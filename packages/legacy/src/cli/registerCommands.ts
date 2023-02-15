import { CLI_VERSION, CLI_USAGE, CLI_DESCRIPTION } from '../constants';
import CommandRegistry from './commandRegistry';
import { Login } from './commands/login';
import { Logout } from './commands/logout';
import { Host } from './commands/host';

export default function registerCommands(): CommandRegistry {
  return new CommandRegistry(CLI_USAGE, CLI_DESCRIPTION, CLI_VERSION, [
    new Login(),
    new Logout(),
    new Host(),
  ]);
}
