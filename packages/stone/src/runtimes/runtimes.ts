import { RuntimeDefinition } from './runtimeDefinition';
import { RuntimeNotDefinedError } from '../exception';
import { ExtensionGraph } from '../extensionGraph';

export class Runtimes {
  constructor(readonly runtimeDefinition: { [key: string]: RuntimeDefinition }) {}

  add(runtime: RuntimeDefinition) {
    this.runtimeDefinition[runtime.name] = runtime;
    return this;
  }

  get(name: string): RuntimeDefinition {
    const runtime = this.runtimeDefinition[name];
    if (!runtime) throw new RuntimeNotDefinedError(name);
    return this.runtimeDefinition[name];
  }

  static async load(graph: ExtensionGraph) {
    const runtimes: { [key: string]: RuntimeDefinition } = {};
    graph.extensions.forEach((manifest) => {
      if (!manifest.declareRuntime) return;
      runtimes[manifest.declareRuntime.name] = manifest.declareRuntime;
    });

    return new Runtimes(runtimes);
  }
}
