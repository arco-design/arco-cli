/* eslint-disable */
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { exec } = require('child_process');

const DIR_PACKAGES = path.resolve(__dirname, '../packages');
const DIR_NODE_MODULES = path.resolve(__dirname, '../node_modules');

function collectLocalPackages() {
  return new Promise((resolve, reject) => {
    exec('lerna list --json', (error, stdout, stderr) => {
      const errMsg = 'Failed to collect packages info via [lerna list]';

      if (error) {
        reject({
          error,
          msg: errMsg,
        });
      }

      try {
        const infoList = JSON.parse(stdout).filter(({ location }) =>
          location.startsWith(DIR_PACKAGES)
        );
        resolve(infoList);
      } catch (error) {
        reject({
          error,
          msg: stderr || errMsg,
        });
      }
    });
  });
}

async function linkLocalPackages() {
  try {
    const packages = await collectLocalPackages();
    const packagesDone = [];
    packages.forEach(({ name, location }) => {
      const from = location;
      const to = `${DIR_NODE_MODULES}/${name}`;
      const nodeModulesEntryDir = path.resolve(
        DIR_NODE_MODULES,
        name.split('/').slice(0, -1).join('')
      );

      try {
        if (!fs.existsSync(to)) {
          fs.ensureDirSync(nodeModulesEntryDir);
          fs.symlinkSync(from, to, 'dir');
        }

        packagesDone.push(name);
      } catch (error) {
        console.error(chalk.red(`Failed to link ${to} from ${from}\n`), error);
      }
    });

    console.log(
      chalk.green(
        'Link workspace packages successfully. Following packages are linked to node_modules:\n'
      ),
      packagesDone
    );
    process.exit(0);
  } catch ({ error, msg }) {
    console.error(chalk.red(`${msg}\n`), error);
    process.exit(1);
  }
}

linkLocalPackages().finally(() => {});
