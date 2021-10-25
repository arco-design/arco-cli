import getConfigProcessor from '../scripts/utils/getConfigProcessor';

let config: { [key: string]: any } = {};

const processor = getConfigProcessor('tsc');
if (processor) {
  config = processor(config) || config;
}

export default config;
