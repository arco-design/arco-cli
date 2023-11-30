import { resolve } from 'path';
import { ExecutionContext } from '@arco-cli/aspect/dist/envs';
import { Bundler, BundlerContext, Target } from '@arco-cli/aspect/dist/bundler';
import { BUILD_TASK_NAME_PREVIEW } from '@arco-cli/legacy/dist/constants';

import { BuildContext, BuildTask, BuildTaskResult, TaskLocation } from '@service/builder';

import { PreviewMain } from './preview.main.runtime';
import { PREVIEW_ASPECT_ID } from './preview.aspect';

export class PreviewTask implements BuildTask {
  constructor(private preview: PreviewMain) {}

  aspectId = PREVIEW_ASPECT_ID;

  name = BUILD_TASK_NAME_PREVIEW;

  location: TaskLocation = 'end';

  async execute(context: BuildContext): Promise<BuildTaskResult> {
    const defs = this.preview.getDefs();
    const url = `/preview/${context.envRuntime.id}`;
    const bundlingStrategy = this.preview.getBundlingStrategy(context.env);
    const envPreviewConfig = this.preview.getEnvPreviewConfig(context.env);
    const splitComponentBundle = envPreviewConfig.splitComponentBundle ?? false;
    const computeTargetsContext = Object.assign(context, { splitComponentBundle });

    const targets: Target[] = await bundlingStrategy.computeTargets(
      computeTargetsContext,
      defs,
      this
    );

    const bundlerContext: BundlerContext = Object.assign(context, {
      targets,
      entry: [],
      publicPath: this.getPreviewDirectory(context),
      rootPath: url,
      metaData: {
        initiator: `${BUILD_TASK_NAME_PREVIEW} task`,
        envId: context.id,
      },
    });

    const bundler: Bundler = await context.env.getBundler(bundlerContext);
    const bundlerResults = await bundler.run();

    return bundlingStrategy.computeResults(bundlerContext, bundlerResults, this);
  }

  getPreviewDirectory(context: ExecutionContext) {
    return resolve(`${context.id}/public`);
  }
}
