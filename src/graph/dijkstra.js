export function dijkstra(graph, startId, endId) {
  const dist = {};
  const prev = {};
  const visited = {};

  Object.keys(graph).forEach((v) => {
    dist[v] = Infinity;
    prev[v] = null;
  });

  dist[startId] = 0;

  while (true) {
    let closest = null;
    let minDist = Infinity;

    for (let v in dist) {
      if (!visited[v] && dist[v] < minDist) {
        minDist = dist[v];
        closest = v;
      }
    }

    if (closest === null) break;
    if (closest == endId) break;

    visited[closest] = true;

    for (let edge of graph[closest]) {
      const alt = dist[closest] + edge.dist;

      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = closest;
      }
    }
  }

  const path = [];
  let u = endId;

  while (u) {
    path.unshift(u);
    u = prev[u];
  }

  if (path[0] != startId) return [];

  return path;
}