import type { WorkspaceConfig } from '@arco-cli/aspect/dist/workspace';
import type { CompilerAspectConfig } from '@arco-cli/service/dist/compiler';
import type { GeneratorConfig } from '@arco-cli/service/dist/generator';

/**
 * type of arco.workspace.json config
 */
export type ArcoWorkspaceFile = {
  'arco.aspect/workspace'?: WorkspaceConfig;
  'arco.service/compiler'?: CompilerAspectConfig;
  'arco.service/generator'?: GeneratorConfig;
};

/**
 * type of arco.env.js config
 */
export type { ArcoEnvConfig } from '@arco-cli/aspect/dist/envs/types';
