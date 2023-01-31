import cors from 'cors';
import { createServer } from 'http';
import { GraphQLModule } from '@graphql-modules/core';
import { Stone, Slot, SlotRegistry } from '@arco-cli/stone';
import express, { Express } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { PubSubEngine, PubSub } from 'graphql-subscriptions';

import { MainRuntime } from '@core/cli';
import { Logger, LoggerAspect, LoggerMain } from '@core/logger';

import { Schema } from './schema';
import { GraphqlAspect } from './graphql.aspect';

export enum Verb {
  // eslint-disable-next-line no-unused-vars
  WRITE = 'write',
  // eslint-disable-next-line no-unused-vars
  READ = 'read',
}

type GraphQLConfig = {
  port: number;
};

type SchemaSlot = SlotRegistry<Schema>;

type PubSubSlot = SlotRegistry<PubSubEngine>;

export type GraphQLServerOptions = {
  schemaSlot?: SchemaSlot;
  app?: Express;
  graphiql?: boolean;
};

export class GraphqlMain {
  constructor(
    /**
     * extension config
     */
    readonly config: GraphQLConfig,

    /**
     * slot for registering graphql modules
     */
    private moduleSlot: SchemaSlot,

    /**
     * Stone context.
     */
    private context: Stone,

    /**
     * logger extension.
     */
    readonly logger: Logger,

    /**
     * graphql pubsub. allows to emit events to clients.
     */
    private pubSubSlot: PubSubSlot
  ) {}

  get pubsub(): PubSubEngine {
    const pubSubSlots = this.pubSubSlot.values();
    if (pubSubSlots.length) return pubSubSlots[0];
    return new PubSub();
  }

  private modules = new Map<string, GraphQLModule>();

  async createServer(options: GraphQLServerOptions) {
    const { graphiql = true } = options;
    const schema = this.createRootModule(options.schemaSlot).schema;
    const app: Express = options.app || express();

    app.use(
      cors({
        origin(_origin, callback) {
          callback(null, true);
        },
        credentials: true,
      })
    );

    app.use(
      '/graphql',
      // @ts-ignore
      graphqlHTTP((request, _res, params) => {
        return {
          schema,
          graphiql,
          rootValue: request,
          customFormatErrorFn: (err) => {
            this.logger.error('graphql got an error during running the following query:', params);
            this.logger.error('graphql error ', err);
            return Object.assign(err, {
              ERR_CODE:
                // @ts-ignore
                err?.originalError?.errors?.[0].ERR_CODE || err.originalError?.constructor?.name,
              // @ts-ignore
              HTTP_CODE: err?.originalError?.errors?.[0].HTTP_CODE || err.originalError?.code,
            });
          },
        };
      })
    );

    return createServer(app);
  }

  /**
   * register a pubsub client
   */
  registerPubSub(pubsub: PubSubEngine) {
    const pubSubSlots = this.pubSubSlot.toArray();
    if (pubSubSlots.length) throw new Error('can not register more then one pubsub provider');
    this.pubSubSlot.register(pubsub);
    return this;
  }

  /**
   * register a new graphql module.
   */
  register(schema: Schema) {
    this.moduleSlot.register(schema);
    return this;
  }

  private createRootModule(schemaSlot?: SchemaSlot) {
    const modules = this.buildModules(schemaSlot);
    return new GraphQLModule({
      imports: modules,
    });
  }

  private buildModules(schemaSlot: SchemaSlot = this.moduleSlot) {
    const schemaSlots = schemaSlot.toArray();
    return schemaSlots.map(([extensionId, schema]) => {
      const moduleDeps = this.getModuleDependencies(extensionId);

      const module = new GraphQLModule({
        typeDefs: schema.typeDefs,
        resolvers: schema.resolvers,
        schemaDirectives: schema.schemaDirectives,
        imports: moduleDeps,
        context: (session) => {
          return {
            ...session,
            verb: session?.headers?.['x-verb'] || Verb.READ,
          };
        },
      });

      this.modules.set(extensionId, module);

      return module;
    });
  }

  private getModuleDependencies(extensionId: string): GraphQLModule[] {
    const extension = this.context.extensions.get(extensionId);
    if (!extension) throw new Error(`aspect ${extensionId} was not found`);
    const deps = this.context.getDependencies(extension);
    const ids = deps.map((dep) => dep.id);

    return Array.from(this.modules.entries())
      .map(([depId, module]) => {
        const dep = ids.includes(depId);
        if (!dep) return undefined;
        return module;
      })
      .filter((module) => !!module);
  }

  static slots = [Slot.withType<Schema>(), Slot.withType<PubSubSlot>()];

  static defaultConfig = {
    port: 4000,
  };

  static runtime = MainRuntime;

  static dependencies = [LoggerAspect];

  static async provider(
    [loggerFactory]: [LoggerMain],
    config: GraphQLConfig,
    [moduleSlot, pubSubSlot]: [SchemaSlot, PubSubSlot],
    context: Stone
  ) {
    const logger = loggerFactory.createLogger(GraphqlAspect.id);
    const graphqlMain = new GraphqlMain(config, moduleSlot, context, logger, pubSubSlot);
    return graphqlMain;
  }
}

GraphqlAspect.addRuntime(GraphqlMain);
