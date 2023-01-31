import { Configuration } from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

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
    plugins: [],
    performance: false,
  };
}
