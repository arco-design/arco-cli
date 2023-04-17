import { ComponentConfig } from '@arco-cli/legacy/dist/workspace/componentInfo';

/**
 * config of arco.aspect/workspace
 */
export interface WorkspaceConfig {
  /**
   * name of the workspace.
   */
  name: string;

  /**
   * components map of the workspace
   */
  components:
    | ComponentConfig[]
    | {
        /**
         * component shared configuration fields
         */
        extends?: Partial<ComponentConfig>;
        /**
         * component separate configuration fields
         */
        members: ComponentConfig[];
      };
}
