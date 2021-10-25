// Custom webpack config
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import ProgressPlugin from 'progress-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { webpackExternalForArco } from '@arco-design/arco-dev-utils';

import ArcoSiteModuleInfoPlugin from '../plugin';
import babelConfig from './babel.config';
import getMainConfig from '../utils/getMainConfig';
import getConfigProcessor from '../utils/getConfigProcessor';
import removeMarkdownDemoPart from '../utils/removeMarkdownDemoPart';
import { getPathEntryByLanguage } from '../utils/generateEntryFiles';

const LIB_MODULE_NAME = 'arcoSite';
const REGEXP_LESS_MODULE = /\.module\.less$/;

const { build: buildConfig, site: siteConfig } = getMainConfig();

function getUseForLess(isCssModule = false) {
  return [
    {
      loader: MiniCssExtractPlugin.loader,
    },
    {
      loader: 'css-loader',
      options: isCssModule
        ? {
            modules: {
              localIdentName: '[local]-[hash:10]',
            },
          }
        : {},
    },
    {
      loader: 'less-loader',
      options: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
    },
  ];
}

let config = {
  mode: 'production',
  entry: (() => {
    const entry = {};
    siteConfig.languages.forEach((language) => {
      entry[language] = getPathEntryByLanguage(language);
    });
    return entry;
  })(),
  output: {
    path: path.resolve('dist'),
    filename: `${LIB_MODULE_NAME}.[name].js`,
    library: LIB_MODULE_NAME,
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: babelConfig,
          },
        ],
      },
      {
        test: /\.less$/,
        exclude: REGEXP_LESS_MODULE,
        use: getUseForLess(),
      },
      {
        test: REGEXP_LESS_MODULE,
        use: getUseForLess(true),
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
          },
        ],
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: 'babel-loader',
            options: babelConfig,
          },
          {
            loader: '@arco-design/arco-markdown-loader',
            options: {
              demoDir: 'demo',
              preprocess: removeMarkdownDemoPart,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(png|jpg|gif|ttf|eot|woff|woff2)$/,
        type: 'asset/resource',
      },
      {
        test: /\.txt$/,
        type: 'asset/source',
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: `${LIB_MODULE_NAME}.css`,
    }),
    new ArcoSiteModuleInfoPlugin({
      globs: {
        doc: buildConfig.globs.doc,
        demo: path.resolve(buildConfig.globs.component.base, buildConfig.globs.component.demo),
      },
    }),
    new ProgressPlugin(true),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {},
  },
  resolveLoader: {
    modules: [
      'node_modules',
      path.resolve(__dirname, '../../node_modules'),
      path.resolve(__dirname, '../../../'),
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
  optimization: {
    minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
  },
};

const processor = getConfigProcessor('webpack');
if (processor) {
  config = processor(config) || config;
}

export default config;
