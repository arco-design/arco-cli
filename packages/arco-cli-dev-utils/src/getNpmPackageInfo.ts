import fs from 'fs-extra';
import execQuick from './execQuick';
import getGlobalInfo from './getGlobalInfo';

export default async (packageName = ''): Promise<Record<string, any>> => {
  if (!packageName) {
    try {
      // hack, It doesn't work in some users' environments without parameter packageName
      packageName = fs.readJsonSync('./package.json').name;
    } catch (error) {
      return { error };
    }
  }

  const hostNPM = getGlobalInfo().host.npm;
  const isWin32 = process.platform === 'win32';
  const npmCommander = isWin32 ? 'npm.cmd' : 'npm';

  const { code, stdout, stderr } = await execQuick(
    `${npmCommander} view ${packageName} --registry ${hostNPM} --json`
  );

  if (code !== 0) {
    throw new Error(stderr);
  }

  return JSON.parse(stdout);
};
