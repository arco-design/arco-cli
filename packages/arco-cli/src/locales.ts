import inquirer from 'inquirer';
import { getGlobalInfo, print, writeGlobalInfo } from '@arco-design/arco-dev-utils';
import locale from './locale';

export function printLocale() {
  const { locale: currentLocale } = getGlobalInfo();
  print.info(
    `${locale.PREFIX_CURRENT_LOCALE}: ${
      currentLocale === 'zh-CN'
        ? locale.TIP_LOCALE_ZH_CN
        : currentLocale === 'en-US'
        ? locale.TIP_LOCALE_EN_US
        : locale.TIP_LOCALE_SYSTEM
    }`
  );
}

export async function switchLocale() {
  const { locale: nextLocale } = await inquirer.prompt({
    type: 'list',
    name: 'locale',
    message: locale.TIP_SELECT_LOCALE,
    choices: [
      { name: locale.TIP_LOCALE_EN_US, value: 'en-US' },
      { name: locale.TIP_LOCALE_ZH_CN, value: 'zh-CN' },
      { name: locale.TIP_LOCALE_SYSTEM, value: 'system' },
    ],
  });

  writeGlobalInfo({ locale: nextLocale });
}
