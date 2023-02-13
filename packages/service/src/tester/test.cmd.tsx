// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { Box, Text } from 'ink';
import { Logger } from '@arco-cli/core/dist/logger';
import { Command, CommandOptions } from '@arco-cli/legacy/dist/cli/command';
import { Timer } from '@arco-cli/legacy/dist/utils/timer';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { CLI_COMPONENT_PATTERN_HELP } from '@arco-cli/legacy/dist/constants';
import { TesterMain } from './tester.main.runtime';

type TestFlags = {
  watch: boolean;
};

export class TestCmd implements Command {
  name = 'test [component-pattern]';

  arguments = [{ name: 'component-pattern', description: CLI_COMPONENT_PATTERN_HELP }];

  description = 'test components in the workspace';

  alias = 'at';

  group = 'development';

  options = [['w', 'watch', 'start the tester in watch mode.']] as CommandOptions;

  constructor(private tester: TesterMain, private logger: Logger, private workspace: Workspace) {}

  async render([pattern]: [string], { watch }: TestFlags) {
    this.logger.console(`testing components in workspace in workspace`);

    const timer = Timer.create();
    timer.start();
    const components = await this.workspace.getManyByPattern(pattern);
    this.logger.consoleSuccess(`found ${components.length} components to test`);
    if (!components.length) {
      return {
        code: 1,
        data: <Text color="yellow">no components found to test</Text>,
      };
    }

    // const components = await this.workspace.list();
    const testResults = await this.tester.test(components, { watch });
    const code = testResults.hasErrors() ? 1 : 0;
    const { seconds } = timer.stop();

    return {
      code,
      data: (
        <Box>
          <Text>Test has been completed in </Text>
          <Text color="cyan">{seconds}</Text>
          <Text> seconds.</Text>
        </Box>
      ),
    };
  }
}
