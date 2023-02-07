import { CLIAspect, CLIMain, MainRuntime } from '@arco-cli/core/dist/cli';
import { Workspace, WorkspaceAspect } from '@arco-cli/aspect/dist/workspace';
import { EnvsAspect, EnvsMain } from '@arco-cli/aspect/dist/envs';
import { PubsubAspect, PubsubMain } from '@arco-cli/aspect/dist/pubsub';
import { LoggerAspect, LoggerMain } from '@arco-cli/core/dist/logger';
import { CompileCmd } from './compiler.cmd';
import { CompilerAspect } from './compiler.aspect';
import { WorkspaceCompiler } from './workspaceCompiler';
import { CompilerTask } from './compiler.task';
import { Compiler } from './types';

export class CompilerMain {
  static runtime = MainRuntime;

  static dependencies = [CLIAspect, WorkspaceAspect, EnvsAspect, PubsubAspect, LoggerAspect];

  static slots = [];

  static provider([cli, workspace, envs, pubsub, loggerMain]: [
    CLIMain,
    Workspace,
    EnvsMain,
    PubsubMain,
    LoggerMain
  ]) {
    const logger = loggerMain.createLogger(CompilerAspect.id);
    const workspaceCompiler = new WorkspaceCompiler(pubsub, logger, workspace, envs);
    cli.register(new CompileCmd(workspaceCompiler, logger, pubsub));
    return new CompilerMain();
  }

  constructor() {}

  createTask(name: string, compiler: Compiler): CompilerTask {
    return new CompilerTask(CompilerAspect.id, name, compiler);
  }
}

CompilerAspect.addRuntime(CompilerMain);
