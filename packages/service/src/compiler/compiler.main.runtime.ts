import { MainRuntime } from '@arco-cli/core/dist/cli';
import { CompilerAspect } from './compiler.aspect';
import { CompilerTask } from './compiler.task';
import type { Compiler, CompilerAspectConfig } from './types';

export class CompilerMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static provider(_deps, config: CompilerAspectConfig = {}) {
    return new CompilerMain(config);
  }

  constructor(private config: CompilerAspectConfig) {}

  createTask(name: string, compiler: Compiler): CompilerTask {
    return new CompilerTask(CompilerAspect.id, name, this.config, compiler);
  }
}

CompilerAspect.addRuntime(CompilerMain);
