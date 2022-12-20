// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { NavigateFunction } from 'react-router-dom';
import type { Location, NavigationType, RouteProps } from 'react-router-dom';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { UIRuntime } from '@arco-cli/ui/dist/ui.aspect';

import { SlotRouter } from './slotRouter';
import { ReactRouterAspect } from '../reactRouter.aspect';

export type RouteSlot = SlotRegistry<RouteProps>;

export class ReactRouterUI {
  static runtime = UIRuntime;

  static slots = [Slot.withType<RouteProps>()];

  static async provider(_deps, _config, [routeSlot]: [RouteSlot]) {
    return new ReactRouterUI(routeSlot);
  }

  constructor(
    /**
     * route slot.
     */
    private routeSlot: RouteSlot
  ) {}

  private navigate?: NavigateFunction = undefined;

  renderRoutes(routes: RouteProps[]) {
    return <SlotRouter routes={this.routeSlot.values()} rootRoutes={routes} />;
  }

  /**
   * register a new route.
   */
  register(route: RouteProps) {
    this.routeSlot.register(route);
    return this;
  }

  navigateTo = (
    /** destination */
    path: Location | string,
    /** history action to execute (pop / push / replace) */
    action?: NavigationType
  ) => {
    const state = typeof path !== 'string' ? path.state : undefined;

    switch (action) {
      case 'POP':
        return; // TBD;
      case 'REPLACE':
        this.navigate?.(path, { replace: true, state });
        return;
      case 'PUSH':
      default:
        this.navigate?.(path, { state });
    }
  };
}

ReactRouterAspect.addRuntime(ReactRouterUI);
