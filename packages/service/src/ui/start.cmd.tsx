import React, { ReactElement } from 'react';
import { render } from 'ink';
import { Logger } from '@arco-cli/core/dist/logger';
import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { CLI_COMPONENT_PATTERN_HELP } from '@arco-cli/legacy/dist/constants';

import { UIServerConsole } from './cli/uiServerConsole';
import type { UIMain } from './ui.main.runtime';

type StartFlags = {
  port: string;
  noBrowser: boolean;
};

export class StartCmd implements Command {
  name = 'start [component-pattern]';

  description = 'run the development server';

  arguments = [{ name: 'component-pattern', description: CLI_COMPONENT_PATTERN_HELP }];

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

  inkRender(element: ReactElement) {
    return render(element);
  }

  async render([pattern]: [string], { port }: StartFlags): Promise<React.ReactElement> {
    this.logger.off();

    const uiServer = this.ui.createRuntime({
      port: +port,
      pattern,
    });

    this.logger.clearConsole();

    return <UIServerConsole futureUiServer={uiServer} url={this.ui.publicUrl} />;
  }
}
