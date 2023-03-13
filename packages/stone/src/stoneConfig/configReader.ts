import path from 'path';
import { parse } from 'comment-json';
import { readFileSync, existsSync } from 'fs-extra';
import { ReadConfigError } from '../exception';

export function readConfigFile(filePath: string, mustExist = true) {
  if (!mustExist && !existsSync(filePath)) {
    return {};
  }
  if (path.extname(filePath) === '.js') {
    const config = require(filePath);
    if (typeof config === 'function') {
      return config();
    }
    return config;
  }

  try {
    return parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new ReadConfigError(filePath, err);
  }
}
