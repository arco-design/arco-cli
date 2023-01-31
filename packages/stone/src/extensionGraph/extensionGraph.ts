import { Graph } from 'cleargraph';
import { fromExtension, fromExtensions } from './fromExtension';
import { ExtensionManifest, Extension } from '../extension';
import { RuntimeDefinition, Runtimes } from '../runtimes';
import { RequireFn } from '../stone';

export type Edge = {
  type: string;
  runtime?: string;
};

export class ExtensionGraph extends Graph<Extension, Edge> {
  private cache = new Map<string, Extension>();

  getRuntimeDependencies(aspect: Extension, runtime: RuntimeDefinition): Extension[] {
    const dependencies = this.successors(aspect.name);
    const runtimeDeps = this.successors(aspect.name, (edge) => {
      if (!edge.runtime) return false;
      return edge.runtime === runtime.name;
    });
    const runtimeManifest = aspect.getRuntime(runtime);
    if (!runtimeManifest) return Array.from(dependencies.values());

    if (runtimeDeps && runtimeDeps.size)
      return this.sortDeps(runtimeManifest.dependencies, Array.from(runtimeDeps.values()));
    return this.sortDeps(runtimeManifest.dependencies, Array.from(dependencies.values()));
  }

  private sortDeps(originalDependencies: any[], targetDependencies: any[]) {
    return targetDependencies.sort((a, b) => {
      return (
        originalDependencies.findIndex((item) => item.id === a.id) -
        originalDependencies.findIndex((item) => item.id === b.id)
      );
    });
  }

  byExecutionOrder() {
    return this.toposort(true);
  }

  private async enrichRuntimeExtension(
    id: string,
    aspect: Extension,
    runtime: RuntimeDefinition,
    runtimes: Runtimes,
    requireFn: RequireFn
  ) {
    await requireFn(aspect, runtime);
    const runtimeManifest = aspect.getRuntime(runtime);
    if (!runtimeManifest) return null;
    const deps = runtimeManifest.dependencies;
    if (!deps) return null;
    const promises = deps.map(async (dep: any) => {
      if (!this.hasNode(dep.id)) {
        this.add(dep);
        if (dep.declareRuntime) {
          runtimes.add(dep.declareRuntime);
        }

        await requireFn(this.get(dep.id), runtime);
        await this.enrichRuntimeExtension(dep.id, this.get(dep.id), runtime, runtimes, requireFn);
      }

      this.setEdge(id, dep.id, {
        runtime: runtime.name,
        type: 'runtime-dependency',
      });
    });

    return Promise.all(promises);
  }

  async enrichRuntime(runtime: RuntimeDefinition, runtimes: Runtimes, requireFn: RequireFn) {
    const promises = Array.from(this.nodes.entries()).map(async ([id, aspect]) => {
      return this.enrichRuntimeExtension(id, aspect, runtime, runtimes, requireFn);
    });

    return Promise.all(promises);
  }

  add(manifest: ExtensionManifest) {
    const { vertices, edges } = fromExtension(manifest);
    this.setNodes(vertices);
    this.setEdges(edges);

    return this;
  }

  load(extensions: ExtensionManifest[]) {
    const newExtensions = extensions.filter((extension) => {
      if (!extension.id) return false;
      return !this.get(extension.id);
    });

    const { vertices, edges } = fromExtensions(newExtensions);
    // only set new vertices
    // false because we don't want to override already-loaded extensions
    this.setNodes(vertices, false);
    this.setEdges(edges);

    return this;
  }

  getExtension(manifest: ExtensionManifest): Extension {
    const id = manifest.id || manifest.name;
    const cachedVertex = this.cache.get(id);
    if (cachedVertex) return cachedVertex;

    const res = this.node(id);
    if (res) {
      this.cache.set(res.name, res);
      return res;
    }

    return null;
  }

  get extensions(): ExtensionManifest[] {
    return Array.from(this.nodes.values());
  }

  get aspects() {
    return this.extensions;
  }

  get(id: string): Extension {
    const cachedVertex = this.cache.get(id);
    if (cachedVertex) return cachedVertex;

    const res = this.node(id);
    if (res) {
      this.cache.set(res.name, res);
      return res;
    }

    return null;
  }

  /**
   * build graph from a single extension.
   */
  static fromRoot(extension: ExtensionManifest) {
    const { vertices, edges } = fromExtension(extension);
    return new ExtensionGraph(vertices, edges);
  }

  /**
   * build graph from set of extensions
   */
  static from(extensions: ExtensionManifest[]) {
    const { vertices, edges } = fromExtensions(extensions);
    return new ExtensionGraph(vertices, edges);
  }
}
