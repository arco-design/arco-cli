import { Slot, SlotRegistry } from '@arco-cli/stone';
import { MainRuntime, CLIAspect, CLIMain } from '@arco-cli/cli';
import { Component } from '@arco-cli/component';
import { EnvsAspect, EnvsMain } from '@arco-cli/envs';
import { LoggerAspect, LoggerMain } from '@arco-cli/logger';
import { WorkspaceAspect, Workspace } from '@arco-cli/workspace';

import BuilderAspect from './builder.aspect';
import { BuilderService, BuilderServiceOptions } from './builder.service';
import { BuilderCmd } from './build.cmd';
import { BuildTask } from './buildTask';

export type TaskSlot = SlotRegistry<BuildTask[]>;

export class BuilderMain {
  static runtime = MainRuntime;

  static dependencies = [CLIAspect, EnvsAspect, WorkspaceAspect, LoggerAspect];

  static slots = [Slot.withType<BuildTask[]>()];

  static provider(
    [cli, envs, workspace, loggerMain]: [CLIMain, EnvsMain, Workspace, LoggerMain],
    _config,
    [taskSlot]: [TaskSlot]
  ) {
    const logger = loggerMain.createLogger(BuilderAspect.id);
    const buildService = new BuilderService(workspace, taskSlot, logger);
    const builder = new BuilderMain(envs, buildService, taskSlot);

    envs.registerService(buildService);
    cli.register(new BuilderCmd(builder, workspace, logger));

    return builder;
  }

  constructor(
    private envs: EnvsMain,
    private buildService: BuilderService,
    private buildTaskSlot: TaskSlot
  ) {}

  /**
   * register a build task to apply on all component build pipelines.
   */
  registerBuildTasks(tasks: BuildTask[]) {
    this.buildTaskSlot.register(tasks);
    return this;
  }

  async build(componnets: Component[], options?: BuilderServiceOptions) {
    const envs = await this.envs.createEnvironment(componnets);
    const buildResult = await envs.runOnce(this.buildService, options);
    return buildResult;
  }
}

BuilderAspect.addRuntime(BuilderMain);
