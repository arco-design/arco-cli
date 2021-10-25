import less from 'gulp-less';
import LessAutoprefix from 'less-plugin-autoprefix';
import NpmImportPlugin from 'less-plugin-npm-import';

import {
  BUILD_ENV_DIST_FILENAME_CSS,
  DIR_NAME_ASSET,
  DIR_NAME_CJS,
  DIR_NAME_COMPONENT_LIBRARY,
  DIR_NAME_ESM,
  DIR_NAME_SOURCE,
  DIR_NAME_UMD,
  FILENAME_DIST_CSS,
  FILENAME_DIST_LESS,
} from '../constant';
import getConfigProcessor from '../scripts/utils/getConfigProcessor';
import compatiblePropertyNameChange from '../scripts/utils/compatiblePropertyNameChange';

const npmImport = new NpmImportPlugin({ prefix: '~' });
const autoprefix = new LessAutoprefix({ browsers: ['last 2 versions'] });

const FILE_ASSET_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'eot', 'woff', 'woff2'];
const FILE_WATCHED_EXT = FILE_ASSET_EXT.concat(['less']);

let config = {
  css: {
    entry: [`${DIR_NAME_SOURCE}/**/index.less`, `${DIR_NAME_COMPONENT_LIBRARY}/**/index.less`],
    watch: [
      `${DIR_NAME_SOURCE}/**/*.{${FILE_WATCHED_EXT.join(',')}}`,
      `${DIR_NAME_COMPONENT_LIBRARY}/**/*.{${FILE_WATCHED_EXT.join(',')}}`,
    ],
    // Supplement the base filed for file watch
    watchBase: {
      // e.g. ['components/**/*.{less,woff,png,jpg}']: 'components',
    },
    output: {
      es: DIR_NAME_ESM,
      cjs: DIR_NAME_CJS,
      dist: {
        path: `${DIR_NAME_UMD}/css`,
        cssFileName: FILENAME_DIST_CSS,
        rawFileName: FILENAME_DIST_LESS,
      },
    },
    // Style compiler
    compiler: less,
    // Options for compiler
    compilerOptions: {
      paths: ['node_modules'],
      plugins: [npmImport, autoprefix],
      relativeUrls: true,
      javascriptEnabled: true,
    },
  },
  asset: {
    entry: [
      `${DIR_NAME_SOURCE}/**/*.{${FILE_ASSET_EXT.join(',')}}`,
      `${DIR_NAME_COMPONENT_LIBRARY}/**/*.{${FILE_ASSET_EXT.join(',')}}`,
    ],
    output: `${DIR_NAME_UMD}/${DIR_NAME_ASSET}`,
  },
  jsEntry: {
    // Glob pattern for style entry file
    entry: [`${DIR_NAME_SOURCE}/style/index.ts`, `${DIR_NAME_COMPONENT_LIBRARY}/*/style/index.ts`],
    // Whether to automatically inject Arco UI library style dependency into style entry file
    // e.g. @import '~@arco-design/web-react/es/Button/style';
    autoInjectArcoDep: true,
    // Extension for style file
    styleSheetExtension: 'less',
    // Filename of JS entry which imported raw style file (default index.js)
    rawEntryFileName: '',
    // Filename of JS entry which imported compiled css file (default css.js)
    cssEntryFileName: '',
  },
};

// Compatible 'config.less' field changed to 'config.css'
config = compatiblePropertyNameChange(config, [{ now: 'css', prev: 'less' }]);

const processor = getConfigProcessor('style');
if (processor) {
  config = processor(config) || config;
}

// 通过 Node Env 传递而来的参数具有最高优先级
if (BUILD_ENV_DIST_FILENAME_CSS) {
  config.css.output.dist.cssFileName = BUILD_ENV_DIST_FILENAME_CSS;
}

export default config;
