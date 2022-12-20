import { MainRuntime } from '@arco-cli/cli';
import { Environment } from '@arco-cli/envs';
import { PreviewAspect, PreviewMain } from '@arco-cli/preview';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/graphql';
import { WorkspaceAspect, Workspace } from '@arco-cli/workspace';
import { Component, ComponentMap } from '@arco-cli/component';
import { AbstractVinyl } from '@arco-cli/legacy/dist/workspace/component/sources';

import DocsAspect from './docs.aspect';
import getDocsSchema from './docs.graphql';
import { DocsPreviewDefinition } from './docs.previewDefinition';

export class DocsMain {
  static runtime = MainRuntime;

  static dependencies = [PreviewAspect, GraphqlAspect, WorkspaceAspect];

  static slots = [];

  static provider([preview, graphql, workspace]: [PreviewMain, GraphqlMain, Workspace]) {
    const docsMain = new DocsMain();

    preview.registerDefinition(new DocsPreviewDefinition(docsMain));
    graphql.register(getDocsSchema());

    if (workspace) {
      // TODO notify workspace component loaded
    }

    return docsMain;
  }

  constructor() {}

  private getDocsFiles(component: Component): AbstractVinyl[] {
    // TODO set doc file path
    const docFiles = [`__docs__/index.mdx`];
    return component.files.filter((file) => docFiles.includes(file.relative));
  }

  async getTemplate(env: Environment): Promise<string> {
    return env.getDocsTemplate?.();
  }

  /**
   * returns an array of doc file paths for a set of components.
   */
  getDocsMap(components: Component[]): ComponentMap<AbstractVinyl[]> {
    return ComponentMap.as<AbstractVinyl[]>(components, (component) => {
      return this.getDocsFiles(component);
    });
  }
}

DocsAspect.addRuntime(DocsMain);
