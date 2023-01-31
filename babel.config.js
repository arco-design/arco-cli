// eslint-disable-next-line @typescript-eslint/no-var-requires
const createResolvePath = require('babel-plugin-tsconfig-paths-module-resolver/create-resolve');

const defaultResolvePath = createResolvePath();

module.exports = function (api) {
  api.cache(true);

  const presets = ['@babel/preset-react', '@babel/typescript'];

  const plugins = [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
    'babel-plugin-transform-typescript-metadata',
    [
      'tsconfig-paths-module-resolver',
      {
        resolvePath: function customResolvePath(sourceFile, currentFile, opts) {
          // alias for @arco-cli/packages is only for IDE ts-hint
          // we don't need to transform it while compiling
          if (sourceFile.startsWith('@arco-cli/')) {
            return null;
          }

          return defaultResolvePath(sourceFile, currentFile, opts);
        },
      },
    ],
  ];

  return {
    presets,
    plugins,
    only: ['**/*.ts', '**/*.tsx'],
  };
};
