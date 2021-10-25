interface ProcessEnv {
  BUILD_ENV_MODE?: 'development' | 'production';
  BUILD_ENV_TS_COMPILER?: 'tsc' | 'babel';
  BUILD_ENV_DIST_FILENAME_JS?: string;
  BUILD_ENV_DIST_FILENAME_CSS?: string;
}

export const {
  BUILD_ENV_MODE,
  BUILD_ENV_TS_COMPILER,
  BUILD_ENV_DIST_FILENAME_JS,
  BUILD_ENV_DIST_FILENAME_CSS,
} = process.env as ProcessEnv;

export const CWD = process.cwd();

export const DIR_NAME_ESM = 'es';

export const DIR_NAME_CJS = 'lib';

export const DIR_NAME_UMD = 'dist';

export const DIR_NAME_ICON = 'icon';

export const DIR_NAME_SITE = 'site';

export const DIR_NAME_TEST = 'tests';

export const DIR_NAME_SOURCE = 'src';

export const DIR_NAME_ASSET = 'asset';

export const DIR_NAME_DEMO = 'demo';

export const DIR_NAME_COMPONENT_LIBRARY = 'components';

export const FILENAME_DIST_LESS = 'index.less';

export const FILENAME_DIST_CSS = 'index.css';

export const FILENAME_STYLE_ENTRY_RAW = 'index.js';

export const FILENAME_STYLE_ENTRY_CSS = 'css.js';

export const FILENAME_README = 'README.md';

export const ARCO_LIBRARY_PACKAGE_NAME_REACT = '@arco-design/web-react';
