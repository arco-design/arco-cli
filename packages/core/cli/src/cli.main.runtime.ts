import { clone } from 'lodash';
import { SlotRegistry, Slot } from '@arco-cli/stone';
import { Logger, LoggerAspect, LoggerMain } from '@arco-cli/logger';
import { Command } from '@arco-cli/legacy/dist/cli/command';
import { groups, GroupsType } from '@arco-cli/legacy/dist/cli/commandGroups';
import { BASE_DOCS_DOMAIN } from '@arco-cli/legacy/dist/constants';
import registerCommands from '@arco-cli/legacy/dist/cli/registerCommands';
import { getCommandId } from './getCommandId';
import { CLIAspect, MainRuntime } from './cli.aspect';
import { CLIParser } from './cliParser';
import { LegacyCommandAdapter } from './legacyCommandAdapter';
import { HelpCmd } from './commands/help';

export type CommandList = Array<Command>;
export type OnStart = (hasWorkspace: boolean) => Promise<void>;

export type OnStartSlot = SlotRegistry<OnStart>;
export type CommandsSlot = SlotRegistry<CommandList>;

export class CLIMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect];

  static slots = [Slot.withType<CommandList>(), Slot.withType<OnStart>()];

  static provider(
    [loggerMain]: [LoggerMain],
    _,
    [commandsSlog, onStartSlot]: [CommandsSlot, OnStartSlot]
  ) {
    const logger = loggerMain.createLogger(CLIAspect.id);
    const cliMain = new CLIMain(commandsSlog, onStartSlot, logger);
    const legacyRegistry = registerCommands();
    const legacyCommandsAdapters = legacyRegistry.commands.map(
      (command) => new LegacyCommandAdapter(command, cliMain)
    );
    const helpCmd = new HelpCmd(cliMain, BASE_DOCS_DOMAIN);
    cliMain.register(...legacyCommandsAdapters, helpCmd);
    return cliMain;
  }

  constructor(
    private commandsSlot: CommandsSlot,
    private onStartSlot: OnStartSlot,
    private logger: Logger
  ) {}

  public groups: GroupsType = clone(groups);

  private async invokeOnStart(hasWorkspace: boolean) {
    const onStartFns = this.onStartSlot.values();
    const promises = onStartFns.map(async (onStart) => onStart(hasWorkspace));
    return Promise.all(promises);
  }

  private setDefaults(command: Command) {
    command.alias = command.alias || '';
    command.description = command.description || '';
    command.extendedDescription = command.extendedDescription || '';
    command.group = command.group || 'ungrouped';
    command.options = command.options || [];
    command.private = command.private || false;
    command.commands = command.commands || [];
    if (command.loader === undefined) {
      if (command.internal) {
        command.loader = false;
      } else {
        command.loader = true;
      }
    }
  }

  register(...commands: CommandList) {
    commands.forEach((command) => {
      this.setDefaults(command);
      command.commands!.forEach((cmd) => this.setDefaults(cmd));
    });
    this.commandsSlot.register(commands);
  }

  unregister(commandName: string) {
    this.commandsSlot.toArray().forEach(([aspectId, commands]) => {
      const filteredCommands = commands.filter((command) => {
        return getCommandId(command.name) !== commandName;
      });
      this.commandsSlot.map.set(aspectId, filteredCommands);
    });
  }

  registerGroup(name: string, description: string) {
    if (this.groups[name]) {
      this.logger.consoleWarning(`CLI group "${name}" is already registered`);
    } else {
      this.groups[name] = description;
    }
  }

  registerOnStart(onStartFn: OnStart) {
    this.onStartSlot.register(onStartFn);
    return this;
  }

  /**
   * list of all registered commands. (legacy and new).
   */
  get commands(): CommandList {
    return this.commandsSlot.values().flat();
  }

  /**
   * get an instance of a registered command. (useful for aspects to modify and extend existing commands)
   */
  getCommand(name: string): Command | undefined {
    return this.commands.find((command) => getCommandId(command.name) === name);
  }

  async run(hasWorkspace: boolean) {
    await this.invokeOnStart(hasWorkspace);
    const parser = new CLIParser(this.commands, this.groups, undefined, BASE_DOCS_DOMAIN);
    await parser.parse();
  }
}

CLIAspect.addRuntime(CLIMain);
