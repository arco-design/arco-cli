import fs from 'fs-extra';
import { print } from 'arco-cli-dev-utils';

export default function getConfigProcessor<T = Function>(configType: 'webpack' | 'babel'): T {
  const configFilePath = `${process.cwd()}/.config/${configType}.config.js`;
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
