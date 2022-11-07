/**
 * add a custom type and include all properties from within the environment.
 */
export interface Environment {
  // :TODO need to define an abstract type for service handlers (now using any)
  [key: string]: any;

  /**
   * name of the environment.
   */
  name?: string;

  /**
   * description of the environment.
   */
  description?: string;

  /**
   * Returns the Environment descriptor
   * Required for any task
   */
  __getDescriptor?: () => Promise<{ type: string }>;

  /**
   * Returns the dev patterns to match doc files
   */
  getDocsDevPatterns?: () => string[];

  /**
   * Returns additional dev patterns for the component.
   * Patterns that were provided by getDocsDevPatterns, getTestsDevPatterns will be considered as dev files as well, without need to add them here.
   */
  getDevPatterns?: () => string[];
}

export interface TesterEnv<T = any> extends Environment {
  /**
   * Returns a tester
   */
  getTester?: (path: string, tester: any) => T;

  /**
   * Returns the dev patterns to match test files
   */
  getTestsDevPatterns?: () => string[];
}

export interface CompilerEnv<T = any> extends Environment {
  /**
   * Returns a compiler
   */
  getCompiler: () => T;
}
