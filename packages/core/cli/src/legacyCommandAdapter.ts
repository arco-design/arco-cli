import { LegacyCommand } from '@arco-cli/legacy/dist/cli/legacyCommand';
import { Command, CommandOptions, GenericObject } from '@arco-cli/legacy/dist/cli/command';
import { CLIMain } from './cli.main.runtime';

type ActionResult = {
  code: number;
  report: string;
};

export class LegacyCommandAdapter implements Command {
  alias: string;

  name: string;

  description: string;

  options: CommandOptions;

  extendedDescription?: string;

  group?: string;

  loader?: boolean;

  commands: Command[];

  private?: boolean;

  migration?: boolean;

  internal?: boolean;

  skipWorkspace?: boolean;

  helpUrl?: string;

  _packageManagerArgs?: string[];

  constructor(private cmd: LegacyCommand, cliExtension: CLIMain) {
    this.name = cmd.name;
    this.description = cmd.description;
    this.helpUrl = cmd.helpUrl;
    this.options = cmd.options || [];
    this.alias = cmd.alias;
    this.extendedDescription = cmd.extendedDescription;
    this.skipWorkspace = cmd.skipWorkspace;
    this.group = cmd.group;
    this.loader = cmd.loader;
    this.private = cmd.private;
    this.migration = cmd.migration;
    this.internal = cmd.internal;
    this.commands = (cmd.commands || []).map((sub) => new LegacyCommandAdapter(sub, cliExtension));
  }

  private async action(params: any, options: { [key: string]: any }): Promise<ActionResult> {
    const res = await this.cmd.action(params, options, this._packageManagerArgs);
    let data = res;
    let code = 0;
    if (res && res.__code !== undefined) {
      data = res.data;
      code = res.__code;
    }
    const report = this.cmd.report(data, params, options);
    return {
      code,
      report,
    };
  }

  async report(
    params: any,
    options: { [key: string]: any }
  ): Promise<{ data: string; code: number }> {
    const actionResult = await this.action(params, options);
    return { data: actionResult.report, code: actionResult.code };
  }

  async json(params: any, options: { [key: string]: any }): Promise<GenericObject> {
    const actionResult = await this.action(params, options);
    return {
      data: JSON.parse(actionResult.report),
      code: actionResult.code,
    };
  }
}
