module.exports = function (api) {
  api.cache(true);

  const presets = ['@babel/preset-react', '@babel/typescript'];

  const plugins = [
    'ramda',
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        lazy: () => true,
      },
    ],
    'babel-plugin-transform-typescript-metadata',
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-runtime'],
    ['@babel/plugin-proposal-object-rest-spread'],
    ['@babel/plugin-proposal-class-properties'],
  ];

  return {
    presets,
    plugins,
    only: ['**/*.ts', '**/*.tsx'],
  };
};
