import type { ReactElement } from 'react';
import { Group } from './commandGroups';

export type Flags = { [flagName: string]: string | boolean | undefined | any };
export type CLIArgs = Array<string[] | string>;
export type GenericObject = { [k: string]: any };
export type Report = { data: string; code: number };
export type RenderResult = { data: ReactElement; code: number };
export type Example = { cmd: string; description: string };
export type CommandArg = { name: string; description?: string };
export type CommandOption = [string, string, string];
export type CommandOptions = Array<CommandOption>;

export interface Command {
  /**
   * name of command with arguments:
   * <> for mandatory arguments.
   * [] for optional arguments.
   * e.g. 'add <path>'
   */
  name: string;

  /**
   * command alias (for example: 't' for 'tag')
   */
  alias?: string;

  /**
   * The description of the command. Being used in the commands summery and the help
   * should be short and precise. not more than one line. (use extendedDescription for more info).
   */
  description?: string;

  /**
   * The extended description of the command. Will be seen in only in the command help, just after the description.
   */
  extendedDescription?: string;

  /**
   * url to a doc page explaining the command. shown in the command help just after the extendedDescription.
   */
  helpUrl?: string;

  /**
   * allow grouping of commands to hint summery renderer
   * Places in default automatic help
   */
  group?: Group | string;

  /**
   * should a command be exposed to the user (by arco help).
   * e.g. experimental commands or commands created for the ssh communication should not be exposed
   */
  private?: boolean;

  /**
   * command that is not running on the terminal, such as "_fetch", "_put".
   * in case an error is thrown, it is serialized so it's easier to parse it later
   */
  internal?: boolean;

  /**
   * should turn on Loader.
   * the default is false for internal-commands and true for others.
   * @see cliMain.setDefaults()
   */
  loader?: boolean;

  /**
   * Array of command options where each element is a tuple.
   * ['flag alias', 'flag name', 'flag description']
   * for example:
   * ['j', 'json', 'output json format']
   */
  options: CommandOptions;

  /**
   * arguments are defined in the "name" property, and that's where the source of truth is.
   * this prop is optional and provides a way to describe the args. later, it'll support more fields, such as defaultValue.
   * if this is set, it'll be shown in the command help under "Arguments" section.
   */
  arguments?: CommandArg[];

  /**
   * sub commands for example:
   * arco capsule list to list active capsules.
   */
  commands?: Command[];

  /**
   * interact with a remote
   * for now, the only difference is that they get a "token" flag to authenticate anonymously.
   */
  remoteOp?: boolean;

  /**
   * if true, it indicates that it doesn't need the workspace to work and can be executed outside a
   * workspace
   */
  skipWorkspace?: boolean;

  /**
   * optionally, give some examples how to use the command.
   */
  examples?: Example[];

  /**
   * do not set this. it is being set once the command run.
   * the values are those followed `--` in the command line. (e.g. `arco import -- --no-optional`)
   */
  _packageManagerArgs?: string[];

  /**
   * Main command handler which is called when invoking new commands
   * @param args  - arguments object as defined in name.
   * @param flags - command flags as described in options.
   * @return - JSX element which is rendered with ink
   */
  render?(args: CLIArgs, flags: Flags): Promise<RenderResult | ReactElement>;

  /**
   * render method from ink
   * https://www.npmjs.com/package/ink
   * package ink depends on react
   * mount its render method on Command instance to ensure that there is only one copy of React
   */
  inkRender?: (element: ReactElement) => { waitUntilExit: () => Promise<void> };

  /**
   * Command handler which is called for legacy commands or when process.isTTY is false
   * @param args  - arguments object as defined in name.
   * @param flags - command flags as described in options.
   * @return - Report object. The Report.data is printed to the stdout as is.
   */
  report?(args: CLIArgs, flags: Flags): Promise<string | Report>;

  /**
   * Optional handler to provide a raw result of the command.
   * Will be go called if '-j'/'--json' option is provided by user.
   * @param args  - arguments object as defined in name.
   * @param flags - command flags as described in options.
   * @return a GenericObject to be rendered to string (by json.stringify) in the console.
   */
  json?(args: CLIArgs, flags: Flags): Promise<GenericObject>;
}
