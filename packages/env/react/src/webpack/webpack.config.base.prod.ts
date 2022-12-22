import { Configuration } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
// eslint-disable-next-line complexity
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

    plugins: [],
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false,
  };
}
