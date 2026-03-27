export function getPointById(id, places, nodes) {
  const p = places.find((x) => x.id == id);
  if (p) return p;

  const n = nodes.find((x) => x.id == id);
  if (n) return n;

  return null;
}


// ---------- COORDS ----------

export function pathToCoords(path, places, nodes) {
  return path
    .map((id) => {
      const p = getPointById(id, places, nodes);
      if (!p) return null;

      return {
        lat: p.lat,
        lng: p.lng,
      };
    })
    .filter(Boolean);
}


// ---------- NAMES ----------

export function pathToNames(path, places, nodes) {
  return path
    .map((id) => {
      const p = getPointById(id, places, nodes);
      return p?.name || id;
    });
}


// ---------- INSTRUCTIONS ----------
export function pathToInstructions(
  path,
  edges,
  places,
  nodes
) {

  const result = [];

  if (!path || path.length < 2) return result;

  const getName = (id) => {

    id = Number(id);

    const p =
      places.find(x => Number(x.id) === id) ||
      nodes.find(x => Number(x.id) === id);

    return p ? p.name : id;

  };


  for (let i = 0; i < path.length - 1; i++) {

    const a = Number(path[i]);
    const b = Number(path[i + 1]);

    const edge = edges.find(
      e =>
        (Number(e.from) === a && Number(e.to) === b) ||
        (Number(e.from) === b && Number(e.to) === a)
    );

    const inst = edge?.instruction || edge?.direction || "";

    if (inst) {
      result.push({
        from: getName(a),
        to: getName(b),
        instruction: inst,
      });
    }

  }

  return result;
}
