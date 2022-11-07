import { MainRuntime } from '@arco-cli/cli';
import { Slot, SlotRegistry } from '@arco-cli/stone';
import { EnvsAspect, EnvsMain } from '@arco-cli/envs';
import { Component } from '@arco-cli/component';
import { BundlerAspect } from './bundler.aspect';
import { BrowserRuntime } from './browserRuntime';
import { DevServerService } from './devServer.service';
import { ComponentServer } from './componentServer';

export type BrowserRuntimeSlot = SlotRegistry<BrowserRuntime>;

export class BundlerMain {
  static runtime = MainRuntime;

  static dependencies = [EnvsAspect];

  static slots = [Slot.withType<BrowserRuntime>()];

  static async provider([envs]: [EnvsMain], _config, [runtimeSlot]: [BrowserRuntimeSlot]) {
    const devServerService = new DevServerService(runtimeSlot);
    const bundler = new BundlerMain(envs, runtimeSlot, devServerService);
    return bundler;
  }

  constructor(
    private envs: EnvsMain,
    private runtimeSlot: BrowserRuntimeSlot,
    private devService: DevServerService
  ) {}

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
    return servers;
  }
}

BundlerAspect.addRuntime(BundlerMain);
