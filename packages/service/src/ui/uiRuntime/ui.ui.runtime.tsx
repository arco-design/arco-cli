import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { ReactRouterAspect, ReactRouterUI } from '@arco-cli/aspect/dist/react-router/uiRuntime';

import UIAspect, { UIRuntime } from '../ui.aspect';
import { UIRootFactory } from './uiRoot.ui';

type UIRootSlot = SlotRegistry<UIRootFactory>;

const MOUNT_ROOT_ID = 'root';

export class UIUI {
  static runtime = UIRuntime;

  static dependencies = [ReactRouterAspect];

  static slots = [Slot.withType<UIRootFactory>()];

  static provider([router]: [ReactRouterUI], _config, [uiRootSlot]: [UIRootSlot]) {
    return new UIUI(router, uiRootSlot);
  }

  constructor(private router: ReactRouterUI, private uiRootSlot: UIRootSlot) {}

  private getRoot(rootExtension: string) {
    return this.uiRootSlot.get(rootExtension);
  }

  registerRoot(uiRoot: UIRootFactory) {
    return this.uiRootSlot.register(uiRoot);
  }

  render(rootExtension: string) {
    const rootFactory = this.getRoot(rootExtension);
    if (!rootFactory) throw new Error(`root: ${rootExtension} was not found`);

    const uiRoot = rootFactory();
    const routes = this.router.renderRoutes(uiRoot.routes);

    ReactDOM.render(
      <BrowserRouter>{routes}</BrowserRouter>,
      document.querySelector(`#${MOUNT_ROOT_ID}`)
    );
  }
}

UIAspect.addRuntime(UIUI);
