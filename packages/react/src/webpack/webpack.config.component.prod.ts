import { Configuration } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { ENV_BUNDLE_SIZE_ANALYZER } from '@arco-cli/legacy/dist/constants';

const BUNDLER_ANALYZER = process.env[ENV_BUNDLE_SIZE_ANALYZER] === 'true';

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
