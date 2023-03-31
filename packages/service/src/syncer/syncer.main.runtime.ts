import { mergeWith } from 'lodash';
import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain, Logger } from '@arco-cli/core/dist/logger';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';
import { Doc, DocsAspect, DocsMain } from '@arco-cli/aspect/dist/docs';
import { Component } from '@arco-cli/aspect/dist/component';
import request from '@arco-cli/legacy/dist/cli/request';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import { DEFAULT_MATERIAL_GROUP_ID, MATERIAL_GENERATION } from '@arco-cli/legacy/dist/constants';

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
    const syncer = new SyncerMain(config, logger, docs);
    cli.register(new SyncCmd(logger, syncer, workspace));
    return syncer;
  }

  constructor(private config: SyncerConfig, private logger: Logger, private docs: DocsMain) {}

  private extendSyncParamsWithDefaultMaterialMeta(params: SyncParams) {
    const { defaultMaterialMeta = {} } = this.config;
    defaultMaterialMeta.group ||= DEFAULT_MATERIAL_GROUP_ID;
    mergeWith(params, defaultMaterialMeta, (paramValue, defaultValue) => {
      return paramValue === undefined ? defaultValue : paramValue;
    });
  }

  async sync(components: Component[], currentUserName: string): Promise<ComponentResult[]> {
    const results: ComponentResult[] = [];
    await Promise.all(
      components.map(async (component) => {
        const syncResult: ComponentResult = {
          id: component.id,
          errors: [],
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
          author: component.author || currentUserName,
          package: {
            name: component.packageName,
            version: component.version,
            peerDependencies: Object.keys(component.peerDependencies),
          },
          outline: doc.outline,
          fileManifest: {
            docs: docManifest,
          },
          _generation: MATERIAL_GENERATION,
        };

        this.extendSyncParamsWithDefaultMaterialMeta(meta);

        let error = null;
        const longProcessLogger = this.logger.createLongProcessLogger(
          `sync ${component.id} to material market`
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
          this.logger.consoleSuccess();
        }

        results.push(syncResult);
      })
    );

    return results;
  }
}

SyncerAspect.addRuntime(SyncerMain);
