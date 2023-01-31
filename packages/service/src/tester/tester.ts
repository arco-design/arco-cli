import { ExecutionContext } from '@arco-cli/aspect/dist/envs';

export class Tests {
  constructor() {}

  get errors(): Error[] {
    // TODO errors
    return [];
  }
}

export interface TesterContext extends ExecutionContext {
  /**
   * rootPath of the component workspace or the capsule root dir (during build).
   */
  rootPath: string;

  /**
   * determines whether to start the tester in watch mode.
   */
  watch?: boolean;
}

export type CallbackFn = () => void;

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
  onTestRunComplete?(callback: CallbackFn): Promise<void>;
}
