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
    'tsconfig-paths-module-resolver',
  ];

  return {
    presets,
    plugins,
    only: ['**/*.ts', '**/*.tsx'],
  };
};
