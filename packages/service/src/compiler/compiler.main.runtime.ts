import { MainRuntime } from '@arco-cli/core/dist/cli';
import { CompilerAspect } from './compiler.aspect';
import { CompilerTask } from './compiler.task';
import { Compiler } from './types';

export class CompilerMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static provider() {
    return new CompilerMain();
  }

  constructor() {}

  createTask(name: string, compiler: Compiler): CompilerTask {
    return new CompilerTask(CompilerAspect.id, name, compiler);
  }
}

CompilerAspect.addRuntime(CompilerMain);
