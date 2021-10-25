import path from 'path';
import {
  CWD,
  DIR_NAME_CJS,
  DIR_NAME_COMPONENT_LIBRARY,
  DIR_NAME_ESM,
  DIR_NAME_ICON,
  DIR_NAME_SOURCE,
  DIR_NAME_TEST,
  DIR_NAME_UMD,
} from '../../constant';
import getConfigProcessor from '../../scripts/utils/getConfigProcessor';

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const baseConfig = {
  // The root directory that Jest should scan for tests and modules within
  rootDir: CWD,

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: [`./${DIR_NAME_TEST}/setup.js`],

  // An array of file extensions your modules use
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'jsx', 'node', 'mjs', 'md'],

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  snapshotSerializers: [require.resolve('enzyme-to-json/serializer')],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/'],

  // The regexp pattern Jest uses to detect test files
  testRegex: '.*\\.test\\.(j|t)sx?$',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.jsx?$': path.resolve(__dirname, './babelTransform.js'),
    '^.+\\.tsx?$': require.resolve('ts-jest'),
    '.*\\.md$': path.resolve(__dirname, './mdTransform.js'),
    '.*\\.(css|less|scss)$': path.resolve(__dirname, './styleTransform.js'),
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ['node_modules/[^/]+?/(?!(es|node_modules)/)'],
};

const config = {
  client: {
    ...baseConfig,

    // The test environment that will be used for testing
    testEnvironment: 'jsdom',

    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
      `${DIR_NAME_SOURCE}/**/*.{ts,tsx}`,
      `${DIR_NAME_COMPONENT_LIBRARY}/**/*.{ts,tsx}`,
      '!**/style/*',
    ],

    // The directory where Jest should output its coverage files
    coverageDirectory: './.coverage/',

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: [
      '/node_modules/',
      `/${DIR_NAME_CJS}/`,
      `/${DIR_NAME_ESM}/`,
      `/${DIR_NAME_UMD}/`,
      `/${DIR_NAME_ICON}/`,
    ],

    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: ['json', 'json-summary', 'lcov', 'text', 'clover', 'text-summary'],
  },
  node: {
    ...baseConfig,

    // The test environment that will be used for testing
    testEnvironment: 'node',

    // The regexp pattern Jest uses to detect test files
    testRegex: 'demo\\.test\\.(j|t)sx?$',
  },
};

const processor = getConfigProcessor<{ client: Function; node: Function }>('jest');
if (processor) {
  if (processor.client) {
    config.client = processor.client(config.client) || config.client;
  }
  if (processor.node) {
    config.node = processor.node(config.node) || config.node;
  }
}

export default config;
