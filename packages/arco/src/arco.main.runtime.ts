import { MainRuntime } from '@arco-cli/core/dist/cli';

import { manifestMap } from './manifest';

const manifests = Object.values(manifestMap);

export const ArcoMain = {
  name: 'arco',
  runtime: MainRuntime,
  dependencies: manifests,
  provider: () => {},
};
