import glob from 'glob';
import { join, resolve } from 'path';
import { existsSync } from 'fs-extra';

const CLI_NPM_PACKAGE_SCOPE = '@arco-cli';

function getCoreAspectName(id: string): string {
  const [, ...name] = id.split('/');
  return name.join('.');
}

function getCoreAspectPackageName(id: string): string {
  return `${CLI_NPM_PACKAGE_SCOPE}/${id.split('/')[0].split('.').pop()}`;
}

export function getAspectDir(id: string): string {
  const aspectName = getCoreAspectName(id);
  const packageName = getCoreAspectPackageName(id);

  let dirPath = '';
  try {
    // to remove the "index.js" at the end
    dirPath = join(require.resolve(packageName), '../..');
  } catch (e) {
    // __dirname is node_modules/@arco-cli/core/dist/aspect-loader
    const arcoCliNodeModulesHome = resolve(__dirname, '../../..');

    // some aspect has standalone package like @arco-cli/arco
    dirPath = resolve(arcoCliNodeModulesHome, aspectName);

    if (!existsSync(dirPath)) {
      dirPath = resolve(
        arcoCliNodeModulesHome,
        `${packageName.split('/').pop()}/dist/${aspectName}`
      );
    }
  }

  if (!existsSync(dirPath)) {
    throw new Error(`unable to find ${aspectName} in ${dirPath}`);
  }

  return dirPath;
}

export async function getAspectDef(aspectName: string, runtime?: string) {
  const dirPath = getAspectDir(aspectName);

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
