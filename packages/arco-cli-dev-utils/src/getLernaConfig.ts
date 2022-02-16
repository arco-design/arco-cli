import path from 'path';
import fs from 'fs-extra';
import getGitRootPath from './getGitRootPath';

export default () => {
  try {
    return fs.readJsonSync(path.resolve('./lerna.json'));
  } catch (e) {}

  try {
    const root = getGitRootPath();
    return fs.readJsonSync(path.resolve(root, 'lerna.json'));
  } catch (e) {}

  return null;
};
