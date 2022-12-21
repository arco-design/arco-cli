// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { Text, Newline } from 'ink';
import { Logger } from '@arco-cli/logger';
import { Component } from '@arco-cli/component';
import { EnvDefinition, EnvService, ExecutionContext } from '@arco-cli/envs';

import { BuildContext, BuildTaskHelper } from './buildTask';
import { TaskResultsList } from './taskResultsList';
import { calculatePipelineOrder } from './buildPipelineOrder';
import { TaskSlot } from './builder.main.runtime';
import { BuildPipe, TaskResults } from './buildPipe';

export type BuilderServiceOptions = {
  skipTests?: boolean;
  originalSeeders?: string[];
  previousTasksResults?: TaskResults[];
};

export type BuildServiceResults = {
  id: string;
  buildResults: TaskResultsList;
  components: Component[];
  errors?: [];
};

export type EnvsBuildContext = { [envId: string]: BuildContext };

export type BuilderDescriptor = { tasks: string[] };

export class BuilderService implements EnvService<BuildServiceResults, BuilderDescriptor> {
  name = 'builder';

  constructor(private taskSlot: TaskSlot, private logger: Logger) {}

  async runOnce(envsExecutionContext: ExecutionContext[], options: BuilderServiceOptions) {
    const envs = envsExecutionContext.map((context) => context.envDefinition);
    const tasksQueue = calculatePipelineOrder({
      envs,
      taskSlot: this.taskSlot,
      skipTests: options.skipTests,
    });
    tasksQueue.validate();

    this.logger.info(`going to run tasks in the following order:\n${tasksQueue.toString()}`);
    const title = `running build pipe for ${envs.length} environments, total ${tasksQueue.length} tasks`;
    const longProcessLogger = this.logger.createLongProcessLogger(title);
    this.logger.consoleTitle(title);

    const envsBuildContext: EnvsBuildContext = {};
    envsExecutionContext.forEach((executionContext) => {
      envsExecutionContext[executionContext.id] = Object.assign(executionContext, {
        previousTasksResults: [],
      });
    });

    const buildPipe = new BuildPipe(
      tasksQueue,
      envsBuildContext,
      this.logger,
      options.previousTasksResults
    );

    const buildResults = await buildPipe.execute();
    longProcessLogger.end();
    buildResults.hasErrors() ? this.logger.consoleFailure() : this.logger.consoleSuccess();

    return buildResults;
  }

  getDescriptor(env: EnvDefinition) {
    const tasks = calculatePipelineOrder({ envs: [env], taskSlot: this.taskSlot }).map(({ task }) =>
      BuildTaskHelper.serializeId(task)
    );
    return { tasks };
  }

  render(env: EnvDefinition) {
    const { tasks } = this.getDescriptor(env);

    if (!tasks || !tasks.length) {
      return null;
    }

    return (
      <Text>
        <Text underline color="green">
          build pipe
        </Text>
        <Newline />
        <Text color="cyan">
          total {tasks.length} tasks are configured to be executed in the following order
        </Text>
        <Newline />
        {tasks.map((task, index) => (
          <Text key={index}>
            <Text>
              {index + 1}. {task}
            </Text>
            <Newline />
          </Text>
        ))}
        <Newline />
      </Text>
    );
  }
}
