import { MainRuntime } from '@arco-cli/cli';
import { EnvsAspect, EnvsMain } from '@arco-cli/envs';
import { JestAspect, JestMain } from '@arco-cli/jest';
import { BuilderAspect, BuilderMain } from '@arco-cli/builder';
import { WebpackAspect, WebpackMain } from '@arco-cli/webpack';
import { CompilerAspect, CompilerMain } from '@arco-cli/compiler';
import { MultiCompilerAspect, MultiCompilerMain } from '@arco-cli/multi-compiler';
import { TsConfigTransformer, TypescriptAspect, TypescriptMain } from '@arco-cli/typescript';
import { SassAspect, SassMain } from '@arco-cli/sass';
import { LessAspect, LessMain } from '@arco-cli/less';

import { ReactAspect } from './react.aspect';
import { ReactEnv } from './react.env';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tsconfig = require('./typescript/tsconfig.json');

const DEFAULT_ESM_DIR = 'es';
const DEFAULT_CJS_DIR = 'lib';

export class ReactMain {
  static runtime = MainRuntime;

  static dependencies = [
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

  static provider([
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
    BuilderMain,
    CompilerMain,
    MultiCompilerMain,
    EnvsMain,
    JestMain,
    TypescriptMain,
    WebpackMain,
    LessMain,
    SassMain
  ]) {
    const reactMain = new ReactMain();
    const reactEnv = new ReactEnv(
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
