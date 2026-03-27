import { useState } from "react";

export default function LeftMenu({
  places = [],
  start,
  end,
  setStart,
  setEnd,
  onSwap,
  onReset,
  instructions = [],
  totalDistance = 0,
  totalTime = 0,
}) {
  const handleStartChange = (e) => {
    const val = e.target.value;
    if (!val) setStart(null);
    else setStart(places.find((p) => String(p.id) === val));
  };

  const handleEndChange = (e) => {
    const val = e.target.value;
    if (!val) setEnd(null);
    else setEnd(places.find((p) => String(p.id) === val));
  };

  return (
    <aside className="w-full h-full flex flex-col bg-gray-900 shadow-2xl z-10 font-sans border-r border-gray-800">
      
      {/* --- Header --- */}
      <div className="bg-gray-800 text-gray-100 p-6 shadow-md relative z-20 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-wide text-blue-400">Campus Navigation</h1>
        <p className="text-xs text-gray-400 mt-1.5 font-medium">
          Select start and destination to find your route.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* --- Selection Form --- */}
        <div className="bg-gray-800 p-6 border-b border-gray-700 shadow-sm relative z-10">
          
          <div className="space-y-5">
            
            {/* Start */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 pl-1">
                Start Location
              </label>
              <select
                className="w-full bg-gray-900 border-2 border-gray-700 hover:border-blue-500 focus:border-blue-500 rounded-lg px-2 py-2 text-xs text-gray-200 outline-none transition-all cursor-pointer font-semibold shadow-sm"
                value={start ? start.id : ""}
                onChange={handleStartChange}
              >
                <option value="">-- Choose start point --</option>
                {places.map((p) => (
                  <option key={`start-${p.id}`} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-3 relative z-10">
               <button
                 onClick={onSwap}
                 className="bg-gray-700 hover:bg-gray-600 p-2.5 rounded-full border border-gray-600 text-blue-400 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                 title="Swap Locations"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
               </button>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 pl-1">
                Destination
              </label>
              <select
                className="w-full bg-gray-900 border-2 border-gray-700 hover:border-blue-500 focus:border-blue-500 rounded-lg px-2 py-2 text-xs text-gray-200 outline-none transition-all cursor-pointer font-semibold shadow-sm"
                value={end ? end.id : ""}
                onChange={handleEndChange}
              >
                <option value="">-- Choose destination --</option>
                {places.map((p) => (
                  <option key={`end-${p.id}`} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Action Button: Clear */}
          <div className="mt-6 flex justify-end">
            <button
               onClick={onReset}
               className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-md text-xs font-bold border border-gray-600 transition-colors shadow-sm w-full sm:w-auto"
               title="Clear Route"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Clear Map
            </button>
          </div>
        </div>

        {/* --- Path Summary & Guide --- */}
        <div className="p-6">
          {instructions && instructions.length > 0 ? (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-lg font-extrabold text-gray-100 mb-4">Route Information</h2>
              
              {/* Distance and Time Cards */}
              <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-sm flex flex-col items-center justify-center">
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Distance</span>
                  <div className="text-2xl font-black text-blue-400">
                    {totalDistance}<span className="text-xs font-bold text-gray-500 ml-1">m</span>
                  </div>
                </div>
                <div className="flex-1 bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-sm flex flex-col items-center justify-center">
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-1">Est. Time</span>
                  <div className="text-2xl font-black text-blue-400">
                    {totalTime}<span className="text-xs font-bold text-gray-500 ml-1">min</span>
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn List */}
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">Turn-by-turn Directions</h3>
              <div className="space-y-4">
                {instructions.map((step, i) => (
                  <div key={i} className="bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-sm flex gap-4 items-start">
                    <div className="bg-blue-900/50 text-blue-400 shadow-inner w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 border border-blue-800/50">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-gray-200 leading-snug">
                        {step.from} <span className="text-gray-500 font-normal mx-1">→</span> {step.to}
                      </div>
                      {step.instruction && (
                        <div className="mt-1.5 text-xs font-medium text-gray-400 bg-gray-900/50 p-2 rounded-lg border border-gray-700 flex items-start gap-1.5">
                           <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           <span>{step.instruction}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Final Destination Arrival */}
                <div className="bg-blue-600 p-5 rounded-2xl shadow-md mt-6 border border-blue-500">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div className="text-base font-bold text-white">
                      Arrive at {end?.name || "Destination"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center py-16 px-6 animate-in fade-in duration-500">
               <div className="bg-gray-800 shadow-sm w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-600 border border-gray-700">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
               </div>
               <h3 className="text-xl font-bold text-gray-300 mb-3">Ready to Navigate</h3>
               <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-[250px] mx-auto">
                 Use the dropdown menus above to select your starting point and destination.
               </p>
             </div>
          )}
        </div>
      </div>
    </aside>
  );
}