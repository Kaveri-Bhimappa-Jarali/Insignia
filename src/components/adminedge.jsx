import { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";

import { campusCenter, campusBounds } from "../config/mapBounds";

import placesData from "../data/places.json";
import nodesData from "../data/nodes.json";
import edgesData from "../data/edges.json";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const options = {
  restriction: {
    latLngBounds: campusBounds,
    strictBounds: true,
  },
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeId: "satellite",
};

const EDGES_KEY = "insignia_edges";

const loadEdges = () => {
  try {
    const s = localStorage.getItem(EDGES_KEY);
    if (!s) return edgesData;
    return JSON.parse(s);
  } catch {
    return edgesData;
  }
};

export default function AdminEdgeEditor() {

  // ✅ load places & nodes from JSON

  const [placesState] = useState(placesData);
  const [nodesState] = useState(nodesData);

  // ✅ edges from localStorage

  const [edgesState, setEdgesState] = useState(loadEdges);

  const [selectedPoints, setSelectedPoints] = useState([]);
  const [edgeForm, setEdgeForm] = useState({});
  const [showEdgeForm, setShowEdgeForm] = useState(false);

  const allPoints = [...placesState, ...nodesState];

  // ---------------- select points ----------------

  const handlePointSelect = (p) => {

    if (selectedPoints.length === 0) {

      setSelectedPoints([p]);

      return;
    }

    if (selectedPoints.length === 1) {

      if (selectedPoints[0].id === p.id) return;

      setSelectedPoints([selectedPoints[0], p]);
      setShowEdgeForm(true);
    }
  };

  // ---------------- form ----------------

  const handleEdgeFormChange = (e) => {

    const { name, value } = e.target;

    setEdgeForm((prev) => ({
      ...prev,
      [name]:
        name === "distance" || name === "time"
          ? Number(value)
          : value,
    }));
  };

  // ---------------- save edge ----------------

  const handleEdgeSubmit = () => {

    if (!edgeForm.distance) return;

    const nextId =
      Math.max(0, ...edgesState.map(e => e.id)) + 1;

    const newEdge = {

      id: nextId,

      from: selectedPoints[0].id,
      to: selectedPoints[1].id,

      distance: edgeForm.distance,
      direction: edgeForm.direction,
      instruction: edgeForm.instruction,
      time: edgeForm.time,
    };

    const updated = [...edgesState, newEdge];

    setEdgesState(updated);

    localStorage.setItem(
      EDGES_KEY,
      JSON.stringify(updated, null, 2)
    );

    setSelectedPoints([]);
    setShowEdgeForm(false);
    setEdgeForm({});
  };

  // ---------------- export ----------------

  const exportEdges = () => {

    const value = JSON.stringify(
      edgesState,
      null,
      2
    );

    navigator.clipboard.writeText(value);

    alert("Edges copied");
  };

  // ================= UI =================

  return (

    <div style={{ display: "flex", height: "100vh" }}>

      {/* PANEL */}

      <div
        style={{
          width: 300,
          background: "#111",
          color: "#fff",
          padding: 10,
        }}
      >

        <h3>Edge Editor</h3>

        <p>
          Click two markers to create edge
        </p>

        <p>
          Selected:
          {selectedPoints.map(p => p.name).join(" → ")}
        </p>

        <button onClick={exportEdges}>
          Export
        </button>

      </div>


      {/* MAP */}

      <div style={{ flex: 1 }}>

        <LoadScript
          googleMapsApiKey={
            import.meta.env.VITE_GOOGLE_MAP_KEY
          }
        >

          <GoogleMap
            mapContainerStyle={containerStyle}
            center={campusCenter}
            zoom={17}
            options={options}
          >

            {/* PLACES */}

            {placesState.map(p => (

              <Marker
                key={p.id}
                position={{
                  lat: p.lat,
                  lng: p.lng,
                }}
                onClick={() => handlePointSelect(p)}
              />

            ))}

            {/* NODES */}

            {nodesState.map(n => (

              <Marker
                key={n.id}
                position={{
                  lat: n.lat,
                  lng: n.lng,
                }}
                icon={{
                  url:
                    "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                }}
                onClick={() => handlePointSelect(n)}
              />

            ))}

            {/* selected line */}

            {selectedPoints.length === 2 && (

              <Polyline
                path={[
                  selectedPoints[0],
                  selectedPoints[1],
                ]}
              />

            )}

            {/* edges */}

            {edgesState.map(e => {

              const a = allPoints.find(
                x => x.id === e.from
              );

              const b = allPoints.find(
                x => x.id === e.to
              );

              if (!a || !b) return null;

              return (

                <Polyline
                  key={e.id}
                  path={[
                    a,
                    b,
                  ]}
                  options={{
                    strokeColor: "#00ff00",
                  }}
                />

              );

            })}

          </GoogleMap>

        </LoadScript>

      </div>


      {/* FORM */}

      {showEdgeForm && (

        <div
          style={{
            position: "fixed",
            top: 100,
            left: 400,
            background: "#222",
            padding: 20,
            color: "#fff",
          }}
        >

          <h3>Add Edge</h3>

          <input
            name="distance"
            placeholder="distance"
            onChange={handleEdgeFormChange}
          />

          <input
            name="instruction"
            placeholder="instruction"
            onChange={handleEdgeFormChange}
          />

          <input
            name="time"
            placeholder="time"
            onChange={handleEdgeFormChange}
          />

          <button onClick={handleEdgeSubmit}>
            Save
          </button>

        </div>

      )}

    </div>

  );
}