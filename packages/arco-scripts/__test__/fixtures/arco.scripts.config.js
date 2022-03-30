const path = require('path');

module.exports = {
  /**
   * @param config {import('arco-scripts').BabelConfig}
   */
  babel: (config) => {},
  /**
   * @param config {import('arco-scripts').StyleConfig}
   */
  style: (config) => {},
  /**
   * @param config {import('arco-scripts').WebpackConfig}
   */
  webpack: (config) => {},
  /**
   * @param config {import('arco-scripts').DocgenConfig}
   */
  docgen: (config) => {
    config.entry = 'src';
    // DON'T change output!!!
    config.output = 'docs/README.md';
    config.tsParseTool = ['ts-document'];
    config.demoGlob = 'demo/index.js';
  },
  jest: {
    /**
     * @param config {import('arco-scripts').JestConfig}
     */
    node: (config) => {
      config.setupFiles = [path.resolve(__dirname, './tests/setup.js')];
    },
    /**
     * @param config {import('arco-scripts').JestConfig}
     */
    client: (config) => {
      config.setupFiles = [path.resolve(__dirname, './tests/setup.js')];
    },
  },
};
