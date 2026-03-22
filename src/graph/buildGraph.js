export function buildGraph(places, nodes, edges) {
  const graph = {};

  const addVertex = (id) => {
    if (!graph[id]) graph[id] = [];
  };

  places.forEach((p) => addVertex(p.id));
  nodes.forEach((n) => addVertex(n.id));

  edges.forEach((e) => {
    addVertex(e.from);
    addVertex(e.to);

    graph[e.from].push({
      to: e.to,
      dist: e.distance || 1,
      instruction: e.instruction || "",
    });

    graph[e.to].push({
      to: e.from,
      dist: e.distance || 1,
      instruction: e.instruction || "",
    });
  });

  return graph;
}