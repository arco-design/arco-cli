import { MainRuntime } from '@arco-cli/core/dist/cli';
import { CompilerOptions } from '@arco-cli/service/dist/compiler';

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
