import chalk from 'chalk';
import { print, getNpmPackageInfo, getGlobalInfo } from 'arco-cli-dev-utils';
import locale from './locale';

const ARCO_CLI_PACKAGE_NAME = 'arco-cli';

export function fetchLatestVersion() {
  try {
    const info = getNpmPackageInfo(ARCO_CLI_PACKAGE_NAME);
    const { latest: lastVersion } = info['dist-tags'];
    return lastVersion;
  } catch (e) {}

  return null;
}

export function printLogo() {
  const { version } = require('../package.json');
  const globalInfo = getGlobalInfo();
  const envInfo = globalInfo?.env === 'private' ? `${locale.LABEL_BANNER_ENV_PRIVATE} ` : '      ';
  print(
    chalk.hex('#165dff').bold(
      `
        ___                    ____            _           
       /   |  ______________  / __ \\___  _____(_)___ _____ 
      / /| | / ___/ ___/ __ \\/ / / / _ \\/ ___/ / __ \`/ __ \\
     / ___ |/ /  / /__/ /_/ / /_/ /  __(__  ) / /_/ / / / /
    /_/  |_/_/   \\___/\\____/_____/\\___/____/_/\\__, /_/ /_/ 
                                             /____/        
                                             
                                          ${envInfo}v${version}
    `
    )
  );
}
