// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { RouteProps } from 'react-router-dom';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { UIAspect, UIUI, UIRuntime, UIRootUI as UIRoot } from '@arco-cli/service/dist/ui/uiRuntime';

import { DocsAspect } from '@aspect/docs/uiRuntime';
import { ComponentAspect, ComponentUI } from '@aspect/component/uiRuntime';

import { WorkspaceAspect } from '../workspace.aspect';
import { Workspace } from './workspace';
import { GraphqlProvider } from './graphqlProvider';

type RouteSlot = SlotRegistry<RouteProps>;

export class WorkspaceUI {
  static runtime = UIRuntime;

  // TODO ensure load order, WorkspaceAspect should load at last
  static dependencies = [UIAspect, ComponentAspect, DocsAspect];

  static slots = [Slot.withType<RouteProps>()];

  static provider([ui, componentUI]: [UIUI, ComponentUI], _config, [routeSlot]: [RouteSlot]) {
    const workspaceUI = new WorkspaceUI(routeSlot, componentUI);
    ui.registerRoot(workspaceUI.uiRoot.bind(workspaceUI));
    workspaceUI.registerRoute({
      path: workspaceUI.componentUI.routePath,
      element: workspaceUI.componentUI.getComponentUI(WorkspaceAspect.id),
    });
    return workspaceUI;
  }

  constructor(private routeSlot: RouteSlot, private componentUI: ComponentUI) {}

  registerRoute(route: RouteProps) {
    this.routeSlot.register(route);
    return this;
  }

  uiRoot(): UIRoot {
    return {
      routes: [
        {
          path: '/*',
          element: (
            <GraphqlProvider>
              <Workspace routes={this.routeSlot.values()} />
            </GraphqlProvider>
          ),
        },
      ],
    };
  }
}

WorkspaceAspect.addRuntime(WorkspaceUI);
