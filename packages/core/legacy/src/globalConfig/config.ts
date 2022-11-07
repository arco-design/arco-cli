import fs from 'fs-extra';
import * as path from 'path';

import { mapToObject } from '../utils';
import { DIR_GLOBAL_CONFIG, FILE_GLOBAL_CONFIG } from '../constants';

function getPath() {
  return path.join(DIR_GLOBAL_CONFIG, FILE_GLOBAL_CONFIG);
}

export default class Config extends Map<string, string | boolean> {
  toPlainObject() {
    return mapToObject(this);
  }

  toJson() {
    return JSON.stringify(this.toPlainObject());
  }

  write() {
    return fs.outputFile(getPath(), this.toJson());
  }

  writeSync() {
    return fs.outputFileSync(getPath(), this.toJson());
  }

  static loadSync(): Config {
    const configPath = getPath();
    if (!fs.existsSync(configPath)) {
      const config = new Config([]);
      config.writeSync();
      return config;
    }
    const contents = fs.readFileSync(configPath);
    return new Config(Object.entries(JSON.parse(contents.toString())));
  }

  static async load(): Promise<Config> {
    const configPath = getPath();
    const exists = await fs.pathExists(configPath);
    if (!exists) {
      const config = new Config([]);
      await config.write();
      return config;
    }
    const contents = await fs.readFile(configPath);
    return new Config(Object.entries(JSON.parse(contents.toString())));
  }
}
