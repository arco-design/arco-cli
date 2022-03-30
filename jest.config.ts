import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['packages/*/src/*.{j,t}s'],
  testRegex: '.*\\.test\\.(j|t)sx?$',
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: ['node_modules/[^/]+?/(?!(es|node_modules)/)'],
};

export default config;
