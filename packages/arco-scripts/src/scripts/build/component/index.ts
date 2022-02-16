import gulp from 'gulp';
import fs from 'fs-extra';
import replace from 'gulp-replace';
import { print } from 'arco-cli-dev-utils';

import compileTS from './compileTS';
import { build as buildStyle, watch as watchStyle } from './compileStyle';
import buildIcon from '../icon';
import webpackConfig from '../../../config/webpack/component';
import webpackWithPromise from '../../utils/webpackWithPromise';
import { CWD, DIR_NAME_CJS, DIR_NAME_ESM } from '../../../constant';

const DIR_PATH_ESM = `${CWD}/${DIR_NAME_ESM}`;
const DIR_PATH_CJS = `${CWD}/${DIR_NAME_CJS}`;

const watchES = () => {
  return compileTS({ outDir: DIR_PATH_ESM, type: 'es', watch: true });
};

const buildES = () => {
  return compileTS({ outDir: DIR_PATH_ESM, type: 'es' });
};

const buildCJS = () => {
  return compileTS({
    outDir: DIR_PATH_CJS,
    type: 'cjs',
  }).then(() => {
    return new Promise((resolve, reject) => {
      gulp
        .src(`${DIR_PATH_CJS}/**/*.js`, { allowEmpty: true })
        .pipe(replace('/icon/react-icon/', '/icon/react-icon-cjs/'))
        .pipe(gulp.dest(DIR_PATH_CJS))
        .on('end', resolve)
        .on('error', reject);
    });
  });
};

const buildUMD = () => {
  print.info('[arco-scripts]', 'Start to build dist module...');
  return webpackWithPromise(webpackConfig).then(
    () => print.success('[arco-scripts]', 'Build dist module success!'),
    (error) => {
      throw error;
    }
  );
};

const buildCSS = () => {
  print.info('[arco-scripts]', 'Start to build css...');
  return buildStyle().then(
    () => print.success('[arco-scripts]', 'Build css success!'),
    (error) => {
      throw error;
    }
  );
};

export default {
  buildCSS,
  buildES,
  buildCJS,
  buildUMD,
  build: async () => {
    // Remove old files
    [DIR_PATH_ESM, DIR_PATH_CJS, webpackConfig.output.path].forEach(
      (path) => path && fs.removeSync(path)
    );

    try {
      await buildES();
      await Promise.all([buildCJS(), buildUMD(), buildIcon()]);
      await buildCSS();
    } catch (error) {
      print.error('[arco-scripts]', 'Failed to build component');
      console.error(error);
      process.exit(1);
    }
  },
  dev: () => {
    watchES();
    watchStyle();
  },
};
