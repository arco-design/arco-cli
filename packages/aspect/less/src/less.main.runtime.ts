import { MainRuntime } from '@arco-cli/cli';
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

  createCompiler() {
    return new LessCompiler(LessAspect.id);
  }
}

LessAspect.addRuntime(LessMain);
