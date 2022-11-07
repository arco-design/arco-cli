import type { ReactElement } from 'react';
import { Environment } from './environment';
import { ExecutionContext } from './executionContext';

export interface EnvServiceExecutionResult {
  errors?: Error[];
}

/**
 * services allows to reuse and standardize services for development environments.
 * examples for services can be: `linting`, `compilation`, `build`, and others which offer
 * standard services to environments such as `react`, `angular` and `vue` and different compositions of each for
 * more concrete needs.
 *
 * `TData` - type of data returned by the service handler.
 * `TOpts` is the type of options passed to the environment through execution.
 * `TExecResponse` is the execution result of the service.
 */
export interface EnvService<
  TExecResponse extends EnvServiceExecutionResult,
  TData = Record<string, any>,
  TOpts = Record<string, any>
> {
  /**
   * name of the service. (e.g. `compile`, `test`, etc.)
   */
  name?: string;

  /**
   * description of the env.
   */
  description?: string;

  /**
   * create a string to describe to service in the env cli.
   */
  render?(env: Environment): ReactElement | Promise<ReactElement>;

  /**
   * get service data from an environment.
   */
  getDescriptor?(env: Environment): TData | undefined | Promise<TData | undefined>;

  /**
   * executes a service on a subset of components.
   */
  run?(context: ExecutionContext, options?: TOpts): Promise<TExecResponse>;

  /**
   * run the service only once.
   */
  runOnce?(context: ExecutionContext[], options?: TOpts): Promise<any>;
}
