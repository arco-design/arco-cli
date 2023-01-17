import gitconfig from 'gitconfig';
import { isNil } from 'lodash';
import { ENV_VARIABLE_CONFIG_PREFIX } from '../../../constants';
import GeneralError from '../../../error/generalerror';
import Config from '../../../globalConfig/config';

export function set(key: string, val: string | boolean): Promise<Config> {
  if (!key || !val) {
    throw new GeneralError(`missing a configuration key and value.`);
  }
  return Config.load().then((config) => {
    config.set(key, val);
    invalidateCache();
    return config.write().then(() => config);
  });
}

export function setSync(key: string, val: string | boolean): Config {
  const config = Config.loadSync();
  config.set(key, val);
  invalidateCache();
  config.writeSync();
  return config;
}

export function del(key: string): Promise<Config> {
  return Config.load().then((config) => {
    config.delete(key);
    invalidateCache();
    return config.write().then(() => config);
  });
}

export function delSync(key: string): Config {
  const config = Config.loadSync();
  config.delete(key);
  config.writeSync();
  invalidateCache();
  return config;
}

export async function get(key: string): Promise<string | undefined> {
  const envVarName = toEnvVariableName(key);
  if (process.env[envVarName]) {
    return process.env[envVarName];
  }

  const config = await (async () => {
    const configFromCache = cache().get();
    if (configFromCache) return configFromCache;
    const config = await Config.load();
    cache().set(config);
    return config;
  })();
  const val = config ? config.get(key) : undefined;
  if (!isNil(val)) return val;

  try {
    return await gitconfig.get(key);
    // Ignore error from git config get
  } catch (err: any) {
    return null;
  }
}

export function getSync(key: string): string | undefined {
  const envVarName = toEnvVariableName(key);
  if (process.env[envVarName]) {
    return process.env[envVarName];
  }

  const config = (() => {
    const configFromCache = cache().get();
    if (configFromCache) return configFromCache;
    const config = Config.loadSync();
    cache().set(config);
    return config;
  })();
  const val = config ? config.get(key) : undefined;
  if (!isNil(val)) return val;

  const gitConfigCache = gitCache().get() || {};
  if (key in gitConfigCache) {
    return gitConfigCache[key];
  }

  try {
    gitConfigCache[key] = gitconfig.get.sync(key);
  } catch (err: any) {
    // Ignore error from git config get
    gitConfigCache[key] = undefined;
  }
  gitCache().set(gitConfigCache);
  return gitConfigCache[key];
}

export function list(): Promise<any> {
  return Config.load().then((config) => config.toPlainObject());
}

export function listSync(): any {
  const config = Config.loadSync();
  return config.toPlainObject();
}

export function getNumberFromConfig(name: string): number | null {
  const fromConfig = getSync(name);
  if (!fromConfig) return null;
  const num = Number(fromConfig);
  if (Number.isNaN(num)) {
    throw new Error(`config of "${name}" is invalid. Expected number, got "${fromConfig}"`);
  }
  return num;
}

function cache() {
  return {
    get: () => {
      // @ts-ignore AUTO-ADDED-AFTER-MIGRATION-PLEASE-FIX!
      return cache.config;
    },
    set: (config) => {
      // @ts-ignore AUTO-ADDED-AFTER-MIGRATION-PLEASE-FIX!
      cache.config = config;
    },
  };
}

function gitCache() {
  return {
    get: () => {
      // @ts-ignore AUTO-ADDED-AFTER-MIGRATION-PLEASE-FIX!
      return gitCache.config;
    },
    set: (config) => {
      // @ts-ignore AUTO-ADDED-AFTER-MIGRATION-PLEASE-FIX!
      gitCache.config = config;
    },
  };
}

function invalidateCache() {
  cache().set(null);
}

function toEnvVariableName(configName: string): string {
  return `${ENV_VARIABLE_CONFIG_PREFIX}${configName.replace(/\./g, '_').toUpperCase()}`;
}
