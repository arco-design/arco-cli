import fs from 'fs-extra';
import { spawnSync } from 'child_process';
import { getGlobalInfo } from './index';

export default (packageName = '') => {
  if (!packageName) {
    try {
      // hack, It doesn't work in some users' environments without parameter packageName
      packageName = fs.readJsonSync('./package.json').name;
    } catch (error) {
      return { error };
    }
  }

  const hostNPM = getGlobalInfo().host.npm;
  const { stdout } = spawnSync('npm', ['view', packageName, '--registry', hostNPM, '--json']);

  let info;
  try {
    info = JSON.parse(stdout.toString());
  } catch (error) {
    return { error };
  }

  return info;
};
