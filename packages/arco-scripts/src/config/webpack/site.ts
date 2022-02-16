import path from 'path';
import chalk from 'chalk';
import webpack from 'webpack';
import merge from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import WriteFilePlugin from 'write-file-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';

import babelConfig from '../babel.config';
import { CWD, DIR_NAME_SITE } from '../../constant';
import getConfigProcessor from '../../scripts/utils/getConfigProcessor';

const DIR_PATH_SITE = `${CWD}/${DIR_NAME_SITE}`;

const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

function getUse(cssModule, isProduction) {
  const options = cssModule
    ? {
        modules: {
          localIdentName: '[local]-[hash:10]',
        },
      }
    : {};
  return [
    {
      loader: isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
    },
    {
      loader: 'css-loader',
      options,
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: ['autoprefixer'],
        },
      },
    },
    {
      loader: 'less-loader',
      options: {
        javascriptEnabled: true,
      },
    },
  ];
}

const baseConfig = {
  context: DIR_PATH_SITE,
  entry: `${DIR_PATH_SITE}/src/pages/components/index.js`,
  output: {
    path: `${DIR_PATH_SITE}/dist`,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: babelConfig,
        // loader: 'esbuild-loader',
        // options: {
        //   loader: 'tsx',
        //   target: 'es2015',
        // },
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: 'babel-loader',
            options: babelConfig,
            // loader: 'esbuild-loader',
            // options: {
            //   loader: 'jsx',
            //   target: 'es2015',
            // },
          },
          {
            loader: 'arco-markdown-loader',
            options: {
              demoDir: 'demo',
              babelConfig,
            },
          },
        ],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'file-loader',
        options: {
          esModule: false,
        },
      },
      {
        test: /\.(ttf|eot|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]',
          esModule: false,
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: `${DIR_PATH_SITE}/public/index.html`,
    }),
    new ProgressBarPlugin({
      format: `[arco-scripts]: [:bar] ${chalk.green.bold(':percent')} (:elapsed seconds)`,
    }),
  ],
  resolve: {
    modules: [`${DIR_PATH_SITE}/node_modules`, 'node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {},
  },
};

// Avoid require.resolve error when react is not installed
try {
  (baseConfig.resolve.alias as any).react = require.resolve('react');
} catch (e) {}

const config = {
  dev: merge.smart(baseConfig, {
    mode: 'development',
    output: {
      publicPath: '/',
      filename: '[name].min.js',
    },
    module: {
      rules: [
        {
          test: lessRegex,
          exclude: lessModuleRegex,
          use: getUse(false, false),
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
            },
          ],
        },
        {
          test: lessModuleRegex,
          use: getUse(true, false),
        },
      ],
    },
    plugins: [new WriteFilePlugin()],
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      host: '0.0.0.0',
      port: 8080,
      compress: true,
      inline: true,
      open: true,
      historyApiFallback: true,
      stats: {
        assets: true,
        chunks: false,
        chunkModules: false,
        chunkOrigins: false,
        modules: false,
        moduleTrace: false,
        reasons: false,
        source: false,
      },
    },
    devtool: 'cheap-source-map',
  }),
  prod: merge.smart(baseConfig, {
    mode: 'production',
    output: {
      publicPath: '/',
      filename: '[contenthash:6].[name].min.js',
    },
    module: {
      rules: [
        {
          test: lessRegex,
          exclude: lessModuleRegex,
          use: getUse(false, true),
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
          test: lessModuleRegex,
          use: getUse(true, true),
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"',
        },
      }),
      new MiniCssExtractPlugin({
        filename: '[contenthash:6].[name].min.css',
      }),
    ],
    optimization: {
      minimizer: [new TerserPlugin(), new OptimizeCSSAssetsPlugin()],
    },
  }),
};

const processor = getConfigProcessor<{ site: Function }>('webpack');
const realProcessor = processor && processor.site;
if (realProcessor) {
  config.dev = realProcessor(config.dev, 'dev') || config.dev;
  config.prod = realProcessor(config.prod, 'prod') || config.prod;
}

export const dev = config.dev;
export const prod = config.prod;
