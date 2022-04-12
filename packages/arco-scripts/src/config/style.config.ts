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
const autoprefix = new LessAutoprefix();

const FILE_ASSET_EXT = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'eot', 'woff', 'woff2'];
const FILE_WATCHED_EXT = FILE_ASSET_EXT.concat(['less', 'css']);

type AdditionalDataOption = {
  /**
   * Content added
   * @zh 新增的数据
   */
  data: string;
  /**
   * Whether to insert content at the end
   * @zh 是否在文件末尾插入内容，默认为文件首插入
   */
  append?: boolean;
  /**
   * Whether to use `data` to overwrite the original file content
   * @zh 是否使用 `data` 覆盖原文件内容
   */
  overwrite?: boolean;
};

export interface StyleConfig {
  /**
   * Config for building CSS
   * @zh 构建 CSS 的配置
   */
  css: {
    /**
     * Glob pattern for style entry file
     * @zh 样式入口文件的 glob 匹配符
     * @default ['src/**\/index.less', 'components/*\/index.less']
     */
    entry: string[];
    /**
     * Glob pattern for files to be watched
     * @zh 需要监听变化的文件的 glob 匹配符
     * @default ['{src,components}/**\/*.{less,css,png,jpg,jpeg,gif,svg,ttf,eot,woff,woff2}']
     */
    watch: string[];
    /**
     * Supplement the base filed for file watch
     * @zh 提供 Glob 匹配所需的 base 字段
     * @e.g ['src/*.{less,woff,png,jpg}']: 'components'
     */
    watchBase: Record<string, string>;
    /**
     * Config for style dist files
     * @zh 样式产物文件的相关配置
     */
    output: {
      /**
       * Path of ESM directory
       * @zh ESM 产物的文件夹路径
       * @default es
       */
      es: string;
      /**
       * Path of CommonJS directory
       * @zh CommonJS 产物的文件夹路径
       * @default lib
       */
      cjs: string;
      /**
       * Config for style UMD dist files
       * @zh UMD 产物的样式配置
       */
      dist: {
        /**
         * Path of UMD directory
         * @zh UND 产物的文件夹路径
         * @default dist/css
         */
        path: string;
        /**
         * CSS filename of UMD dist
         * @zh UMD 产物中的 CSS 文件名
         * @default index.css
         */
        cssFileName: string;
        /**
         * Raw-style filename of UMD dist
         * @zh UMD 产物中的原始样式文件的文件名
         * @default index.less
         */
        rawFileName: string;
      };
    };
    /**
     * Compiler to compile raw-style files
     * @zh 处理原始样式文件的编译器
     * @default less
     */
    compiler: any;
    /**
     * Options of style compiler
     * @zh 样式编译器的配置选项
     */
    compilerOptions: Record<string, any>;
    /**
     * Prepends/Appends Less code to the actual entry file.
     * @zh 在 Less 文件编译前修改其内容（不修改源码）
     */
    additionalData?:
      | AdditionalDataOption
      | ((file: {
          path: string;
          contents: string;
        }) => AdditionalDataOption | Promise<AdditionalDataOption>);
  };
  /**
   * Config of asset
   * @zh 静态资源文件配置
   */
  asset: {
    /**
     * Glob pattern for asset files
     * @zh 静态资源文件的 Glob 匹配符
     * @default ['{src,components}/**\/*.{png,jpg,jpeg,gif,svg,ttf,eot,woff,woff2}']
     */
    entry: string[];
    /**
     * Output path for asset files
     * @zh 静态资源文件的输出路径
     * @default dist/asset
     */
    output: string;
  };
  /**
   * Options for js-entry of style
   * @zh 样式的 JS 入口相关配置
   */
  jsEntry: {
    /**
     * Glob pattern for style entry file
     * @zh 样式 JS 入口文件的 Glob 匹配符
     * @default ['src/style/index.ts', 'components/*\/style/index.ts']
     */
    entry: string[];
    /**
     * Whether to automatically inject Arco UI library style dependency into style entry file
     * @zh 是否自动注入所依赖的 Arco 组件样式
     * @e.g @import '~@arco-design/web-react/es/Button/style';
     * @default true
     */
    autoInjectArcoDep: boolean;
    /**
     * Extension for raw-style file. e.g. less
     * @zh 未编译样式文件的扩展名。例如：less
     * @default less
     */
    styleSheetExtension: string;
    /**
     * Filename of entry for raw-style
     * @zh 未编译文件的 JS 入口
     * @default index.js
     */
    rawEntryFileName: string;
    /**
     * Filename of entry for css
     * @zh 文件的 JS 入口
     * @default css.js
     */
    cssEntryFileName: string;
  };
  /**
   * Hook executed during style compilation
   * @zh 在样式构建过程中执行的钩子
   */
  hook?: {
    /**
     * Hook before raw style file compiled, can receive gulp-plugin directly
     * @zh 原始样式文件编译前的钩子，可直接传入 gulp plugin
     */
    beforeCompile?: (...args: any[]) => NodeJS.ReadWriteStream;
    /**
     * Hook after raw style file compiled, can receive gulp-plugin directly
     * @zh 原始样式文件编译后的钩子，可直接传入 gulp plugin
     */
    afterCompile?: (...args: any[]) => NodeJS.ReadWriteStream;
  };
}

let config: StyleConfig = {
  css: {
    entry: [`${DIR_NAME_SOURCE}/**/index.less`, `${DIR_NAME_COMPONENT_LIBRARY}/**/index.less`],
    watch: [
      `${DIR_NAME_SOURCE}/**/*.{${FILE_WATCHED_EXT.join(',')}}`,
      `${DIR_NAME_COMPONENT_LIBRARY}/**/*.{${FILE_WATCHED_EXT.join(',')}}`,
    ],
    watchBase: {},
    output: {
      es: DIR_NAME_ESM,
      cjs: DIR_NAME_CJS,
      dist: {
        path: `${DIR_NAME_UMD}/css`,
        cssFileName: FILENAME_DIST_CSS,
        rawFileName: FILENAME_DIST_LESS,
      },
    },
    compiler: less,
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
    entry: [`${DIR_NAME_SOURCE}/style/index.ts`, `${DIR_NAME_COMPONENT_LIBRARY}/*/style/index.ts`],
    autoInjectArcoDep: true,
    styleSheetExtension: 'less',
    rawEntryFileName: '',
    cssEntryFileName: '',
  },
  hook: {},
};

// Compatible 'config.less' field changed to 'config.css'
config = compatiblePropertyNameChange(config, [{ now: 'css', prev: 'less' }]);

const processor = getConfigProcessor('style');
if (processor) {
  config = processor(config) || config;
}

// Options passed through Node Env have the highest priority
if (BUILD_ENV_DIST_FILENAME_CSS) {
  config.css.output.dist.cssFileName = BUILD_ENV_DIST_FILENAME_CSS;
}

export default config;
