import babelConfig from 'arco-scripts-babel-config';
import getConfigProcessor from '../scripts/utils/getConfigProcessor';

let config = babelConfig;

const processor = getConfigProcessor('babel');
if (processor) {
  config = processor(config) || config;
}

export default config;
