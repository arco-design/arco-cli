#!/usr/bin/env node

import fs from 'fs-extra';
import axios from 'axios';
import open from 'open';
import program from 'commander';
import chokidar from 'chokidar';
import { webpack } from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { print, fileServer, getGlobalInfo } from 'arco-cli-dev-utils';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import locale from '../locale';
import getMainConfig, { getMainConfigPath } from '../utils/getMainConfig';
import webpackCallback from '../utils/webpackCallback';
import generateEntryFiles, { getPathEntryByLanguage } from '../utils/generateEntryFiles';
import { dev as webpackConfigDev, prod as webpackConfigProd } from '../config/webpack.config';
import getArcoHost from '../utils/getArcoHost';

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

// Watch file changes, re-generate entry files
function hotUpdateEntries(globsToWatch: string[]) {
  const mainConfigPath = getMainConfigPath();
  const watcher = chokidar.watch(globsToWatch.concat(mainConfigPath), {
    ignoreInitial: true,
  });

  watcher
    .on('add', (filePath) => {
      print.success(locale.TIP_REGENERATE_ENTRY_BY_GLOB);
      print.info(`[+] ${filePath}`);
      generateEntryFiles({ isDev: true });
    })
    .on('unlink', (filePath) => {
      print.success(locale.TIP_REGENERATE_ENTRY_BY_GLOB);
      print.info(`[-] ${filePath}`);
      generateEntryFiles({ isDev: true });
    })
    .on('change', () => {
      // TODO re-check why this not work
      // if (filePath === mainConfigPath) {
      //   print.success(locale.TIP_REGENERATE_ENTRY_BY_CONFIG);
      //   generateEntryFiles();
      // }
    });

  return async () => {
    await watcher.close();
  };
}

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
    const {
      group,
      site: { languages },
    } = getMainConfig();
    const globsToWatch = await generateEntryFiles();

    // Set default language
    language = language || languages[0];

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

    // Extend dev server options
    const devSeverOptions = { ...(webpackConfigDev as any).devServer };
    const arcoHost = await getArcoHost(group?.private);
    const proxy = {
      target: arcoHost,
      cookieDomainRewrite: `${devSeverOptions.host || 'localhost'}:${devSeverOptions.port}`,
      secure: false,
      changeOrigin: true,
    };
    const apiPath = '/material/api';
    devSeverOptions.proxy = devSeverOptions.proxy || {};

    if (Array.isArray(devSeverOptions.proxy)) {
      if (
        !devSeverOptions.proxy.find(
          (item) => Array.isArray(item?.context) && item.context.indexOf(apiPath) > -1
        )
      ) {
        (devSeverOptions.proxy as any).push({
          context: [apiPath],
          ...proxy,
        });
      }
    } else if (!devSeverOptions.proxy[apiPath]) {
      devSeverOptions.proxy[apiPath] = proxy;
    }

    const compiler = webpack(webpackConfigDev);
    const server = new WebpackDevServer(devSeverOptions, compiler);
    await server.start();

    // Watch file and re-generate entry files
    hotUpdateEntries(globsToWatch);
  });

program
  .command('preview')
  .description('preview a doc site from local dist files')
  .option('--path [path]', locale.TIP_PREVIEW_PATH)
  .option('-p, --port [port]', locale.TIP_PREVIEW_PORT)
  .option('-l, --language [language]', locale.TIP_DEV_OPTION_LANGUAGE)
  .action(
    async ({
      language,
      port = 9093,
      path: previewPath = '',
    }: {
      path: string;
      port: number;
      language: string;
    }) => {
      const hostArco = getGlobalInfo().host?.arco || 'https://arco.design';
      const query = `localPreviewUrl=http://localhost:${port}${previewPath}`;
      const openBrowser = (url) => {
        open(url);
        console.log(`Visit ${url}`);
      };
      fileServer(port);
      openBrowser(
        `${hostArco}/material/team/SitePreview${language ? `/${language}` : ''}?${query}`
      );
    }
  );

program.parse(process.argv);
