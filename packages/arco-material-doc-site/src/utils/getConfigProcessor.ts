import fs from 'fs-extra';
import path from 'path';
import { print } from 'arco-cli-dev-utils';

import getConfigEntryDir from './getConfigEntryDir';

export default function getConfigProcessor<T = Function>(configType: 'webpack' | 'babel'): T {
  const configFilePath = path.resolve(getConfigEntryDir(), `${configType}.config.js`);
  let processor = null;
  if (fs.existsSync(configFilePath)) {
    try {
      processor = require(configFilePath);
    } catch (error) {
      print.error('[arco-doc-site]', `Failed to extend configuration from ${configFilePath}`);
      console.error(error);
      process.exit(1);
    }
  }
  return processor;
}
