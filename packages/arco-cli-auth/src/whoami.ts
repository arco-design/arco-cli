import { print, getGlobalInfo } from 'arco-cli-dev-utils';
import { isLogin } from './utils';
import locale from './locale';

export default async () => {
  const _isLogin = await isLogin();
  if (_isLogin) {
    const { userInfo } = getGlobalInfo();
    print(locale.TIP_USER_INFO);
    print(userInfo);
  } else {
    print.error(locale.TIP_USER_INFO_ERROR);
  }
};
