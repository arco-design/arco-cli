import { Aspect } from '@arco-cli/stone';
import { CORE_ASPECT_ID_MAP } from '@arco-cli/legacy/dist/constants';

export const ReactAspect = Aspect.create({
  id: CORE_ASPECT_ID_MAP.ENV_REACT,
});

export default ReactAspect;
