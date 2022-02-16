import axios from 'axios';
import { getGlobalInfo, print, writeGlobalInfo } from 'arco-cli-dev-utils';
import inquirer from 'inquirer';
import locale from './locale';

export function checkEnv() {
  const globalInfo = getGlobalInfo();
  return !!(globalInfo && globalInfo.host);
}

export function printEnv() {
  const globalInfo = getGlobalInfo();
  if (globalInfo && globalInfo.env) {
    print(
      `${locale.PREFIX_CURRENT_ENV}${
        globalInfo.env === 'private' ? locale.LABEL_ENV_PRIVATE : locale.LABEL_ENV_PUBLIC
      }`
    );
  } else {
    print.error(locale.TIP_NO_ENV_SET);
  }
}

export async function switchEnv() {
  const {
    data: { result: hostInfo },
  } = await axios.get('https://arco.design/material/api/getHostInfo');
  const { env } = await inquirer.prompt({
    type: 'list',
    name: 'env',
    message: locale.TIP_SELECT_ENV,
    choices: [
      { name: locale.TIP_ENV_PUBLIC, value: 'public' },
      { name: locale.TIP_ENV_PRIVATE, value: 'private' },
    ],
  });

  if (hostInfo[env]) {
    // Switch env and clear user info
    writeGlobalInfo({ host: hostInfo[env], env, 'x-arco-token': null, userInfo: null });
    print.success(
      env === 'private' ? locale.TIP_SWITCH_SUCCESS_TO_PRIVATE : locale.TIP_SWITCH_SUCCESS_TO_PUBLIC
    );
  } else {
    print.error('[arco env]', 'failed to get host info.');
  }
}
