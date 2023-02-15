import request from '../request';
import logger from '../../logger';

export type UserFromAPI = {
  accountType: 'sso' | 'github';
  name: string;
  username: string;
  nickname: string;
  email: string;
  avatarUrl: string;
};

export async function getUserInfoFromAPI(): Promise<{
  ok: boolean;
  user?: UserFromAPI;
  msg?: string;
}> {
  try {
    const { ok, msg, result: user } = await request.get('userInfo');

    if (!ok && msg) {
      logger.error('get error while get user info from API', msg);
    }

    return { ok, msg, user };
  } catch (error) {
    return { ok: false, msg: error.toString() };
  }
}
