import { Component } from '@aspect/component';

import { Environment } from '../environment';

export class EnvRuntime {
  constructor(
    /**
     * ID of the wrapping extension.
     */
    readonly id: string,

    /**
     * Environment
     */
    readonly env: Environment,

    /**
     * components to be loaded in the environment
     */
    readonly components: Component[]
  ) {}
}
