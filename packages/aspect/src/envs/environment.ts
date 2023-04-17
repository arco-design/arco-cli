import { EnvPreviewConfig } from '@arco-cli/service/dist/preview';
import type { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';

import { Bundler, BundlerContext } from '@aspect/bundler';

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

export interface PreviewEnv extends Environment {
  /**
   * Returns a path to a docs template.
   * Required for `arco start` & `arco build`
   */
  getDocsTemplate?: () => string;

  /**
   * Return metadata of current component document, like properties info
   */
  getDocsMetadata?: (files: SourceFile[]) => unknown;

  /**
   * Returns a bundler for the preview.
   */
  getBundler?: (context: BundlerContext, transformers: any[]) => Promise<Bundler>;

  /**
   * Returns preview config like the strategy name to use when bundling the components for the preview
   */
  getPreviewConfig?: () => EnvPreviewConfig;
}
