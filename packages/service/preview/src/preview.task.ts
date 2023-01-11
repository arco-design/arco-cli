import { resolve } from 'path';
import { ExecutionContext } from '@arco-cli/envs';
import { BuildContext, BuildTask, BuildTaskResult, TaskLocation } from '@arco-cli/builder';
import { Bundler, BundlerContext, Target } from '@arco-cli/bundler';
import { PreviewMain } from './preview.main.runtime';
import { PREVIEW_ASPECT_ID } from './preview.aspect';

export const PREVIEW_TASK_NAME = 'GeneratePreview';

export class PreviewTask implements BuildTask {
  constructor(private preview: PreviewMain) {}

  aspectId = PREVIEW_ASPECT_ID;

  name = PREVIEW_TASK_NAME;

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
      compress: bundlingStrategy.name !== 'env' && splitComponentBundle,
      entry: [],
      publicPath: this.getPreviewDirectory(context),
      rootPath: url,
      metaData: {
        initiator: `${PREVIEW_TASK_NAME} task`,
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
