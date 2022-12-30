import type { Component } from '@arco-cli/component';
import type { Environment } from '@arco-cli/envs';
import type { PreviewDefinition } from '@arco-cli/preview';

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
  async getModuleMap(components: Component[]) {
    return this.docs.getDocsMap(components);
  }

  /**
   * metadata to collect
   */
  async getMetadataMap(components: Component[], env: Environment) {
    return this.docs.getDocMetadata(components, env);
  }
}
