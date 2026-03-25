import { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { campusCenter, campusBounds } from "../config/mapBounds";

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

const PLACES_KEY = "insignia_places";
const NODES_KEY = "insignia_nodes";
const EDGES_KEY = "insignia_edges";

const loadFromLocalStorage = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored);
  } catch (error) {
    console.error("localStorage parse error", key, error);
    return fallback;
  }
};

export default function AdminPanel({ places = [], nodes = [], edges = [] }) {
  const [activeMode, setActiveMode] = useState(null); // "place", "node", "edge"
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedPoints, setSelectedPoints] = useState([]); // For edge creation
  const [edgeForm, setEdgeForm] = useState({});
  const [showEdgeForm, setShowEdgeForm] = useState(false);

  const [placesState, setPlacesState] = useState(() => loadFromLocalStorage(PLACES_KEY, places));
  const [nodesState, setNodesState] = useState(() => loadFromLocalStorage(NODES_KEY, nodes));
  const [edgesState, setEdgesState] = useState(() => loadFromLocalStorage(EDGES_KEY, edges));

  const allPlaceNodes = [...placesState, ...nodesState];

  // Handle map click
  const handleMapClick = (e) => {
    if (!activeMode) {
      alert("Select a mode first (Add Place, Add Node, or Add Edge)");
      return;
    }

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    if (activeMode === "edge") {
      // Handle edge creation - click on existing places/nodes
      const clickedPoint = allPlaceNodes.find(
        (p) => Math.abs(p.lat - lat) < 0.0001 && Math.abs(p.lng - lng) < 0.0001
      );

      if (!clickedPoint) {
        alert("Click on existing places or nodes to create an edge");
        return;
      }

      if (selectedPoints.length === 0) {
        setSelectedPoints([clickedPoint]);
        alert(`Selected ${clickedPoint.name}. Click another point to create edge.`);
      } else if (selectedPoints.length === 1) {
        if (selectedPoints[0].id === clickedPoint.id) {
          alert("Cannot create edge between the same point");
          return;
        }
        setSelectedPoints([selectedPoints[0], clickedPoint]);
        setShowEdgeForm(true);
      }
    } else {
      // Handle place/node creation
      setFormData({
        lat: lat.toFixed(10),
        lng: lng.toFixed(10),
        floor: 0,
      });
      setShowForm(true);
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "floor" ? parseInt(value) : value,
    }));
  };

  const handlePointSelect = (point) => {
    if (activeMode !== "edge") return;

    if (selectedPoints.length === 0) {
      setSelectedPoints([point]);
      alert(`Selected ${point.name}. Click another point to create edge.`);
    } else if (selectedPoints.length === 1) {
      if (selectedPoints[0].id === point.id) {
        alert("Cannot create edge between the same point");
        return;
      }
      setSelectedPoints([selectedPoints[0], point]);
      setShowEdgeForm(true);
    }
  };

  // Handle edge form input changes
  const handleEdgeFormChange = (e) => {
    const { name, value } = e.target;
    setEdgeForm((prev) => ({
      ...prev,
      [name]: name === "distance" || name === "time" ? parseInt(value) : value,
    }));
  };

  // Submit place/node form
  const handleFormSubmit = () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }

    const list = activeMode === "place" ? placesState : nodesState;
    const nextId = Math.max(...list.map((p) => p.id), 0) + 1;

    const newItem = {
      id: nextId,
      type: activeMode,
      name: formData.name,
      description: formData.description || "",
      floor: formData.floor || 0,
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
    };

    if (activeMode === "place") {
      const updated = [...placesState, newItem];
      setPlacesState(updated);
      localStorage.setItem(PLACES_KEY, JSON.stringify(updated, null, 2));
    } else {
      const updated = [...nodesState, newItem];
      setNodesState(updated);
      localStorage.setItem(NODES_KEY, JSON.stringify(updated, null, 2));
    }

    alert(`${activeMode.charAt(0).toUpperCase() + activeMode.slice(1)} added successfully!`);
    setShowForm(false);
    setFormData({});
  };

  const handleExportData = () => {
    const data = {
      places: placesState,
      nodes: nodesState,
      edges: edgesState,
    };

    const value = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(value).then(
      () => {
        alert("Exported data to clipboard. Paste it into your JSON file.");
      },
      (err) => {
        console.error(err);
        const fallback = window.prompt("Failed to write to clipboard. Copy this data manually:", value);
        if (fallback === null) {
          alert("Copy the JSON from the text box.");
        }
      }
    );
  };

  // Submit edge form
  const handleEdgeSubmit = () => {
    if (!edgeForm.distance || !edgeForm.direction || !edgeForm.instruction || edgeForm.time === undefined) {
      alert("All edge fields are required");
      return;
    }

    const nextId = Math.max(...edgesState.map((e) => e.id), 300) + 1;

    const newEdge = {
      id: nextId,
      from: selectedPoints[0].id,
      to: selectedPoints[1].id,
      distance: edgeForm.distance,
      direction: edgeForm.direction,
      instruction: edgeForm.instruction,
      time: edgeForm.time,
    };

    const updatedEdges = [...edgesState, newEdge];
    setEdgesState(updatedEdges);
    localStorage.setItem(EDGES_KEY, JSON.stringify(updatedEdges, null, 2));

    alert("Edge added successfully!");
    setShowEdgeForm(false);
    setEdgeForm({});
    setSelectedPoints([]);
    setActiveMode(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Control Panel */}
      <div
        style={{
          width: "320px",
          backgroundColor: "#1a1a1a",
          color: "#fff",
          padding: "20px",
          overflowY: "auto",
          borderRight: "2px solid #333",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Admin Panel</h2>

        {/* Mode Selection */}
        <div style={{ marginBottom: "20px" }}>
          <h3>Mode Selection</h3>
          <button
            onClick={() => {
              setActiveMode("place");
              setSelectedPoints([]);
            }}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "8px",
              backgroundColor: activeMode === "place" ? "#FF6B35" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ➕ Add Place
          </button>
          <button
            onClick={() => {
              setActiveMode("node");
              setSelectedPoints([]);
            }}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "8px",
              backgroundColor: activeMode === "node" ? "#FF6B35" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            • Add Node
          </button>
          <button
            onClick={() => {
              setActiveMode("edge");
              setSelectedPoints([]);
            }}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "8px",
              backgroundColor: activeMode === "edge" ? "#FF6B35" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ➝ Add Edge
          </button>
          <button
            onClick={() => {
              setActiveMode(null);
              setSelectedPoints([]);
            }}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#555",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ✕ Cancel
          </button>
        </div>

        {/* Active Mode Info */}
        {activeMode && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#2a2a2a",
              borderLeft: "4px solid #FF6B35",
              marginBottom: "20px",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Mode:</strong> {activeMode.charAt(0).toUpperCase() + activeMode.slice(1)}
            </p>
            {activeMode === "edge" && selectedPoints.length > 0 && (
              <p style={{ margin: "8px 0 0 0", fontSize: "12px" }}>
                Selected: {selectedPoints.map((p) => p.name).join(" → ")}
              </p>
            )}
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#aaa" }}>
              Click on map to {activeMode === "edge" ? "select 2 points" : "add"}
            </p>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #333" }}>
          <h3>Legend</h3>
          <div style={{ fontSize: "12px", color: "#aaa" }}>
            <p>🔴 Places (with info)</p>
            <p>⚫ Nodes (routing points)</p>
            <p>🟢 Edges (connections)</p>
          </div>
        </div>

        {/* Export */}
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={handleExportData}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#1c7ed6",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            📋 Export Data to Clipboard
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1 }}>
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={campusCenter}
            zoom={17}
            options={options}
            onClick={handleMapClick}
          >
            {/* Render Places */}
            {placesState.map((p) => (
              <Marker
                key={`place-${p.id}`}
                position={{ lat: p.lat, lng: p.lng }}
                title={p.name}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
                onClick={() => handlePointSelect(p)}
              />
            ))}

            {/* Render Nodes */}
            {nodesState.map((n) => (
              <Marker
                key={`node-${n.id}`}
                position={{ lat: n.lat, lng: n.lng }}
                title={n.name}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                }}
                onClick={() => handlePointSelect(n)}
              />
            ))}

            {/* Highlight selected points for edge creation */}
            {selectedPoints.map((p) => (
              <Marker
                key={`selected-${p.id}`}
                position={{ lat: p.lat, lng: p.lng }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
              />
            ))}

            {/* Draw line between selected points */}
            {selectedPoints.length === 2 && (
              <Polyline
                path={[
                  { lat: selectedPoints[0].lat, lng: selectedPoints[0].lng },
                  { lat: selectedPoints[1].lat, lng: selectedPoints[1].lng },
                ]}
                options={{
                  strokeColor: "#00ff00",
                  strokeWeight: 3,
                  strokeOpacity: 0.8,
                }}
              />
            )}

            {/* Existing edges from data */}
            {edgesState.map((edge) => {
              const fromPoint = allPlaceNodes.find((p) => p.id === edge.from);
              const toPoint = allPlaceNodes.find((p) => p.id === edge.to);
              if (!fromPoint || !toPoint) return null;

              return (
                <Polyline
                  key={`edge-${edge.id}`}
                  path={[{ lat: fromPoint.lat, lng: fromPoint.lng }, { lat: toPoint.lat, lng: toPoint.lng }]}
                  options={{
                    strokeColor: "#00ff00",
                    strokeWeight: 2,
                    strokeOpacity: 0.5,
                    icons: [
                      {
                        icon: {
                          path: window.google?.maps?.SymbolPath.FORWARD_CLOSED_ARROW,
                          scale: 2,
                          strokeColor: "#00ff00",
                        },
                        offset: "0%",
                        repeat: "40px",
                      },
                    ],
                  }}
                />
              );
            })}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Place/Node Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            padding: "30px",
            borderRadius: "8px",
            zIndex: 1000,
            minWidth: "400px",
            boxShadow: "0 0 20px rgba(0,0,0,0.8)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Add {activeMode === "place" ? "Place" : "Node"}
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleFormChange}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
              placeholder="Enter name"
            />
          </div>

          {activeMode === "place" && (
            <>
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleFormChange}
                  style={{
                    width: "100%",
                    padding: "8px",
                    backgroundColor: "#333",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Enter description"
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Floor</label>
            <input
              type="number"
              name="floor"
              value={formData.floor || 0}
              onChange={handleFormChange}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleFormSubmit}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#FF6B35",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#555",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edge Form Modal */}
      {showEdgeForm && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#1a1a1a",
            color: "#fff",
            padding: "30px",
            borderRadius: "8px",
            zIndex: 1000,
            minWidth: "400px",
            boxShadow: "0 0 20px rgba(0,0,0,0.8)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Add Edge: {selectedPoints[0]?.name} → {selectedPoints[1]?.name}
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Distance (meters) *</label>
            <input
              type="number"
              name="distance"
              value={edgeForm.distance || ""}
              onChange={handleEdgeFormChange}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
              placeholder="e.g., 15"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Direction *</label>
            <select
              name="direction"
              value={edgeForm.direction || ""}
              onChange={handleEdgeFormChange}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            >
              <option value="">Select direction</option>
              <option value="straight">Straight</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="stairs">Stairs</option>
              <option value="elevator">Elevator</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Instruction *</label>
            <input
              type="text"
              name="instruction"
              value={edgeForm.instruction || ""}
              onChange={handleEdgeFormChange}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
              placeholder="e.g., Go straight from gate"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Time (minutes) *</label>
            <input
              type="number"
              name="time"
              value={edgeForm.time || ""}
              onChange={handleEdgeFormChange}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
              placeholder="e.g., 2"
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleEdgeSubmit}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#FF6B35",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Save Edge
            </button>
            <button
              onClick={() => {
                setShowEdgeForm(false);
                setSelectedPoints([]);
              }}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#555",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Backdrop for modals */}
      {(showForm || showEdgeForm) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
          onClick={() => {
            setShowForm(false);
            setShowEdgeForm(false);
          }}
        />
      )}
    </div>
  );
}
