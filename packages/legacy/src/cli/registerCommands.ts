import { CLI_USAGE, CLI_DESCRIPTION } from '../constants';
import CommandRegistry from './commandRegistry';
import { Login } from './commands/login';
import { Logout } from './commands/logout';
import { Host } from './commands/host';
import { getCliVersion } from '../utils';

export default function registerCommands(): CommandRegistry {
  return new CommandRegistry(CLI_USAGE, CLI_DESCRIPTION, getCliVersion(), [
    new Login(),
    new Logout(),
    new Host(),
  ]);
}
