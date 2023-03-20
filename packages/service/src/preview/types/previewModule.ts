/**
 * single preview module, e.g. compositions file
 */
export type ModuleImportFunction<T = any> = () => Promise<Record<string, T>>;

/**
 * A full index of the preview data
 */
export type PreviewModule<T = any> = {
  /**
   * Dictionary mapping components to their module files.
   */
  componentMap: Record<string, ModuleImportFunction<T>[]>;

  /**
   * Dictionary mapping components to their preview metadata
   */
  componentMetadataMap: Record<string, unknown>;

  /**
   * The 'main file' for this Preview type
   */
  mainModule: {
    default: {
      (...args: any[]): void;
      apiObject?: boolean;
    };
  };
};
