import { ExtensionManifest, Extension } from '../extension';
import { ExtensionPotentialCircularError } from '../exception';
import { Edge } from './extensionGraph';

/**
 * build vertices and edges from the given extension
 */
export function fromExtension(extension: ExtensionManifest) {
  const vertices: { [id: string]: Extension } = {};
  let edges: { sourceId: string; targetId: string; edge: Edge }[] = [];

  function iterate(root: ExtensionManifest) {
    const id = root.id || root.name;
    if (vertices[id]) return;

    const instance = Extension.from(root);
    const validDeps = instance.dependencies.filter((dep) => dep).map((dep) => Extension.from(dep));
    if (instance.dependencies.length > validDeps.length) {
      throw new ExtensionPotentialCircularError(instance, validDeps);
    }
    vertices[id] = instance;

    const newEdges = validDeps.map((dep) => {
      return {
        sourceId: id,
        targetId: dep.name,
        edge: {
          type: 'dependency',
        },
      };
    });

    edges = edges.concat(newEdges);
    instance.dependencies.forEach((dep) => iterate(dep));
  }

  iterate(extension);

  const vertexArray: { id: string; node: Extension }[] = [];
  for (const [key, value] of Object.entries(vertices)) {
    vertexArray.push({ id: key, node: value });
  }

  return {
    vertices: vertexArray,
    edges,
  };
}

/**
 * build vertices and edges from the given list of extensions
 */
export function fromExtensions(extensions: ExtensionManifest[]) {
  const perExtension = extensions.map((ext) => fromExtension(ext));
  return perExtension.reduce(
    (acc, subgraph) => {
      acc.edges = acc.edges.concat(subgraph.edges);
      acc.vertices = acc.vertices.concat(subgraph.vertices);
      return acc;
    },
    { vertices: [], edges: [] }
  );
}
