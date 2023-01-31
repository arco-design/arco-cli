import chalk from 'chalk';
import ArcoError from '@arco-cli/legacy/dist/error/arcoError';

export class CommandNotFoundError extends ArcoError {
  commandName: string;

  suggestion?: string;

  constructor(commandName: string, suggestion?: string) {
    super(`command ${commandName} was not found`);
    this.commandName = commandName;
    this.suggestion = suggestion;
  }

  report() {
    let output = chalk.yellow(
      `warning: '${chalk.bold(this.commandName)}' is not a valid command.
see 'arco help' for additional information`
    );
    if (this.suggestion) {
      output += `\nDid you mean ${chalk.bold(this.suggestion)}?`;
    }
    return output;
  }
}
