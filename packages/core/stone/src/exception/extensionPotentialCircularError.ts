import { Extension } from '../extension';

export class ExtensionPotentialCircularError extends Error {
  constructor(public extension: Extension, public validDeps: Extension[]) {
    super();
  }

  toString() {
    return `Failed to load the dependencies for extension . 
This may result from a wrong import or from circular dependencies in imports. 
The following dependencies succeeded loading:`;
  }
}
