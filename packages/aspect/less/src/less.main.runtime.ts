import { MainRuntime } from '@arco-cli/cli';
import { CompilerOptions } from '@arco-cli/compiler';

import { LessAspect } from './less.aspect';
import { LessCompiler } from './less.compiler';

export class LessMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static async provider() {
    return new LessMain();
  }

  constructor() {}

  createCompiler(options: Partial<CompilerOptions> = {}) {
    return new LessCompiler(LessAspect.id, options);
  }
}

LessAspect.addRuntime(LessMain);
