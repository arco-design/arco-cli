import { CompilerOptions } from '@arco-cli/service/distcompiler';

export type SassCompilerOptions = {
  /**
   * option for sass.compile function
   */
  sassOptions?: Record<string, any>;

  combine?: boolean | { fileName: string };
} & Partial<CompilerOptions>;
