import { stringify, assign } from 'comment-json';
import { join } from 'path';
import { homedir } from 'os';
import { readConfigFile } from './configReader';

export type GlobalConfigOpts = {
  dir?: string;
  name: string;
};

export type ConfigOptions = {
  cwd?: string;
  global?: GlobalConfigOpts;
  shouldThrow?: boolean;
};

const defaultConfig = {
  cwd: process.cwd(),
  shouldThrow: true,
};

export class StoneConfig {
  constructor(private raw: Record<string, any>) {}

  toObject() {
    return this.raw;
  }

  toString() {
    return stringify(this.raw);
  }

  static load(fileName: string, opts?: ConfigOptions) {
    const mergedOpts = Object.assign(defaultConfig, opts);
    const config = readConfigFile(join(mergedOpts.cwd, fileName), mergedOpts.shouldThrow);

    if (mergedOpts.global) {
      return StoneConfig.loadGlobal(mergedOpts.global, config);
    }

    return new StoneConfig(config);
  }

  static loadGlobal(globalOpts: GlobalConfigOpts, config: any = {}) {
    const globalConfig = readConfigFile(join(globalOpts.dir || homedir(), globalOpts.name), false);
    return new StoneConfig(assign(config, globalConfig));
  }
}
