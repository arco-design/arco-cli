import path from 'path';
import { print } from '@arco-design/arco-dev-utils';

import { MainConfig } from '../interface';

const PATH_MAIN_CONFIG = '.config/main.js';

function getMainConfig(): MainConfig {
  try {
    const config = require(path.resolve(process.cwd(), PATH_MAIN_CONFIG));
    return config;
  } catch (err) {
    print.error('[arco-doc-site]', 'Failed to get site config');
    console.error(err);
  }
}

export default getMainConfig;
