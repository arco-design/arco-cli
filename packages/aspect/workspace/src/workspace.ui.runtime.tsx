// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { RouteProps } from 'react-router-dom';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { ComponentAspect, ComponentUI } from '@arco-cli/component';
import { UIAspect, UIUI, UIRuntime, UIRootUI as UIRoot } from '@arco-cli/ui';

import { WorkspaceAspect } from './workspace.aspect';
import { Workspace } from './ui/workspace';
import { GraphqlProvider } from './ui/graphqlProvider';

type RouteSlot = SlotRegistry<RouteProps>;

export class WorkspaceUI {
  static runtime = UIRuntime;

  static dependencies = [UIAspect, ComponentAspect];

  static slots = [Slot.withType<RouteProps>()];

  static provider([ui, componentUI]: [UIUI, ComponentUI], _config, [routeSlot]: [RouteSlot]) {
    const workspaceUI = new WorkspaceUI(routeSlot, componentUI);
    ui.registerRoot(workspaceUI.uiRoot.bind(workspaceUI));
    workspaceUI.registerRoutes({
      path: workspaceUI.componentUI.routePath,
      element: workspaceUI.componentUI.getComponentUI(WorkspaceAspect.id),
    });
    return workspaceUI;
  }

  constructor(private routeSlot: RouteSlot, private componentUI: ComponentUI) {}

  registerRoutes(route: RouteProps) {
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
