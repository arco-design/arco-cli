import { Slot, SlotRegistry } from '@arco-cli/stone';
import { MainRuntime } from '@arco-cli/core/dist/cli';
import { Logger, LoggerAspect, LoggerMain } from '@arco-cli/core/dist/logger';
import { DEFAULT_ENV } from '@arco-cli/legacy/dist/constants';

import { Component } from '@aspect/component';

import { EnvRuntime, Runtime } from './runtime';
import { EnvsAspect } from './envs.aspect';
import { Environment } from './environment';
import { EnvDefinition } from './envDefinition';
import { EnvNotFoundError } from './exceptions/envNotFoundError';
import { EnvService } from './envService';

type EnvsSlot = SlotRegistry<Environment>;
type ServiceSlot = SlotRegistry<EnvService<any>>;

export type EnvTransformer = (env: Environment) => Environment;

export class EnvsMain {
  static runtime = MainRuntime;

  static dependencies = [LoggerAspect];

  static slots = [Slot.withType<Environment>(), Slot.withType<EnvService<any>>()];

  static provider(
    [loggerMain]: [LoggerMain],
    _config,
    [envSlot, serviceSlot]: [EnvsSlot, ServiceSlot]
  ) {
    const logger = loggerMain.createLogger(EnvsAspect.id);
    return new EnvsMain(logger, envSlot, serviceSlot);
  }

  constructor(
    private logger: Logger,
    private envSlot: EnvsSlot,
    private serviceSlot: ServiceSlot
  ) {}

  private async aggregateByDefs(components: Component[]): Promise<EnvRuntime[]> {
    const envsMap = {};
    components.forEach((component: Component) => {
      const envDef = this.getEnv(component);
      const envId = envDef.id;
      const env = envDef.env;
      // handle config as well when aggregating envs.
      if (envsMap[envId]) {
        envsMap[envId].components.push(component);
      } else
        envsMap[envId] = {
          components: [component],
          env,
        };
    });

    return Promise.all(
      Object.keys(envsMap).map(async (key) => {
        return new EnvRuntime(key, envsMap[key].env, envsMap[key].components);
      })
    );
  }

  /**
   * compose a new environment from a list of environment transformers.
   */
  compose(targetEnv: Environment, envTransformers: EnvTransformer[]) {
    return envTransformers.reduce((acc, transformer) => {
      acc = transformer(acc);
      return acc;
    }, targetEnv);
  }

  /**
   * create an env transformer which overrides specific env properties.
   */
  override(propsToOverride: Environment): EnvTransformer {
    return (env: Environment) => {
      return this.merge(propsToOverride, env);
    };
  }

  /**
   * compose two environments into one.
   */
  merge<T extends Environment, S extends Environment>(
    targetEnv: Environment,
    sourceEnv: Environment
  ): T & S {
    const allNames = new Set<string>();
    const keys = ['name', 'description'];

    for (let o = sourceEnv; o !== Object.prototype; o = Object.getPrototypeOf(o)) {
      for (const name of Object.getOwnPropertyNames(o)) {
        allNames.add(name);
      }
    }

    allNames.forEach((key: string) => {
      const sourceFn = sourceEnv[key];
      if (targetEnv[key]) return;

      if (keys.includes(key)) {
        targetEnv[key] = sourceFn;
      } else if (sourceFn?.bind) {
        targetEnv[key] = sourceFn.bind(sourceEnv);
      }
    });

    return targetEnv as T & S;
  }

  getEnv(component: Component): EnvDefinition {
    const envId = component.env;
    const env = this.envSlot.get(component.env);
    if (env) {
      return new EnvDefinition(envId, env as Environment);
    }
    throw new EnvNotFoundError(envId);
  }

  getDefaultEnv(): EnvDefinition {
    const defaultEnv = this.envSlot.get(DEFAULT_ENV);
    if (!defaultEnv) throw new Error('default env must be set.');
    return new EnvDefinition(DEFAULT_ENV, defaultEnv);
  }

  registerEnv(env: Environment) {
    return this.envSlot.register(env);
  }

  registerService(envService: EnvService<any>) {
    this.serviceSlot.register(envService);
    return this;
  }

  isEnvRegistered(id: string) {
    return Boolean(this.envSlot.get(id));
  }

  getAllRegisteredEnvs(): string[] {
    return this.envSlot.toArray().map((envData) => envData[0]);
  }

  async createEnvironment(components: Component[]): Promise<Runtime> {
    const envRuntimes = await this.aggregateByDefs(components);
    return new Runtime(envRuntimes, this.logger);
  }
}

EnvsAspect.addRuntime(EnvsMain);
