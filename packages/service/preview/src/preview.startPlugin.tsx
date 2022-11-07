// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Workspace } from '@arco-cli/workspace';
import { StartPlugin, StartPluginOptions } from '@arco-cli/ui';
import { BundlerMain } from '@arco-cli/bundler';
import { PubsubMain } from '@arco-cli/pubsub';
import { ComponentServer } from '@arco-cli/bundler/dist/componentServer';
import { CompilationResult, SubscribeToWebpackEvents } from './webpackEventsListener';
import { PreviewServerStatus } from './cli/previewServerStatus/previewServerStatus';

type CompilationServers = Record<string, CompilationResult>;
type ServersSetter = Dispatch<SetStateAction<CompilationServers>>;

export class PreviewStartPlugin implements StartPlugin {
  constructor(
    private workspace: Workspace,
    private bundler: BundlerMain,
    private pubsub: PubsubMain
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
    // TODO watch
    this.previewServers = this.previewServers.concat(previewServers);
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
