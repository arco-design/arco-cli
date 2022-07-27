import fs from 'fs-extra';
import path from 'path';
import { print } from 'arco-cli-dev-utils';

const VALID_CONFIG_DIR_NAMES = ['.arco-doc-site', '.config'];

export default function () {
  for (const dirName of VALID_CONFIG_DIR_NAMES) {
    const dirPath = path.resolve(dirName);
    if (fs.existsSync(dirPath)) {
      return dirPath;
    }
  }

  print.error(
    '[arco-doc-site]',
    `No valid configuration directory found. Please check if a folder named .arco-doc-site exists in your project.`
  );
  process.exit(1);
}
