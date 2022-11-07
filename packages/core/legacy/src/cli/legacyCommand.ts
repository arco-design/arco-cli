import { Group } from './commandGroups';
import { CommandOptions } from './command';

export interface LegacyCommand {
  name: string;
  // for help command
  description: string;
  // for the command itself
  extendedDescription?: string;
  helpUrl?: string;
  alias: string;
  options?: CommandOptions;
  commands?: LegacyCommand[];
  private?: boolean;
  loader?: boolean;
  skipWorkspace?: boolean;
  migration?: boolean;
  internal?: boolean;
  // Used for adding the token option globally
  remoteOp?: boolean;
  // for grouping in the "arco help" page
  group?: Group;

  action(params: any, options: { [key: string]: any }, packageManagerArgs?: string[]): Promise<any>;

  report(data: any, params: any, options: { [key: string]: any }): string;
}
