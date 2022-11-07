import { resolve } from 'path';
import { readdir } from 'fs-extra';
import logger from '@arco-cli/legacy/dist/logger';
import { AspectLoaderAspect, AspectLoaderMain, getAspectDistDir } from '@arco-cli/aspect-loader';
import { Stone, Extension, RuntimeDefinition } from '@arco-cli/stone';
import { Config, ConfigOptions } from '@arco-cli/stone/dist/stoneConfig';
import { CLIAspect, MainRuntime, CLIMain } from '@arco-cli/cli';
import { getWorkspaceInfo } from '@arco-cli/legacy/dist/workspace/workspaceLocator';
import { FILE_WORKSPACE_JSONC } from '@arco-cli/legacy/dist/constants';
import { ArcoAspect } from './arco.aspect';
import { manifestMap } from './manifest';

export async function requireAspects(aspect: Extension, runtime: RuntimeDefinition) {
  const id = aspect.name;
  if (!id) throw new Error('could not retrieve aspect id');
  const dirPath = getAspectDistDir(id);
  const files = await readdir(dirPath);
  const runtimeFile = files.find((file) => file.includes(`.${runtime.name}.runtime.js`));
  if (!runtimeFile) return;
  // eslint-disable-next-line
  require(resolve(`${dirPath}/${runtimeFile}`));
}

async function getConfig(cwd = process.cwd()): Promise<Config> {
  const workspaceInfo = await getWorkspaceInfo(cwd);
  if (workspaceInfo) {
    const configOpts: ConfigOptions = {
      shouldThrow: false,
      cwd: workspaceInfo?.path,
    };
    return Config.load(FILE_WORKSPACE_JSONC, configOpts);
  }
  return null;
}

async function loadArco(path = process.cwd()) {
  logger.info(`*** Loading arco *** argv:\n${process.argv.join('\n')}`);

  const config = await getConfig();
  const configMap = config ? config.toObject() : {};
  configMap[ArcoAspect.id] ||= {};
  configMap[ArcoAspect.id].cwd = path;

  const stone = await Stone.load([CLIAspect, ArcoAspect], MainRuntime.name, configMap);
  await stone.run(async (aspect: Extension, runtime: RuntimeDefinition) =>
    requireAspects(aspect, runtime)
  );

  const aspectLoader = stone.get<AspectLoaderMain>(AspectLoaderAspect.id);
  aspectLoader.setCoreAspects(Object.values(manifestMap));

  return stone;
}

export async function runCLI() {
  const stone = await loadArco();
  const cli = stone.get<CLIMain>(CLIAspect.id);
  cli.run(false);
}
