import glob from 'glob';
import { join, resolve } from 'path';
import { existsSync } from 'fs-extra';
import { CORE_ASPECT_ID_MAP, CORE_ASPECT_PACKAGE_NAME_MAP } from '@arco-cli/legacy/dist/constants';

const RESOLVE_MODULE_PATHS = [];
const CLI_NPM_PACKAGE_SCOPE = '@arco-cli';

function getCoreAspectName(id: string): string {
  const [, ...name] = id.split('/');
  return name.join('.');
}

function getCoreAspectPackageName(id: string): string {
  switch (id) {
    case CORE_ASPECT_ID_MAP.APP_ARCO:
      return CORE_ASPECT_PACKAGE_NAME_MAP.APP_ARCO;

    case CORE_ASPECT_ID_MAP.ENV_REACT:
      return CORE_ASPECT_PACKAGE_NAME_MAP.ENV_REACT;

    default:
      return `${CLI_NPM_PACKAGE_SCOPE}/${id.split('/')[0].split('.').pop()}`;
  }
}

function getAspectDir(id: string): string {
  const aspectName = getCoreAspectName(id);
  const packageName = getCoreAspectPackageName(id);

  let dirPath = '';
  try {
    // it will be like packageName/dist/index.js
    const packageEntryFilePath = require.resolve(packageName, {
      paths: RESOLVE_MODULE_PATHS,
    });

    // remove the "index.js" at the end, it will be like packageName/dist
    dirPath = join(packageEntryFilePath, '..');

    // if several aspects share the same package, locate the aspect dir
    // it will be like packageName/dist/aspectName
    const _aspectDirPath = join(dirPath, aspectName);
    if (existsSync(_aspectDirPath)) {
      dirPath = _aspectDirPath;
    }
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

export async function getAspectDef(aspectId: string, runtime: string, resolveModuleFrom?: string) {
  if (resolveModuleFrom && RESOLVE_MODULE_PATHS.indexOf(resolveModuleFrom) === -1) {
    RESOLVE_MODULE_PATHS.push(resolveModuleFrom);
  }

  const dirPath = getAspectDir(aspectId);
  const files = glob.sync(`${dirPath}/**/**.js`);
  const aspectPath = files.find((file) => file.includes('.aspect.js')) || join(dirPath, '..');
  const runtimePath = runtime
    ? files.find((file) => file.includes(`.${runtime}.runtime.js`))
    : null;

  return {
    id: aspectId,
    aspectPath,
    runtimePath,
  };
}
