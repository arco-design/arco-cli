import { Config as _JestConfig } from '@jest/types';

export type JestConfig = _JestConfig.InitialOptions;

export { Configuration as WebpackConfig } from 'webpack';

export { TransformOptions as BabelConfig } from 'babel__core';

export { DocgenConfig } from './config/docgen.config';

export { StyleConfig } from './config/style.config';
