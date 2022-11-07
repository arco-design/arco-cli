// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { Logger } from '@arco-cli/logger';
import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import openBrowser from 'react-dev-utils/openBrowser';
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

  options = [
    ['p', 'port [port-number]', 'port of the UI server'],
    ['', 'no-browser', 'do not automatically open browser when ready'],
  ] as CommandOptions;

  constructor(
    /**
     * access to the extension instance.
     */
    private ui: UIMain,

    private logger: Logger
  ) {}

  async render(_args, { port, noBrowser }: StartFlags): Promise<React.ReactElement> {
    this.logger.off();

    const uiServer = this.ui.createRuntime({
      port: +port,
    });

    if (!noBrowser) {
      uiServer
        .then(async (server) => {
          if (server.buildOptions?.launchBrowserOnStart) {
            return openBrowser(this.ui.publicUrl || server.fullUrl);
          }
          return null;
        })
        .catch((error) => this.logger.error(error));
    }

    this.ui.clearConsole();

    return <UIServerConsole futureUiServer={uiServer} url={this.ui.publicUrl} />;
  }
}
