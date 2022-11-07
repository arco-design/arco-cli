import { MainRuntime } from '@arco-cli/cli';
import { WorkspaceAspect, Workspace } from '@arco-cli/workspace';
import { BundlerMode, DevServer, DevServerContext, Target } from '@arco-cli/bundler';
import webpack from 'webpack';
import WsDevServer from 'webpack-dev-server';
import { WebpackAspect } from './webpack.aspect';
import { WebpackConfigMutator } from './webpackConfigMutator';
import devServerConfigFactory from './config/webpack.dev.config';
import { WebpackDevServer } from './webpack.devServer';

export type GlobalWebpackConfigTransformContext = {
  mode: BundlerMode;
  /**
   * A path for the host root dir
   * Host root dir is usually the env root dir
   * This can be used in different bundle options which run require.resolve
   * for example when configuring webpack aliases or webpack expose loader on the peers deps
   */
  hostRootDir?: string;
};

export type WebpackConfigTransformContext = GlobalWebpackConfigTransformContext & {
  target: Target;
};

export type WebpackConfigDevServerTransformContext = GlobalWebpackConfigTransformContext &
  DevServerContext;

export type WebpackConfigTransformer = (
  config: WebpackConfigMutator,
  context: WebpackConfigTransformContext
) => WebpackConfigMutator;

function runTransformersWithContext(
  config: WebpackConfigMutator,
  context: any,
  transformers: Array<WebpackConfigTransformer | WebpackConfigDevServerTransformContext> = []
): WebpackConfigMutator {
  if (!Array.isArray(transformers)) return config;
  const newConfig = transformers.reduce((acc, transformer) => {
    // @ts-ignore
    return transformer(acc, context);
  }, config);
  return newConfig;
}

export class WebpackMain {
  static runtime = MainRuntime;

  static dependencies = [WorkspaceAspect];

  static slots = [];

  static provider([workspace]: [Workspace]) {
    const webpackMain = new WebpackMain(workspace);
    return webpackMain;
  }

  constructor(private workspace) {}

  /**
   * create an instance of webpack dev server for a set of components
   */
  createDevServer(
    context: DevServerContext,
    transformers: WebpackConfigTransformer[] = []
  ): DevServer {
    const config = devServerConfigFactory(
      context.id,
      this.workspace.path,
      context.entry,
      context.rootPath,
      context.publicPath,
      context.title
    );
    const configMutator = new WebpackConfigMutator(config);
    const transformerContext: WebpackConfigDevServerTransformContext = Object.assign(context, {
      mode: 'dev' as const,
    });
    const afterMutation = runTransformersWithContext(configMutator.clone(), transformerContext, [
      ...transformers,
    ]);
    // @ts-ignore - fix this
    return new WebpackDevServer(afterMutation.raw, webpack, WsDevServer);
  }
}

WebpackAspect.addRuntime(WebpackMain);
