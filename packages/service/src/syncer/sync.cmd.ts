import chalk from 'chalk';
import { Logger } from '@arco-cli/core/dist/logger';
import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { CLI_COMPONENT_PATTERN_HELP, CLI_LOGIN_FIRST_TIP } from '@arco-cli/legacy/dist/constants';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { WorkspaceNotFoundError } from '@arco-cli/aspect/dist/workspace/exceptions';
import ArcoError from '@arco-cli/legacy/dist/error/arcoError';
import { formatComponentResultError } from '@arco-cli/legacy/dist/workspace/componentResult';
import { checkUserLogin } from '@arco-cli/legacy/dist/cli/user';

import { SyncerMain } from './syncer.main.runtime';

export class SyncCmd implements Command {
  name = 'sync [component-pattern]';

  description = 'sync components in the workspace to Arco material market';

  arguments = [{ name: 'component-pattern', description: CLI_COMPONENT_PATTERN_HELP }];

  alias = '';

  group = 'collaborate';

  options = [] as CommandOptions;

  constructor(private logger: Logger, private syncer: SyncerMain, private workspace: Workspace) {}

  async report([pattern]: [string]): Promise<string> {
    if (!this.workspace) throw new WorkspaceNotFoundError();

    const components = await this.workspace.getManyByPattern(pattern);
    if (!components.length) {
      return chalk.bold('no components found to sync');
    }
    this.logger.consoleSuccess(`found ${components.length} components to sync`);

    const { loggedIn, user } = await checkUserLogin();
    if (!loggedIn) {
      return chalk.red(CLI_LOGIN_FIRST_TIP);
    }

    const results = await this.syncer.sync(components, user.username);
    const errorMsg = formatComponentResultError(results);

    if (errorMsg) {
      throw new ArcoError(errorMsg);
    }

    return chalk.green(`sync components completed. total: ${components.length} components`);
  }
}
