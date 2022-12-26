export type ImportSpecifier = {
  /**
   * relative/absolute or module name. e.g. the `y` in the example of `import x from 'y';`
   */
  fromModule: string;

  /**
   * is default import (e.g. `import x from 'y';`)
   */
  isDefault?: boolean;

  /**
   * the name used to identify the module, e.g. the `x` in the example of `import x from 'y';`
   */
  identifier?: string;
};
