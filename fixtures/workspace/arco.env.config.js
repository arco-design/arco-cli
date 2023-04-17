const path = require('path');
const NpmPluginImport = require('less-plugin-npm-import');
// const ArcoWebpackPlugin = require('@arco-plugins/webpack-react');

module.exports = function defineConfig(envId) {
  /**
   * @type {import('../../packages/arco/src/types').ArcoEnvConfig}
   */
  const config = {
    jest: {
      jestConfigPath: path.resolve(__dirname, './jest.config.js'),
    },
    webpack: {
      devServerConfig: [
        (config) => {
          return config.merge({
            plugins: [
              // new ArcoWebpackPlugin({
              //   theme: '@arco-design/theme-line',
              //   webpackImplementation: config.webpack,
              //   include: 'packages',
              // }),
            ],
            resolve: {
              alias: {
                react: require.resolve('react'),
              },
            },
          });
        },
      ],
    },
    typescript: {
      buildConfig: [
        (config) => {
          config.mergeTsConfig({
            compilerOptions: {
              allowJs: false,
            },
          });
          return config;
        },
      ],
    },
    less: {
      combine: {
        filename: '../dist/style/dist.less'
      },
      lessOptions: {
        plugins: [new NpmPluginImport({ prefix: '~' })],
      },
    },
    sass: {
      combine: true,
      sassOptions: {}
    }
  };

  return config;
};
