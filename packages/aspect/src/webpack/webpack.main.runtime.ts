import { MainRuntime } from '@arco-cli/core/dist/cli';
import { LoggerAspect, LoggerMain } from '@arco-cli/core/dist/logger';

import webpack, { Configuration } from 'webpack';
import WsDevServer from 'webpack-dev-server';

import { WorkspaceAspect, Workspace } from '@aspect/workspace';
import { BundlerContext, BundlerMode, DevServer, DevServerContext, Target } from '@aspect/bundler';

import { WebpackAspect } from './webpack.aspect';
import { WebpackConfigMutator } from './webpackConfigMutator';
import { WebpackDevServer } from './webpack.devServer';
import { WebpackBundler } from './webpack.bundler';
import baseConfigFactory from './config/webpack.config';
import devServerConfigFactory from './config/webpack.dev.config';

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

  static dependencies = [WorkspaceAspect, LoggerAspect];

  static slots = [];

  static provider([workspace, loggerMain]: [Workspace, LoggerMain]) {
    const logger = loggerMain.createLogger(WebpackAspect.id);
    const webpackMain = new WebpackMain(workspace, logger);
    return webpackMain;
  }

  constructor(private workspace, private logger) {}

  private createConfigs(
    targets: Target[],
    factory: (target: Target, context: BundlerContext) => Configuration,
    transformers: WebpackConfigTransformer[],
    transformerContext: GlobalWebpackConfigTransformContext,
    bundlerContext: BundlerContext
  ) {
    transformers = transformers || [];

    return targets.map((target) => {
      const baseConfig = factory(target, bundlerContext);
      const configMutator = new WebpackConfigMutator(baseConfig, webpack);
      const context = { ...transformerContext, target };
      const afterMutation = runTransformersWithContext(
        configMutator.clone(),
        context,
        transformers
      );
      return afterMutation.raw;
    });
  }

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
    const configMutator = new WebpackConfigMutator(config, webpack);
    const transformerContext: WebpackConfigDevServerTransformContext = Object.assign(context, {
      mode: 'dev' as const,
    });
    const afterMutation = runTransformersWithContext(configMutator.clone(), transformerContext, [
      ...transformers,
    ]);
    // @ts-ignore - fix this
    return new WebpackDevServer(afterMutation.raw, webpack, WsDevServer);
  }

  createBundler(
    context: BundlerContext,
    transformers?: WebpackConfigTransformer[],
    initialConfigs?: webpack.Configuration[],
    webpackInstance?: any
  ) {
    const transformerContext: GlobalWebpackConfigTransformContext = { mode: 'prod' };
    // eslint-disable-next-line max-len
    const configs =
      initialConfigs ||
      this.createConfigs(
        context.targets,
        baseConfigFactory,
        transformers,
        transformerContext,
        context
      );
    return new WebpackBundler(
      context.targets,
      configs,
      this.logger,
      webpackInstance || webpack,
      context.metaData
    );
  }
}

WebpackAspect.addRuntime(WebpackMain);
