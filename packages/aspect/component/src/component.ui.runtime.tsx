// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import type { RouteProps } from 'react-router-dom';
import { UIRuntime } from '@arco-cli/ui';
import { Slot, SlotRegistry } from '@arco-cli/stone';

import { Component, ComponentPageElement, ComponentPageSlot } from './ui/component';
import ComponentAspect from './component.aspect';

type RouteSlot = SlotRegistry<RouteProps>;

export class ComponentUI {
  static runtime = UIRuntime;

  static dependencies = [];

  static slots = [Slot.withType<RouteProps>(), Slot.withType<ComponentPageElement[]>()];

  static provider(_deps, _config, [routeSlot, pageItemSlot]: [RouteSlot, ComponentPageSlot]) {
    const componentUI = new ComponentUI(routeSlot, pageItemSlot);
    return componentUI;
  }

  constructor(private routeSlot: RouteSlot, private pageItemSlot: ComponentPageSlot) {}

  readonly routePath = '/*';

  registerRoute(routes: RouteProps) {
    this.routeSlot.register(routes);
    return this;
  }

  registerPageItem = (...items: ComponentPageElement[]) => {
    this.pageItemSlot.register(items);
    return this;
  };

  getComponentUI(host: string, componentId?: string) {
    return (
      <Component
        host={host}
        componentId={componentId}
        routes={this.routeSlot.values()}
        containerSlot={this.pageItemSlot}
      />
    );
  }
}

ComponentAspect.addRuntime(ComponentUI);
