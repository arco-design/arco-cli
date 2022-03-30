const { jest } = require('../arco.scripts.config');
module.exports = {
  node: (config) => {
    config = jest.node(config) || config;
    config.moduleNameMapper = {
      '^@arco-materials/material-sandbox-react/(.+)$': '<rootDir>/$1',
      '^@arco-materials/material-sandbox-react$': '<rootDir>',
    };
  },
  client: (config) => {
    config = jest.client(config) || config;
    config.moduleNameMapper = {
      '^@arco-materials/material-sandbox-react/(.+)$': '<rootDir>/$1',
      '^@arco-materials/material-sandbox-react$': '<rootDir>',
    };
  },
};
