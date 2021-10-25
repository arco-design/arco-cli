import fs from 'fs-extra';
import { print } from '@arco-design/arco-dev-utils';
import webpackConfig from '../../config/webpack/icon';
import webpackWithPromise from '../utils/webpackWithPromise';

export default () => {
  if (fs.existsSync(webpackConfig.entry)) {
    print.info('[arco-scripts]', 'Start to build icons...');
    return webpackWithPromise(webpackConfig).then(
      () => print.success('[arco-scripts]', 'Build icons success!'),
      (error) => print.error(error)
    );
  }
  return Promise.resolve(null);
};
