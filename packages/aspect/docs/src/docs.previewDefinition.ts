import type { Component, ComponentMap } from '@arco-cli/component';
import type { Environment } from '@arco-cli/envs';
import type { PreviewDefinition } from '@arco-cli/preview';
import type { AbstractVinyl } from '@arco-cli/legacy/dist/workspace/component/sources';

import { DocsMain } from './docs.main.runtime';

export class DocsPreviewDefinition implements PreviewDefinition {
  readonly prefix = 'overview';

  readonly include = ['compositions'];

  readonly includePeers = true;

  constructor(
    /**
     * docs extension.
     */
    private docs: DocsMain
  ) {}

  /**
   * application root
   */
  async renderTemplatePath(env: Environment): Promise<string> {
    return this.docs.getTemplate(env);
  }

  /**
   * files to load.
   */
  async getModuleMap(components: Component[]): Promise<ComponentMap<AbstractVinyl[]>> {
    return this.docs.getDocsMap(components);
  }
}
