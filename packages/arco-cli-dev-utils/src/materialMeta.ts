import fs from 'fs-extra';
import path from 'path';

export function getMetaPath({ metaFileName = 'arcoMeta' } = {}) {
  return path.resolve(process.cwd(), `${metaFileName}.json`);
}

export function isMetaExist({ metaFileName = 'arcoMeta' } = {}) {
  return fs.existsSync(getMetaPath({ metaFileName }));
}
