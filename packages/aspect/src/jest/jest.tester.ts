import path from 'path';
import type jest from 'jest';
import { readFileSync } from 'fs-extra';
import { Tester, TesterContext, Tests } from '@arco-cli/service/dist/tester';
import { parseCliRawArgs } from '@arco-cli/core/dist/cli/utils';

export type JestTesterOptions = {
  /**
   * add more root paths to look for tests.
   */
  roots?: string[];
};

export class JestTester implements Tester {
  displayName = 'Jest';

  private readonly jestModule: typeof jest;

  constructor(
    readonly id: string,
    readonly jestConfigPath: string,
    private jestModulePath: string,
    _opts: JestTesterOptions = {}
  ) {
    this.jestModule = require(this.jestModulePath);
  }

  private convertJestCliOptions(optionsWithAlias): typeof optionsWithAlias {
    // jest cli options with alias
    // https://jestjs.io/docs/29.3/cli
    const jestOptionAliasMap = {
      b: 'bail',
      c: 'config',
      collectCoverage: 'coverage',
      e: 'expand',
      w: 'maxWorkers',
      o: 'onlyChanged',
      i: 'runInBand',
      t: 'testNamePattern',
      u: 'updateSnapshot',
      v: 'version',
    };

    const result = { ...optionsWithAlias };

    Object.entries(jestOptionAliasMap).forEach(([alias, optionName]) => {
      if (alias in result) {
        result[optionName] = result[alias];
        delete result[alias];
      }
    });

    return result;
  }

  displayConfig(): string {
    return readFileSync(this.jestConfigPath, 'utf8');
  }

  version(): string {
    return this.jestModule.getVersion();
  }

  async test(context: TesterContext): Promise<Tests> {
    const config: jest.Config = {
      rootDir: context.rootPath,
      roots: [context.rootPath],
    };

    if (context.watch) {
      config.watchAll = true;
      config.cache = false;
    }

    if (context.components) {
      config.testMatch = [];
      config.collectCoverageFrom = [];
      context.components.forEach(({ componentDir, entries }) => {
        config.testMatch.push(
          ...entries.testFilePatterns.map((pattern) => path.join('**', componentDir, pattern))
        );
        config.collectCoverageFrom.push(
          ...[`**/${componentDir}/**/*.[jt]s?(x)`, `!**/${componentDir}/**/{style,__docs__}/*`]
        );
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jestConfig = require(this.jestConfigPath);
    const withEnv = Object.assign(jestConfig, config);
    const { parsed: jestCliOptions } = parseCliRawArgs('jest', context.rawTesterArgs);
    const testsOutput = await this.jestModule.runCLI(
      { ...withEnv, ...this.convertJestCliOptions(jestCliOptions) },
      [this.jestConfigPath]
    );

    // TODO print test result
    false && console.log(testsOutput.results.testResults);

    return new Tests();
  }
}
