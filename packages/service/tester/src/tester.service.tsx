import chalk from 'chalk';
import { Logger } from '@arco-cli/logger';
import { EnvService, ExecutionContext, EnvDefinition } from '@arco-cli/envs';
import { Tester, Tests, CallbackFn } from './tester';

export type TesterOptions = {
  watch: boolean;
  callback?: CallbackFn;
};

export type TesterDescriptor = {
  /**
   * id of the tester (e.g. jest/mocha)
   */
  id: string;

  /**
   * display name of the tester (e.g. Jest / Mocha)
   */
  displayName: string;

  /**
   * string containing the config for display.
   */
  config: string;

  version?: string;
};

export class TesterService implements EnvService<Tests, TesterDescriptor> {
  name = 'tester';

  constructor(private logger: Logger) {}

  _callback: CallbackFn | undefined;

  getDescriptor(environment: EnvDefinition) {
    if (!environment.env.getTester) return null;
    const tester: Tester = environment.env.getTester();
    return {
      id: tester.id || '',
      displayName: tester.displayName || '',
      config: tester.displayConfig ? tester.displayConfig() : '',
      version: tester.version ? tester.version() : '?',
    };
  }

  onTestRunComplete(callback: CallbackFn) {
    this._callback = callback;
  }

  async run(context: ExecutionContext, options: TesterOptions) {
    this.logger.console(`testing components with environment ${chalk.cyan(context.id)}\n`);
    const tester: Tester = context.env.getTester();
    const testerContext = Object.assign(context, {
      watch: options.watch,
      // TODO root path
      rootPath: '/Users/helium/Desktop/arco-cli/fixtures/component',
    });
    const results = await tester.test(testerContext);
    return results;
  }
}
