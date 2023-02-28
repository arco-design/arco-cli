import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { flatten } from 'lodash';
import { Workspace } from '@arco-cli/aspect/dist/workspace';
import { BundlerMain } from '@arco-cli/aspect/dist/bundler';
import { PubsubMain } from '@arco-cli/aspect/dist/pubsub';
import { ComponentServer } from '@arco-cli/aspect/dist/bundler/componentServer';
import { Logger } from '@arco-cli/core/dist/logger';

import { StartPlugin, StartPluginOptions, ProxyEntry } from '@service/ui';

import { CompilationResult, SubscribeToWebpackEvents } from './webpackEventsListener';
import { PreviewServerStatus } from './cli/previewServerStatus/previewServerStatus';

type CompilationServers = Record<string, CompilationResult>;
type ServersSetter = Dispatch<SetStateAction<CompilationServers>>;

export class PreviewStartPlugin implements StartPlugin {
  constructor(
    private workspace: Workspace,
    private bundler: BundlerMain,
    private pubsub: PubsubMain,
    private logger: Logger
  ) {}

  previewServers: ComponentServer[] = [];

  private setReady: () => void;

  private readyPromise = new Promise<void>((resolve) => {
    this.setReady = resolve;
  });

  private initialState: CompilationServers = {};

  // implements react-like setter (value or updater)
  private updateServers: ServersSetter = (servers) => {
    this.initialState = typeof servers === 'function' ? servers(this.initialState) : servers;
    return servers;
  };

  private listenToDevServers() {
    // keep state changes immutable!
    SubscribeToWebpackEvents(this.pubsub, {
      onStart: (id) => {
        this.updateServers((state) => ({
          ...state,
          [id]: { compiling: true },
        }));
      },
      onDone: (id, results) => {
        this.updateServers((state) => ({
          ...state,
          [id]: results,
        }));
      },
    });
  }

  get whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async initiate(options: StartPluginOptions) {
    this.listenToDevServers();

    const conponents = await this.workspace.getManyByPattern(options.pattern);
    const previewServers = await this.bundler.devServer(conponents);
    previewServers.forEach((server) => server.listen());

    // DON'T add wait! this promise never resolve, so it will stop all the start process!
    this.workspace.watcher.watchAll({}).catch((error) => {
      const msg = `watcher found an error`;
      this.logger.error(msg, error);
      this.logger.console(`${msg}, ${error.message}`);
    });

    this.previewServers = this.previewServers.concat(previewServers);
  }

  getProxy(): ProxyEntry[] {
    const proxyConfigs = this.previewServers.map<ProxyEntry[]>((server) => {
      return [
        {
          context: [`/preview/${server.context.envRuntime.id}`],
          target: `http://localhost:${server.port}`,
        },
        {
          context: [`/_hmr/${server.context.envRuntime.id}`],
          target: `http://localhost:${server.port}`,
          ws: true,
        },
      ];
    });

    return flatten(proxyConfigs);
  }

  render = () => {
    const [servers, setServers] = useState<CompilationServers>(this.initialState);
    this.updateServers = setServers;
    this.initialState = {};

    useEffect(() => {
      const noneAreCompiling = Object.values(servers).every((x) => !x.compiling);
      if (noneAreCompiling) this.setReady();
    }, [servers]);

    return <PreviewServerStatus previewServers={this.previewServers} serverStats={servers} />;
  };
}
