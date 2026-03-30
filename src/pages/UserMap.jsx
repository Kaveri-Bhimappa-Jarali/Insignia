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
    // const [edges] = useState(edgesData);
    const [edges, setEdges] = useState([]);

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    const [pathCoords, setPathCoords] = useState([]);
    const [pathNames, setPathNames] = useState([]);

    const [instructions, setInstructions] = useState([]);
    const [totalDistance, setTotalDistance] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [renderKey, setRenderKey] = useState(0); // Force polyline complete remount
    const [hasValidPath, setHasValidPath] = useState(false); // Track if path is calculated

    const onSwap = () => {
    setStart(end);
    setEnd(start);
    };

    const onReset = () => {
        setStart(null);
        setEnd(null);
        setPathCoords([]);
        setPathNames([]);
        setInstructions([]);
        setHasValidPath(false);
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

    const totalCalculate = (path, edges) => {

        let dist = 0;
        let time = 0;

        if (!path || path.length < 2) {
            setTotalDistance(0);
            setTotalTime(0);
            return;
        }

        for (let i = 0; i < path.length - 1; i++) {

            const a = Number(path[i]);
            const b = Number(path[i + 1]);

            const edge = edges.find(
                e =>
                    (Number(e.from) === a && Number(e.to) === b) ||
                    (Number(e.from) === b && Number(e.to) === a)
            );

            if (edge) {

                dist += Number(edge.distance || 0);
                time += Number(edge.time || 0);

            }

        }

        setTotalDistance(dist);
        setTotalTime(time);

    };

    useEffect(() => {
        setEdges(edgesData);
    }, []);

    // Clear and recalculate path when start or end changes
    useEffect(() => {
        // Step 1: Immediately clear ALL path data and set hasValidPath to false
        setPathCoords([]);
        setPathNames([]);
        setInstructions([]);
        setTotalDistance(0);
        setTotalTime(0);
        setHasValidPath(false); // Mark path as invalid
        
        // Increment render key to force polyline complete unmount
        setRenderKey(prev => prev + 1);
        
        // Step 2: If both start and end exist, calculate new path
        if (!start || !end) return;

        // Use a setTimeout to allow the clearing to fully render before calculating new path
        const timer = setTimeout(() => {
            console.log("START", start.id);
            console.log("END", end.id);
            console.log("EDGES", edges);
            
            const graph = buildGraph(places, nodes, edges);
            const result = dijkstra(graph, start.id, end.id);

            setPathCoords(pathToCoords(result, places, nodes));
            setPathNames(pathToNames(result, places, nodes));
            setInstructions(pathToInstructions(result, edges, places, nodes));
            totalCalculate(result, edges);
            setHasValidPath(true); // Mark path as valid once calculated
        }, 100); // Increased delay to ensure clear renders

        return () => clearTimeout(timer);

    }, [start, end, edges, places, nodes]);

    return (

        <div className="h-screen w-screen bg-[#020617] text-white flex flex-col">

            {/* HEADER */}

            <div className="p-4 border-b border-gray-800 shrink-0">

            <h1 className="text-2xl font-bold">
                SDMCET Campus Map
            </h1>

            <p className="text-sm text-gray-400">
                Tap a pin to select start and destination locations.
            </p>

            </div>



            {/* MAIN AREA */}

            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">


            {/* MAP */}

            <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden">

                <MapContainer
                places={places}
                nodes={nodes}
                start={start}
                end={end}
                setStart={setStart}
                setEnd={setEnd}
                pathCoords={pathCoords}
                renderKey={renderKey}
                hasValidPath={hasValidPath}
                />

            </div>



            {/* RIGHT PANEL DESKTOP */}

            <div className="hidden lg:flex w-[260px] flex-col overflow-hidden">

                <div className="flex-1 overflow-y-auto">

                {/* <LeftMenu
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
                /> */}
                <LeftMenu
                    places={places}
                    start={start}
                    end={end}
                    setStart={setStart}
                    setEnd={setEnd}
                    path={pathNames}
                    instructions={instructions}
                    totalDistance={totalDistance}
                    totalTime={totalTime}
                    onSwap={onSwap}
                    onReset={onReset}
                    onUseCurrent={onUseCurrent}
                />

                </div>

            </div>


            </div>



            {/* MOBILE PANEL */}

            <div className="lg:hidden h-72 border-t border-gray-800 overflow-y-auto">

            <LeftMenu
                places={places}
                start={start}
                end={end}
                setStart={setStart}
                setEnd={setEnd}
                path={pathNames}
                instructions={instructions}
                totalDistance={totalDistance}
                totalTime={totalTime}
                onSwap={onSwap}
                onReset={onReset}
                onUseCurrent={onUseCurrent}
            />

            </div>

        </div>

    );
}
