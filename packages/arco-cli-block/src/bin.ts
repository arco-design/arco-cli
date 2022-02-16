#!/usr/bin/env node

import path from 'path';
import axios from 'axios';
import fs from 'fs-extra';
import program from 'commander';
import { customAlphabet } from 'nanoid';
import { getConfig } from 'arco-cli-config';
import { print, getGitRootPath, getGlobalInfo } from 'arco-cli-dev-utils';
import { arcoPageInsert, arcoBlockInsert } from './main';
import locale from './locale';

type PageMeta = {
  parents: string[];
  name: string;
  key: string;
  componentPath: string;
};

// Source path of page material (relative to src)
const PATH_PAGE_SOURCE = './page';

// Source path of block material (relative to src)
const PATH_BLOCK_SOURCE = './lib';

// Default insert path for page material (relative to src)
const DEFAULT_PATH_PAGE_INSERT = 'pages';

function getDirName(pkgName) {
  return pkgName.split('/')[1];
}

/**
 * Get meta info for page/block material
 */
async function getMeta(pkgName): Promise<{
  arcoMeta?: { [key: string]: any };
  pageMeta?: PageMeta;
}> {
  let arcoMeta = null;
  let pageMeta = null;
  const urlPrefix = `${getGlobalInfo().host.unpkg}/${pkgName}`;

  try {
    arcoMeta = (await axios.get(`${urlPrefix}/package.json`)).data.arcoMeta;
  } catch (e) {}

  try {
    pageMeta = (await axios.get(`${urlPrefix}/pageMeta.json`)).data;
  } catch (e) {}

  return { arcoMeta, pageMeta };
}

program
  .command('use <pkgName>')
  .description(locale.CMD_DES)
  .action(async (packageName) => {
    const projectDir = getGitRootPath();
    const { arcoMeta, pageMeta } = await getMeta(packageName);

    if (!arcoMeta) {
      print.error('[arco block]', locale.ERROR_NO_VALID_PACKAGE);
      process.exit();
    }

    const isPage = arcoMeta.type === 'react-page';
    const isBlock = arcoMeta.type === 'react-block';

    if (!isPage && !isBlock) {
      print.error('[arco block]', locale.ERROR_WRONG_MATERIAL_TYPE);
      process.exit();
    }

    try {
      // Insert page for Arco Pro
      if (isPage && pageMeta) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nanoid = customAlphabet(alphabet, 10);
        const randomKey = nanoid();

        if (!pageMeta.componentPath) {
          print.error('[arco block]', locale.ERROR_NO_PAGE_MATE_COMPONENT_PATH);
          process.exit();
        }

        await arcoPageInsert(
          {
            packageName,
            parentKey: pageMeta.parents && pageMeta.parents[0],
            routeConfig: {
              name: pageMeta.name || randomKey,
              key: pageMeta.key || randomKey,
              componentPath: pageMeta.componentPath,
            },
          },
          { rootPath: projectDir, silent: false }
        );
      } else {
        const { pathBlockInsert } = getConfig();
        const targetDir = isBlock && pathBlockInsert ? pathBlockInsert : DEFAULT_PATH_PAGE_INSERT;

        fs.ensureDirSync(targetDir);
        await arcoBlockInsert(
          {
            packageName,
            // The location of the target file, relative path to the project's /src
            targetPath: path.join(targetDir, getDirName(packageName)),
            // The location of the source file, relative path to the npm package
            sourcePath: isBlock ? PATH_BLOCK_SOURCE : PATH_PAGE_SOURCE,
          },
          { rootPath: projectDir, silent: false }
        );
      }

      print.success('[arco block]', locale.TIP_INSTALL_SUCCESS);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        print.error('[arco block]', `${locale.ERROR_NO_VALID_PACKAGE} ${packageName}`);
      } else {
        print.error('[arco block]', `${locale.ERROR_INSTALL_FAIL} ${packageName}`);
      }
      throw err;
    }
  });

program.parse(process.argv);
