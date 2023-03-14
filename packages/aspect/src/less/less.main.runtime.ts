import { MainRuntime } from '@arco-cli/core/dist/cli';

import { LessAspect } from './less.aspect';
import { LessCompiler } from './less.compiler';
import type { LessCompilerOptions } from './compilerOptions';

export class LessMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static async provider() {
    return new LessMain();
  }

  constructor() {}

  createCompiler(options: LessCompilerOptions = {}) {
    return new LessCompiler(LessAspect.id, options);
  }
}

LessAspect.addRuntime(LessMain);
