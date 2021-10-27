import fs from 'fs-extra';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { print } from '@arco-design/arco-dev-utils';
import { dev as configDev, prod as configProd } from '../../config/webpack/site';

import webpackWithPromise from '../utils/webpackWithPromise';

export const dev = (https, ip, port) => {
  ip = ip || '127.0.0.1';
  port = port || 8080;

  const config = configDev;
  const host = ip === '0.0.0.0' ? 'localhost' : ip;
  const url = `${https ? 'https' : 'http'}://${host}:${port}`;
  const compiler = webpack(config);
  const server = new WebpackDevServer(compiler, { ...config.devServer, host, port });

  server.listen(port, ip, () => {
    print.success('[arco-scripts]', `Starting server on ${url}`);
  });
};

export const build = () => {
  const config = configProd;
  print.info('\nStart to build site...');
  fs.removeSync(config.output.path);
  return webpackWithPromise(config).then(
    () => print.success('[arco-scripts]', 'Build site success!'),
    (error) => {
      print.error('[arco-scripts]', 'Failed to build site');
      console.error(error);
    }
  );
};
