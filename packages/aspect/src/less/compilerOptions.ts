import { CompilerOptions, StyleCompilerOptions } from '@arco-cli/service/dist/compiler';

export type LessCompilerOptions = {
  /**
   * option for less.render function
   */
  lessOptions?: Record<string, any>;
} & StyleCompilerOptions &
  Partial<CompilerOptions>;
