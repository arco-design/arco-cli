import path from 'path';
import logger from '@arco-cli/legacy/dist/logger';
import { Stone, Extension, RuntimeDefinition } from '@arco-cli/stone';
import { ConfigOptions, StoneConfig as Config } from '@arco-cli/stone/dist/stoneConfig';
import {
  AspectLoaderAspect,
  AspectLoaderMain,
  getAspectDef,
} from '@arco-cli/core/dist/aspect-loader';
import { CLIAspect, MainRuntime, CLIMain } from '@arco-cli/core/dist/cli';
import { getWorkspaceInfo } from '@arco-cli/legacy/dist/workspace/workspaceLocator';

import { ArcoAspect } from './arco.aspect';
import { ArcoMain } from './arco.main.runtime';
import { manifestMap } from './manifest';

// add ArcoMain here to make sure every aspect in manifest is loaded
ArcoAspect.addRuntime(ArcoMain);

export async function requireAspects(aspect: Extension, runtime: RuntimeDefinition) {
  const id = aspect.name;
  if (!id) throw new Error('could not retrieve aspect id');

  // resolve aspect packages from the dir where @arco-cli/arco located
  // otherwise resolve.resolve can't find these packages
  const resolveModuleFrom = path.resolve(__dirname, '../../..');
  const { runtimePath } = await getAspectDef(id, runtime.name, resolveModuleFrom);

  // eslint-disable-next-line
  return runtimePath ? require(runtimePath) : null;
}

async function getConfig(cwd = process.cwd()): Promise<Config> {
  const workspaceInfo = await getWorkspaceInfo(cwd);
  if (workspaceInfo) {
    const configOpts: ConfigOptions = {
      shouldThrow: false,
      cwd: workspaceInfo?.path,
    };
    return Config.load(workspaceInfo.configFilename, configOpts);
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
