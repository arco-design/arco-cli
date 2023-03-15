import { MainRuntime } from '@arco-cli/core/dist/cli';

import { SassAspect } from './sass.aspect';
import { SassCompiler } from './sass.compiler';
import { SassCompilerOptions } from './compilerOptions';

export class SassMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static async provider() {
    return new SassMain();
  }

  constructor() {}

  createCompiler(option: SassCompilerOptions = {}) {
    return new SassCompiler(SassAspect.id, option);
  }
}

SassAspect.addRuntime(SassMain);
