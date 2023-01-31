import { Aspect, RuntimeDefinition } from '@arco-cli/stone';

export const MainRuntime = new RuntimeDefinition('main');

export const CLIAspect = Aspect.create({
  id: 'arco.core/cli',
  declareRuntime: MainRuntime,
});

export default CLIAspect;
