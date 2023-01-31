import { Target, BundlerResult, BundlerContext } from '@arco-cli/aspect/dist/bundler';

import { BuildContext, BuildTaskResult } from '@service/builder';

import { PreviewDefinition } from './types';
import { PreviewTask } from './preview.task';

export interface ComputeTargetsContext extends BuildContext {
  splitComponentBundle?: boolean;
}

export interface BundlingStrategy {
  /**
   * name of the bundling strategy.
   */
  name: string;

  /**
   * compute bundling targets for the build context.
   */
  computeTargets(
    context: ComputeTargetsContext,
    previewDefs: PreviewDefinition[],
    previewTask: PreviewTask
  ): Promise<Target[]>;

  /**
   * compute the results of the bundler.
   */
  computeResults(
    context: BundlerContext,
    results: BundlerResult[],
    previewTask: PreviewTask
  ): Promise<BuildTaskResult>;
}
