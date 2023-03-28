import { ExecutionContext } from '@arco-cli/aspect/dist/envs';

export class Tests {
  constructor() {}

  get errors(): Error[] {
    // TODO errors
    return [];
  }
}

export interface TesterOptions {
  /**
   * determines whether to start the tester in watch mode.
   */
  watch?: boolean;

  /**
   * pass the raw tester cli options, e.g. "$jest: -u --testMatch=['test.js']";
   */
  rawTesterArgs?: string;

  /**
   * component pattern passed via 'arco test component-pattern'
   */
  pattern?: string;
}

export interface TesterContext extends ExecutionContext, TesterOptions {
  /**
   * rootPath of the component workspace
   */
  rootPath: string;
}

/**
 * tester interface allows extensions to implement a component tester
 */
export interface Tester {
  /**
   * id of the tester.
   */
  id: string;

  /**
   * display name of the tester.
   */
  displayName?: string;

  /**
   * serialized config of the tester.
   */
  displayConfig?(): string;

  /**
   * return the tester version.
   */
  version(): string;

  /**
   * path to the config in the filesystem.
   */
  configPath?: string;

  /**
   * execute tests on all components in the given execution context.
   */
  test(context: TesterContext): Promise<Tests>;

  /**
   * on test run complete. (applies only during watch)
   * @param callback
   */
  onTestRunComplete?(callback: () => void): Promise<void>;
}
