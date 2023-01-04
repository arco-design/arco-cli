import { merge } from 'lodash';
import { sep } from 'path';
import 'style-loader';
import { Configuration, IgnorePlugin } from 'webpack';
import getCSSModuleLocalIdent from 'react-dev-utils/getCSSModuleLocalIdent';
import * as stylesRegexps from '@arco-cli/legacy/dist/utils/regexp/style';
import { generateStyleLoaders } from '@arco-cli/webpack';
import { postCssConfig } from './postcss.config';

const styleLoaderPath = require.resolve('style-loader');

const MODULE_FILE_EXTENSIONS = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'cjs',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
  'mdx',
  'md',
];

// Source maps are resource heavy and can cause out of memory issue for large source files.
const GENERATE_SOURCEMAP = process.env.GENERATE_SOURCEMAP !== 'false';

const IMAGE_INLINE_SIZE_LIMIT = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000');

export default function (isEnvProduction = false): Configuration {
  const mergedShouldUseSourceMap = isEnvProduction || GENERATE_SOURCEMAP;

  // "postcss" loader applies autoprefixer to our CSS.
  // "css" loader resolves paths in CSS and adds assets as dependencies.
  // "style" loader turns CSS into JS modules that inject <style> tags.
  // By default, we keep style in the js files, you can use MiniCSSExtractPlugin
  // to extract that CSS to a file in production
  const baseStyleLoadersOptions = {
    injectingLoader: styleLoaderPath,
    cssLoaderPath: require.resolve('css-loader'),
    postCssLoaderPath: require.resolve('postcss-loader'),
    postCssConfig,
  };

  return {
    devtool: mergedShouldUseSourceMap ? 'inline-source-map' : false,

    resolve: {
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: MODULE_FILE_EXTENSIONS.map((ext) => `.${ext}`),

      alias: {
        'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime.js'),
        'react/jsx-runtime': require.resolve('react/jsx-runtime.js'),
        'react-dom/server': require.resolve('react-dom/server'),
        '@mdx-js/react': require.resolve('@mdx-js/react'),
      },
    },

    module: {
      strictExportPresence: true,
      rules: [
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESNext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: [/node_modules/, /\/dist\//],
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                customize: require.resolve('babel-preset-react-app/webpack-overrides'),
                presets: [
                  require.resolve('@babel/preset-react'),
                  require.resolve('@babel/preset-typescript'),
                ],
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },

            // MDX support (move to the mdx aspect and extend from there)
            {
              test: /\.mdx?$/,
              exclude: [/node_modules/],
              use: [
                {
                  loader: require.resolve('babel-loader'),
                  options: {
                    babelrc: false,
                    configFile: false,
                    presets: [
                      require.resolve('@babel/preset-env'),
                      require.resolve('@babel/preset-react'),
                      require.resolve('@babel/preset-typescript'),
                    ],
                  },
                },
                {
                  loader: require.resolve('@arco-cli/mdx/dist/loader'),
                },
              ],
            },

            // By default, we support CSS Modules with the extension .module.css
            {
              test: stylesRegexps.cssNoModulesRegex,
              use: generateStyleLoaders(
                merge({}, baseStyleLoadersOptions, {
                  cssLoaderOpts: {
                    importLoaders: 1,
                    sourceMap: mergedShouldUseSourceMap,
                  },
                })
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },

            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: stylesRegexps.cssModuleRegex,
              use: generateStyleLoaders(
                merge({}, baseStyleLoadersOptions, {
                  cssLoaderOpts: {
                    importLoaders: 1,
                    sourceMap: mergedShouldUseSourceMap,
                    modules: {
                      getLocalIdent: getCSSModuleLocalIdent,
                    },
                  },
                  shouldUseSourceMap: mergedShouldUseSourceMap,
                })
              ),
            },

            // Opt-in support for SASS (using .scss or .sass extensions).
            {
              test: stylesRegexps.sassNoModuleRegex,
              use: generateStyleLoaders(
                merge({}, baseStyleLoadersOptions, {
                  cssLoaderOpts: {
                    importLoaders: 3,
                    sourceMap: mergedShouldUseSourceMap,
                  },
                  shouldUseSourceMap: mergedShouldUseSourceMap,
                  preProcessOptions: {
                    resolveUrlLoaderPath: require.resolve('resolve-url-loader'),
                    preProcessorPath: require.resolve('sass-loader'),
                  },
                })
              ),
              sideEffects: true,
            },

            // By default, we support SASS Modules with the
            // extensions .module.scss or .module.sass
            {
              test: stylesRegexps.sassModuleRegex,
              use: generateStyleLoaders(
                merge({}, baseStyleLoadersOptions, {
                  cssLoaderOpts: {
                    importLoaders: 3,
                    sourceMap: mergedShouldUseSourceMap,
                    modules: {
                      getLocalIdent: getCSSModuleLocalIdent,
                    },
                  },
                  shouldUseSourceMap: mergedShouldUseSourceMap,
                  preProcessOptions: {
                    resolveUrlLoaderPath: require.resolve('resolve-url-loader'),
                    preProcessorPath: require.resolve('sass-loader'),
                  },
                })
              ),
            },

            // Opt-in support for LESS (using .less extensions).
            {
              test: stylesRegexps.lessNoModuleRegex,
              use: generateStyleLoaders(
                merge({}, baseStyleLoadersOptions, {
                  cssLoaderOpts: {
                    importLoaders: 1,
                    sourceMap: mergedShouldUseSourceMap,
                  },
                  shouldUseSourceMap: mergedShouldUseSourceMap,
                  preProcessOptions: {
                    resolveUrlLoaderPath: require.resolve('resolve-url-loader'),
                    preProcessorPath: require.resolve('less-loader'),
                  },
                })
              ),
              sideEffects: true,
            },

            // By default, we support LESS Modules with the
            // extensions .module.less
            {
              test: stylesRegexps.lessModuleRegex,
              use: generateStyleLoaders(
                merge({}, baseStyleLoadersOptions, {
                  cssLoaderOpts: {
                    importLoaders: 1,
                    sourceMap: mergedShouldUseSourceMap,
                    modules: {
                      getLocalIdent: getCSSModuleLocalIdent,
                    },
                  },
                  shouldUseSourceMap: mergedShouldUseSourceMap,
                  preProcessOptions: {
                    resolveUrlLoaderPath: require.resolve('resolve-url-loader'),
                    preProcessorPath: require.resolve('less-loader'),
                  },
                })
              ),
            },

            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: IMAGE_INLINE_SIZE_LIMIT,
                },
              },
              generator: {
                filename: 'static/images/[hash][ext][query]',
              },
            },

            {
              // loads svg as both inlineUrl and react component, like:
              // import starUrl, { ReactComponent as StarIcon } from './star.svg';
              // (remove when there is native support for both options from webpack5 / svgr)
              test: /\.svg$/,
              oneOf: [
                {
                  dependency: { not: ['url'] }, // exclude new URL calls
                  use: [
                    {
                      loader: require.resolve('@svgr/webpack'),
                      options: { titleProp: true, ref: true },
                    },
                    require.resolve('new-url-loader'),
                  ],
                },
                {
                  type: 'asset', // export a data URI or emit a separate file
                },
              ],
            },

            {
              test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
              type: 'asset',
              generator: {
                filename: 'static/fonts/[hash][ext][query]',
              },
            },

            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions, so they get processed
              // by webpack internal loaders.
              exclude: [/\.(js|mjs|cjs|jsx|ts|tsx)$/, /\.html$/, /\.mdx?/, /\.json$/, /\.css$/],
              generator: {
                filename: 'static/[hash][ext][query]',
              },
              type: 'asset',
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "type:asset" loader.
          ],
        },
      ],
    },

    plugins: [
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new IgnorePlugin({
        resourceRegExp: new RegExp(`^\\.${sep}locale$`),
        contextRegExp: /moment$/,
      }),
    ].filter(Boolean),
    performance: false,
  };
}
