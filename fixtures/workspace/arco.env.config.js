const path = require('path');
const ArcoWebpackPlugin = require('@arco-plugins/webpack-react');

module.exports = function defineConfig(envId) {
  return {
    jest: {
      jestConfigPath: path.resolve(__dirname, './jest.config.js'),
    },
    webpack: {
      devServerConfig: [
        (config) => {
          return config.merge({
            plugins: [
              new ArcoWebpackPlugin({
                theme: '@arco-design/theme-line',
                webpackImplementation: config.webpack,
                include: 'packages',
              }),
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
          console.log(config);
          config.mergeTsConfig({
            compilerOptions: {
              allowJs: false,
            }
          });
          return config;
        },
      ],
    },
  };
};
