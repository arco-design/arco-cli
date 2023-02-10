import { MainRuntime } from '@arco-cli/core/dist/cli';
import { Compiler, CompilerOptions } from '@arco-cli/service/dist/compiler';

import { MultiCompilerAspect } from './multiCompiler.aspect';
import { MultiCompiler } from './multiCompiler.compiler';

export class MultiCompilerMain {
  static runtime = MainRuntime;

  static async provider() {
    return new MultiCompilerMain();
  }

  /**
   * create a multi-compiler `Compiler` instance.
   */
  createCompiler(compilers: Compiler[], options: Partial<CompilerOptions> = {}) {
    compilers.forEach((compiler) => {
      if (options.distDir) {
        compiler.distDir = options.distDir;
      }
    });
    return new MultiCompiler(MultiCompilerAspect.id, compilers, options);
  }
}

MultiCompilerAspect.addRuntime(MultiCompilerMain);
