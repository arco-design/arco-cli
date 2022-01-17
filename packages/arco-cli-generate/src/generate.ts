import path from 'path';
import fs from 'fs-extra';
import { getConfig } from '@arco-design/arco-cli-config';
import { checkLogin } from '@arco-design/arco-cli-auth';
import { MessageQueue, materialMeta, getGlobalInfo } from '@arco-design/arco-dev-utils';
import locale from './locale';

const { isMetaExist, getMetaPath } = materialMeta;

const BASE_META = {
  name: '',
  title: '',
  description: '',
  type: '',
  category: '',
  group: 0,
  homepage: '',
  repository: '',
  author: '',
  screenshot: '',
  package: {
    name: '',
    version: 'latest',
    type: 'npm',
    registry: '',
    peerDependencies: [],
  },
};

export interface GenerateOptions {
  /* Filename of meta info */
  metaFileName?: string;
  /* Filename for arco-cli */
  configFileName?: string;
  /* Paths for command execution */
  paths?: string | string[];
  /* Used to overwrite the initial meta */
  meta?: { [key: string]: any };
  /* Silent mode (do not output result information) */
  silent?: boolean;
}

/**
 * Generate material meta info in project
 */
export default async ({
  metaFileName = 'arcoMeta',
  configFileName,
  paths,
  meta: initialMeta,
  silent,
}: GenerateOptions = {}) => {
  await checkLogin();
  const arcoCliConfig = getConfig(configFileName);

  const meta = {
    ...BASE_META,
    ...arcoCliConfig.initialMeta,
    ...initialMeta,
  };

  const messageQueue = new MessageQueue({
    description: locale.LABEL_GENERATE_RESULT,
  });

  /**
   * @param root CWD of process
   * @returns {boolean} Whether there is a meta file in the directory
   */
  const generateMeta = (root) => {
    process.chdir(root);

    // Check package.json
    let packageJson;
    try {
      packageJson = require(path.resolve(root, 'package.json')) || {};
    } catch (e) {
      messageQueue.push('error', [root, locale.ERROR_NO_VALID_PACKAGE_JSON]);
      return false;
    }

    // Check 'arcoMeta' in package.json
    const packageName = packageJson.name;
    if (!packageJson[metaFileName]) {
      messageQueue.push('error', [packageName, locale.ERROR_NO_ARCO_META_IN_PACKAGE_JSON]);
      return false;
    }

    // Check if the meta file already exists
    if (isMetaExist()) {
      messageQueue.push('warn', [packageName, locale.WARN_META_FILE_EXIST]);
      return true;
    }

    const { userInfo } = getGlobalInfo();
    const metaPath = getMetaPath({ metaFileName });
    const metaInPackageJson = packageJson[metaFileName];
    fs.writeJsonSync(
      metaPath,
      {
        ...meta,
        name: packageName,
        description: packageJson.description,
        author: userInfo?.name,
        title: metaInPackageJson.title,
        type: metaInPackageJson.type,
        category: metaInPackageJson.category,
        package: {
          ...meta.package,
          name: packageName,
          peerDependencies: Object.keys(packageJson.peerDependencies || {}),
        },
      },
      { spaces: 2 }
    );
    messageQueue.push('success', [packageName, locale.TIP_GENERATE_SUCCESS]);
    return true;
  };

  // Execute material generation in all specified directories
  const originalPath = process.cwd();
  paths = paths ? (Array.isArray(paths) ? paths : [paths]) : arcoCliConfig.packages;
  const results = (paths as []).map(generateMeta);

  !silent && messageQueue.flush();
  process.chdir(originalPath);
  return results.every((result) => result !== false);
};
