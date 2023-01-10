import { MainRuntime } from '@arco-cli/cli';
import { Environment } from '@arco-cli/envs';
import { LoggerAspect, LoggerMain, Logger } from '@arco-cli/logger';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { PreviewAspect, PreviewMain } from '@arco-cli/preview';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/graphql';
import { WorkspaceAspect, Workspace } from '@arco-cli/workspace';
import { Component, ComponentMap } from '@arco-cli/component';
import { AbstractVinyl } from '@arco-cli/legacy/dist/workspace/component/sources';

import DocsAspect from './docs.aspect';
import getDocsSchema from './docs.graphql';
import { DocsPreviewDefinition } from './docs.previewDefinition';
import { DocReader } from './type';
import { FileExtensionNotSupportedError } from './exceptions';
import { Doc, DocPropList } from './doc';

type DocReaderSlot = SlotRegistry<DocReader>;

export class DocsMain {
  static runtime = MainRuntime;

  static dependencies = [PreviewAspect, GraphqlAspect, WorkspaceAspect, LoggerAspect];

  static slots = [Slot.withType<DocReader>()];

  static provider(
    [preview, graphql, workspace, loggerMain]: [PreviewMain, GraphqlMain, Workspace, LoggerMain],
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

    return docsMain;
  }

  constructor(private logger: Logger, private docReaderSlot: DocReaderSlot) {}

  private getDocsFiles(component: Component): AbstractVinyl[] {
    // TODO set doc file path
    const docFiles = [`__docs__/index.mdx`];
    return component.files.filter((file) => docFiles.includes(file.relative));
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
      return this.getDocsFiles(component);
    });
  }

  /**
   * return any component metadata generate by env, like component property tables
   */
  getDocMetadata(components: Component[], env: Environment) {
    return ComponentMap.as<Record<string, any>>(components, (component) => {
      return env.getDocsMetadata?.(component.files);
    });
  }

  /**
   * return the metadata parsed from raw document file
   */
  getDoc(component: Component) {
    const docData = component.extensions.findExtension(DocsAspect.id)?.data?.doc;
    return docData ? new Doc(docData.filePath, new DocPropList(docData.props)) : null;
  }

  /**
   * compute a doc for a component.
   */
  async computeDoc(component: Component) {
    const docFiles = this.getDocsFiles(component);
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
}

DocsAspect.addRuntime(DocsMain);
