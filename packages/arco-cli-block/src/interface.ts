export interface ArcoProBlockInsertConfig {
  /**
   * Package name of block material
   */
  packageName: string;
  /**
   * The location of the target file, relative path to the project's /src
   */
  targetPath: string;
  /**
   * The location of the source file, relative path to the npm package
   */
  sourcePath: string;
}

export interface ArcoProPageInsertConfig {
  /**
   * Package name of page material
   */
  packageName: string;

  /**
   * Route info for new page
   */
  routeConfig: {
    name: string;
    key: string;
    componentPath: string;
  };

  /**
   * Route key of new page's parent page
   */
  parentKey: string;
}
