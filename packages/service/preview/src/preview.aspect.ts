import { Aspect, RuntimeDefinition } from '@arco-cli/stone';

export const PreviewRuntime = new RuntimeDefinition('preview');

export const PreviewAspect = Aspect.create({
  id: 'arco.service/preview',
  declareRuntime: PreviewRuntime,
});

export default PreviewAspect;
