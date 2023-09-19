import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain } from '@arco-cli/core/dist/logger';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';

import { ForkAspect } from './fork.aspect';
import { ForkCmd } from './fork.cmd';

export class ForkMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect, CLIAspect, WorkspaceAspect];

  static provider([loggerMain, cli, workspace]: [LoggerMain, CLIMain, Workspace]) {
    const logger = loggerMain.createLogger(ForkAspect.id);
    const fork = new ForkMain();
    // TODO register cmd after forking component to workspace ready
    if (0) {
      cli.register(new ForkCmd(logger, fork, workspace));
    }
    return fork;
  }

  constructor() {}
}

ForkAspect.addRuntime(ForkMain);
