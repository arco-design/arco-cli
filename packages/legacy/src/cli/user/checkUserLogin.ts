import { getSync } from '../../globalConfig';
import { getUserInfoFromAPI, UserFromAPI } from './getUserInfoFromAPI';
import { CFG_USER_TOKEN_KEY } from '../../constants';

export async function checkUserLogin(): Promise<{ loggedIn: boolean; user?: UserFromAPI }> {
  if (!getSync(CFG_USER_TOKEN_KEY)) {
    return { loggedIn: false };
  }

  const { ok, user } = await getUserInfoFromAPI();
  return ok && user ? { loggedIn: true, user } : { loggedIn: false };
}
