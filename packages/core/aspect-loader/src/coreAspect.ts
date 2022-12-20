import glob from 'glob';
import { join, resolve } from 'path';
import { existsSync } from 'fs-extra';

const CLI_NPM_PACKAGE_SCOPE = '@arco-cli';

export function getCoreAspectName(id: string): string {
  const [, ...name] = id.split('/');
  return name.join('.');
}

export function getCoreAspectPackageName(id: string): string {
  const aspectName = getCoreAspectName(id);
  return `${CLI_NPM_PACKAGE_SCOPE}/${aspectName}`;
}

export function getAspectDir(id: string): string {
  const aspectName = getCoreAspectName(id);
  const packageName = getCoreAspectPackageName(id);

  let dirPath = '';
  try {
    // to remove the "index.js" at the end
    dirPath = join(require.resolve(packageName), '../..');
  } catch (e) {
    dirPath = resolve(__dirname, '../..', aspectName);
  }

  if (!existsSync(dirPath)) {
    throw new Error(`unable to find ${aspectName} in ${dirPath}`);
  }

  return dirPath;
}

export function getAspectDistDir(id: string) {
  return resolve(`${getAspectDir(id)}/dist`);
}

export async function getAspectDef(aspectName: string, runtime?: string) {
  const dirPath = getAspectDistDir(aspectName);

  const files = glob.sync(`${dirPath}/**/**.js`);
  const aspectPath = files.find((file) => file.includes('.aspect.js')) || join(dirPath, '..');
  const runtimePath = runtime
    ? files.find((file) => file.includes(`.${runtime}.runtime.js`))
    : null;

  return {
    id: aspectName,
    aspectPath,
    runtimePath,
  };
}
