import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { WorkspaceNotFoundError } from '@arco-cli/aspect/dist/workspace/exceptions';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { Logger } from '@arco-cli/core/dist/logger';
import { ForkMain } from '@service/fork/fork.main.runtime';

export class ForkCmd implements Command {
  name = 'fork [component-id]';

  description = 'fork component from Arco material market';

  arguments = [];

  alias = '';

  group = 'collaborate';

  options = [] as CommandOptions;

  constructor(private logger: Logger, private fork: ForkMain, private workspace: Workspace) {}

  async report(): Promise<string> {
    if (!this.workspace) throw new WorkspaceNotFoundError();

    if (this.fork) {
      this.logger.debug(`start to fork component to workspace`);
      return 'TODO: fork component to current workspace.';
    }

    return '';
  }
}
