import { Aspect } from '@arco-cli/stone';
import { CORE_ASPECT_ID_MAP } from '@arco-cli/legacy/dist/constants';

export const ArcoAspect = Aspect.create({
  id: CORE_ASPECT_ID_MAP.APP_ARCO,
});

export default ArcoAspect;
