import chalk from 'chalk';
import { LegacyCommand } from '../../legacyCommand';
import { Group } from '../../commandGroups';
import { delSync, getSync } from '../../../globalConfig';
import { CFG_USER_NAME_KEY, CFG_USER_TOKEN_KEY } from '../../../constants';

type LogoutActionResult = {
  isNotLoggedIn?: boolean;
  username?: string;
};

export class Logout implements LegacyCommand {
  name = 'logout';

  description = 'log out from Arco';

  group: Group = 'general';

  alias = '';

  skipWorkspace = true;

  options = [];

  async action(): Promise<LogoutActionResult> {
    if (getSync(CFG_USER_TOKEN_KEY)) {
      delSync(CFG_USER_TOKEN_KEY);
      return { username: getSync(CFG_USER_NAME_KEY) };
    }

    return { isNotLoggedIn: true };
  }

  report({ isNotLoggedIn = false, username }: LogoutActionResult): string {
    return isNotLoggedIn
      ? chalk.yellow('you are not logged yet')
      : chalk.green(`${username || 'you'} successfully logged out`);
  }
}
