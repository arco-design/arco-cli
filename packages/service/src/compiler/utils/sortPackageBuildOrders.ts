import { Graph } from 'cleargraph';

export function sortPackageBuildOrders(
  packages: Array<{ name: string; dependencies?: string[] }>
): { orders: string[]; isCyclic: boolean; error?: Error } {
  const graph = new Graph(packages.map(({ name }) => ({ id: name, node: name })));

  for (const { name, dependencies = [] } of packages) {
    for (const dep of dependencies) {
      if (graph.hasNode(dep)) {
        graph.setEdge(dep, name, 'dependency');
      }
    }
  }

  const result = {
    orders: packages.map(({ name }) => name),
    isCyclic: graph.isCyclic(),
    error: null,
  };

  try {
    result.orders = graph.toposort();
  } catch (err) {
    result.error = err;
  }

  return result;
}
