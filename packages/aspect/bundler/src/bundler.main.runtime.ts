import { MainRuntime } from '@arco-cli/cli';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { EnvsAspect, EnvsMain } from '@arco-cli/envs';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/graphql';
import { ComponentAspect, Component } from '@arco-cli/component';

import { BundlerAspect } from './bundler.aspect';
import { BrowserRuntime } from './browserRuntime';
import { DevServerService } from './devServer.service';
import { ComponentServer } from './componentServer';
import getDevServerSchema from './devServer.graphql';

export type BrowserRuntimeSlot = SlotRegistry<BrowserRuntime>;

export class BundlerMain {
  static runtime = MainRuntime;

  static dependencies = [EnvsAspect, GraphqlAspect, ComponentAspect];

  static slots = [Slot.withType<BrowserRuntime>()];

  static async provider(
    [envs, graphql]: [EnvsMain, GraphqlMain],
    _config,
    [runtimeSlot]: [BrowserRuntimeSlot]
  ) {
    const devServerService = new DevServerService(runtimeSlot);
    const bundler = new BundlerMain(envs, runtimeSlot, devServerService);
    graphql.register(getDevServerSchema(bundler));
    return bundler;
  }

  constructor(
    private envs: EnvsMain,
    private runtimeSlot: BrowserRuntimeSlot,
    private devService: DevServerService
  ) {}

  private componentServers: ComponentServer[] = [];

  /**
   * register a new browser runtime environment.
   */
  registerTarget(runtime: BrowserRuntime) {
    this.runtimeSlot.register(runtime);
    return this;
  }

  async devServer(components: Component[]): Promise<ComponentServer[]> {
    const envRuntime = await this.envs.createEnvironment(components);
    const servers: ComponentServer[] = await envRuntime.runOnce<ComponentServer[]>(this.devService);
    this.componentServers = servers;
    return servers;
  }

  /**
   * get a dev server instance containing a component.
   * @param component
   */
  getComponentServer(component: Component): undefined | ComponentServer {
    const envId = component.env;
    const server = this.componentServers.find(
      (componentServer) =>
        componentServer.context.relatedContexts.includes(envId) ||
        componentServer.context.id === envId
    );
    return server;
  }
}

BundlerAspect.addRuntime(BundlerMain);
