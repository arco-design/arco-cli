import path from 'path';
import { print } from 'arco-cli-dev-utils';

import { MainConfig } from '../interface';
import getConfigEntryDir from './getConfigEntryDir';

const FILENAME_MAIN_CONFIG = 'main.js';

export function getMainConfigPath() {
  return path.resolve(getConfigEntryDir(), FILENAME_MAIN_CONFIG);
}

function getMainConfig(): MainConfig {
  try {
    const config = require(getMainConfigPath());
    return config;
  } catch (err) {
    print.error('[arco-doc-site]', 'Failed to get site config');
    console.error(err);
  }
}

export default getMainConfig;
