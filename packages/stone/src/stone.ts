import { Config } from './config';
import { Aspect } from './aspect';
import { ExtensionLoadError, RuntimeNotDefinedError } from './exception';
import { Extension, ExtensionManifest } from './extension';
import { ExtensionGraph } from './extensionGraph';
import { Runtimes, RuntimeDefinition } from './runtimes';
import { asyncForEach } from './utils/asyncForEach';

export type GlobalConfig = {
  [key: string]: object;
};

export type RequireFn = (aspect: Extension, runtime: RuntimeDefinition) => Promise<void>;

export class Stone {
  constructor(
    readonly graph: ExtensionGraph,

    readonly config: Config,

    readonly runtimes: Runtimes,

    readonly activeRuntime: string
  ) {}

  public current: string | null = null;

  private runtime: RuntimeDefinition | undefined;

  get extensions() {
    return this.graph.nodes;
  }

  get extensionsIds() {
    return [...this.graph.nodes.keys()];
  }

  private async runOne(extension: Extension, runtime: RuntimeDefinition) {
    if (extension.loaded) return null;
    // create an index of all vertices in dependency graph
    const deps = this.graph.getRuntimeDependencies(extension, runtime);
    const instances = deps.map((extension) => extension.instance);

    try {
      return extension.__run(instances, this, runtime);
    } catch (err) {
      throw new ExtensionLoadError(extension, err);
    }
  }

  getDependencies(aspect: Extension) {
    if (!this.runtime) throw new RuntimeNotDefinedError(this.activeRuntime);
    return this.graph.getRuntimeDependencies(aspect, this.runtime);
  }

  initExtension(id: string) {
    this.current = id;
  }

  endExtension() {
    this.current = null;
  }

  /**
   * get an extension
   */
  get<T>(id: string): T {
    const extension = this.graph.get(id);
    if (!extension || !extension.instance) throw new Error(`failed loading extension ${id}`);
    return extension.instance;
  }

  resolveRuntime(name: string): RuntimeDefinition {
    return this.runtimes.get(name);
  }

  /**
   * load an Aspect into the dependency graph.
   */
  async load(extensions: ExtensionManifest[]) {
    this.graph.load(extensions);
    // Only load new extensions and their dependencies
    const extensionsToLoad = extensions.map((ext) => {
      return ext.id || ext.name;
    });

    // @ts-ignore
    await this.graph.enrichRuntime(this.runtime, this.runtimes, () => {});
    const subGraphs = this.graph.successorsSubgraph(extensionsToLoad);
    if (subGraphs) {
      const executionOrder = subGraphs.toposort(true);
      await asyncForEach(executionOrder, async (ext: Extension) => {
        if (!this.runtime) throw new RuntimeNotDefinedError(this.activeRuntime);
        await this.runOne(ext, this.runtime);
      });
    }
  }

  async run(requireFn?: RequireFn) {
    const runtime = this.resolveRuntime(this.activeRuntime);
    this.runtime = runtime;
    const defaultRequireFn: RequireFn = async (aspect: Extension, runtime: RuntimeDefinition) => {
      const runtimeFile = runtime.getRuntimeFile(aspect.files);
      // eslint-disable-next-line no-useless-return
      if (!runtimeFile) return;
      // runtime.require(runtimeFile);
    };
    await this.graph.enrichRuntime(runtime, this.runtimes, requireFn || defaultRequireFn);
    const executionOrder = this.graph.byExecutionOrder();
    await asyncForEach(executionOrder, async (ext: Extension) => {
      await this.runOne(ext, runtime);
    });
  }

  static async load(aspects: Aspect[], runtime: string, globalConfig: GlobalConfig) {
    const aspectGraph = ExtensionGraph.from(aspects as any);
    const runtimes = await Runtimes.load(aspectGraph);
    return new Stone(aspectGraph, Config.from(globalConfig), runtimes, runtime);
  }
}
