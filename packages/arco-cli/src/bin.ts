#!/usr/bin/env node

import chalk from 'chalk';
import program from 'commander';
import init from '@arco-design/arco-cli-init';
import sync from '@arco-design/arco-cli-sync';
import publish from '@arco-design/arco-cli-publish';
import generate from '@arco-design/arco-cli-generate';
import createTemplateFromProject from '@arco-design/arco-create-template-from-project';
import { print } from '@arco-design/arco-dev-utils';
import { login, logout, whoami, checkLogin } from '@arco-design/arco-cli-auth';

import locale from './locale';
import preview from './preview';
import subCommands from './subCommands';
import { printLogo, fetchLatestVersion } from './utils';
import { listAllGroups, queryGroup, addGroupMember, deleteGroupMember } from './group';
import { checkEnv, switchEnv, printEnv } from './env';

const VALID_SUBCOMMANDS = [
  'init',
  'generate',
  'publish',
  'sync',
  'login',
  'logout',
  'whoami',
  'group',
  'block',
  'preview',
  'template',
  'env',
];

function registerCommand() {
  program
    .name('arco')
    .usage('[commands] [options]')
    .arguments('<cmd>')
    .action((cmd) => {
      if (VALID_SUBCOMMANDS.indexOf(cmd) === -1) {
        print.error('arco', 'Invalid command...');
        program.help();
      }
    });

  program.option('-v, --version', locale.CMD_DES_VERSION, async () => {
    const { version } = require('../package.json');
    print(chalk.green(locale.PREFIX_CURRENT_VERSION), version);

    const latestVersion = await fetchLatestVersion();
    if (latestVersion) {
      print();
      if (latestVersion !== version) {
        print.warn(`${locale.PREFIX_LATEST_VERSION}${latestVersion}`);
        print.warn(locale.TIP_VERSION_UPDATE);
      } else {
        print(chalk.cyan(locale.TIP_VERSION_ALREADY_LATEST));
      }
    }
  });

  program
    .command('env')
    .description(locale.CMD_DES_ENV)
    .option('-s, --switch', locale.TIP_ENV_SWITCH)
    .action(({ switch: sw }) => {
      if (sw) {
        switchEnv();
      } else {
        printEnv();
      }
    });

  program
    .command('init <projectName>')
    .description(locale.CMD_DES_INIT)
    .option('-t, --template [packageName]', locale.TIP_INIT_FROM_TEMPLATE)
    .option('-m, --monorepo', locale.TIP_INIT_FOR_MONOREPO)
    .option('-p, --pure', locale.TIP_INIT_PURE)
    .action((name, { template, monorepo, pure }) => {
      init({
        template,
        projectName: name,
        isForMonorepo: !!monorepo,
        isPureProject: !!pure,
      });
    });

  program
    .command('generate')
    .description(locale.CMD_DES_GENERATE)
    .option('--from-current-package', locale.TIP_GENERATE_FROM_CURRENT_PACKAGE)
    .action(({ fromCurrentPackage }) => {
      generate({ paths: fromCurrentPackage ? process.cwd() : undefined });
    });

  program
    .command('publish')
    .description(locale.CMD_DES_PUBLISH)
    .action(async () => {
      await publish();
    });

  program
    .command('sync')
    .description(locale.CMD_DES_SYNC)
    .option('-s, --screenshot [screenshotPath]', locale.TIP_SYNC_SCREENSHOT)
    .option('--from-current-package', locale.TIP_SYNC_FROM_CURRENT_PACKAGE)
    .option('--fetch', locale.TIP_SYNC_FETCH)
    .action(async ({ screenshot, fromCurrentPackage, fetch }) => {
      await sync({ screenshot, fetch, paths: fromCurrentPackage ? process.cwd() : undefined });
      process.exit(0);
    });

  program
    .command('preview')
    .description(locale.CMD_DES_PREVIEW)
    .option('-p, --port [port]', locale.TIP_PREVIEW_PORT)
    .option('--path [path]', locale.TIP_PREVIEW_PATH)
    .option('--teamSite', locale.TIP_PREVIEW_TEAM_SITE)
    .action(({ port, path, teamSite }) => {
      preview({ port, path, teamSite });
    });

  program.command('login').description(locale.CMD_DES_LOGIN).action(login);

  program.command('logout').description(locale.CMD_DES_LOGOUT).action(logout);

  program.command('whoami').description(locale.CMD_DES_WHOAMI).action(whoami);

  program
    .command('group')
    .description(locale.CMD_DES_GROUP)
    .option('--id <groupId>', locale.TIP_GROUP_QUERY_WITH_ID)
    .option('--add <groupId>', locale.TIP_GROUP_ADD_MEMBER)
    .option('--delete <groupId>', locale.TIP_GROUP_REMOVE_MEMBER)
    .action(async ({ id, add, delete: del }) => {
      await checkLogin();
      if (id) {
        await queryGroup(id);
      } else if (add) {
        await addGroupMember(add);
      } else if (del) {
        await deleteGroupMember(del);
      } else {
        await listAllGroups();
      }
    });

  program
    .command('template')
    .description(locale.CMD_DES_TEMPLATE)
    .option('--create', locale.TIP_TEMPLATE_CREATE)
    .action(({ create }) => {
      if (create) {
        createTemplateFromProject();
      } else {
        program.help();
      }
    });

  // SubCommands
  Object.entries(subCommands).forEach(([subCommand, { desc, executableFile }]) => {
    program.command(subCommand, desc, { executableFile } as any);
  });

  program.on('--help', function () {
    print.divider();
    print(locale.TIP_SHOW_HELP);
    print('Examples:');
    print('  $ arco sync --screenshot');
    print('  $ arco group --id 1');
    print.divider();
  });
}

printLogo();

if (process.argv[2] !== 'env' && checkEnv() === false) {
  print.warn(locale.TIP_SET_ENV_FIRST);
  process.exit(0);
}

registerCommand();
program.parse(process.argv);
