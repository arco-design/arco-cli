import path from 'path';
import fs from 'fs-extra';
import { mergeWith } from 'lodash';
import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain, Logger } from '@arco-cli/core/dist/logger';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';
import { Doc, DocsAspect, DocsMain } from '@arco-cli/aspect/dist/docs';
import { Component } from '@arco-cli/aspect/dist/component';
import request from '@arco-cli/legacy/dist/cli/request';
import { uploadFile } from '@arco-cli/legacy/dist/cli/uploadFile';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import {
  DEFAULT_MATERIAL_GROUP_ID,
  MATERIAL_GENERATION,
  DIR_ARTIFACTS,
  PACKAGE_JSON,
  CFG_HOST_ARCO_KEY,
} from '@arco-cli/legacy/dist/constants';
import { toFsCompatible } from '@arco-cli/legacy/dist/utils';
import { zipFiles } from '@arco-cli/legacy/dist/utils/fs/zipFiles';
import { getSync } from '@arco-cli/legacy/dist/globalConfig';

import { SyncerAspect } from './syncer.aspect';
import { SyncCmd } from './sync.cmd';
import { SyncParams } from './type/syncParams';

type SyncerConfig = {
  defaultMaterialMeta: {
    group?: number;
    author?: string;
    repository?: string;
  };
};

export class SyncerMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect, CLIAspect, WorkspaceAspect, DocsAspect];

  static provider(
    [loggerMain, cli, workspace, docs]: [LoggerMain, CLIMain, Workspace, DocsMain],
    config
  ) {
    const logger = loggerMain.createLogger(SyncerAspect.id);
    const syncer = new SyncerMain(config, logger, docs, workspace);
    cli.register(new SyncCmd(logger, syncer, workspace));
    return syncer;
  }

  constructor(
    private config: SyncerConfig,
    private logger: Logger,
    private docs: DocsMain,
    private workspace: Workspace
  ) {}

  private getCacheDir() {
    return this.workspace.getCacheDir(SyncerAspect.id);
  }

  private extendSyncParamsWithDefaultMaterialMeta(params: SyncParams) {
    const { defaultMaterialMeta = {} } = this.config;
    defaultMaterialMeta.group ||= DEFAULT_MATERIAL_GROUP_ID;
    mergeWith(params, defaultMaterialMeta, (paramValue, defaultValue) => {
      return paramValue === undefined ? defaultValue : paramValue;
    });
  }

  private async preparePackageFilesToUpload(component: Component): Promise<string> {
    const cacheDir = this.getCacheDir();
    const tempDir = path.join(cacheDir, toFsCompatible(component.packageName));
    const artifactsDir = path.join(component.packageDirAbs, DIR_ARTIFACTS);

    await fs.ensureDir(tempDir);
    await fs.copy(
      path.join(component.packageDirAbs, PACKAGE_JSON),
      path.join(tempDir, PACKAGE_JSON)
    );
    await fs.copy(artifactsDir, path.join(tempDir, DIR_ARTIFACTS));

    return tempDir;
  }

  private async uploadPackageFiles(components: Component[]) {
    const uploadResults: Record<
      string,
      {
        data?: {
          zip: string;
          files: Record<string, string>;
        };
        errors: string[];
      }
    > = {};
    const cacheDir = this.getCacheDir();
    const packagesUploading: string[] = [];

    // clear cache dir at first
    await fs.emptyDir(cacheDir);

    // dist and upload all artifacts files
    await Promise.all(
      components.map(async (component) => {
        const { packageName } = component;
        uploadResults[packageName] ||= { errors: [] };

        // components may come from the same package, upload the package files only once
        if (packagesUploading.indexOf(packageName) === -1) {
          packagesUploading.push(packageName);

          const pathOfDirToUpload = await this.preparePackageFilesToUpload(component);
          const pathOfZipToUpload = `${pathOfDirToUpload}.zip`;

          let error = null;
          const longProcessLogger = this.logger.createLongProcessLogger(
            `upload artifacts of ${packageName} to material market`
          );

          try {
            await zipFiles({
              sourceDir: pathOfDirToUpload,
              targetPath: pathOfZipToUpload,
            });
          } catch (err) {
            error = err.toString();
          }

          if (fs.existsSync(pathOfZipToUpload)) {
            const { code, data, msg } = await uploadFile({
              filePath: pathOfZipToUpload,
              cdnGlobs: [`${DIR_ARTIFACTS}/**/*.*`],
            });
            if (code === 0) {
              uploadResults[packageName].data = data;
            } else {
              error = msg;
            }
          }

          longProcessLogger.end();

          if (error) {
            uploadResults[packageName].errors.push(error);
            this.logger.consoleFailure();
          } else {
            this.logger.consoleSuccess();
          }
        }
      })
    );

    return uploadResults;
  }

  async sync({
    components,
    currentUser,
    skipArtifactsUpload,
  }: {
    components: Component[];
    currentUser: string;
    skipArtifactsUpload?: boolean;
  }): Promise<ComponentResult[]> {
    const hostArco = getSync(CFG_HOST_ARCO_KEY);
    const syncResults: ComponentResult[] = [];
    const uploadResultMap = skipArtifactsUpload ? {} : await this.uploadPackageFiles(components);

    await Promise.all(
      components.map(async (component) => {
        const uploadResult = uploadResultMap[component.packageName] || { errors: [] };
        const syncResult: ComponentResult = {
          id: component.id,
          errors: uploadResult.errors.slice() || [],
        };
        const doc = this.docs.getDoc(component);
        const docManifest = await this.docs.getDocsManifestFromArtifact(component);
        const meta: SyncParams = {
          name: component.id,
          title: doc.title || component.name,
          description: doc.description,
          category: Doc.mergeDocProperty(doc.labels || [], component.labels),
          repository: component.repository,
          uiResource: component.uiResource,
          group: component.group,
          author: component.author || currentUser,
          package: {
            name: component.packageName,
            version: component.version,
            peerDependencies: Object.keys(component.peerDependencies),
          },
          outline: doc.outline,
          fileManifest: {
            extraStyle: component.extraStyles,
            docs: docManifest,
            cdn: uploadResult.data || {},
          },
          _generation: MATERIAL_GENERATION,
        };

        this.extendSyncParamsWithDefaultMaterialMeta(meta);

        let error = null;
        const longProcessLogger = this.logger.createLongProcessLogger(
          `sync metadata of ${component.id} to material market`
        );

        try {
          const { ok, msg } = await request.post('material/update', {
            meta,
            createIfNotExists: true,
          });
          if (!ok) {
            error = msg;
          }
        } catch (err) {
          error = err.toString();
        }

        longProcessLogger.end();

        if (error) {
          syncResult.errors.push(error);
          this.logger.consoleFailure();
        } else {
          this.logger.consoleSuccess(
            `${component.id} has successfully synced to https://${hostArco}/material/detail?name=${component.id}`
          );
        }

        syncResults.push(syncResult);
      })
    );

    return syncResults;
  }
}

SyncerAspect.addRuntime(SyncerMain);
