// Custom webpack config
import path from 'path';
import merge from 'webpack-merge';
import { Configuration } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import ProgressPlugin from 'progress-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import ArcoWebpackPlugin from '@arco-design/webpack-plugin';
import { webpackExternalForArco } from 'arco-cli-dev-utils';

import ArcoSiteModuleInfoPlugin from '../plugin';
import babelConfig from './babel.config';
import getMainConfig from '../utils/getMainConfig';
import getConfigProcessor from '../utils/getConfigProcessor';
import removeMarkdownDemoPart from '../utils/removeMarkdownDemoPart';
import {
  ENTRY_DIR_NAME,
  getPathEntryByLanguage,
  LIBRARY_MODULE_NAME,
} from '../utils/generateEntryFiles';

const REGEXP_CSS = /\.css$/;
const REGEXP_LESS = /\.less$/;
const REGEXP_LESS_MODULE = /\.module\.less$/;

const DEV_DIRECTORY_NAME = 'dist-dev';

const { build: buildConfig, site: siteConfig } = getMainConfig();

function getEntryConfig() {
  const entry: Record<string, string> = {};

  siteConfig.languages.forEach((language) => {
    entry[language] = getPathEntryByLanguage(language);
  });

  return entry;
}

function getModuleRuleForCss(production: boolean) {
  return [
    {
      loader: production ? MiniCssExtractPlugin.loader : 'style-loader',
    },
    {
      loader: 'css-loader',
    },
  ];
}

function getModuleRuleForLess({
  cssModule,
  production,
}: {
  cssModule?: boolean;
  production?: boolean;
}) {
  return [
    {
      loader: production ? MiniCssExtractPlugin.loader : 'style-loader',
    },
    {
      loader: 'css-loader',
      options: cssModule
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

/**
 * Generate webpack config needed by both production and development mode.
 * Config extension function will be executed twice, ensuring that BaseConfig is a different reference object.
 */
function generateBaseConfig() {
  return {
    output: {
      path: path.resolve('dist'),
      filename: `${LIBRARY_MODULE_NAME}.[name].js`,
      library: {
        name: LIBRARY_MODULE_NAME,
        type: 'umd',
      },
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
          test: /\.md$/,
          use: [
            {
              loader: 'babel-loader',
              options: babelConfig,
            },
            {
              loader: 'arco-markdown-loader',
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
      new ArcoSiteModuleInfoPlugin({
        globs: buildConfig.globs,
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
  };
}

/**
 * Generate webpack config based on user's site config
 */
function generateCustomConfig() {
  const plugins = [];

  if (siteConfig.arcoIconBox) {
    plugins.push(
      new ArcoWebpackPlugin({
        iconBox: siteConfig.arcoIconBox,
        include: [ENTRY_DIR_NAME],
      })
    );
  }

  return {
    plugins,
  };
}

const config = {
  dev: merge([
    generateBaseConfig(),
    {
      mode: 'development',
      output: {
        publicPath: '/',
      },
      module: {
        rules: [
          {
            test: REGEXP_CSS,
            use: getModuleRuleForCss(false),
          },
          {
            test: REGEXP_LESS,
            exclude: REGEXP_LESS_MODULE,
            use: getModuleRuleForLess({ production: false, cssModule: false }),
          },
          {
            test: REGEXP_LESS_MODULE,
            use: getModuleRuleForLess({ production: false, cssModule: true }),
          },
        ],
      },
      plugins: [],
      devServer: {
        open: true,
        historyApiFallback: true,
        port: 9000,
        static: {
          directory: path.resolve(DEV_DIRECTORY_NAME),
        },
      },
    },
    generateCustomConfig(),
  ]),
  prod: merge([
    generateBaseConfig(),
    {
      mode: 'production',
      entry: getEntryConfig(),
      module: {
        rules: [
          {
            test: REGEXP_CSS,
            use: getModuleRuleForCss(true),
          },
          {
            test: REGEXP_LESS,
            exclude: REGEXP_LESS_MODULE,
            use: getModuleRuleForLess({ production: true, cssModule: false }),
          },
          {
            test: REGEXP_LESS_MODULE,
            use: getModuleRuleForLess({ production: true, cssModule: true }),
          },
        ],
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: `${LIBRARY_MODULE_NAME}.css`,
        }),
      ],
      optimization: {
        minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
      },
    },
    generateCustomConfig(),
  ]),
};

const processor = getConfigProcessor('webpack');
if (processor) {
  config.dev = processor(config.dev, 'dev') || config.dev;
  config.prod = processor(config.prod, 'prod') || config.prod;
}

export const dev = config.dev as Configuration;
export const prod = config.prod as Configuration;
