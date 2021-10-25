import babelJest from 'babel-jest';
import babelConfig from '../babel.config';

module.exports = babelJest.createTransformer({
  ...babelConfig,
  babelrc: false,
  configFile: false,
});
