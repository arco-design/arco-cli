import path from 'path';
import http from 'http';
import open from 'open';
import fs from 'fs-extra';
import connect from 'connect';
import { nanoid } from 'nanoid';
import { print, writeGlobalInfo } from 'arco-cli-dev-utils';

import locale from './locale';
import request from './request';
import { isLogin } from './utils';

const LOCAL_LISTEN_SERVER_PATH = '/login_result';
const LOCAL_LISTEN_SERVER_PORT = 3333;

// Avoid calling this function in a loop to report errors
let isWaiting = false;
const loginSuccessPage = fs.readFileSync(path.resolve(__dirname, '../template/success.html'));

interface LoginOptions {
  /** HTML of login success page */
  successHTMLString?: string;
  /** Whether to exit the progress after logging in */
  exitAfterLogin?: boolean;
}

export default async ({
  successHTMLString = loginSuccessPage.toString(),
  exitAfterLogin = true,
}: LoginOptions = {}) => {
  if (isWaiting) {
    isWaiting = true;
    return;
  }

  const _isLogin = await isLogin();

  if (_isLogin) {
    print.warn(locale.TIP_ALREADY_LOGIN);
  } else {
    print(locale.TIP_LOGIN_ING);

    // Monitor the login result, jump to the login result page
    let httpServer;
    const userInfo: any = await new Promise((resolve, reject) => {
      const app = connect();
      const token = nanoid();

      app.use(LOCAL_LISTEN_SERVER_PATH, async (_, res, next) => {
        try {
          writeGlobalInfo({ 'x-arco-token': token });
          const { result } = await request.get('userInfo');
          res.end(successHTMLString);
          resolve(result);
        } catch (err) {
          next(err);
        }
      });

      httpServer = http.createServer(app).listen(LOCAL_LISTEN_SERVER_PORT);

      request
        .get('login', {
          headers: {
            'x-arco-token': token,
            referer: `http://localhost:${LOCAL_LISTEN_SERVER_PORT}${LOCAL_LISTEN_SERVER_PATH}`,
          },
        })
        .then((res) => {
          const { result } = res;
          print(`${locale.TIP_VERIFY_IN_BROWSER}${result.redirectUrl} \n`);
          open(result.redirectUrl);
        })
        .catch((err) => {
          reject(err);
          print.error(err);
        });
    });

    writeGlobalInfo({ userInfo });
    print.success(`${locale.TIP_LOGIN_SUCCESS}${userInfo.username}`);
    httpServer && httpServer.close();
  }

  isWaiting = false;

  if (exitAfterLogin) {
    process.exit();
  }
};
