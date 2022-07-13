import chalk from 'chalk';
import webpack from 'webpack';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import { webpackExternalForArco } from 'arco-cli-dev-utils';

import tscConfig from '../tsc.config';
import babelConfig from '../babel.config';
import {
  BUILD_ENV_DIST_FILENAME_JS,
  BUILD_ENV_MODE,
  CWD,
  DIR_NAME_COMPONENT_LIBRARY,
  DIR_NAME_UMD,
} from '../../constant';
import getConfigProcessor from '../../scripts/utils/getConfigProcessor';

const { name: packageName, version } = require(`${CWD}/package.json`);
const packageNameWithoutScope = packageName.replace(/^@[^\/]+\//, '');

const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

function getUse(cssModule) {
  const options = cssModule
    ? {
        modules: {
          localIdentName: '[local]-[hash:10]',
        },
      }
    : {};
  return [
    {
      loader: require.resolve('style-loader'),
    },
    {
      loader: require.resolve('css-loader'),
      options,
    },
    {
      loader: require.resolve('less-loader'),
      options: {
        javascriptEnabled: true,
      },
    },
  ];
}

function getTSLoaderOptions() {
  const options: { [key: string]: any } = {
    // Just for simplicity, not all the values in tscConfig are compilerOptions
    compilerOptions: { ...tscConfig },
  };
  if (tscConfig.project) {
    options.configFile = tscConfig.project;
  }
  return options;
}

let config = {
  mode: 'production',
  entry: {
    arco: `${CWD}/${DIR_NAME_COMPONENT_LIBRARY}/index.tsx`,
  },
  output: {
    path: `${CWD}/${DIR_NAME_UMD}`,
    publicPath: `https://unpkg.com/${packageName}@latest/${DIR_NAME_UMD}/`,
    filename: '[name].min.js',
    library: '[name]',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: babelConfig,
          },
          {
            loader: require.resolve('ts-loader'),
            options: getTSLoaderOptions(),
          },
        ],
      },
      {
        test: lessRegex,
        exclude: lessModuleRegex,
        use: getUse(false),
      },
      {
        test: /\.css$/,
        sideEffects: true,
        use: [
          {
            loader: require.resolve('style-loader'),
          },
          {
            loader: require.resolve('css-loader'),
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|ttf|eot|woff|woff2)$/,
        loader: require.resolve('file-loader'),
        options: {
          esModule: false,
        },
      },
      {
        test: /\.svg$/,
        use: [require.resolve('@svgr/webpack')],
      },
      {
        test: lessModuleRegex,
        use: getUse(true),
      },
    ],
  },
  externals: [
    {
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react',
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs2: 'react-dom',
        commonjs: 'react-dom',
        amd: 'react-dom',
      },
    },
    webpackExternalForArco,
  ],
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  resolveLoader: {
    modules: ['node_modules/arco-scripts/node_modules', 'node_modules'],
  },
  plugins: [
    new ProgressBarPlugin({
      format: `[arco-scripts]: [:bar] ${chalk.green.bold(':percent')} (:elapsed seconds)`,
    }),
    new webpack.BannerPlugin({
      banner: `${packageNameWithoutScope} v${version}\n\nCopyright 2019-present, Bytedance, Inc.\nAll rights reserved.\n`,
    }),
  ],
};

const processor = getConfigProcessor<Function | { component: Function }>('webpack');
// When webpack.config.js directly exposes a function, it defaults to the configuration of component webpack
const realProcessor =
  typeof processor === 'function'
    ? processor
    : processor && processor.component
    ? processor.component
    : null;

if (realProcessor) {
  config = realProcessor(config) || config;
}

// Compatible, avoid the outer layer directly set the entry as a string
if (typeof config.entry === 'string') {
  config.entry = {
    arco: config.entry,
  };
}

// 通过 Node Env 传递而来的参数具有最高优先级
if (BUILD_ENV_MODE) {
  config.mode = BUILD_ENV_MODE;
}
if (BUILD_ENV_DIST_FILENAME_JS) {
  config.output.filename = BUILD_ENV_DIST_FILENAME_JS;
}

export default config;
