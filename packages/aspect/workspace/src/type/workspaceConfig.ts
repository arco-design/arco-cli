import { ComponentConfig } from '@arco-cli/legacy/dist/workspace/componentInfo';

export interface WorkspaceConfig {
  /**
   * name of the workspace.
   */
  name: string;

  /**
   * components map of the workspace
   */
  components: Record<string, ComponentConfig>;
}
