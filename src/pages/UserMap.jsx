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
    };

    const onUseCurrent = () => {
    alert("current location later");
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