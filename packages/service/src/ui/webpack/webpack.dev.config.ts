import path, { sep } from 'path';
import { ProvidePlugin } from 'webpack';
import openBrowser from 'react-dev-utils/openBrowser';
import * as stylesRegexps from '@arco-cli/legacy/dist/utils/regexp/style';
import { pathNormalizeToLinux } from '@arco-cli/legacy/dist/utils/path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import evalSourceMapMiddleware from 'react-dev-utils/evalSourceMapMiddleware';
import noopServiceWorkerMiddleware from 'react-dev-utils/noopServiceWorkerMiddleware';
import redirectServedPath from 'react-dev-utils/redirectServedPathMiddleware';
import getPublicUrlOrPath from 'react-dev-utils/getPublicUrlOrPath';
import type { WebpackConfigWithDevServer } from '@arco-cli/aspect/dist/webpack';
import { fallbacks, fallbacksProvidePluginConfig } from '@arco-cli/aspect/dist/webpack/config';

import { html } from './html';

const matchNothingRegex = 'a^';

const publicUrlOrPath = getPublicUrlOrPath(
  process.env.NODE_ENV === 'development',
  sep,
  `${sep}public`
);

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

export function devConfig(
  workspaceDir: string,
  entryFiles: string[],
  title: string
): WebpackConfigWithDevServer {
  const resolveWorkspacePath = (relativePath) => path.resolve(workspaceDir, relativePath);

  // Host
  const host = process.env.HOST || 'localhost';

  // Required for babel-preset-react-app
  process.env.NODE_ENV = 'development';

  return {
    mode: 'development',
    entry: {
      main: entryFiles,
    },
    output: {
      pathinfo: false,
      path: resolveWorkspacePath('/'),
      // Development filename output
      filename: 'static/js/[name].bundle.js',
      publicPath: publicUrlOrPath,
      chunkFilename: 'static/js/[name].chunk.js',
      // point sourcemap entries to original disk locations (format as URL on windows)
      devtoolModuleFilenameTemplate: (info) =>
        pathNormalizeToLinux(path.resolve(info.absoluteResourcePath)),
    },
    // improves HMR - assume node_modules might change
    snapshot: {
      managedPaths: [],
    },
    infrastructureLogging: {
      level: 'error',
    },
    stats: {
      errorDetails: true,
    },
    devtool: 'inline-source-map',
    devServer: {
      host,
      hot: true,
      compress: true,
      allowedHosts: 'all',
      onListening: (devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        const addr = devServer.server.address();
        const ipListOfLocalhost = ['::1', '127.0.0.1'];
        openBrowser(
          typeof addr === 'string'
            ? addr
            : `http://${
                ipListOfLocalhost.indexOf(addr.address) > -1 ? 'localhost' : ipListOfLocalhost
              }:${addr.port}`
        );
      },
      static: [
        {
          directory: resolveWorkspacePath(publicUrlOrPath),
          staticOptions: {},
          // Don't be confused with `dev.publicPath`, it is `publicPath` for static directory
          // Can be:
          // publicPath: ['/static-public-path-one/', '/static-public-path-two/'],
          publicPath: publicUrlOrPath,
          // Can be:
          // serveIndex: {} (options for the `serveIndex` option you can find https://github.com/expressjs/serve-index)
          serveIndex: true,
          // Can be:
          // watch: {} (options for the `watch` option you can find https://github.com/paulmillr/chokidar)
          watch: true,
        },
      ],
      historyApiFallback: {
        index: publicUrlOrPath,
        disableDotRule: true,
      },
      devMiddleware: {
        // forward static files
        publicPath: publicUrlOrPath.slice(0, -1),
      },
      setupMiddlewares: (middlewares, devServer) => {
        middlewares.unshift(
          // Keep `evalSourceMapMiddleware` and `errorOverlayMiddleware`
          // middlewares before `redirectServedPath` otherwise will not have any effect
          // This lets us fetch source contents from webpack for the error overlay
          // @ts-ignore @types/wds mismatch
          evalSourceMapMiddleware(devServer),
          // This lets us open files from the runtime error overlay.
          errorOverlayMiddleware()
        );

        middlewares.push(
          // Redirect to `PUBLIC_URL` or `homepage` from `package.json` if url not match
          redirectServedPath(publicUrlOrPath),
          // This service worker file is effectively a 'no-op' that will reset any
          // previous service worker registered for the same host:port combination.
          // We do this in development to avoid hitting the production cache if
          // it used the same host and port.
          // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
          noopServiceWorkerMiddleware(publicUrlOrPath)
        );

        return middlewares;
      },
    },
    resolve: {
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: moduleFileExtensions.map((ext) => `.${ext}`),
      alias: {
        react: require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
        'react-router-dom': require.resolve('react-router-dom'),
      },
      fallback: {
        fs: false,
        stream: false,
        path: fallbacks.path,
        process: fallbacks.process,
      },
    },
    module: {
      // Webpack by default includes node_modules under its managed paths which cause the whole directory to be cached
      // Watch mode requires us to turn off unsafeCache as well
      // this de-optimizes the dev build but ensures hmr works when writing/linking into node modules.
      // However, we do not lose the caching entirely like cache: false
      unsafeCache: false,
      rules: [
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.js$/,
          enforce: 'pre',
          include: /node_modules/,
          // only apply to packages with componentId in their package.json
          descriptionData: { componentId: (value) => !!value },
          use: [
            require.resolve('@pmmmwh/react-refresh-webpack-plugin/loader'),
            require.resolve('source-map-loader'),
          ],
        },
        {
          test: /\.(js|jsx|tsx|ts)$/,
          exclude: /node_modules/,
          include: workspaceDir,
          use: [
            require.resolve('@pmmmwh/react-refresh-webpack-plugin/loader'),
            {
              loader: require.resolve('babel-loader'),
              options: {
                configFile: false,
                babelrc: false,
                presets: [
                  // Preset includes JSX, TypeScript, and some ESnext features
                  require.resolve('babel-preset-react-app'),
                ],
                plugins: [require.resolve('react-refresh/babel')],
              },
            },
          ],
        },
        {
          test: stylesRegexps.sassModuleRegex,
          use: [
            require.resolve('style-loader'),
            {
              loader: require.resolve('css-loader'),
              options: {
                modules: {
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                },
                sourceMap: true,
              },
            },
            {
              loader: require.resolve('sass-loader'),
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: stylesRegexps.sassNoModuleRegex,
          use: [
            require.resolve('style-loader'),
            require.resolve('css-loader'),
            {
              loader: require.resolve('sass-loader'),
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: stylesRegexps.lessModuleRegex,
          use: [
            require.resolve('style-loader'),
            {
              loader: require.resolve('css-loader'),
              options: {
                modules: {
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                },
                sourceMap: true,
              },
            },
            {
              loader: require.resolve('less-loader'),
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: stylesRegexps.lessNoModuleRegex,
          use: [
            require.resolve('style-loader'),
            require.resolve('css-loader'),
            {
              loader: require.resolve('less-loader'),
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: stylesRegexps.cssModuleRegex,
          use: [
            require.resolve('style-loader'),
            {
              loader: require.resolve('css-loader'),
              options: {
                modules: {
                  localIdentName: '[name]__[local]--[hash:base64:5]',
                },
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: stylesRegexps.cssNoModulesRegex,
          use: [require.resolve('style-loader'), require.resolve('css-loader')],
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: require.resolve('@svgr/webpack'),
              options: { titleProp: true, ref: true },
            },
          ],
        },
      ],
    },
    plugins: [
      new ReactRefreshWebpackPlugin({
        // we use '@pmmmwh/react-refresh-webpack-plugin/loader' directly where relevant.
        // FYI, original defaults of the plugin are:
        // include: /\.([cm]js|[jt]sx?|flow)$/i, exclude: /node_modules/,
        include: matchNothingRegex,
      }),
      // Re-generate index.html with injected script tag.
      // The injected script tag contains a src value of the
      // filename output defined above.
      new HtmlWebpackPlugin({
        inject: true,
        templateContent: html(title || 'Workspace'),
        chunks: ['main'],
        filename: 'index.html',
      }),
      new ProvidePlugin({ process: fallbacksProvidePluginConfig.process }),
    ],
  };
}
