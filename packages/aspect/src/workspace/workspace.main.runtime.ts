import { Slot } from '@arco-cli/stone';
import { LoggerAspect, LoggerMain } from '@arco-cli/core/dist/logger';
import { UIAspect, UIMain } from '@arco-cli/service/dist/ui';
import { MainRuntime } from '@arco-cli/core/dist/cli';
import { AspectLoaderAspect, AspectLoaderMain } from '@arco-cli/core/dist/aspect-loader';
import { getWorkspaceInfo } from '@arco-cli/legacy/dist/workspace/workspaceLocator';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/core/dist/graphql';
import { PubsubAspect, PubsubMain } from '@arco-cli/core/dist/pubsub';

import { ComponentAspect, ComponentMain } from '@aspect/component';

import { WorkspaceAspect } from './workspace.aspect';
import {
  OnComponentAddSlot,
  OnComponentChangeSlot,
  OnComponentLoadSlot,
  OnComponentRemoveSlot,
  Workspace,
} from './workspace';
import { WorkspaceUiRoot } from './workspace.uiRoot';
import { WorkspaceNotFoundError } from './exceptions';
import { WorkspaceConfig } from './type';
import getWorkspaceSchema from './workspace.graphql';
import {
  OnComponentAdd,
  OnComponentChange,
  OnComponentLoad,
  OnComponentRemove,
} from './type/onComponentEvents';

export const WorkspaceMain = {
  name: WorkspaceAspect.id,
  runtime: MainRuntime,
  dependencies: [
    LoggerAspect,
    UIAspect,
    ComponentAspect,
    PubsubAspect,
    AspectLoaderAspect,
    GraphqlAspect,
  ],
  slots: [
    Slot.withType<OnComponentLoad>(),
    Slot.withType<OnComponentAdd>(),
    Slot.withType<OnComponentChange>(),
    Slot.withType<OnComponentRemove>(),
  ],
  provider: async (
    [_loggerMain, ui, component, pubsub, aspectLoader, graphql]: [
      LoggerMain,
      UIMain,
      ComponentMain,
      PubsubMain,
      AspectLoaderMain,
      GraphqlMain
    ],
    config: WorkspaceConfig,
    [onComponentLoadSlot, onComponentAddSlot, onComponentChangeSlot, onComponentRemoveSlot]: [
      OnComponentLoadSlot,
      OnComponentAddSlot,
      OnComponentChangeSlot,
      OnComponentRemoveSlot
    ],
    stone
  ) => {
    const arcoConfig = stone.config.get('arco.app/arco');

    const workspaceInfo = await getWorkspaceInfo(arcoConfig.cwd);
    if (!workspaceInfo) {
      throw new WorkspaceNotFoundError();
    }

    const workspace = await Workspace.load({
      path: workspaceInfo.path,
      config,
      pubsub,
      aspectLoader,
      onComponentLoadSlot,
      onComponentAddSlot,
      onComponentChangeSlot,
      onComponentRemoveSlot,
    });

    ui.registerUiRoot(new WorkspaceUiRoot(workspace));
    component.registerHost(workspace);
    graphql.register(getWorkspaceSchema(workspace));

    return workspace;
  },
};

WorkspaceAspect.addRuntime(WorkspaceMain);
