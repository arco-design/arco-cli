import { MainRuntime } from '@arco-cli/cli';
import { EnvsAspect, EnvsMain } from '@arco-cli/envs';
import { JestAspect, JestMain } from '@arco-cli/jest';
import { TypescriptAspect, TypescriptMain } from '@arco-cli/typescript';
import { WebpackAspect, WebpackMain } from '@arco-cli/webpack';
import { WorkspaceAspect, Workspace } from '@arco-cli/workspace';
import { ReactAspect } from './react.aspect';
import { ReactEnv } from './react.env';

export class ReactMain {
  static runtime = MainRuntime;

  static dependencies = [WorkspaceAspect, EnvsAspect, JestAspect, TypescriptAspect, WebpackAspect];

  static slots = [];

  static provider([workspace, envs, jestMain, tsMain, webpackMain]: [
    Workspace,
    EnvsMain,
    JestMain,
    TypescriptMain,
    WebpackMain
  ]) {
    const reactMain = new ReactMain();
    const reactEnv = new ReactEnv(workspace, jestMain, tsMain, webpackMain);
    envs.registerEnv(reactEnv);
    return reactMain;
  }

  constructor() {}
}

ReactAspect.addRuntime(ReactMain);
