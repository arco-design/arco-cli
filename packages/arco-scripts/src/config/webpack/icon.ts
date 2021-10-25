import chalk from 'chalk';
import webpack from 'webpack';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import { webpackExternalForArco } from '@arco-design/arco-dev-utils';

import { CWD, DIR_NAME_ICON, DIR_NAME_UMD } from '../../constant';
import getConfigProcessor from '../../scripts/utils/getConfigProcessor';

const { name: packageName, version } = require(`${CWD}/package.json`);
const packageNameWithoutScope = packageName.replace(/^@[^\/]+\//, '');

let config = {
  entry: `${CWD}/${DIR_NAME_ICON}/index.js`,
  output: {
    path: `${CWD}/${DIR_NAME_UMD}`,
    filename: 'arco-icon.min.js',
    library: 'arcoicon',
    libraryTarget: 'umd',
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
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
  plugins: [
    new ProgressBarPlugin({
      format: `[arco-scripts]: [:bar] ${chalk.green.bold(':percent')} (:elapsed seconds)`,
    }),
    new webpack.BannerPlugin({
      banner: `${packageNameWithoutScope} v${version}\n\nCopyright 2019-present, Bytedance, Inc.\nAll rights reserved.\n`,
    }),
  ],
};

const processor = getConfigProcessor<{ icon: Function }>('webpack');
const realProcessor = processor && processor.icon;
if (realProcessor) {
  config = realProcessor(config) || config;
}

export default config;
