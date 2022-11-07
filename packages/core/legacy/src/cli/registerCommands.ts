import { CLI_VERSION, CLI_USAGE, CLI_DESCRIPTION } from '../constants';
import CommandRegistry from './commandRegistry';
import Login from './commands/login';

export default function registerCommands(): CommandRegistry {
  return new CommandRegistry(CLI_USAGE, CLI_DESCRIPTION, CLI_VERSION, [new Login()]);
}
