import { Configuration } from 'webpack';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

const matchNothingRegex = 'a^';

export default function (envId: string): Configuration {
  return {
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
