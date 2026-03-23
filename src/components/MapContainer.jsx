import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
  InfoWindow,
} from "@react-google-maps/api";

import { campusCenter, campusBounds } from "../config/mapBounds";
import { useState, useEffect } from "react";

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

// Lightweight SVG human figure icon
const humanIcon = {
  path: "M0,-24 C-5.5,-24 -10,-19.5 -10,-14 C-10,-8.5 -5.5,-4 0,-4 C5.5,-4 10,-8.5 10,-14 C10,-19.5 5.5,-24 0,-24 Z M-8,0 L-12,16 L-4,16 L-4,28 L4,28 L4,16 L12,16 L8,0 Z",
  fillColor: "#FF6B35",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 1.5,
  scale: 1.2,
};

export default function MapContainer({
  places = [],
  nodes = [],
  start,
  end,
  setStart,
  setEnd,
  pathCoords = [],
  adminMode = false,
  onMapClick,
}) {
  const [animatedPosition, setAnimatedPosition] = useState(null);
  const [direction, setDirection] = useState(0); // Track direction for rotation
  const [showPath, setShowPath] = useState(false); // Track if path should be shown
  const [selectedPlace, setSelectedPlace] = useState(null); // Track which place info is shown

  // Animate marker along path
  useEffect(() => {
    if (pathCoords.length < 2) {
      setAnimatedPosition(null);
      setDirection(0);
      setShowPath(false);
      return;
    }

    setShowPath(true);

    let animationFrame;
    let progress = 0;
    const duration = 8000; // 8 seconds for full animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = (elapsed % duration) / duration;

      // Calculate position along path
      const totalDistance = pathCoords.length - 1;
      const currentSegment = progress * totalDistance;
      const segmentIndex = Math.floor(currentSegment);
      const segmentProgress = currentSegment - segmentIndex;

      if (segmentIndex < pathCoords.length - 1) {
        const current = pathCoords[segmentIndex];
        const next = pathCoords[segmentIndex + 1];

        const lat = current.lat + (next.lat - current.lat) * segmentProgress;
        const lng = current.lng + (next.lng - current.lng) * segmentProgress;

        // Calculate direction angle
        const dLat = next.lat - current.lat;
        const dLng = next.lng - current.lng;
        const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
        setDirection(angle);

        setAnimatedPosition({ lat, lng });
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [pathCoords]);

  const handleMarkerClick = (place) => {
    if (adminMode) return;

    if (!start) {
      setStart(place);
    } else if (!end) {
      setEnd(place);
    }
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAP_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={campusCenter}
        zoom={17}
        options={options}
        onClick={(e) => {
          if (!adminMode) return;

          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          if (onMapClick) {
            onMapClick(lat, lng);
          }
        }}
      >
        {/* ---------- PLACES ---------- */}

        {places.map((p) => (
            <div key={p.id}>
                <Marker
                    position={{ lat: p.lat, lng: p.lng }}
                    title={p.name}
                    onClick={() => {
                        setSelectedPlace(p.id);
                        if (adminMode && onMarkerClick) {
                            onMarkerClick(p.id);
                        } else {
                            handleMarkerClick(p);
                        }
                    }}
                />
                {selectedPlace === p.id && (
                  <InfoWindow
                    position={{ lat: p.lat, lng: p.lng }}
                    onCloseClick={() => setSelectedPlace(null)}
                  >
                    <div className="bg-gray-800 text-white p-3 rounded shadow-lg" style={{ maxWidth: '200px' }}>
                      <h3 className="font-bold text-blue-400 mb-2">{p.name}</h3>
                      {p.description && (
                        <p className="text-sm text-gray-300 mb-2">
                          📍 {p.description}
                        </p>
                      )}
                      {p.floor !== undefined && (
                        <p className="text-sm text-gray-400">
                          🏢 Floor {p.floor}
                        </p>
                      )}
                    </div>
                  </InfoWindow>
                )}
            </div>
        ))}

        {/* ---------- NODES (only visible when path OR admin) ---------- */}

        {(adminMode || showPath) &&
            nodes.map((n) => (
                <Marker
                    key={n.id}
                    position={{ lat: n.lat, lng: n.lng }}
                    onClick={() => {
                    if (adminMode && onMarkerClick) {
                        onMarkerClick(n.id);
                    }
                    }}
                />
            ))
        }

        {/* ---------- START MARKER ---------- */}

        {start && (
          <Marker
            position={{ lat: start.lat, lng: start.lng }}
            title="Start"
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
          />
        )}

        {/* ---------- END MARKER ---------- */}

        {end && (
          <Marker
            position={{ lat: end.lat, lng: end.lng }}
            title="End"
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            }}
          />
        )} 

        {/* ---------- PATH LINE ---------- */}

        {showPath && pathCoords && pathCoords.length > 1 && (
          <Polyline
            key={`path-${Date.now()}`}
            path={pathCoords}
            options={{
              strokeColor: "#00ff00",
              strokeWeight: 5,
              icons: [
                {
                  icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 3,
                    strokeColor: "#00ff00",
                    fillColor: "#004cff",
                    fillOpacity: 1,
                  },
                  offset: "0%",
                  repeat: "40px",
                },
              ],
            }}
          />
        )}

        {/* ---------- PATH POINTS ---------- */}

        {showPath && pathCoords.map((p, i) => (
          <Marker
            key={"path" + i}
            position={{ lat: p.lat, lng: p.lng }}
            icon={{
              url:
                "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
          />
        ))}

        {/* ---------- ANIMATED MARKER ---------- */}

        {animatedPosition && (
          <Marker
            position={animatedPosition}
            title="Navigation"
            icon={{
              ...humanIcon,
              rotation: direction,
            }}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
}