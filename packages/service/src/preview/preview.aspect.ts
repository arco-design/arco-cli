import { Aspect, RuntimeDefinition } from '@arco-cli/stone';

export const PREVIEW_ASPECT_ID = 'arco.service/preview';

export const PreviewRuntime = new RuntimeDefinition('preview');

export const PreviewAspect = Aspect.create({
  id: PREVIEW_ASPECT_ID,
  declareRuntime: PreviewRuntime,
});

export default PreviewAspect;
