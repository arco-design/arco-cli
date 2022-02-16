import { print, getGlobalInfo, writeGlobalInfo } from 'arco-cli-dev-utils';
import locale from './locale';

export default async function logout() {
  const { userInfo } = getGlobalInfo();
  try {
    writeGlobalInfo({ 'x-arco-token': null, userInfo: null });
    print.success(`${locale.TIP_LOGOUT_SUCCESS}${userInfo?.username}`);
  } catch (err) {
    print.error(err);
  }
}
