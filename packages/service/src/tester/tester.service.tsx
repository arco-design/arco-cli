import chalk from 'chalk';
import { Logger } from '@arco-cli/core/dist/logger';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { EnvService, ExecutionContext, EnvDefinition } from '@arco-cli/aspect/dist/envs';
import { Tester, Tests, TesterOptions } from './tester';

export { TesterOptions };

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

  constructor(private logger: Logger, private workspace: Workspace) {}

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

  async run(context: ExecutionContext, options: TesterOptions) {
    this.logger.console(`testing components with environment ${chalk.cyan(context.id)}\n`);
    const tester: Tester = context.env.getTester();
    const results = await tester.test(
      Object.assign(context, {
        rootPath: this.workspace.path,
        ...options,
      })
    );
    return results;
  }
}
