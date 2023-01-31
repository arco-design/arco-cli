import { MainRuntime } from '@arco-cli/core/dist/cli';
import { EnvsAspect, EnvsMain } from '@arco-cli/aspect/dist/envs';
import { JestAspect, JestMain } from '@arco-cli/aspect/dist/jest';
import { BuilderAspect, BuilderMain } from '@arco-cli/service/dist/builder';
import { WebpackAspect, WebpackMain } from '@arco-cli/aspect/dist/webpack';
import { CompilerAspect, CompilerMain } from '@arco-cli/service/dist/compiler';
import { MultiCompilerAspect, MultiCompilerMain } from '@arco-cli/service/dist/multi-compiler';
import {
  TsConfigTransformer,
  TypescriptAspect,
  TypescriptMain,
} from '@arco-cli/aspect/dist/typescript';
import { SassAspect, SassMain } from '@arco-cli/aspect/dist/sass';
import { LessAspect, LessMain } from '@arco-cli/aspect/dist/less';
import { WorkspaceAspect, Workspace } from '@arco-cli/aspect/dist/workspace';

import { ReactAspect } from './react.aspect';
import { ReactEnv } from './react.env';
import { ReactConfig } from './types/reactConfig';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsconfig = require('./typescript/tsconfig.json');

const DEFAULT_ESM_DIR = 'es';
const DEFAULT_CJS_DIR = 'lib';

export class ReactMain {
  static runtime = MainRuntime;

  static dependencies = [
    WorkspaceAspect,
    BuilderAspect,
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

  static provider(
    [
      workspace,
      builder,
      compiler,
      multiCompiler,
      envs,
      jestMain,
      tsMain,
      webpackMain,
      lessMain,
      sassMain,
    ]: [
      Workspace,
      BuilderMain,
      CompilerMain,
      MultiCompilerMain,
      EnvsMain,
      JestMain,
      TypescriptMain,
      WebpackMain,
      LessMain,
      SassMain
    ],
    config: ReactConfig
  ) {
    const reactMain = new ReactMain();
    const reactEnv = new ReactEnv(
      config,
      workspace,
      compiler,
      multiCompiler,
      jestMain,
      tsMain,
      webpackMain,
      lessMain,
      sassMain
    );
    envs.registerEnv(reactEnv);

    const transformer: TsConfigTransformer = (config) => {
      config
        .mergeTsConfig(tsconfig)
        .setArtifactName('declaration')
        .setShouldCopyNonSupportedFiles(false);
      return config;
    };

    builder.registerBuildTasks([
      reactEnv.createEsmCompilerTask({
        transformers: [transformer],
        compilerOptions: { distDir: DEFAULT_ESM_DIR },
      }),
      reactEnv.createCjsCompilerTask({
        transformers: [transformer],
        compilerOptions: { distDir: DEFAULT_CJS_DIR },
      }),
    ]);

    return reactMain;
  }

  constructor() {}
}

ReactAspect.addRuntime(ReactMain);
