import { CompilerOptions } from '@arco-cli/service/distcompiler';

export type LessCompilerOptions = {
  /**
   * option for less.render function
   */
  lessRenderOptions?: Record<string, any>;
} & Partial<CompilerOptions>;
