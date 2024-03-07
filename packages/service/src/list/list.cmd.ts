import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { CLI_COMPONENT_PATTERN_HELP } from '@arco-cli/legacy/dist/constants';
import { ListMain } from './list.main.runtime';

export class ListCmd implements Command {
  name = 'list [component-pattern]';

  description = 'list components of current workspace';

  arguments = [{ name: 'component-pattern', description: CLI_COMPONENT_PATTERN_HELP }];

  alias = '';

  group = 'collaborate';

  options = [['', 'formatJson', 'print components info with JSON format']] as CommandOptions;

  constructor(private list: ListMain) {}

  async report([pattern]: [string], { formatJson }: { formatJson: boolean }): Promise<string> {
    const components = await this.list.getWorkspaceComponents(pattern);

    if (formatJson) {
      return JSON.stringify(
        components.map(({ packageDir, packageName, name }) => ({ packageDir, packageName, name })),
        null,
        2
      );
    }

    return components
      .map(({ packageDir, packageName, name }) => `${packageDir} | ${packageName} | ${name}`)
      .join('\n');
  }
}
