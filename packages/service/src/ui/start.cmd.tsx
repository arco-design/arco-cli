import React from 'react';
import { Logger } from '@arco-cli/core/dist/logger';
import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { UIServerConsole } from './cli/uiServerConsole';
import type { UIMain } from './ui.main.runtime';

type StartFlags = {
  port: string;
  noBrowser: boolean;
};

export class StartCmd implements Command {
  name = 'start';

  description = 'run the development server';

  alias = 'c';

  group = 'development';

  options = [['p', 'port [port-number]', 'port of the UI server']] as CommandOptions;

  constructor(
    /**
     * access to the extension instance.
     */
    private ui: UIMain,

    private logger: Logger
  ) {}

  async render(_args, { port }: StartFlags): Promise<React.ReactElement> {
    this.logger.off();

    const uiServer = this.ui.createRuntime({
      port: +port,
    });

    this.logger.clearConsole();

    return <UIServerConsole futureUiServer={uiServer} url={this.ui.publicUrl} />;
  }
}
