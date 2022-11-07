// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactDOM from 'react-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BrowserRouter } from 'react-router-dom';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { ReactRouterAspect, ReactRouterUI } from '@arco-cli/react-router';
import { ClientContext } from '@arco-cli/ui-foundation-react/dist/clientContext';

import UIAspect, { UIRuntime } from './ui.aspect';
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
      <ClientContext>
        <BrowserRouter>{routes}</BrowserRouter>
      </ClientContext>,
      document.querySelector(`#${MOUNT_ROOT_ID}`)
    );
  }
}

UIAspect.addRuntime(UIUI);
