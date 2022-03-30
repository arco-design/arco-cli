import type { Config } from '@jest/types';

import jestBaseConfig from '../../jest.config';

const config: Config.InitialOptions = {
  ...jestBaseConfig,
};

export default config;
