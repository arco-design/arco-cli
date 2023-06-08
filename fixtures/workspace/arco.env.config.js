const path = require('path');
const fs = require('fs');
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
          const mdxLoader = config.raw.module.rules
            .find((rule) => rule.oneOf)
            ?.oneOf?.find((rule) => rule.test.test('.mdx'))
            ?.use?.find(({ loader }) => loader.indexOf('/mdx/loader') > -1);
          if (mdxLoader) {
            mdxLoader.options.preProcessFile = ({ path: filePath, content }) => {
              const componentStyleEntry = '../style/index.ts';
              const pathDemoContext = path.join(__dirname, './scripts/initDemoContext.ts');

              // enable editing demo code in codesandbox
              content += `\nimport '${pathDemoContext}';`;

              // auto import component style
              if (fs.existsSync(path.resolve(path.dirname(filePath), componentStyleEntry))) {
                content += `\nimport '${componentStyleEntry}';`;
              }

              return content;
            };
          }

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
        filename: '../dist/style/dist.less',
      },
      lessOptions: {
        plugins: [new NpmPluginImport({ prefix: '~' })],
      },
    },
    sass: {
      combine: true,
      sassOptions: {},
    },
  };

  return config;
};
