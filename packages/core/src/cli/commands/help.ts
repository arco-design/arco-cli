import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { CLIMain } from '../cli.main.runtime';
import { formatHelp } from '../help';

export class HelpCmd implements Command {
  name = 'help';

  description = 'show help information';

  // Default command (meaning, if no args are provided, this will be used)
  // https://github.com/yargs/yargs/blob/master/docs/advanced.md#default-command
  alias = '$0';

  loader = false;

  group = 'general';

  options = [] as CommandOptions;

  constructor(private cliMain: CLIMain, private docsDomain: string) {}

  async report() {
    return formatHelp(this.cliMain.commands, this.cliMain.groups, this.docsDomain);
  }
}
