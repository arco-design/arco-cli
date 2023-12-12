import { MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain, Logger } from '@arco-cli/core/dist/logger';
import { CompilerAspect } from './compiler.aspect';
import { CompilerTask } from './compiler.task';
import type { Compiler, CompilerAspectConfig } from './types';

export class CompilerMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect];

  static slots = [];

  static provider([loggerMain]: [LoggerMain], config: CompilerAspectConfig = {}) {
    const logger = loggerMain.createLogger(CompilerAspect.id);
    return new CompilerMain(config, logger);
  }

  constructor(private config: CompilerAspectConfig, private logger: Logger) {}

  createTask(name: string, compiler: Compiler): CompilerTask {
    return new CompilerTask(CompilerAspect.id, name, this.config, this.logger, compiler);
  }
}

CompilerAspect.addRuntime(CompilerMain);
