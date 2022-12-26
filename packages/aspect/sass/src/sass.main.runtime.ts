import { MainRuntime } from '@arco-cli/cli';
import { CompilerOptions } from '@arco-cli/compiler';

import { SassAspect } from './sass.aspect';
import { SassCompiler } from './sass.compiler';

export class SassMain {
  static runtime = MainRuntime;

  static dependencies = [];

  static slots = [];

  static async provider() {
    return new SassMain();
  }

  constructor() {}

  createCompiler(option: Partial<CompilerOptions> = {}) {
    return new SassCompiler(SassAspect.id, option);
  }
}

SassAspect.addRuntime(SassMain);
