import { parse } from 'comment-json';
import { readFileSync, existsSync } from 'fs-extra';
import { ReadConfigError } from '../exception';

export function readConfigFile(path: string, mustExist = true) {
  if (!mustExist && !existsSync(path)) {
    return {};
  }

  try {
    return parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new ReadConfigError(path, err);
  }
}
