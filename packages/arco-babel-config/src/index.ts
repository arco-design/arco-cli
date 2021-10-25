type BaseBabelConfig = {
  filename: string;
  presets: Array<any>;
  plugins: Array<string | Function>;
};

const config: BaseBabelConfig = {
  // TODO Solve babel error when there is no [filename]
  filename: '',
  presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'],
  plugins: [
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-react-jsx-source',
  ],
};

export default config;
