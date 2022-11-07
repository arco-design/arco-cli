import { MainRuntime } from '@arco-cli/cli';
import { Compiler, CompilerOptions } from '@arco-cli/compiler';
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
    return new MultiCompiler(MultiCompilerAspect.id, compilers, options, {});
  }
}

MultiCompilerAspect.addRuntime(MultiCompilerMain);
