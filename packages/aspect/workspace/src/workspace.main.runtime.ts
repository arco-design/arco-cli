import { LoggerAspect, LoggerMain } from '@arco-cli/logger';
import { EnvsAspect, EnvsMain } from '@arco-cli/envs';
import { UIAspect, UIMain } from '@arco-cli/ui';
import { ComponentAspect, ComponentMain } from '@arco-cli/component';
import { AspectLoaderAspect, AspectLoaderMain } from '@arco-cli/aspect-loader';
import { getWorkspaceInfo } from '@arco-cli/legacy/dist/workspace/workspaceLocator';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/graphql';

import { MainRuntime, WorkspaceAspect } from './workspace.aspect';
import { Workspace } from './workspace';
import { WorkspaceUiRoot } from './workspace.uiRoot';
import { WorkspaceNotFoundError } from './exceptions';
import { WorkspaceConfig } from './type';
import getWorkspaceSchema from './workspace.graphql';

export const WorkspaceMain = {
  name: WorkspaceAspect.id,
  runtime: MainRuntime,
  defineRuntime: 'browser',
  dependencies: [
    LoggerAspect,
    UIAspect,
    ComponentAspect,
    EnvsAspect,
    AspectLoaderAspect,
    GraphqlAspect,
  ],
  slots: [],
  provider: async (
    [_loggerMain, ui, component, _envs, aspectLoader, graphql]: [
      LoggerMain,
      UIMain,
      ComponentMain,
      EnvsMain,
      AspectLoaderMain,
      GraphqlMain
    ],
    config: WorkspaceConfig,
    _slots,
    stone
  ) => {
    const arcoConfig = stone.config.get('arco.app/arco');

    const workspaceInfo = await getWorkspaceInfo(arcoConfig.cwd);
    if (!workspaceInfo) {
      throw new WorkspaceNotFoundError();
    }

    const workspace = await Workspace.load({ path: workspaceInfo.path, config, aspectLoader });

    ui.registerUiRoot(new WorkspaceUiRoot(workspace));
    component.registerHost(workspace);
    graphql.register(getWorkspaceSchema(workspace));

    return workspace;
  },
};

WorkspaceAspect.addRuntime(WorkspaceMain);
