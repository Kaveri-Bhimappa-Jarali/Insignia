import { useState , useEffect } from "react";

import { pathToCoords, pathToNames, pathToInstructions, } from "../graph/pathUtils";
import MapContainer from "../components/MapContainer";
import LeftMenu from "../components/LeftMenu";

import { buildGraph } from "../graph/buildGraph";
import { dijkstra } from "../graph/dijkstra";

import placesData from "../data/places.json";
import nodesData from "../data/nodes.json";
import edgesData from "../data/edges.json";

export default function UserMap() {

    const [places] = useState(placesData);
    const [nodes] = useState(nodesData);
    const [edges] = useState(edgesData);

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    const [path, setPath] = useState([]);

    const [pathCoords, setPathCoords] = useState([]);
    const [pathNames, setPathNames] = useState([]);

    const [instructions, setInstructions] = useState([]);

    const onSwap = () => {
    setStart(end);
    setEnd(start);
    };

    const onReset = () => {
        setStart(null);
        setEnd(null);
        setPath([]);
        setPathCoords([]);
        setPathNames([]);
        setInstructions([]);
    };

    const onUseCurrent = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Combine places and nodes for searching
                const allLocations = [...places, ...nodes];

                let closest = null;
                let minDist = Infinity;

                allLocations.forEach((loc) => {
                    // Simple Euclidean distance (suitable for small campus area)
                    const dist = Math.sqrt(
                        Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        closest = loc;
                    }
                });

                if (closest) {
                    setStart(closest);
                } else {
                    alert("No nearby location found in the campus data.");
                }
            },
            (error) => {
                let errorMessage = "Error getting location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied by user.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                }
                alert(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes
            }
        );
    };

    useEffect(() => {
        if (!start || !end) return;

        const graph = buildGraph(places, nodes, edges);

        const result = dijkstra(
            graph,
            start.id,
            end.id
        );

        setPath(result);

        setPathCoords(
            pathToCoords(result, places, nodes)
        );

        setPathNames(
            pathToNames(result, places, nodes)
        );

        setInstructions(
            pathToInstructions(
            result,
            edges,
            places,
            nodes
            )
        );

    }, [start, end]);

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row">

        <LeftMenu
            places={places}
            start={start}
            end={end}
            setStart={setStart}
            setEnd={setEnd}
            path={pathNames}
            instructions={instructions}
            onSwap={onSwap}
            onReset={onReset}
            onUseCurrent={onUseCurrent}
        />

        <div className="flex-1 h-full">

            <MapContainer
                places={places}
                nodes={nodes}
                start={start}
                end={end}
                setStart={setStart}
                setEnd={setEnd}
                pathCoords={pathCoords}
            />

        </div>

        </div>
    );
}