import { Aspect, RuntimeDefinition } from '@arco-cli/stone';

export const MainRuntime = new RuntimeDefinition('main');

export const WorkspaceAspect = Aspect.create({
  id: 'arco.aspect/workspace',
  declareRuntime: MainRuntime,
});
