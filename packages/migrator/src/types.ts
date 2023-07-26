export interface AdapterOptions {
  workspaceRoot: string;
  path: string;
  noEmit: boolean;
  uselessFilePatterns: string[];
}

export type ComponentInfo = {
  path: string;
  name: string;
  title?: string;
  description?: string;
  labels?: string[];
  author?: string;
  demos: Array<{
    path: string;
    moduleName: string;
    isDefault?: boolean;
    title?: string;
    description?: string;
  }>;
  package: {
    path: string;
  };
};

export type MigratorOptions = {
  /**
   * workspace root path, default to cwd()
   */
  root?: string;
  /**
   * globs to match workspace components
   */
  componentDirPatterns: string | string[];
  /**
   * don't delete or write new files while migrating
   */
  noEmit?: boolean;
  /**
   * path of demo dir, relative to component dir
   */
  demoDir?: string;
  /**
   * globs to match useless component files, relative to component dir
   */
  uselessProjectFilePatterns?: string[];
  /**
   * globs to match useless package files, relative to component package dir
   */
  uselessPackageFilePatterns?: string[];
  /**
   * globs to match useless project files, relative to process.cwd()
   */
  uselessComponentFilePatterns?: string[];
};
