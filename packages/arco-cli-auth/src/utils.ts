import { print, getGlobalInfo } from '@arco-design/arco-dev-utils';

import login from './login';
import request from './request';
import locale from './locale';

export const isLogin = async () => {
  const config = getGlobalInfo();

  if (!config || !config.userInfo) {
    return false;
  }

  try {
    await request.get('userInfo');
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * check login status
 */
export const checkLogin = async (autoLogin = true) => {
  const _isLogin = await isLogin();
  if (!_isLogin) {
    if (autoLogin) {
      await login({
        exitAfterLogin: false,
      });
    } else {
      print.error(locale.TIP_LOGIN_FIRST);
      print.info('$ arco login');
      process.exit();
    }
  }
};
