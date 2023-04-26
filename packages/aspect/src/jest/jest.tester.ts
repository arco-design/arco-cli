import path from 'path';
import type jest from 'jest';
import { readFileSync } from 'fs-extra';
import { TestResult as JestTestResult } from '@jest/test-result';
import { Tester, TesterContext, Tests } from '@arco-cli/service/dist/tester';
import { parseCliRawArgs } from '@arco-cli/core/dist/cli/utils';
import { ComponentResult } from '@arco-cli/legacy/dist/workspace/componentResult';
import { ComponentMap } from '@aspect/component';

import { JestError } from './exceptions';

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

  private convertJestCliOptions(option): typeof option {
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

    const { _: args, ...optionsWithAlias } = option;
    const result = { ...optionsWithAlias };

    if (args?.length) {
      const regexForTestFiles = args[0];
      if (/\.(js|jsx|ts|tsx)$/.test(regexForTestFiles)) {
        result.testMatch = [regexForTestFiles];
      } else {
        result.testNamePattern = regexForTestFiles;
      }
    }

    // convert 'true' | 'false' to boolean
    Object.entries(result).forEach(([key, value]) => {
      if (value === 'true') {
        result[key] = true;
      } else if (value === 'false') {
        result[key] = false;
      }
    });

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

  private getErrors(testResult: JestTestResult[]): JestError[] {
    return testResult.reduce((errors: JestError[], test) => {
      if (test.testExecError) {
        const { message, stack, code, type } = test.testExecError;
        errors.push(new JestError(message, stack, code, type));
      } else if (test.failureMessage) {
        errors.push(new JestError(test.failureMessage));
      }
      return errors;
    }, []);
  }

  private attachTestsToComponent(testerContext: TesterContext, testResults: JestTestResult[]) {
    return ComponentMap.as(testerContext.components, (component) => {
      return testResults.filter((test) => {
        const componentDirAbs = path.join(testerContext.rootPath, component.componentDir);
        return test.testFilePath.startsWith(componentDirAbs);
      });
    });
  }

  private buildTestsObj(
    componentTestMap: ComponentMap<JestTestResult[] | undefined>
  ): ComponentResult[] {
    return componentTestMap
      .toArray()
      .map(([component, testsFiles]) => {
        return testsFiles?.length
          ? {
              id: component.id,
              errors: this.getErrors(testsFiles),
            }
          : null;
      })
      .filter(Boolean);
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
      const testMatch: string[] = [];
      const collectCoverageFrom: string[] = [];

      context.components.forEach(({ packageDir, componentDir, entries }) => {
        const includeDir = context.pattern ? componentDir : packageDir;
        testMatch.push(
          ...entries.testFilePatterns.map((testFilePattern) =>
            path.join('**', includeDir, testFilePattern)
          )
        );
        collectCoverageFrom.push(
          ...[
            path.join('**', includeDir, '**/*.[jt]s?(x)'),
            path.join('!**', includeDir, '**/{style,__docs__}/*'),
          ]
        );
      });

      // unique pattern strings
      config.testMatch = [...new Set(testMatch)];
      config.collectCoverageFrom = [...new Set(collectCoverageFrom)];
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jestConfig = require(this.jestConfigPath);
    const jestConfigWithSpecs = Object.assign(jestConfig, config);
    const { parsed: jestCliOptions } = parseCliRawArgs('jest', context.rawTesterArgs);
    const testsOutput = await this.jestModule.runCLI(
      { ...jestConfigWithSpecs, ...this.convertJestCliOptions(jestCliOptions) },
      [this.jestConfigPath]
    );

    const testResults = testsOutput.results.testResults;
    const componentsWithTests = this.attachTestsToComponent(context, testResults);
    const componentTestResults = this.buildTestsObj(componentsWithTests);

    return new Tests(componentTestResults);
  }
}
