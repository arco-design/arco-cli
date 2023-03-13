import http from 'http';
import chalk from 'chalk';
import connect from 'connect';
import open from 'open';
import uniqid from 'uniqid';

import logger from '../../../logger';
import request from '../../request';
import { LegacyCommand } from '../../legacyCommand';
import { Group } from '../../commandGroups';
import { setSync } from '../../../globalConfig';
import { loginSuccessPage } from './loginSuccessPage';
import { checkUserLogin, getUserInfoFromAPI, UserFromAPI } from '../../user';
import {
  CFG_USER_NAME_KEY,
  CFG_USER_TOKEN_KEY,
  CFG_USER_EMAIL_KEY,
  CFG_USER_ACCOUNT_TYPE_KET,
} from '../../../constants';

type LoginActionResult = {
  isLoggedIn?: boolean;
  isWaiting?: boolean;
  username?: string;
};

const LOCAL_LISTEN_SERVER_PATH = '/login_result';
const LOCAL_LISTEN_SERVER_PORT = 3333;

export class Login implements LegacyCommand {
  // Avoid calling this function in a loop to report errors
  static isWaiting = false;

  private successHTMLString = loginSuccessPage();

  name = 'login';

  description = 'log in to Arco';

  group: Group = 'general';

  alias = '';

  skipWorkspace = true;

  options = [];

  async action(): Promise<LoginActionResult> {
    if (Login.isWaiting) return { isWaiting: true };

    const { loggedIn, user } = await checkUserLogin();
    if (loggedIn) {
      return {
        isLoggedIn: true,
        username: user.username,
      };
    }

    Login.isWaiting = true;

    let httpServer;
    const userInfo: UserFromAPI = await new Promise((resolve, reject) => {
      const app = connect();
      const token = uniqid();

      app.use(LOCAL_LISTEN_SERVER_PATH, async (_, res, next) => {
        try {
          setSync({ [CFG_USER_TOKEN_KEY]: token });
          const { user } = await getUserInfoFromAPI();
          res.end(this.successHTMLString);
          resolve(user);
        } catch (err) {
          next(err);
        }
      });

      httpServer = http.createServer(app).listen(LOCAL_LISTEN_SERVER_PORT);

      request
        .get('login', {
          headers: {
            [CFG_USER_TOKEN_KEY]: token,
            referer: `http://localhost:${LOCAL_LISTEN_SERVER_PORT}${LOCAL_LISTEN_SERVER_PATH}`,
          },
        })
        .then((res) => {
          const { result } = res;
          console.log(
            chalk.cyan(
              `\nPlease complete the authentication in the browser: ${result.redirectUrl}\n`
            )
          );
          open(result.redirectUrl);
        })
        .catch((err) => {
          reject(err);
          logger.error('get an error from command login', err);
        });
    });

    setSync({
      [CFG_USER_NAME_KEY]: userInfo.username,
      [CFG_USER_EMAIL_KEY]: userInfo.email,
      [CFG_USER_ACCOUNT_TYPE_KET]: userInfo.accountType,
    });
    httpServer?.close();

    return { username: userInfo.username };
  }

  report({ isWaiting, isLoggedIn = false, username }: LoginActionResult): string {
    return isWaiting
      ? chalk.yellow('a login process is already running')
      : isLoggedIn
      ? chalk.yellow(`${username || 'you'} already logged in`)
      : chalk.green(`successfully logged in as ${username}`);
  }
}
