import { MainRuntime } from '@arco-cli/core/dist/cli';
import { CompilerOptions } from '@arco-cli/service/dist/compiler';

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
