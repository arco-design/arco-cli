import { MainRuntime } from '@arco-cli/cli';
import { EnvsAspect, EnvsMain } from '@arco-cli/envs';
import { JestAspect, JestMain } from '@arco-cli/jest';
import { TypescriptAspect, TypescriptMain } from '@arco-cli/typescript';
import { WebpackAspect, WebpackMain } from '@arco-cli/webpack';
import { WorkspaceAspect, Workspace } from '@arco-cli/workspace';
import { MultiCompilerAspect, MultiCompilerMain } from '@arco-cli/multi-compiler';
import { SassAspect, SassMain } from '@arco-cli/sass';
import { LessAspect, LessMain } from '@arco-cli/less';

import { ReactAspect } from './react.aspect';
import { ReactEnv } from './react.env';

export class ReactMain {
  static runtime = MainRuntime;

  static dependencies = [
    WorkspaceAspect,
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
    workspace,
    multiCompiler,
    envs,
    jestMain,
    tsMain,
    webpackMain,
    lessMain,
    sassMain,
  ]: [
    Workspace,
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
      workspace,
      multiCompiler,
      jestMain,
      tsMain,
      webpackMain,
      lessMain,
      sassMain
    );
    envs.registerEnv(reactEnv);
    return reactMain;
  }

  constructor() {}
}

ReactAspect.addRuntime(ReactMain);
