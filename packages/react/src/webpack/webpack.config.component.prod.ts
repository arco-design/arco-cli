import { Configuration } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const BUNDLER_ANALYZER = process.env.BUNDLER_ANALYZER === 'true';

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
    performance: false,
    plugins: [
      BUNDLER_ANALYZER
        ? new BundleAnalyzerPlugin({
            analyzerMode: 'static',
          })
        : null,
    ].filter(Boolean),
  };
}
