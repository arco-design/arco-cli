import { MainRuntime } from '@arco-cli/core/dist/cli';
import { JestAspect } from './jest.aspect';
import { JestTester, JestTesterOptions } from './jest.tester';

export class JestMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static provider() {
    return new JestMain();
  }

  constructor() {}

  createTester(jestConfig: any, jestModulePath?: string, opts?: JestTesterOptions) {
    jestModulePath = jestModulePath || require.resolve('jest');
    return new JestTester(JestAspect.id, jestConfig, jestModulePath, opts);
  }
}

JestAspect.addRuntime(JestMain);
