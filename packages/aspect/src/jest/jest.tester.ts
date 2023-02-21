import path from 'path';
import type jest from 'jest';
import { Tester, TesterContext, Tests } from '@arco-cli/service/dist/tester';
import { CallbackFn } from '@arco-cli/service/dist/tester/tester';
import { readFileSync } from 'fs-extra';

export type JestTesterOptions = {
  /**
   * array of patterns to test. (override the patterns provided by the context)
   */
  patterns?: string[];

  /**
   * add more root paths to look for tests.
   */
  roots?: string[];
};

export class JestTester implements Tester {
  displayName = 'Jest';

  _callback: CallbackFn | undefined;

  private readonly jestModule: typeof jest;

  constructor(
    readonly id: string,
    readonly jestConfigPath: string,
    private jestModulePath: string,
    _opts: JestTesterOptions = {}
  ) {
    this.jestModule = require(this.jestModulePath);
  }

  displayConfig(): string {
    return readFileSync(this.jestConfigPath, 'utf8');
  }

  version(): string {
    return this.jestModule.getVersion();
  }

  async test(context: TesterContext): Promise<Tests> {
    const config: any = {
      rootDir: context.rootPath,
      roots: [context.rootPath],
    };

    if (context.watch) {
      config.watchAll = true;
      config.noCache = true;
    }

    if (context.components) {
      config.testMatch = [];
      config.collectCoverageFrom = [];
      context.components.forEach(({ componentDir }) => {
        config.testMatch.push(...[
          `**/${componentDir}/**/*.test.[jt]s?(x)`,
          `**/${componentDir}/**/__test__/**/*.[jt]s?(x)`
        ]);
        config.collectCoverageFrom.push(...[
          `**/${componentDir}/**/*.[jt]s?(x)`,
          `!**/${componentDir}/**/style/*`,
          `!**/${componentDir}/**/__docs__/*`,
        ]);
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jestConfig = require(this.jestConfigPath);
    const withEnv = Object.assign(jestConfig, config);
    const testsOutput = await this.jestModule.runCLI(withEnv, [this.jestConfigPath]);
    const testResults = testsOutput.results.testResults;

    // TODO print test result
    false && console.log(testResults);

    return new Tests();
  }
}
