import { EnvDefinition } from '@arco-cli/envs';
import { Logger, LongProcessLogger } from '@arco-cli/logger';
import mapSeries from 'p-map-series';
import prettyTime from 'pretty-time';
import { BuildContext, BuildTask, BuildTaskHelper, BuildTaskResult } from './buildTask';
import { ComponentResult } from './types';
import { TasksQueue } from './tasksQueue';
import { TaskResultsList } from './taskResultsList';
import { EnvsBuildContext } from './builder.service';

export type TaskResults = {
  /**
   * task itself. useful for getting its id/description later on.
   */
  task: BuildTask;

  /**
   * environment were the task was running
   */
  env: EnvDefinition;

  /**
   * component build results.
   */
  componentsResults: ComponentResult[];

  /**
   * timestamp of start initiation.
   */
  startTime: number;

  /**
   * timestamp of task completion.
   */
  endTime: number;
};

export class BuildPipe {
  private failedTasks: BuildTask[] = [];

  private failedDependencyTask: BuildTask | undefined;

  private longProcessLogger: LongProcessLogger;

  private taskResults: TaskResults[] = [];

  constructor(
    /**
     * array of services to apply on the components.
     */
    readonly tasksQueue: TasksQueue,
    readonly envsBuildContext: EnvsBuildContext,
    readonly logger: Logger,
    private previousTaskResults?: TaskResults[]
  ) {}

  get allTasksResults(): TaskResults[] {
    return [...(this.previousTaskResults || []), ...(this.taskResults || [])];
  }

  /**
   * execute a pipeline of build tasks.
   */
  async execute(): Promise<TaskResultsList> {
    this.addSignalListener();
    await this.executePreBuild();
    this.longProcessLogger = this.logger.createLongProcessLogger(
      'running tasks',
      this.tasksQueue.length
    );
    await mapSeries(this.tasksQueue, async ({ task, env }) => this.executeTask(task, env));
    this.longProcessLogger.end();
    const tasksResultsList = new TaskResultsList(this.tasksQueue, this.taskResults);
    await this.executePostBuild(tasksResultsList);

    return tasksResultsList;
  }

  /**
   * for some reason, some tasks (such as typescript compilation) ignore ctrl+C. this fixes it.
   */
  private addSignalListener() {
    process.on('SIGTERM', () => {
      process.exit();
    });

    process.on('SIGINT', () => {
      process.exit();
    });
  }

  private async executePreBuild() {
    this.logger.setStatusLine('executing pre-build for all tasks');
    await mapSeries(this.tasksQueue, async ({ task, env }) => {
      if (!task.preBuild) return;
      await task.preBuild(this.getBuildContext(env.id));
    });
    this.logger.consoleSuccess();
  }

  private async executeTask(task: BuildTask, env: EnvDefinition): Promise<void> {
    const taskId = BuildTaskHelper.serializeId(task);
    const taskName = `${taskId}${task.description ? ` (${task.description})` : ''}`;
    this.longProcessLogger.logProgress(`env "${env.id}", task "${taskName}"`);
    this.updateFailedDependencyTask(task);
    if (this.shouldSkipTask(taskId, env.id)) {
      return;
    }
    const startTask = process.hrtime();
    const taskStartTime = Date.now();
    const buildContext = this.getBuildContext(env.id);
    let buildTaskResult: BuildTaskResult;
    try {
      buildTaskResult = await task.execute(buildContext);
    } catch (err) {
      this.logger.consoleFailure(`env: ${env.id}, task "${taskId}" threw an error`);
      throw err;
    }

    const endTime = Date.now();
    const compsWithErrors = buildTaskResult.componentsResults.filter((c) => c.errors?.length);
    if (compsWithErrors.length) {
      this.logger.consoleFailure(`env: ${env.id}, task "${taskId}" has failed`);
      this.failedTasks.push(task);
    } else {
      const duration = prettyTime(process.hrtime(startTask));
      this.logger.consoleSuccess(
        `env "${env.id}", task "${taskName}" has completed successfully in ${duration}`
      );
    }

    const taskResults: TaskResults = {
      task,
      env,
      componentsResults: buildTaskResult.componentsResults,
      startTime: taskStartTime,
      endTime,
    };

    this.taskResults.push(taskResults);
  }

  private async executePostBuild(tasksResults: TaskResultsList) {
    this.logger.setStatusLine('executing post-build for all tasks');
    await mapSeries(this.tasksQueue, async ({ task, env }) => {
      if (!task.postBuild) return;
      await task.postBuild(this.getBuildContext(env.id), tasksResults);
    });
    this.logger.consoleSuccess();
  }

  private updateFailedDependencyTask(task: BuildTask) {
    if (!this.failedDependencyTask && this.failedTasks.length && task.dependencies) {
      task.dependencies.forEach((dependency) => {
        const { aspectId, name } = BuildTaskHelper.deserializeIdAllowEmptyName(dependency);
        this.failedDependencyTask = this.failedTasks.find((failedTask) => {
          if (name && name !== failedTask.name) return false;
          return aspectId === failedTask.aspectId;
        });
      });
    }
  }

  private shouldSkipTask(taskId: string, envId: string): boolean {
    if (!this.failedDependencyTask) return false;
    const failedTaskId = BuildTaskHelper.serializeId(this.failedDependencyTask);
    this.logger.consoleWarning(
      `env: ${envId}, task "${taskId}" has skipped due to "${failedTaskId}" failure`
    );
    return true;
  }

  private getBuildContext(envId: string): BuildContext {
    const buildContext = this.envsBuildContext[envId];
    if (!buildContext) throw new Error(`unable to find buildContext for ${envId}`);
    buildContext.previousTasksResults = this.allTasksResults;
    return buildContext;
  }
}
