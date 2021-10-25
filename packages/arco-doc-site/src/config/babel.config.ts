import babelConfig from '@arco-design/arco-babel-config';
import getConfigProcessor from '../utils/getConfigProcessor';

let config = babelConfig;
const processor = getConfigProcessor('babel');
if (processor) {
  config = processor(config) || config;
}

export default config;
