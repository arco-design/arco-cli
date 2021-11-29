#!/usr/bin/env node

import program from 'commander';
import { webpack } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { print } from '@arco-design/arco-dev-utils';

import webpackCallback from '../utils/webpackCallback';
import generateEntryFiles from '../utils/generateEntryFiles';
import { dev as webpackConfigDev, prod as webpackConfigProd } from '../config/webpack.config';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});

const VALID_SUBCOMMANDS = ['build', 'dev'];

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
    webpack(webpackConfigProd, webpackCallback);
  });

program
  .command('dev')
  .description('dev mode')
  .action(() => {
    const compiler = webpack({ ...webpackConfigDev, mode: 'development' });
    const devSeverOptions = { ...(webpackConfigDev as any).devServer, open: true };
    const server = new WebpackDevServer(devSeverOptions, compiler);
    server.start();
  });

program.parse(process.argv);
