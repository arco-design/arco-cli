#!/usr/bin/env node

import fs from 'fs-extra';
import axios from 'axios';
import program from 'commander';
import { webpack } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { print } from 'arco-cli-dev-utils';
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

const HTML_ENTRY_NAME = 'index.html';
const VALID_SUBCOMMANDS = ['build', 'dev'];
const URL_HTML_TEMPLATE_PREFIX = `http://${
  process.env.HTML_TEMPLATE_DOMAIN ||
  'lf-cdn-tos.bytescm.com/obj/static/arco-design/material/platform-dev'
}/`;
const URL_HTML_TEMPLATE_ISOLATE = `${URL_HTML_TEMPLATE_PREFIX}team.isolate.html`;
const URL_HTML_TEMPLATE_DEVELOPMENT = `${URL_HTML_TEMPLATE_PREFIX}team.development.html`;

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
  .action(async () => {
    await generateEntryFiles();
    if (webpackConfigProd?.output?.path) {
      fs.removeSync(webpackConfigProd.output.path);
    }

    // Set isolate entry for webpack config
    try {
      const {
        site: { languages },
      } = getMainConfig();
      const { data: htmlTemplate } = await axios.get(URL_HTML_TEMPLATE_ISOLATE);
      webpackConfigProd.plugins.push(
        new HtmlWebpackPlugin({
          templateContent: htmlTemplate,
          filename: HTML_ENTRY_NAME,
          // TODO handle multiple languages
          chunks: languages.slice(0, 1),
        })
      );
    } catch (error) {
      print.error(
        '[arco-doc-site]',
        `Failed to get HTML template from ${URL_HTML_TEMPLATE_ISOLATE}`
      );
      console.error(error);
      return;
    }

    webpack(webpackConfigProd, webpackCallback);
  });

program
  .command('dev')
  .description('dev mode')
  .option('-l, --language [language]', locale.TIP_DEV_OPTION_LANGUAGE)
  .action(async ({ language }: { language: string }) => {
    // Re-generate entry files
    // TODO watch file add/remove
    await generateEntryFiles();

    if (!language) {
      const {
        site: { languages },
      } = getMainConfig();
      language = languages[0];
    }

    // Set dev entry for webpack config
    try {
      const { data: htmlTemplate } = await axios.get(URL_HTML_TEMPLATE_DEVELOPMENT);
      webpackConfigDev.entry = {
        [language]: getPathEntryByLanguage(language),
      };
      webpackConfigDev.plugins.push(
        new HtmlWebpackPlugin({
          templateContent: htmlTemplate,
          filename: HTML_ENTRY_NAME,
          chunks: [language],
        })
      );
    } catch (error) {
      print.error(
        '[arco-doc-site]',
        `Failed to get HTML template from ${URL_HTML_TEMPLATE_DEVELOPMENT}`
      );
      console.error(error);
      return;
    }

    const compiler = webpack(webpackConfigDev);
    const devSeverOptions = { ...(webpackConfigDev as any).devServer };
    const server = new WebpackDevServer(devSeverOptions, compiler);
    await server.start();
  });

program.parse(process.argv);
