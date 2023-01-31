import { Aspect, RuntimeDefinition } from '@arco-cli/stone';

export const UIRuntime = new RuntimeDefinition('ui');

export const UIAspect = Aspect.create({
  id: 'arco.service/ui',
  declareRuntime: UIRuntime,
});

export default UIAspect;
