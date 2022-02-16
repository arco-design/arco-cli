import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import generateMeta from 'arco-cli-generate';
import { getConfig } from 'arco-cli-config';
import { checkLogin, request } from 'arco-cli-auth';
import {
  print,
  MessageQueue,
  materialMeta,
  getNpmPackageInfo,
  getGlobalInfo,
} from 'arco-cli-dev-utils';

import genScreenshot from './screenshot';
import locale from './locale';

const { getMetaPath } = materialMeta;

const doScreenshot = async (path: string, packageInfo: { [key: string]: any }) => {
  if (!path) {
    path = `${nanoid()}.png`;
    const { name, version } = packageInfo;
    const screenShotUrl = `https://arco.design/material/preview?name=${name}&version=${version}`;
    const screenshotSelector = '.arco-material-live-preview > *';

    await genScreenshot({ path, url: screenShotUrl, selector: screenshotSelector });
  }

  try {
    // TODO need to rewrite
    const { url } = await request.post('tos', { buffer: fs.readFileSync(path), path });
    return url.startsWith('http') ? url : `https:${url}`;
  } finally {
    fs.unlink(path, () => {});
  }
};

const updateLocalMeta = (localMeta, originMeta) => {
  Object.keys(localMeta).forEach((key) => {
    localMeta[key] = originMeta[key];
  });
  if (originMeta.metaUpdateTime) {
    localMeta.metaUpdateTime = originMeta.metaUpdateTime;
  }
  // Useless field, delete it
  delete localMeta.updatedAt;
  return localMeta;
};

interface SyncOptions {
  /** Filename of meta */
  metaFileName?: string;
  /** Filename of Arco CLI config */
  configFileName?: string;
  /** Whether to automatically screenshot */
  screenshot?: boolean;
  /** Paths to exec this command */
  paths?: string | string[];
  /** Whether to update the local data from origin */
  fetch?: boolean;
}

/**
 * Synchronize material meta
 */
export default async function ({
  metaFileName = 'arcoMeta',
  configFileName,
  screenshot,
  paths,
  fetch = false,
}: SyncOptions = {}) {
  await checkLogin();

  const messageQueue = new MessageQueue({
    description: locale.TIP_CMD_EXEC_RESULT,
  });

  const syncMeta = async (root: string) => {
    process.chdir(root);

    // Ensure that the material has been released to NPM
    const packageInfo = getNpmPackageInfo();
    if (packageInfo.error) {
      const errorPrefix =
        packageInfo.error.code === 'E404'
          ? locale.ERROR_NEED_PUBLISH_TO_NPM
          : locale.ERROR_GET_PACKAGE_INFO_FAILED;
      messageQueue.push('error', [
        root,
        `${errorPrefix}\nDetails: ${JSON.stringify(packageInfo.error, null, 2)}`,
      ]);
      return;
    }

    // Ensure that arcoMeta.json has been generated
    const { name: packageName, peerDependencies } = packageInfo;
    const metaPath = getMetaPath({ metaFileName });
    if (!fs.existsSync(metaPath)) {
      print.info(packageName, locale.TIP_META_GENERATE_ING);
      const result = await generateMeta({ paths: [root], silent: true });
      if (result) {
        print.info(packageName, locale.TIP_META_GENERATE_DONE);
      } else {
        messageQueue.push('error', [packageName, locale.ERROR_META_GENERATE_FAILED]);
        return;
      }
    }

    const localMeta = require(metaPath);
    const {
      result: [originMeta],
    } = await request.post('material', { name: packageName });

    // Update local meta from origin
    if (fetch) {
      if (originMeta) {
        fs.writeJsonSync(metaPath, updateLocalMeta(localMeta, originMeta), { spaces: 2 });
        messageQueue.push('success', [packageName, locale.TIP_META_FETCH_SUCCESS]);
      } else {
        messageQueue.push('error', [packageName, locale.ERROR_META_FETCH_FAILED]);
      }
    } else {
      print.info(packageName, locale.TIP_META_SYNC_ING);

      // Check whether the local material meta is behind the remote
      if (
        originMeta &&
        originMeta.name === packageName &&
        +new Date(localMeta.metaUpdateTime) < +new Date(originMeta.metaUpdateTime)
      ) {
        messageQueue.push('error', [packageName, locale.ERROR_META_SHOULD_FETCH_FIRST]);
        return;
      }

      const metaUpdateParams = {
        ...localMeta,
        group: +localMeta.group,
        package: {
          ...localMeta.package,
          peerDependencies: Object.keys(peerDependencies),
        },
      };

      // Auto generate screenshot
      if (screenshot) {
        try {
          const imagePath = typeof screenshot === 'string' ? screenshot : null;
          metaUpdateParams.screenshot = await doScreenshot(imagePath, packageInfo);
        } catch (err) {
          print.error(packageName, `${locale.ERROR_AUTO_SCREENSHOT_FAILED} ${err.toString()}`);
        }
      }

      try {
        const { ok, msg, result } = await request.post(
          `material/${originMeta ? 'update' : 'create'}`,
          {
            meta: metaUpdateParams,
          }
        );

        if (ok) {
          const hostArco = getGlobalInfo().host.arco;
          fs.writeJsonSync(metaPath, updateLocalMeta(localMeta, result), { spaces: 2 });
          messageQueue.push('success', [
            packageName,
            `${locale.TIP_META_SYNC_DONE} ${hostArco}/material/detail?name=${packageName}`,
          ]);
        } else {
          messageQueue.push('error', [packageName, msg || locale.ERROR_META_SYNC_FAILED]);
        }
      } catch (err) {
        messageQueue.push('error', [packageName, err]);
      }
    }
  };

  // Try to sync meta in all specified paths
  const originalPath = process.cwd();
  paths = paths ? (Array.isArray(paths) ? paths : [paths]) : getConfig(configFileName).packages;
  await Promise.all((paths as []).map((path) => syncMeta(path)));

  messageQueue.flush();
  process.chdir(originalPath);
}
