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
            <Marker
                key={p.id}
                position={{ lat: p.lat, lng: p.lng }}
                onClick={() => {
                if (adminMode && onMarkerClick) {
                    onMarkerClick(p.id);
                } else {
                    handleMarkerClick(p);
                }
                }}
            />
        ))}

        {/* ---------- NODES (only visible when path OR admin) ---------- */}

        {(adminMode || pathCoords.length > 0) &&
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

        {pathCoords.length > 1 && (
          <Polyline
            path={pathCoords}
            options={{
              strokeColor: "#00ff00",
              strokeWeight: 5,
            }}
          />
        )}

        {/* ---------- PATH POINTS ---------- */}

        {pathCoords.map((p, i) => (
          <Marker
            key={"path" + i}
            position={{ lat: p.lat, lng: p.lng }}
            icon={{
              url:
                "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}