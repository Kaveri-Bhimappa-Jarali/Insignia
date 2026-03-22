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

  const getPoint = (id) =>
    places.find((p) => p.id == id) ||
    nodes.find((n) => n.id == id);

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];

    const edge = edges.find(
      (e) =>
        (e.from == a && e.to == b) ||
        (e.from == b && e.to == a)
    );

    const A = getPoint(a);
    const B = getPoint(b);

    let text = `${A?.name || a} → ${B?.name || b}`;

    if (edge?.instruction) {
      text += " | " + edge.instruction;
    }

    if (A?.floor !== B?.floor) {
      text += ` (Floor ${A?.floor} → ${B?.floor})`;
    }

    result.push(text);
  }

  return result;
}