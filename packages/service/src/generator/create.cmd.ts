import chalk from 'chalk';
import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { WorkspaceNotFoundError } from '@arco-cli/aspect/dist/workspace/exceptions';

import { GeneratorMain, CreateComponentOptions } from './generator.main.runtime';

export class CreateCmd implements Command {
  name = 'create <component-name>';

  description = 'create a new component using a template';

  arguments = [
    {
      name: 'name',
      description: 'component name you want to create, e.g "Button"',
    },
  ];

  alias = '';

  group = 'development';

  options = [
    ['f', 'force', 'force overwrite directory, if it already exists'],
    ['p', 'path <path>', 'directory path to create the new component'],
    ['', 'template <template-name>', 'template for generating the component'],
    ['', 'templateArgs <template-args>', 'template arguments for generating the component'],
    ['', 'packageName <package-name>', 'package name of current component'],
  ] as CommandOptions;

  constructor(private workspace: Workspace, private generator: GeneratorMain) {}

  async report(
    [name]: [string],
    {
      force,
      path,
      packageName,
      template,
      templateArgs,
    }: Pick<CreateComponentOptions, 'force' | 'path' | 'packageName' | 'template' | 'templateArgs'>
  ): Promise<string> {
    if (!this.workspace) throw new WorkspaceNotFoundError();

    try {
      const { message } = await this.generator.create({
        name,
        force,
        path,
        packageName,
        template,
        templateArgs,
      });
      return chalk.green(message);
    } catch (err) {
      return chalk.red(err.toString());
    }
  }
}
