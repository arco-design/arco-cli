import fs from 'fs-extra';
import { print } from 'arco-cli-dev-utils';
import { CWD } from '../../constant';

export default function getConfigProcessor<T = Function>(
  configType: 'jest' | 'webpack' | 'babel' | 'docgen' | 'style' | 'tsc'
): T {
  const configFilePath = `${CWD}/.config/${configType}.config.js`;
  let processor = null;
  if (fs.existsSync(configFilePath)) {
    try {
      processor = require(configFilePath);
    } catch (error) {
      print.error('[arco-scripts]', `Failed to extend configuration from ${configFilePath}`);
      console.error(error);
      process.exit(1);
    }
  }
  return processor;
}
