/* eslint-disable */
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const getLocalPackages = require('./getLocalPackages');

const ROOT_PATH = path.resolve(__dirname, '..');
const FILE_TSCONFIG = path.resolve(ROOT_PATH, 'tsconfig.paths.json');

async function linkLocalPackages() {
  try {
    const packages = await getLocalPackages();
    const tsconfig = fs.readJsonSync(FILE_TSCONFIG);
    const paths = {};

    packages.forEach(({ name, location }) => {
      location = `./node_modules/${name}`;
      paths[name] = [`${location}/src/index.ts`];
      paths[`${name}/dist/*`] = [`${location}/src/*`];
    });
    tsconfig.compilerOptions.paths = paths;
    fs.writeFileSync(FILE_TSCONFIG, JSON.stringify(tsconfig, null, 2));

    console.error(chalk.green('Generate tsconfig paths successfully.'));
  } catch ({ error, msg }) {
    console.error(chalk.red(`${msg}\n`), error);
    process.exit(1);
  }
}

linkLocalPackages().finally(() => {});
