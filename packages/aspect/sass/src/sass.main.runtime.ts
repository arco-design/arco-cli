import { MainRuntime } from '@arco-cli/cli';
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

  createCompiler() {
    return new SassCompiler(SassAspect.id);
  }
}

SassAspect.addRuntime(SassMain);
