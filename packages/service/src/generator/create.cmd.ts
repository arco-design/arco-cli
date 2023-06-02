import chalk from 'chalk';
import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { WorkspaceNotFoundError } from '@arco-cli/aspect/dist/workspace/exceptions';

import { GeneratorMain, CreateComponentOptions } from './generator.main.runtime';

export class CreateCmd implements Command {
  name = 'create <component-name>';

  description = 'create a new component using a template';

  arguments = [
    { name: 'component-name', description: 'component name you want to create, e.g "Button"' },
  ];

  alias = '';

  group = 'development';

  options = [
    ['f', 'force', 'force overwrite directory, if it already exists'],
    ['p', 'path', 'directory path to create the new component'],
  ] as CommandOptions;

  constructor(private workspace: Workspace, private generator: GeneratorMain) {}

  async report(
    [name]: [string],
    { force, path }: Pick<CreateComponentOptions, 'force' | 'path'>
  ): Promise<string> {
    if (!this.workspace) throw new WorkspaceNotFoundError();

    try {
      const { message } = await this.generator.createComponent({ name, force, path });
      return chalk.green(message);
    } catch (err) {
      return chalk.red(err.toString());
    }
  }
}
