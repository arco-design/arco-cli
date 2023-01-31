import { LegacyCommand } from './legacyCommand';

export function parseCommandName(commandName: string): string {
  return commandName?.split(' ')?.[0] || '';
}

export default class CommandRegistry {
  version: string;

  usage: string;

  description: string;

  commands: LegacyCommand[];

  constructor(usage: string, description: string, version: string, commands: LegacyCommand[]) {
    this.usage = usage;
    this.description = description;
    this.version = version;
    this.commands = commands;
  }
}
