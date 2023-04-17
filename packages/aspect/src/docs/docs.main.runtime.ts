import path from 'path';
import fs from 'fs-extra';
import { MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain, Logger } from '@arco-cli/core/dist/logger';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { PreviewAspect, PreviewMain } from '@arco-cli/service/dist/preview';
import { BuilderAspect, BuilderMain } from '@arco-cli/service/dist/builder';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/core/dist/graphql';
import { AbstractVinyl } from '@arco-cli/legacy/dist/workspace/component/sources';

import { Environment } from '@aspect/envs';
import { WorkspaceAspect, Workspace } from '@aspect/workspace';
import { Component, ComponentMap } from '@aspect/component';

import DocsAspect from './docs.aspect';
import getDocsSchema from './docs.graphql';
import { DocsPreviewDefinition } from './docs.previewDefinition';
import { DocReader } from './type';
import { FileExtensionNotSupportedError } from './exceptions';
import { Doc, DocPropList } from './doc';
import {
  ComponentManifestMap,
  DOCS_ARTIFACT_DIR,
  DOCS_MANIFEST_FILENAME,
  DocsTask,
} from './docs.task';

type DocReaderSlot = SlotRegistry<DocReader>;

export class DocsMain {
  static runtime = MainRuntime;

  static dependencies = [
    PreviewAspect,
    GraphqlAspect,
    WorkspaceAspect,
    LoggerAspect,
    BuilderAspect,
  ];

  static slots = [Slot.withType<DocReader>()];

  static provider(
    [preview, graphql, workspace, loggerMain, builder]: [
      PreviewMain,
      GraphqlMain,
      Workspace,
      LoggerMain,
      BuilderMain
    ],
    _config,
    [docReaderSlot]: [DocReaderSlot]
  ) {
    const logger = loggerMain.createLogger(DocsAspect.id);
    const docsMain = new DocsMain(logger, docReaderSlot);

    preview.registerDefinition(new DocsPreviewDefinition(docsMain));
    graphql.register(getDocsSchema(docsMain));

    if (workspace) {
      workspace.registerOnComponentLoad(async (component) => {
        const doc = await docsMain.computeDoc(component);
        return {
          doc: doc?.toObject(),
        };
      });
    }

    builder.registerBuildTasks([new DocsTask()]);

    return docsMain;
  }

  constructor(private logger: Logger, private docReaderSlot: DocReaderSlot) {}

  private getDocFiles(component: Component): AbstractVinyl[] {
    const previewEntry = path.join(component.entries.base, component.entries.preview);
    return component.files.filter((file) =>
      (Array.isArray(previewEntry) ? previewEntry : [previewEntry]).includes(file.relative)
    );
  }

  private getDocReader(extension: string) {
    return this.docReaderSlot.values().find((docReader) => docReader.isFormatSupported(extension));
  }

  /**
   * register a new doc reader. this allows to support further
   * documentation file formats.
   */
  registerDocReader(docReader: DocReader) {
    this.docReaderSlot.register(docReader);
    return this;
  }

  async getTemplate(env: Environment): Promise<string> {
    return env.getDocsTemplate?.();
  }

  /**
   * returns an array of doc file paths for a set of components.
   */
  getDocsMap(components: Component[]) {
    return ComponentMap.as<AbstractVinyl[]>(components, (component) => {
      return this.getDocFiles(component);
    });
  }

  /**
   * return any component metadata generate by env
   * like component property tables
   */
  getMetadata(components: Component[], env: Environment) {
    return ComponentMap.as<Record<string, any>>(components, (component) => {
      let jsdocEntryFiles = [];

      if (component.entries.jsdoc) {
        jsdocEntryFiles = (
          Array.isArray(component.entries.jsdoc)
            ? component.entries.jsdoc
            : [component.entries.jsdoc]
        )
          .map((jsdocEntry) => {
            return component.files.find(
              (file) => file.relative === path.join(component.entries.base, jsdocEntry)
            );
          })
          .filter(Boolean);
      }

      return env.getDocsMetadata?.(jsdocEntryFiles);
    });
  }

  /**
   * return the doc properties parsed from raw document file
   * like description / labels
   */
  getDoc(component: Component) {
    const docData = component.extensions.findExtension(DocsAspect.id)?.data?.doc || {
      filePath: '',
      props: [],
    };
    return new Doc(docData.filePath, new DocPropList(docData.props));
  }

  /**
   * compute a doc for a component.
   */
  async computeDoc(component: Component) {
    const docFiles = this.getDocFiles(component);
    if (docFiles.length) {
      // currently taking the first docs file found with an abstract. (we support only one)
      const docFile = docFiles[0];

      try {
        const docReader = this.getDocReader(docFile.extname);
        if (!docReader) throw new FileExtensionNotSupportedError(docFile.relative, docFile.extname);
        const doc = await docReader.read(docFile.path, docFile.contents, component);
        return doc;
      } catch (err: any) {
        // it's ok to fail here.
        this.logger.debug(`docs.main.runtime.computeDoc caught an error: ${err.message}`);
        return null;
      }
    }

    return null;
  }

  /**
   * get manifest info from doc artifact
   */
  async getDocsManifestFromArtifact(
    component: Component
  ): Promise<Component['entries']['extraDocs']> {
    const artifactManifestPathAbs = path.join(
      component.packageDirAbs,
      DOCS_ARTIFACT_DIR,
      DOCS_MANIFEST_FILENAME
    );

    if (fs.existsSync(artifactManifestPathAbs)) {
      try {
        const manifest: ComponentManifestMap = await fs.readJSON(artifactManifestPathAbs);
        return manifest[component.id] || [];
      } catch (err) {}
    }

    return [];
  }
}

DocsAspect.addRuntime(DocsMain);
