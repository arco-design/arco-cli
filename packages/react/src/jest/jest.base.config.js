module.exports = {
  setupFiles: [require.resolve('react-app-polyfill/jsdom')],
  setupFilesAfterEnv: [require.resolve('./setupTests.js')],
  testEnvironment: require.resolve('jest-environment-jsdom'),
  testPathIgnorePatterns: ['/node_modules/'],
  transform: {
    '^.+\\.(less|scss|sass|css)$': require.resolve('./transformers/style-transformer.js'),
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': require.resolve('./transformers/file-transformer.js'),
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx|cjs)$',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  modulePaths: [],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': require.resolve('identity-obj-proxy'),
    '^.+\\.module\\.(css|sass|scss)$': require.resolve('identity-obj-proxy'),
  },
  moduleFileExtensions: [
    'web.js',
    'js',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'json',
    'web.jsx',
    'jsx',
    'node',
  ],
  testTimeout: 30000,
};
