import { Logger } from '@arco-cli/core/dist/logger';
import mapSeries from 'p-map-series';
import { ExecutionContext } from '../executionContext';
import { EnvService, EnvServiceExecutionResult } from '../envService';
import { EnvRuntime } from './envRuntime';
import { EnvsExecutionResult } from './envsExecutionResult';

export interface EnvResult<T extends EnvServiceExecutionResult> {
  env: EnvRuntime;
  data?: T;
  error?: Error;
}

export class Runtime {
  constructor(
    /**
     * runtime instances of the environments.
     */
    readonly runtimeEnvs: EnvRuntime[],

    private logger: Logger
  ) {}

  getEnvExecutionContext(): ExecutionContext[] {
    return this.runtimeEnvs.map((env) => new ExecutionContext(this, env));
  }

  /**
   * execute a service once for all environments.
   */
  async runOnce<T>(service: EnvService<T>, options?: { [key: string]: any }): Promise<any> {
    if (!service.runOnce)
      throw new Error('a service must implement `runOnce()` in order to be executed');
    const envsExecutionContext = this.getEnvExecutionContext();
    const serviceResult = await service.runOnce(envsExecutionContext, options);
    return serviceResult;
  }

  /**
   * execute a service on each one of the environments.
   */
  async run<T>(
    /**
     * environment service to execute.
     */
    service: EnvService<T>,

    /**
     * options to proxy to the service upon execution.
     */
    options?: { [key: string]: any }
  ): Promise<EnvsExecutionResult<T>> {
    if (!service.run) throw new Error('a service must implement `run()` in order to be executed');

    const contexts: EnvResult<T>[] = await mapSeries(this.runtimeEnvs, async (env) => {
      try {
        const serviceResult = await service.run(new ExecutionContext(this, env), options);
        return {
          env,
          data: serviceResult,
        };
      } catch (err) {
        this.logger.error(err.message, err);
        this.logger.consoleFailure(
          `service "${service.name}" of env "${env.id}" has failed. error: ${err.message}`
        );
        return {
          env,
          error: err,
        };
      }
    });

    return new EnvsExecutionResult(contexts);
  }
}
