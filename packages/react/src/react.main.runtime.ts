import path from 'path';
import fs from 'fs-extra';
import ts from 'typescript';
import { MainRuntime } from '@arco-cli/core/dist/cli';
import { Logger, LoggerMain, LoggerAspect } from '@arco-cli/core/dist/logger';
import {
  EnvsAspect,
  EnvsMain,
  ExecutionContext,
  EnvTransformer,
  Environment,
} from '@arco-cli/aspect/dist/envs';
import { JestAspect, JestMain } from '@arco-cli/aspect/dist/jest';
import {
  WebpackAspect,
  WebpackMain,
  WebpackConfigTransformer,
} from '@arco-cli/aspect/dist/webpack';
import { CompilerAspect, CompilerMain } from '@arco-cli/service/dist/compiler';
import { MultiCompilerAspect, MultiCompilerMain } from '@arco-cli/aspect/dist/multi-compiler';
import {
  TsConfigTransformer,
  TypescriptAspect,
  TypescriptMain,
} from '@arco-cli/aspect/dist/typescript';
import { SassAspect, SassMain } from '@arco-cli/aspect/dist/sass';
import { LessAspect, LessMain } from '@arco-cli/aspect/dist/less';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';
import type { BundlerContext, DevServerContext } from '@arco-cli/aspect/dist/bundler';
import { DEFAULT_ENV_CONFIG_PATH } from '@arco-cli/legacy/dist/constants';

import { ReactAspect } from './react.aspect';
import { ReactEnv } from './react.env';

type UseWebpackModifiers = {
  previewConfig?: WebpackConfigTransformer[];
  devServerConfig?: WebpackConfigTransformer[];
};

type UseTypescriptModifiers = {
  buildConfig?: TsConfigTransformer[];
  tsModule?: any;
};

type UseJestModifiers = {
  jestConfigPath?: string;
  jestModulePath?: string;
};

export class ReactMain {
  static runtime = MainRuntime;

  static dependencies = [
    LoggerAspect,
    WorkspaceAspect,
    CompilerAspect,
    MultiCompilerAspect,
    EnvsAspect,
    JestAspect,
    TypescriptAspect,
    WebpackAspect,
    LessAspect,
    SassAspect,
  ];

  static slots = [];

  static provider([
    loggerMain,
    workspace,
    compiler,
    multiCompiler,
    envs,
    jestMain,
    tsMain,
    webpackMain,
    lessMain,
    sassMain,
  ]: [
    LoggerMain,
    Workspace,
    CompilerMain,
    MultiCompilerMain,
    EnvsMain,
    JestMain,
    TypescriptMain,
    WebpackMain,
    LessMain,
    SassMain
  ]) {
    const defaultReactEnv = new ReactEnv(
      compiler,
      multiCompiler,
      jestMain,
      tsMain,
      webpackMain,
      lessMain,
      sassMain
    );

    const logger = loggerMain.createLogger(ReactAspect.id);
    const reactMain = new ReactMain(defaultReactEnv, workspace, logger, envs);
    const extendedReactEnv = reactMain.extendEnvConfigFromUser();

    envs.registerEnv(extendedReactEnv);

    return reactMain;
  }

  constructor(
    private defaultReactEnv: ReactEnv,
    private workspace: Workspace,
    private logger: Logger,
    private envs: EnvsMain
  ) {}

  private extendEnvConfigFromUser(): Environment {
    let defineConfig = null;
    const envConfigPath = path.resolve(this.workspace.path, DEFAULT_ENV_CONFIG_PATH);

    if (fs.existsSync(envConfigPath)) {
      try {
        defineConfig = require(envConfigPath);
      } catch (error) {
        this.logger.error(`failed to extend ${ReactAspect.id} config from ${envConfigPath}`, error);
        throw new Error(`Failed to extend ${ReactAspect.id} config. Details:\n${error}`);
      }
    }

    if (typeof defineConfig === 'function') {
      try {
        const userConfig = defineConfig();
        const envTransformers: EnvTransformer[] = [];

        userConfig.jest && envTransformers.push(this.useJest(userConfig.jest));
        userConfig.webpack && envTransformers.push(this.useWebpack(userConfig.webpack));
        userConfig.typescript && envTransformers.push(this.useTypescript(userConfig.typescript));

        if (envTransformers.length) {
          return this.compose(envTransformers);
        }
      } catch (error) {
        this.logger.error(`${ReactAspect.id} failed to extend env config from user`, error);
      }
    }

    return this.defaultReactEnv;
  }

  /**
   * override the env's typescript config for both dev and build time.
   * Replaces both overrideTsConfig (devConfig) and overrideBuildTsConfig (buildConfig)
   */
  useTypescript(modifiers: UseTypescriptModifiers = {}) {
    const overrides: any = {};
    const tsModule = modifiers.tsModule || ts;
    const { buildConfig: buildTransformers } = modifiers;

    if (buildTransformers) {
      const buildPipeModifiers = {
        tsModifier: {
          transformers: buildTransformers,
          module: tsModule,
        },
      };
      overrides.getBuildPipe = () => this.defaultReactEnv.getBuildPipe(buildPipeModifiers);
    }

    return this.envs.override(overrides);
  }

  /**
   * override the env's dev server and preview webpack configurations.
   * Replaces both overrideDevServerConfig and overridePreviewConfig
   */
  useWebpack(modifiers: UseWebpackModifiers = {}) {
    const overrides: any = {};
    const devServerTransformers = modifiers.devServerConfig;
    if (devServerTransformers) {
      overrides.getDevServer = (context: DevServerContext) =>
        this.defaultReactEnv.getDevServer(context, devServerTransformers);
      overrides.getDevEnvId = (context: DevServerContext) =>
        this.defaultReactEnv.getDevEnvId((context as unknown as ExecutionContext).envDefinition.id);
    }
    const previewTransformers = modifiers.previewConfig;
    if (previewTransformers) {
      overrides.getBundler = (context: BundlerContext) =>
        this.defaultReactEnv.getBundler(context, previewTransformers);
    }
    return this.envs.override(overrides);
  }

  /**
   * override the jest configuration.
   */
  useJest(modifiers: UseJestModifiers = {}) {
    const { jestConfigPath, jestModulePath } = modifiers;
    return this.envs.override({
      getTester: () => this.defaultReactEnv.getTester(jestConfigPath, jestModulePath),
    });
  }

  /**
   * create a new composition of the react environment.
   */
  compose(transformers: EnvTransformer[]) {
    return this.envs.compose(this.defaultReactEnv, transformers);
  }
}

ReactAspect.addRuntime(ReactMain);
