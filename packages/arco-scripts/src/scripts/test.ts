import { run } from 'jest';
import jestConfig from '../config/jest/config';

export const testClient = () => {
  const argv = process.argv.slice(3);
  const cliConfig = ['--silent'].concat(argv);
  return run(['--config', JSON.stringify(jestConfig.client), ...cliConfig]);
};

export const testNode = () => {
  const argv = process.argv.slice(3);
  const cliConfig = ['--silent'].concat(argv);
  return run(['--config', JSON.stringify(jestConfig.node), ...cliConfig]);
};
