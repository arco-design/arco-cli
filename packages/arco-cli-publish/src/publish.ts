import fs from 'fs-extra';
import relix from 'relix';
import semver from 'semver';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { getConfig } from '@arco-design/arco-cli-config';
import { print, crossSpawn, getGitRootPath } from '@arco-design/arco-dev-utils';

import locale from './locale';

async function checkGitRemote() {
  return new Promise((resolve) => {
    if (getGitRootPath()) {
      exec('git remote -v', (err, stdout) => {
        if (!err && stdout && stdout.match('(push)')) {
          print();
          resolve(null);
        } else {
          print.error(['arco publish', locale.ERROR_NO_GIT_ORIGIN]);
          process.exit();
        }
      });
    } else {
      print.error(['arco publish'], locale.ERROR_NO_GIT_INIT);
      process.exit();
    }
  });
}

interface PublishOptions {
  configFileName?: string;
}

export default async function ({ configFileName }: PublishOptions = {}) {
  const { alias, packages } = getConfig(configFileName);

  if (alias && alias.publish) {
    return new Promise((resolve, reject) => {
      const publishArray = alias.publish.split(' ');
      crossSpawn(publishArray[0], publishArray.slice(1), { stdio: 'inherit' }).on(
        'close',
        (code) => {
          code ? reject(code) : resolve(code);
        }
      );
    });
  }

  if (Array.isArray(packages) && packages.length > 1) {
    print.error('[arco publish]', locale.ERROR_IN_MONOREPO);
    process.exit();
  }

  await checkGitRemote();

  const versionTypes = ['patch', 'minor', 'major'];
  const preVersionTypes = ['prepatch', 'preminor', 'premajor'];
  const { version } = fs.readJsonSync('./package.json');

  const questions = [
    {
      type: 'list',
      name: 'type',
      message: locale.TIP_SELECT_RELEASE_TYPE,
      choices: [...versionTypes, ...preVersionTypes].map((x) => {
        return {
          name: `${x} ( ${semver.inc(version, x, 'beta')} )`,
          value: x,
        };
      }),
    },
    {
      type: 'input',
      name: 'identifier',
      default: 'beta',
      message: locale.TIP_INPUT_RELEASE_TAG,
      when: (answers) => preVersionTypes.indexOf(answers.type) > -1,
    },
    {
      type: 'input',
      name: 'remote',
      default: 'origin/master',
      message: locale.TIP_INPUT_REMOTE_BRANCH,
    },
  ];

  try {
    const { type, identifier, remote } = await inquirer.prompt(questions);
    const options: { [key: string]: any } = {
      [type]: true,
      identifier,
    };
    if (remote) {
      options.remote = remote;
    }
    await relix(options);
    print.success(locale.TIP_PUBLISH_SUCCESS);
  } catch (err) {
    print(err);
    process.exit(1);
  }
}
