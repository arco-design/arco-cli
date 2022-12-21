import path from 'path';
import { Configuration } from 'webpack';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

const matchNothingRegex = 'a^';

export default function (workDir: string, envId: string): Configuration {
  return {
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          // limit loader to files in the current project,
          // to skip any files linked from other projects
          include: path.join(workDir, 'node_modules'),
          use: [require.resolve('source-map-loader')],
        },
        {
          test: /\.js$/,
          // limit loader to files in the current project,
          // to skip any files linked from other projects
          include: path.join(workDir, 'node_modules'),
          use: [
            require.resolve('@pmmmwh/react-refresh-webpack-plugin/loader'),
            {
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                plugins: [require.resolve('react-refresh/babel')],
                // turn off all optimizations (only slow down for node_modules)
                compact: false,
                minified: false,
              },
            },
          ],
        },
        // MDX support (move to the mdx aspect and extend from there)
        {
          test: /\.mdx?$/,
          // to skip any files linked from other projects
          include: path.join(workDir, 'node_modules'),
          use: [
            require.resolve('@pmmmwh/react-refresh-webpack-plugin/loader'),
            {
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                presets: [
                  require.resolve('@babel/preset-react'),
                  require.resolve('@babel/preset-env'),
                ],
                plugins: [require.resolve('react-refresh/babel')],
              },
            },
            {
              loader: require.resolve('@mdx-js/loader'),
            },
          ],
        },
      ],
    },
    plugins: [
      // No need here as we have `hot: true` in the dev server
      // new webpack.HotModuleReplacementPlugin({}),
      new ReactRefreshWebpackPlugin({
        overlay: {
          sockPath: `_hmr/${envId}`,
          entry: require.resolve('./overlay/webpackHotDevClient'),
          module: require.resolve('./overlay/refreshOverlayInterop'),
        },

        // we use '@pmmmwh/react-refresh-webpack-plugin/loader' directly where relevant.
        // FYI, original defaults of the plugin are:
        // include: /\.([cm]js|[jt]sx?|flow)$/i, exclude: /node_modules/,
        include: matchNothingRegex,
      }),
    ],
  };
}
