import webpack from 'webpack';
import WebpackDevServer, { Configuration as WdsConfiguration } from 'webpack-dev-server';
import { Server } from 'http';
import { Express } from 'express';
import httpProxy from 'http-proxy';
import { flatten } from 'lodash';
import { Logger } from '@arco-cli/logger';
import { ExpressMain } from '@arco-cli/express';
import { GraphqlMain } from '@arco-cli/graphql';
import { Port } from '@arco-cli/legacy/dist/utils/network/port';
import { devConfig } from './webpack/webpack.dev.config';
import { ProxyEntry, UIRoot } from './uiRoot';
import { UIMain } from './ui.main.runtime';
import { UIRuntime } from './ui.aspect';
import { StartPlugin } from './startPlugin';

export type StartOptions = {
  /**
   * port range for the UI server to bind. default is a port range of 4000-4200.
   */
  portRange?: number[] | number;
};

export type UIServerProps = {
  graphql: GraphqlMain;
  express: ExpressMain;
  ui: UIMain;
  uiRoot: UIRoot;
  uiRootExtension: string;
  logger: Logger;
  startPlugins: StartPlugin[];
};

export class UIServer {
  private _port = 0;

  static create({
    graphql,
    express,
    ui,
    uiRoot,
    uiRootExtension,
    logger,
    startPlugins,
  }: UIServerProps) {
    return new UIServer(graphql, express, ui, uiRoot, uiRootExtension, logger, startPlugins);
  }

  constructor(
    private graphql: GraphqlMain,
    private express: ExpressMain,
    private ui: UIMain,
    private uiRoot: UIRoot,
    private uiRootExtension: string,
    private logger: Logger,
    private startPlugins: StartPlugin[]
  ) {}

  getName() {
    return this.uiRoot.name;
  }

  get whenReady() {
    return Promise.all([this.startPromise, ...this.startPlugins.map((x) => x?.whenReady)]);
  }

  get port() {
    return this._port;
  }

  get host() {
    return 'localhost';
  }

  get fullUrl() {
    const port = this.port !== 80 ? `:${this.port}` : '';
    return `http://${this.host}${port}`;
  }

  get buildOptions() {
    return this.uiRoot.buildOptions;
  }

  private setReady: () => void;

  private startPromise = new Promise<void>((resolve) => {
    this.setReady = resolve;
  });

  private async selectPort(portRange?: number[] | number) {
    return Port.getPortFromRange(portRange || [3100, 3200]);
  }

  private async getProxyFromPlugins(): Promise<ProxyEntry[]> {
    const proxiesByPlugin = this.startPlugins.map((plugin) => {
      return plugin.getProxy ? plugin.getProxy() : [];
    });

    return flatten(await Promise.all(proxiesByPlugin));
  }

  private async getProxy(port = 4000): Promise<ProxyEntry[]> {
    const proxyEntries = await this.getProxyFromPlugins();
    const gqlProxies: ProxyEntry[] = [
      {
        context: ['/graphql', '/api'],
        target: `http://${this.host}:${port}`,
        changeOrigin: true,
      },
    ];
    return gqlProxies.concat(proxyEntries);
  }

  private async configureProxy(app: Express, server: Server) {
    const proxServer = httpProxy.createProxyServer();
    proxServer.on('error', (e) => this.logger.error(e.message));
    const proxyEntries = await this.getProxyFromPlugins();

    server.on('upgrade', function (req, socket, head) {
      const entry = proxyEntries.find((proxy) => proxy.context.some((item) => item === req.url));
      if (!entry) return;
      proxServer.ws(req, socket, head, {
        target: entry.target,
      });
    });

    proxyEntries.forEach((entry) => {
      entry.context.forEach((route) => {
        app.use(`${route}/*`, (req, res) => {
          proxServer.web(req, res, { ...entry, target: `${entry.target}/${req.originalUrl}` });
        });
      });
    });
  }

  private async getDevConfig() {
    const aspects = await this.uiRoot.resolveAspects(UIRuntime.name);
    const entryFilePath = await this.ui.generateRoot({
      aspectDefs: aspects,
      rootExtensionName: this.uiRootExtension,
    });
    return devConfig(this.uiRoot.path, [entryFilePath], this.uiRoot.name);
  }

  private async getDevServerConfig(
    appPort: number,
    gqlPort: number,
    config?: WdsConfiguration
  ): Promise<WdsConfiguration> {
    const proxy = await this.getProxy(gqlPort);
    return { ...config, proxy, port: appPort };
  }

  getPluginsComponents() {
    return this.startPlugins.map((plugin) => plugin.render);
  }

  async start({ portRange }: StartOptions = {}) {
    const app = this.express.createApp();
    const server = await this.graphql.createServer({ app });
    await this.configureProxy(app, server);
    const port = await Port.getPortFromRange(portRange || [3100, 3200]);
    server.listen(port);
    this._port = port;

    this.logger.info(`UI server of ${this.uiRootExtension} is listening to port ${port}`);
    this.setReady();
  }

  async dev({ portRange }: StartOptions) {
    const devServerPort = await this.selectPort(portRange);
    await this.start({ portRange: [4100, 4200] });
    const expressAppPort = this._port;

    const config = await this.getDevConfig();
    const compiler = webpack(config);
    const devServerConfig = await this.getDevServerConfig(
      devServerPort,
      expressAppPort,
      config.devServer
    );
    const devServer = new WebpackDevServer(devServerConfig, compiler);

    await devServer.start();
    this._port = devServerPort;
    return devServer;
  }
}
