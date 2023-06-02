/* eslint-disable @typescript-eslint/no-var-requires */
// allow IDE to configure Jest config
const defaultConfig = require(require.resolve('@arco-cli/react/dist/jest/jest.cjs.config.js'));

module.exports = {
  ...defaultConfig,
};
