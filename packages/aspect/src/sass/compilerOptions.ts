import { CompilerOptions, StyleCompilerOptions } from '@arco-cli/service/dist/compiler';

export type SassCompilerOptions = {
  /**
   * option for sass.compile function
   */
  sassOptions?: Record<string, any>;
} & StyleCompilerOptions &
  Partial<CompilerOptions>;
