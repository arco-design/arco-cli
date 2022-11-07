import { MainRuntime } from '@arco-cli/cli';

import { ArcoAspect } from './arco.aspect';
import { manifestMap } from './manifest';

const manifests = Object.values(manifestMap);

export const ArcoMain = {
  name: 'arco',
  runtime: MainRuntime,
  dependencies: manifests,
  provider: () => {},
};

ArcoAspect.addRuntime(ArcoMain);
