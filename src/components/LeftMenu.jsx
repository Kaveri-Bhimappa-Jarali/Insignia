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
}) {
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");

  return (
    <div className="w-full md:w-80 h-64 md:h-full bg-gray-900 border-r border-gray-700 flex flex-col text-white">

      <div className="p-3 font-bold border-b border-gray-700 bg-black text-white">
        Campus Map
      </div>

      {/* INPUT AREA */}
      <div className="p-2 flex flex-col gap-2">

        <input
          type="text"
          placeholder="Start location"
          value={start?.name || startText}
          onChange={(e) => setStartText(e.target.value)}
          className="border border-gray-600 bg-gray-800 text-white p-2 rounded"
        />

        {/* DEST */}
        <input
          type="text"
          placeholder="Destination"
          value={end?.name || endText}
          onChange={(e) => setEndText(e.target.value)}
          className="border border-gray-600 bg-gray-800 text-white p-2 rounded"
        />

        <div className="flex gap-2">

          <button
            onClick={onSwap}
            className="bg-blue-700 text-white p-2 rounded hover:bg-blue-600"
          >
            Swap
          </button>

          <button
            onClick={onReset}
            className="bg-blue-700 text-white p-2 rounded hover:bg-blue-600"
          >
            Reset
          </button>

        </div>

        <button
          onClick={onUseCurrent}
          className="bg-blue-700 text-white p-2 rounded hover:bg-blue-600"
        >
          Use Current Location
        </button>

      </div>

      <div className="flex-1 overflow-auto border-t border-gray-700">

        <div className="p-2 font-semibold text-white">
          Places
        </div>

        {places.length === 0 && (
          <div className="p-2 text-gray-400">
            No places added
          </div>
        )}

        {places.map((p) => (
          <div
            key={p.id}
            className="p-2 border-b border-gray-600 cursor-pointer hover:bg-gray-700 text-white"
            onClick={() => {
              if (!start) setStart(p);
              else if (!end) setEnd(p);
            }}
          >
            {p.name}
          </div>
        ))}

      </div>

      {/* PATH DESCRIPTION */}

        <div className="h-40 border-t border-gray-700 p-2 text-sm overflow-auto bg-gray-800">

            <div className="font-semibold text-white">
                Route
            </div>

            {instructions.length === 0 && (
                <div className="text-gray-400">
                No route
                </div>
            )}

            {instructions.map((s, i) => (
                <div key={i} className="mb-1 text-white">

                {s.from} → {s.to}

                {s.instruction && (
                    <div className="text-xs text-gray-400">
                    {s.instruction}
                    </div>
                )}

                </div>
            ))}

        </div>

    </div>
  );
}

export default LeftMenu;