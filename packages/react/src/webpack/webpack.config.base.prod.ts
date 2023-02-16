import { Configuration } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

// This is the production configuration.
export default function (dev?: boolean): Configuration {
  const optimization = dev
    ? undefined
    : {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            extractComments: false,
          }),
          new CssMinimizerPlugin({
            minimizerOptions: {
              preset: [
                'default',
                {
                  minifyFontValues: { removeQuotes: false },
                },
              ],
            },
          }),
        ],
      };

  return {
    optimization,
    plugins: [
      // TODO add a build command option to enable this plugin
      // new BundleAnalyzerPlugin({
      //   analyzerMode: 'static',
      // }),
    ],
    performance: false,
  };
}
