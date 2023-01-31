import { ENV_VARIABLE_CONFIG_PREFIX } from '../constants';
import Config from '../globalConfig/config';

export function set(newConfig: Record<string, string | boolean>): Promise<Config> {
  return Config.load().then((config) => {
    if (Object.keys(newConfig).length === 0) return config;
    Object.entries(newConfig).forEach(([key, value]) => config.set(key, value));
    invalidateCache();
    return config.write().then(() => config);
  });
}

export function setSync(newConfig: Record<string, string | boolean>): Config {
  const config = Config.loadSync();
  if (Object.keys(newConfig).length === 0) return config;
  Object.entries(newConfig).forEach(([key, value]) => config.set(key, value));
  invalidateCache();
  config.writeSync();
  return config;
}

export function del(keys: string | string[]): Promise<Config> {
  keys = Array.isArray(keys) ? keys : [keys];
  return Config.load().then((config) => {
    for (const k of keys) {
      config.delete(k);
    }
    invalidateCache();
    return config.write().then(() => config);
  });
}

export function delSync(keys: string | string[]): Config {
  keys = Array.isArray(keys) ? keys : [keys];
  const config = Config.loadSync();
  for (const k of keys) {
    config.delete(k);
  }
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

  return config ? config.get(key) : null;
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

  return config ? config.get(key) : null;
}

export function list(): Promise<any> {
  return Config.load().then((config) => config.toPlainObject());
}

export function listSync(): any {
  const config = Config.loadSync();
  return config.toPlainObject();
}

function cache() {
  return {
    get: () => {
      // @ts-ignore
      return cache.config;
    },
    set: (config) => {
      // @ts-ignore
      cache.config = config;
    },
  };
}

function invalidateCache() {
  cache().set(null);
}

function toEnvVariableName(configName: string): string {
  return `${ENV_VARIABLE_CONFIG_PREFIX}${configName.replace(/\./g, '_').toUpperCase()}`;
}
