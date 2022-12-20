import { Slot, SlotRegistry } from '@arco-cli/stone';
import { MainRuntime } from '@arco-cli/cli';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/graphql';

import ComponentAspect from './component.aspect';
import { ComponentFactory } from './componentFactory';
import { HostNotFoundError } from './exceptions';
import getComponentSchema from './component.graphql';

export type ComponentHostSlot = SlotRegistry<ComponentFactory>;

export class ComponentMain {
  static runtime = MainRuntime;

  static slots = [Slot.withType<ComponentFactory>()];

  static dependencies = [GraphqlAspect];

  static provider([graphql]: [GraphqlMain], _config, [hostSlot]: [ComponentHostSlot]) {
    const componentMain = new ComponentMain(hostSlot);
    graphql.register(getComponentSchema(componentMain));
    return componentMain;
  }

  private _priorHost: ComponentFactory | undefined;

  constructor(private hostSlot: ComponentHostSlot) {}

  private getPriorHost() {
    if (this._priorHost) return this._priorHost;
    const hosts = this.hostSlot.values();
    return hosts[0];
  }

  registerHost(host: ComponentFactory) {
    this.hostSlot.register(host);
    return this;
  }

  getHost(id?: string): ComponentFactory {
    if (id) {
      const host = this.hostSlot.get(id);
      if (!host) throw new HostNotFoundError(id);
      return host;
    }

    return this.getPriorHost();
  }
}

ComponentAspect.addRuntime(ComponentMain);
