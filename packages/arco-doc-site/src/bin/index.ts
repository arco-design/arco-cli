#!/usr/bin/env node

import axios from 'axios';
import program from 'commander';
import { webpack } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { print } from '@arco-design/arco-dev-utils';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import locale from '../locale';
import getMainConfig from '../utils/getMainConfig';
import webpackCallback from '../utils/webpackCallback';
import generateEntryFiles, { getPathEntryByLanguage } from '../utils/generateEntryFiles';
import { dev as webpackConfigDev, prod as webpackConfigProd } from '../config/webpack.config';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});

const VALID_SUBCOMMANDS = ['build', 'dev'];
const URL_HTML_TEMPLATE = `http://${
  process.env.HTML_TEMPLATE_DOMAIN ||
  'lf-cdn-tos.bytescm.com/obj/static/arco-design/material/platform-dev'
}/team.development.html`;

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
  .option('-l, --language [language]', locale.TIP_DEV_OPTION_LANGUAGE)
  .action(async ({ language }: { language: string }) => {
    // Re-generate entry files
    // TODO watch file add/remove
    generateEntryFiles();

    if (!language) {
      const {
        site: { languages },
      } = getMainConfig();
      language = languages[0];
    }

    // Set dev entry for webpack config
    try {
      const { data: htmlTemplate } = await axios.get(URL_HTML_TEMPLATE);
      webpackConfigDev.entry = {
        [language]: getPathEntryByLanguage(language),
      };
      webpackConfigDev.plugins.push(
        new HtmlWebpackPlugin({
          templateContent: htmlTemplate,
          filename: 'index.html',
          chunks: [language],
        })
      );
    } catch (error) {
      print.error('[arco-doc-site]', `Failed to get HTML template from ${URL_HTML_TEMPLATE}`);
      console.error(error);
      return;
    }

    const compiler = webpack(webpackConfigDev);
    const devSeverOptions = { ...(webpackConfigDev as any).devServer };
    const server = new WebpackDevServer(devSeverOptions, compiler);
    server.start();
  });

program.parse(process.argv);
