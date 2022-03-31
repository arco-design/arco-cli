import fs from 'fs-extra';
import relix from 'relix';
import semver from 'semver';
import inquirer from 'inquirer';
import { getConfig } from 'arco-cli-config';
import { print, getGitRootPath, execQuick } from 'arco-cli-dev-utils';

import locale from './locale';

async function checkGitRemote() {
  if (getGitRootPath()) {
    const { code, stdout } = await execQuick('git remove -v');
    if (code === 0 && stdout.match('(push)')) {
      print();
    } else {
      print.error(['arco publish', locale.ERROR_NO_GIT_ORIGIN]);
      process.exit();
    }
  } else {
    print.error(['arco publish'], locale.ERROR_NO_GIT_INIT);
    process.exit();
  }
}

interface PublishOptions {
  configFileName?: string;
}

export default async function ({ configFileName }: PublishOptions = {}) {
  const { alias, packages } = getConfig(configFileName);

  if (alias && alias.publish) {
    const { code, stderr } = await execQuick(alias.publish, { silent: false, time: true });
    if (code !== 0) {
      print.error(['[arco publish]', locale.ERROR_EXECUTED_FAILED]);
      console.error(stderr);
      process.exit(code);
    }
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
