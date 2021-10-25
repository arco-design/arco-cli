#!/usr/bin/env node

import program from 'commander';
import { webpack } from 'webpack';
import { print } from '@arco-design/arco-dev-utils';

import webpackConfig from '../config/webpack.config';
import webpackCallback from '../utils/webpackCallback';
import generateEntryFiles from '../utils/generateEntryFiles';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});

const VALID_SUBCOMMANDS = ['build'];

program
  .name('arco-doc-site')
  .usage('[commands] [options]')
  .arguments('<cmd>')
  .action((cmd) => {
    if (VALID_SUBCOMMANDS.indexOf(cmd) === -1) {
      print.error('[arco-doc-site]', 'Invalid command...');
      program.help();
    }
  });

program
  .command('build')
  .description('build site for production')
  .action(() => {
    generateEntryFiles();
    webpack(webpackConfig as any, webpackCallback);
  });

program.parse(process.argv);
