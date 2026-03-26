import { useState } from "react";

function LeftMenu({
  places = [],
  start,
  end,
  setStart,
  setEnd,
  path = [],
  onSwap,
  onReset,
  onUseCurrent,
  instructions = [],
  totalDistance = 0,
  totalTime = 0,
}) {

  const [selectedPlace, setSelectedPlace] = useState(null);

  return (

    <aside className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-lg shadow-black/30">
      <div className="p-3 font-bold border-b border-gray-700 bg-black">
        Campus Map
      </div>


      <div className="p-3 space-y-4">

        {/* ---------------- DIRECTIONS ---------------- */}

        <section className="bg-gray-800 rounded-xl p-3 border border-gray-700">

          <h2 className="font-semibold mb-2">
            Directions
          </h2>

          <div className="text-xs mb-2">

            <div>
              Start:
              <span className="text-green-400 ml-1">
                {start?.name || "—"}
              </span>
            </div>

            <div>
              End:
              <span className="text-red-400 ml-1">
                {end?.name || "—"}
              </span>
            </div>

          </div>


          {/* buttons */}

          <div className="flex gap-2 mb-2">

            <button
              onClick={() => {
                setStart(null);
                setEnd(null);
              }}
              className="flex-1 bg-gray-700 p-2 rounded text-xs"
            >
              Pick
            </button>

            <button
              onClick={onSwap}
              className="flex-1 bg-gray-700 p-2 rounded text-xs"
            >
              Swap
            </button>

            <button
              onClick={onReset}
              className="flex-1 bg-gray-700 p-2 rounded text-xs"
            >
              Reset
            </button>

          </div>


          <button
            onClick={onUseCurrent}
            className="w-full bg-blue-700 p-2 rounded text-xs"
          >
            Use Current Location
          </button>

        </section>

        {/* TOTAL */}

        {instructions.length > 0 && (

          <div className="bg-gray-900 p-2 rounded mb-3 text-xs">

            <div>
              Distance:
              <span className="text-green-400 ml-1">
                {totalDistance} m
              </span>
            </div>

            <div>
              Time:
              <span className="text-yellow-400 ml-1">
                {totalTime} min
              </span>
            </div>

          </div>

        )}

        {/* ---------------- PLACE LIST ---------------- */}

        <section className="bg-gray-800 rounded-xl p-3 border border-gray-700">

          <h2 className="font-semibold mb-2">
            Places
          </h2>

          <div className="grid grid-cols-2 gap-1">

            {places.map((p) => (

              <button
                key={p.id}
                onClick={() => {

                  setSelectedPlace(p.id);

                  if (!start) setStart(p);
                  else if (!end) setEnd(p);

                }}
                className="text-xs bg-gray-700 rounded px-2 py-1 hover:bg-gray-600 text-left"
              >
                {p.name}
              </button>

            ))}

          </div>

        </section>



        {/* ---------------- ROUTE ---------------- */}

        <section className="bg-gray-800 rounded-xl p-3 border border-gray-700">

          <h2 className="font-semibold mb-2">
            Route
          </h2>

          {instructions.length === 0 && (
            <div className="text-gray-400 text-xs">
              No route selected
            </div>
          )}

          {instructions.map((s, i) => (

            <div
              key={i}
              className="bg-gray-700 p-2 rounded mb-2"
            >

              <div className="text-xs text-blue-400">
                Step {i + 1}
              </div>

              <div className="text-sm">
                {s.from} → {s.to}
              </div>

              {s.instruction && (
                <div className="text-xs text-gray-400">
                  {s.instruction}
                </div>
              )}

            </div>

          ))}

        </section>



        {/* ---------------- NOTES ---------------- */}

        <section className="bg-gray-800 rounded-xl p-3 border border-gray-700">

          <h2 className="font-semibold mb-2">
            Notes
          </h2>

          <ul className="text-xs text-gray-300 list-disc pl-4">

            <li>Select start & destination</li>
            <li>Shortest path using Dijkstra</li>
            <li>Swap to reverse</li>
            <li>Reset to clear</li>

          </ul>

        </section>


      </div>

    </aside>

  );

}

export default LeftMenu;