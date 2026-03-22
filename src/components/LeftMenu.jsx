import { useState } from "react";

export default function LeftMenu({
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
    <div className="w-full md:w-80 h-64 md:h-full bg-gray-100 border-r flex flex-col">

      {/* HEADER */}
      <div className="p-3 font-bold border-b bg-white">
        Campus Map
      </div>

      {/* INPUT AREA */}
      <div className="p-2 flex flex-col gap-2">

        {/* START */}
        <input
          type="text"
          placeholder="Start location"
          value={start?.name || startText}
          onChange={(e) => setStartText(e.target.value)}
          className="border p-2 rounded"
        />

        {/* DEST */}
        <input
          type="text"
          placeholder="Destination"
          value={end?.name || endText}
          onChange={(e) => setEndText(e.target.value)}
          className="border p-2 rounded"
        />

        {/* BUTTONS */}
        <div className="flex gap-2">

          <button
            onClick={onSwap}
            className="bg-blue-600 text-white p-2 rounded"
          >
            Swap
          </button>

          <button
            onClick={onReset}
            className="bg-blue-600 text-white p-2 rounded"
          >
            Reset
          </button>

        </div>

        <button
          onClick={onUseCurrent}
          className="bg-blue-600 text-white p-2 rounded"
        >
          Use Current Location
        </button>

      </div>

      {/* PLACES LIST */}

      <div className="flex-1 overflow-auto border-t">

        <div className="p-2 font-semibold">
          Places
        </div>

        {places.length === 0 && (
          <div className="p-2 text-gray-500">
            No places added
          </div>
        )}

        {places.map((p) => (
          <div
            key={p.id}
            className="p-2 border-b cursor-pointer hover:bg-gray-100"
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

        <div className="h-40 border-t p-2 text-sm overflow-auto">

            <div className="font-semibold">
                Route
            </div>

            {instructions.length === 0 && (
                <div className="text-gray-500">
                No route
                </div>
            )}

            {instructions.map((s, i) => (
                <div key={i} className="mb-1">

                {s.from} → {s.to}

                {s.instruction && (
                    <div className="text-xs text-gray-500">
                    {s.instruction}
                    </div>
                )}

                </div>
            ))}

        </div>

    </div>
  );
}