import { Environment } from './environment';

/**
 * API for component development environment.
 */
export class EnvDefinition {
  constructor(readonly id: string, readonly env: Environment) {}

  get name() {
    return this.env.name;
  }

  get description() {
    return this.env.description;
  }

  toObject() {
    return {
      id: this.id,
      description: this.description,
      name: this.name,
    };
  }
}
