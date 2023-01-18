import fs from 'fs-extra';
import { join, resolve } from 'path';
import pMapSeries from 'p-map-series';
import { Slot, SlotRegistry, Stone } from '@arco-cli/stone';
import { MainRuntime, CLIAspect, CLIMain } from '@arco-cli/cli';
import { Logger, LoggerAspect, LoggerMain } from '@arco-cli/logger';
import { sha1 } from '@arco-cli/legacy/dist/utils';
import { GraphqlAspect, GraphqlMain } from '@arco-cli/graphql';
import { ExpressAspect, ExpressMain } from '@arco-cli/express';

import UIAspect, { UIRuntime } from './ui.aspect';
import { StartCmd } from './start.cmd';
import { UIServer } from './uiServer';
import { UIRoot } from './uiRoot';
import { UnknownUIError } from './exceptions';
import { createRoot, CreateRootOptions } from './createRoot';
import { StartPlugin, StartPluginOptions } from './startPlugin';

type UIDeps = [GraphqlMain, ExpressMain, CLIMain, LoggerMain];

type UIRootSlot = SlotRegistry<UIRoot>;

type StartPluginSlot = SlotRegistry<StartPlugin>;

export type UIConfig = {
  /**
   * port for the UI root to use.
   */
  port?: number;

  /**
   * port range for the UI root to use.
   */
  portRange: [number, number];

  /**
   * host for the UI root
   */
  host: string;

  /**
   * directory in workspace to use for public assets.
   * always relative to the workspace root directory.
   */
  publicDir: string;

  /**
   * the url to display when server is listening
   */
  publicUrl?: string;
};

export type RuntimeOptions = {
  /**
   * port of the config.
   */
  port?: number;

  /**
   * determine whether to initiate on verbose mode.
   */
  verbose?: boolean;

  /**
   * name of the UI root to load.
   */
  uiRootName?: string;

  /**
   * component selector pattern to load.
   */
  pattern?: string;
};

export class UIMain {
  static dependencies = [GraphqlAspect, ExpressAspect, CLIAspect, LoggerAspect];

  static slots = [Slot.withType<UIRoot>(), Slot.withType<StartPlugin>()];

  static runtime = MainRuntime;

  static provider(
    [graphql, express, cli, loggerMain]: UIDeps,
    config,
    [uiRootSlot, startPluginSlot]: [UIRootSlot, StartPluginSlot],
    stone
  ) {
    const logger = loggerMain.createLogger(UIAspect.id);
    const ui = new UIMain(graphql, express, config, logger, stone, uiRootSlot, startPluginSlot);
    cli.register(new StartCmd(ui, logger));
    return ui;
  }

  constructor(
    private graphql: GraphqlMain,
    private express: ExpressMain,
    private config: UIConfig,
    private logger: Logger,
    private stone: Stone,
    private uiRootSlot: UIRootSlot,
    private startPluginSlot: StartPluginSlot
  ) {}

  get publicUrl() {
    return this.config.publicUrl;
  }

  private addSignalListener() {
    process.on('SIGTERM', () => {
      process.exit();
    });

    process.on('SIGINT', () => {
      process.exit();
    });
  }

  private async initiateStartPlugins(options: StartPluginOptions) {
    const plugins = this.startPluginSlot.values();
    await pMapSeries(plugins, (plugin) => plugin.initiate(options));
    return plugins;
  }

  registerUiRoot(uiRoot: UIRoot) {
    return this.uiRootSlot.register(uiRoot);
  }

  registerStartPlugin(startPlugin: StartPlugin) {
    this.startPluginSlot.register(startPlugin);
    return this;
  }

  getUi(uiRootName?: string): [string, UIRoot] | undefined {
    if (uiRootName) {
      const root = this.uiRootSlot.get(uiRootName);
      return root ? [uiRootName, root] : undefined;
    }
    const uis = this.uiRootSlot.toArray();
    return uis[0];
  }

  async generateRoot({
    path,
    aspectDefs,
    runtimeName = UIRuntime.name,
    rootAspect = UIAspect.id,
    rootExtensionName,
    config = this.stone.config.toObject(),
  }: { path?: string } & CreateRootOptions) {
    const contents = await createRoot({
      aspectDefs,
      runtimeName,
      rootAspect,
      rootExtensionName,
      config,
    });
    const filepath = resolve(join(path || __dirname, `${runtimeName}.root${sha1(contents)}.js`));
    if (!fs.existsSync(filepath)) {
      fs.outputFileSync(filepath, contents);
    }
    return filepath;
  }

  async createRuntime({ port, uiRootName, verbose, pattern }: RuntimeOptions) {
    const maybeUIRoot = this.getUi(uiRootName);
    if (!maybeUIRoot) throw new UnknownUIError(uiRootName);

    const startPlugins = await this.initiateStartPlugins({
      verbose,
      pattern,
    });

    const [name, uiRoot] = maybeUIRoot || [];
    const uiServer = UIServer.create({
      graphql: this.graphql,
      express: this.express,
      logger: this.logger,
      ui: this,
      uiRoot,
      uiRootExtension: name,
      startPlugins,
    });
    // Adding signal listeners to make sure we immediately close the process on sigint / sigterm (otherwise webpack dev server closing will take time)
    this.addSignalListener();
    await uiServer.dev({ portRange: port || this.config.portRange });
    return uiServer;
  }
}

UIAspect.addRuntime(UIMain);
