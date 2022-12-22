import type { Environment } from '@arco-cli/envs';
import type { Component, ComponentMap } from '@arco-cli/component';
import type { AbstractVinyl } from '@arco-cli/legacy/dist/workspace/component/sources';

export interface PreviewDefinition {
  /**
   * extension preview prefix
   */
  prefix: string;

  /**
   * which other extension modules to include in the preview context.
   */
  include?: string[];

  /**
   * Whether to include the peers chunk in the output html
   */
  includePeers?: boolean;

  /**
   * path of the default template to be executed.
   */
  renderTemplatePath?: (env: Environment) => Promise<string>;

  /**
   * get all files to require in the preview runtime.
   */
  getModuleMap(components: Component[]): Promise<ComponentMap<AbstractVinyl[]>>;

  /**
   * Get metadata for the preview
   */
  getMetadata?: (component: Component) => Promise<unknown>;
}
