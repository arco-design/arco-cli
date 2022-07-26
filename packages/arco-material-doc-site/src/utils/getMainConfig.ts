import path from 'path';
import { print } from 'arco-cli-dev-utils';

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

export function getMainConfigPath() {
  return path.resolve(PATH_MAIN_CONFIG);
}

export default getMainConfig;
