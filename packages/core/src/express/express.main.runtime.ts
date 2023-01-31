import { Slot, SlotRegistry } from '@arco-cli/stone';
import express, { Express } from 'express';
import bodyParser from 'body-parser';
import { concat, flatten, lowerCase, sortBy } from 'lodash';

import { MainRuntime } from '@core/cli';
import { Logger, LoggerAspect, LoggerMain } from '@core/logger';

import { ExpressAspect } from './express.aspect';
import { catchErrors } from './middlewares';
import { Middleware, Request, Response, Route, Verb, MiddlewareManifest } from './types';

export type ExpressConfig = {
  port: number;
  namespace: string;
  loggerIgnorePath: string[];
};

export type MiddlewareSlot = SlotRegistry<MiddlewareManifest[]>;

export type RouteSlot = SlotRegistry<Route[]>;

export class ExpressMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect];

  static slots = [Slot.withType<Route[]>(), Slot.withType<MiddlewareManifest[]>()];

  static defaultConfig = {
    port: 4001,
    namespace: 'api',
    loggerIgnorePath: ['/api/_health'],
  };

  static async provider(
    [loggerFactory]: [LoggerMain],
    config: ExpressConfig,
    [routeSlot, middlewareSlot]: [RouteSlot, MiddlewareSlot]
  ) {
    const logger = loggerFactory.createLogger(ExpressAspect.id);
    return new ExpressMain(config, routeSlot, logger, middlewareSlot);
  }

  constructor(
    /**
     * extension config
     */
    readonly config: ExpressConfig,

    /**
     * slot for registering express route
     */
    private routeSlot: RouteSlot,

    /**
     * logger extension.
     */
    readonly logger: Logger,

    readonly middlewareSlot: MiddlewareSlot
  ) {}

  private createRootRoutes() {
    return [
      {
        namespace: ExpressAspect.id,
        method: 'get',
        path: '/_health',
        disableNamespace: false,
        priority: 0,
        middlewares: [async (_req: Request, res: Response) => res.send('ok')],
      },
    ];
  }

  private createRoutes() {
    const routesSlots = this.routeSlot.toArray();
    const routeEntries = routesSlots.map(([, routes]) => {
      return routes.map((route) => {
        const middlewares = flatten([this.verbValidation(route), route.middlewares]);
        return {
          method: lowerCase(route.method),
          path: route.route,
          disableNamespace: route.disableNamespace,
          middlewares,
          priority: route.priority || 0,
        };
      });
    });

    return flatten(routeEntries);
  }

  private verbValidation(route: Route): Middleware {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!route.verb) return next();
      const verb = req.headers['x-verb'] || Verb.READ;
      if (verb !== route.verb) {
        res.status(403);
        return res.jsonp({ message: 'You are not authorized', error: 'forbidden' });
      }
      return next();
    };
  }

  private catchErrorsMiddlewares(middlewares: Middleware[]) {
    return middlewares.map((middleware) => catchErrors(middleware));
  }

  private bodyParser(app: Express) {
    app.use(bodyParser.json({ limit: '5000mb' }));
    app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '5000mb' }));
  }

  /**
   * start a express server.
   */
  async listen(port?: number) {
    const serverPort = port || this.config.port;
    const app = this.createApp();
    app.listen(serverPort);
  }

  /**
   * register a new express routes.
   * route will be added as `/api/${route}`
   */
  register(routes: Route[]) {
    this.routeSlot.register(routes);
    return this;
  }

  /**
   * register a new middleware into express.
   */
  registerMiddleware(middlewares: MiddlewareManifest[]) {
    this.middlewareSlot.register(middlewares);
    return this;
  }

  createApp(expressApp?: Express, options?: { disableBodyParser: true }): Express {
    const internalRoutes = this.createRootRoutes();
    const routes = this.createRoutes();
    const allRoutes = concat(routes, internalRoutes);
    const sortedRoutes = sortBy(allRoutes, (r) => r.priority).reverse();
    const app = expressApp || express();
    app.use((req, _res, next) => {
      if (this.config.loggerIgnorePath.includes(req.url)) return next();
      this.logger.debug(`express got a request to a URL: ${req.url}', headers:`, req.headers);
      return next();
    });
    if (!options?.disableBodyParser) this.bodyParser(app);

    this.middlewareSlot
      .toArray()
      .flatMap(([, middlewares]) =>
        middlewares.flatMap((middlewareManifest) => app.use(middlewareManifest.middleware))
      );
    sortedRoutes.forEach((routeInfo) => {
      const { method, path, middlewares, disableNamespace } = routeInfo;
      const namespace = disableNamespace ? '' : `/${this.config.namespace}`;
      app[method](`${namespace}${path}`, this.catchErrorsMiddlewares(middlewares));
    });

    return app;
  }
}

ExpressAspect.addRuntime(ExpressMain);
