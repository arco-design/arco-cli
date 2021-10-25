import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';
import { getGitRootPath } from '@arco-design/arco-dev-utils';

const defaultConfig = require('../template/config');

const DEFAULT_FILE_NAME = 'arco.config';

export const initConfig = (fileName = DEFAULT_FILE_NAME) => {
  const root = getGitRootPath();
  const configFilePath = path.resolve(root, `${fileName}.js`);
  const defaultConfigFilePath = path.resolve(__dirname, '../template/config.js');

  if (root && !fs.existsSync(configFilePath)) {
    fs.copySync(defaultConfigFilePath, configFilePath);
    return true;
  }
};

export const getConfig = (
  fileName: string = DEFAULT_FILE_NAME,
  root: string = getGitRootPath()
) => {
  const configFilePath = path.resolve(root, `${fileName}.js`);

  let config = { ...defaultConfig };
  if (root && fs.existsSync(configFilePath)) {
    try {
      config = { ...require(configFilePath) };
    } catch (e) {}
  }

  // Transform packages glob configured in arco.config.js into a path array
  if (!Array.isArray(config.packages) || !config.packages.length) {
    // When the config.packages field does not exist, try to use the workspaces field in package.json
    try {
      config.packages = fs.readJsonSync(path.resolve(root, 'package.json')).workspaces;
    } catch (e) {}

    // Try to read the packages field from the lerna configuration
    if (!config.packages) {
      try {
        config.packages = fs.readJsonSync(path.resolve(root, 'lerna.json')).packages;
      } catch (e) {}
    }
  }
  if (Array.isArray(config.packages) && config.packages.length) {
    let paths = [];
    config.packages.forEach((p) => (paths = paths.concat(glob.sync(`${root}/${p}`))));
    config.packages = paths;
  } else {
    config.packages = [root];
  }

  return config;
};
