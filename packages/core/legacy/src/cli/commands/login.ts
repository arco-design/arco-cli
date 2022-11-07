import chalk from 'chalk';
import { LegacyCommand } from '../legacyCommand';
import { Group } from '../commandGroups';

export default class Login implements LegacyCommand {
  name = 'login';

  description = 'Log in to Arco CLI';

  group: Group = 'general';

  alias = '';

  skipWorkspace = true;

  options = [];

  action(): Promise<any> {
    return new Promise<any>((resolve) => {
      setTimeout(() => resolve(0), 1000);
    });
  }

  report({
    isAlreadyLoggedIn = false,
    username,
  }: {
    isAlreadyLoggedIn: boolean;
    username: string;
  }): string {
    return isAlreadyLoggedIn
      ? chalk.yellow('Already logged in.')
      : chalk.green(`Success! Logged in as ${username}.`);
  }
}
