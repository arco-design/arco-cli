import { MainRuntime } from '@arco-cli/cli';
import { PreviewAspect, PreviewMain } from '@arco-cli/preview';
import { Environment } from '@arco-cli/envs';

import DocsAspect from './docs.aspect';
import { DocsPreviewDefinition } from './docs.previewDefinition';
import { Component, ComponentMap } from '@arco-cli/component';
import { AbstractVinyl } from '@arco-cli/legacy/dist/workspace/component/sources';

export class DocsMain {
  static runtime = MainRuntime;

  static dependencies = [PreviewAspect];

  static slots = [];

  static provider([preview]: [PreviewMain]) {
    const docsMain = new DocsMain();
    preview.registerDefinition(new DocsPreviewDefinition(docsMain));
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
