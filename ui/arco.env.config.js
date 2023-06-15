/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

module.exports = function defineConfig() {
  const webpackConfigTransformer = (config) => {
    const mdxLoader = config.raw.module.rules
      .find((rule) => rule.oneOf)
      ?.oneOf?.find((rule) => rule.test.test('.mdx'))
      ?.use?.find(({ loader }) => loader.indexOf('/mdx/loader') > -1);
    if (mdxLoader) {
      mdxLoader.options.preProcessFile = ({ path: filePath, content }) => {
        const componentStyleEntry = '../style/index.ts';
        if (fs.existsSync(path.resolve(path.dirname(filePath), componentStyleEntry))) {
          return `${content}\nimport '${componentStyleEntry}';`;
        }
        return content;
      };
    }

    return config.merge({
      resolve: {
        alias: {
          react: require.resolve('react'),
        },
      },
    });
  };

  const config = {
    jest: {
      jestConfigPath: path.resolve(__dirname, './jest.config.js'),
    },
    webpack: {
      previewConfig: [webpackConfigTransformer],
      devServerConfig: [webpackConfigTransformer],
    },
    typescript: {
      buildConfig: [
        (config) => {
          config.mergeTsConfig({});
          return config;
        },
      ],
    },
    less: {
      lessOptions: {},
    },
    sass: {
      sassOptions: {},
    },
  };

  return config;
};
