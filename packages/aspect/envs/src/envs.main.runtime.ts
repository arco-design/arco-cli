import { Slot, SlotRegistry } from '@arco-cli/stone';
import { MainRuntime } from '@arco-cli/cli';
import { Logger, LoggerAspect, LoggerMain } from '@arco-cli/logger';
import { DEFAULT_ENV } from '@arco-cli/legacy/dist/constants';
import { Component } from '@arco-cli/component';
import { EnvRuntime, Runtime } from './runtime';
import { EnvsAspect } from './envs.aspect';
import { Environment } from './environment';
import { EnvDefinition } from './envDefinition';
import { EnvNotFoundError } from './exceptions/envNotFoundError';
import { EnvService } from './envService';

type EnvsSlot = SlotRegistry<Environment>;
type ServiceSlot = SlotRegistry<EnvService<any>>;

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
