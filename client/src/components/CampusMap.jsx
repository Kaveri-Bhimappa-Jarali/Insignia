import React, { useEffect, useMemo, useRef, useState } from "react";
import campusMap from "../assets/campus-map.jpg";
import nodes from "./nodes";
import graph from "./graph";

// `campus-map.jpg` is ~600x456 (not 16:9). Keep our coordinate system aligned to it.
const MAP_W = 600;
const MAP_H = 456;
const toPct = (x, y) => ({ xPct: (x / MAP_W) * 100, yPct: (y / MAP_H) * 100 });

function floorBadgeFromDetails(details) {
  if (!details?.floors?.length) return null;
  const text = details.floors.join(" ").toLowerCase();
  if (text.includes("ground floor")) return "G";
  if (text.includes("first floor")) return "1F";
  if (text.includes("second floor")) return "2F";
  return null;
}

const NODE_LABELS = {
  MainEntrance: "Main Entrance",
  AcademicArea: "Academic Area",
  AuditoriumAdminCSE: "Admin / Auditorium / CSE",
  AdministrativeBlock: "Administrative Block",
  CSEBlock: "CSE Block",
  ISEBlock: "ISE Block",
  LibraryMBA: "Library",
  CivilBlock: "Civil Block",
  PhysicsChemistryBlock: "Physics / Chemistry Block",
  MechanicalBlock: "Mechanical Block",
  Temple: "Temple",
  BankPostOffice: "Bank / Post Office",
  CanteenSIC: "Canteen / SIC",
  DiningRecreation: "Dining / Recreation",
  BoysHostels: "Boys Hostel",
  GirlsHostels: "Girls Hostel",
  Playground: "Playground",
  IndoorSports: "Indoor Sports",
  STP: "STP",
};

// Floor / department legend (from the image you provided)
const PLACE_DETAILS = {
  cse: {
    title: "Computer Science Engineering (CSE)",
    locationHint: "CSE block",
    floors: ["Second Floor – Computer Science Engineering"],
  },
  ise: {
    title: "Information Science Engineering (ISE)",
    locationHint: "ISE block",
    floors: ["Second Floor – Information Science Engineering"],
  },
  aiml: {
    title: "AI & ML (AIML)",
    locationHint: "Near Mechanical block",
    floors: ["(Floor as per campus: update if needed)"],
  },
  admin: {
    title: "Administrative Block",
    locationHint: "Admin / Auditorium block",
    floors: ["First Floor – Administrative Block"],
  },
  library: {
    title: "Library",
    locationHint: "CCCF / Library / MBA block",
    floors: ["First Floor – Library"],
  },
  civil: {
    title: "Civil Engineering",
    locationHint: "Civil / Physics-Chemistry / Chemical block",
    floors: ["Ground Floor – Civil Engineering"],
  },
  chemical: {
    title: "Chemical Engineering",
    locationHint: "Shown under blocks that list Chemical Engineering",
    floors: ["Second Floor – Chemical Engineering"],
  },
  mechanical: {
    title: "Mechanical Department",
    locationHint: "Mechanical block",
    floors: ["Mechanical Department (floor not specified in legend)"],
  },
  boys: { title: "Boys Hostel", locationHint: "Hostels zone", floors: [] },
  girls: { title: "Girls Hostel", locationHint: "Hostels zone", floors: [] },
  playground: { title: "Playground", locationHint: "Sports zone", floors: [] },
  indoor: { title: "Indoor Sports", locationHint: "Sports complex area", floors: [] },
  temple: { title: "Temple", locationHint: "Near the top/north side", floors: [] },
  "main-entrance": { title: "Main Entrance", locationHint: "Entry point to campus", floors: [] },
};

function bfs(start, end, g) {
  if (!start || !end) return [];
  const queue = [[start]];
  const visited = new Set();
  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];
    if (node === end) return path;
    if (visited.has(node)) continue;
    visited.add(node);
    for (const next of g[node] || []) queue.push([...path, next]);
  }
  return [];
}

function routeDistanceMeters(route) {
  if (!route || route.length < 2) return 0;
  let px = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = nodes[route[i]];
    const b = nodes[route[i + 1]];
    if (!a || !b) continue;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    px += Math.sqrt(dx * dx + dy * dy);
  }
  // Rough on-map conversion: ~0.35 meters per pixel (tune later if needed).
  return px * 0.35;
}

function pointsToSmoothSvgPath(points) {
  if (!points?.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  // Quadratic smoothing using midpoints.
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const parts = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length - 1; i++) {
    const m = mid(points[i], points[i + 1]);
    parts.push(`Q ${points[i].x} ${points[i].y} ${m.x} ${m.y}`);
  }
  const last = points[points.length - 1];
  parts.push(`T ${last.x} ${last.y}`);
  return parts.join(" ");
}

// Map requested labels → existing routing nodes (from `nodes.js` + `graph.js`).
// NOTE: ISE/AIML don’t exist as separate nodes in your graph, so they’re placed near the Admin/CSE
// cluster visually, but route via the same `AuditoriumAdminCSE` node.
const BASE_PINS = [
  {
    id: "cse",
    label: "CSE",
    group: "Departments",
    nodeKey: "CSEBlock",
    ...toPct(nodes.CSEBlock.x, nodes.CSEBlock.y),
  },
  {
    id: "ise",
    label: "ISE",
    group: "Departments",
    nodeKey: "ISEBlock",
    // Place slightly away from CSE so the route is visually clear (and easy to tap).
    ...toPct(nodes.ISEBlock.x, nodes.ISEBlock.y),
  },
  {
    id: "aiml",
    label: "AIML",
    group: "Departments",
    nodeKey: "MechanicalBlock",
    ...toPct(nodes.MechanicalBlock.x + 15, nodes.MechanicalBlock.y + 12),
  },
  {
    id: "mechanical",
    label: "Mechanical",
    group: "Departments",
    nodeKey: "MechanicalBlock",
    ...toPct(nodes.MechanicalBlock.x, nodes.MechanicalBlock.y),
  },
  {
    id: "civil",
    label: "Civil",
    group: "Departments",
    nodeKey: "CivilBlock",
    ...toPct(nodes.CivilBlock.x, nodes.CivilBlock.y),
  },
  {
    id: "chemical",
    label: "Chemical",
    group: "Departments",
    nodeKey: "PhysicsChemistryBlock",
    ...toPct(nodes.PhysicsChemistryBlock.x, nodes.PhysicsChemistryBlock.y),
  },
  {
    id: "library",
    label: "Library",
    group: "Campus",
    nodeKey: "LibraryMBA",
    ...toPct(nodes.LibraryMBA.x, nodes.LibraryMBA.y),
  },
  {
    id: "temple",
    label: "Temple",
    group: "Campus",
    nodeKey: "Temple",
    ...toPct(nodes.Temple.x, nodes.Temple.y),
  },
  {
    id: "admin",
    label: "Administrative",
    group: "Campus",
    nodeKey: "AdministrativeBlock",
    ...toPct(nodes.AdministrativeBlock.x, nodes.AdministrativeBlock.y),
  },
  {
    id: "boys",
    label: "Boys Hostel",
    group: "Hostels",
    nodeKey: "BoysHostels",
    ...toPct(nodes.BoysHostels.x, nodes.BoysHostels.y),
  },
  {
    id: "girls",
    label: "Girls Hostel",
    group: "Hostels",
    nodeKey: "GirlsHostels",
    ...toPct(nodes.GirlsHostels.x, nodes.GirlsHostels.y),
  },
  {
    id: "playground",
    label: "Playground",
    group: "Sports",
    nodeKey: "Playground",
    ...toPct(nodes.Playground.x, nodes.Playground.y),
  },
  {
    id: "indoor",
    label: "Indoor Sports",
    group: "Sports",
    nodeKey: "IndoorSports",
    ...toPct(nodes.IndoorSports.x, nodes.IndoorSports.y),
  },
  {
    id: "main-entrance",
    label: "Main Entrance",
    group: "Campus",
    nodeKey: "MainEntrance",
    ...toPct(nodes.MainEntrance.x, nodes.MainEntrance.y),
  },
];

function PinIcon({ tone = "default" }) {
  const cls =
    tone === "start"
      ? "text-emerald-500"
      : tone === "end"
        ? "text-amber-500"
        : tone === "selected"
          ? "text-indigo-500"
          : "text-red-600";
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["h-6 w-6 drop-shadow", cls].join(" ")}
      fill="currentColor"
    >
      <path d="M12 2c-3.86 0-7 3.14-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export default function CampusMap() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [startId, setStartId] = useState(null);
  const [endId, setEndId] = useState(null);
  const [pickMode, setPickMode] = useState("end"); // "start" | "end"
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [picker, setPicker] = useState(null); // { x, y, candidates: [{id,label}] }
  const mapRef = useRef(null);
  const [pinOverrides, setPinOverrides] = useState(() => {
    try {
      const raw = localStorage.getItem("campusPinOverrides:v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const exportOverridesJson = () => {
    const payload = JSON.stringify(pinOverrides, null, 2);
    try {
      navigator.clipboard?.writeText?.(payload);
    } catch {
      // ignore
    }
    return payload;
  };

  useEffect(() => {
    try {
      localStorage.setItem("campusPinOverrides:v1", JSON.stringify(pinOverrides));
    } catch {
      // ignore
    }
  }, [pinOverrides]);

  const pins = useMemo(() => {
    return BASE_PINS.map((p) => {
      const o = pinOverrides?.[p.id];
      if (!o) return p;
      const xPct = typeof o.xPct === "number" ? o.xPct : p.xPct;
      const yPct = typeof o.yPct === "number" ? o.yPct : p.yPct;
      return { ...p, xPct, yPct };
    });
  }, [pinOverrides]);

  const visiblePins = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pins;
    return pins.filter((p) => p.label.toLowerCase().includes(q));
  }, [query, pins]);

  const selected = useMemo(
    () => pins.find((p) => p.id === selectedId) || null,
    [pins, selectedId]
  );

  const startPin = useMemo(() => pins.find((p) => p.id === startId) || null, [pins, startId]);
  const endPin = useMemo(() => pins.find((p) => p.id === endId) || null, [pins, endId]);

  const route = useMemo(() => {
    if (!startPin?.nodeKey || !endPin?.nodeKey) return [];
    return bfs(startPin.nodeKey, endPin.nodeKey, graph);
  }, [startPin?.nodeKey, endPin?.nodeKey]);

  const routeDistance = useMemo(() => routeDistanceMeters(route), [route]);

  const routeSegments = useMemo(() => {
    if (route.length < 2) return [];
    const segs = [];
    for (let i = 0; i < route.length - 1; i++) {
      const a = nodes[route[i]];
      const b = nodes[route[i + 1]];
      if (!a || !b) continue;
      segs.push({
        x1: (a.x / MAP_W) * 100,
        y1: (a.y / MAP_H) * 100,
        x2: (b.x / MAP_W) * 100,
        y2: (b.y / MAP_H) * 100,
      });
    }
    return segs;
  }, [route]);

  const routePointsPct = useMemo(() => {
    if (route.length < 2) return [];
    const pts = [];
    for (const key of route) {
      const p = nodes[key];
      if (!p) continue;
      pts.push({ x: (p.x / MAP_W) * 100, y: (p.y / MAP_H) * 100 });
    }
    return pts;
  }, [route]);

  const routePathD = useMemo(() => pointsToSmoothSvgPath(routePointsPct), [routePointsPct]);

  const routeSteps = useMemo(() => {
    if (route.length < 2) return [];
    const steps = [];
    for (let i = 0; i < route.length - 1; i++) {
      const from = route[i];
      const to = route[i + 1];
      steps.push({
        from,
        to,
        fromLabel: NODE_LABELS[from] || from,
        toLabel: NODE_LABELS[to] || to,
      });
    }
    return steps;
  }, [route]);

  const destinationDetails = useMemo(() => {
    if (!endPin) return null;
    return PLACE_DETAILS[endPin.id] || null;
  }, [endPin]);

  const destinationBadge = useMemo(
    () => floorBadgeFromDetails(destinationDetails),
    [destinationDetails]
  );

  const hasRoute = route.length >= 2;

  useEffect(() => {
    if (endId) setDirectionsOpen(true);
  }, [endId]);

  const applyPinChoice = (pinId) => {
    setSelectedId(pinId);
    setPicker(null);

    if (pickMode === "start") {
      setStartId(pinId);
      if (endId === pinId) setEndId(null);
      setPickMode("end");
      return;
    }

    if (!startId) {
      setStartId(pinId);
      return;
    }

    if (!endId) {
      if (pinId !== startId) setEndId(pinId);
      return;
    }

    // If a route already exists (start + destination), a new tap begins a new route
    // with this point as the new start (Google Maps-like quick comparisons).
    setStartId(pinId);
    setEndId(null);
  };

  const openPickerAtEvent = (e) => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const scored = visiblePins
      .map((p) => {
        const px = (p.xPct / 100) * rect.width;
        const py = (p.yPct / 100) * rect.height;
        const dx = px - cx;
        const dy = py - cy;
        return { id: p.id, label: p.label, d2: dx * dx + dy * dy };
      })
      .sort((a, b) => a.d2 - b.d2);

    // Finger-friendly radius; also scales a bit with screen size.
    const R = Math.max(18, Math.min(34, rect.width * 0.03));
    const candidates = scored.filter((s) => s.d2 <= R * R).slice(0, 6);

    if (candidates.length <= 1) {
      if (candidates[0]) applyPinChoice(candidates[0].id);
      setPicker(null);
      return;
    }

    setPicker({
      x: Math.min(Math.max(12, cx), rect.width - 12),
      y: Math.min(Math.max(12, cy), rect.height - 12),
      candidates,
    });
  };

  const setPinPosFromClient = (pinId, clientX, clientY) => {
    const el = mapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;
    const clamp = (v) => Math.max(0, Math.min(100, v));
    setPinOverrides((prev) => ({
      ...prev,
      [pinId]: { xPct: clamp(xPct), yPct: clamp(yPct) },
    }));
  };

  const groups = useMemo(() => {
    const m = new Map();
    for (const p of visiblePins) {
      if (!m.has(p.group)) m.set(p.group, []);
      m.get(p.group).push(p);
    }
    return Array.from(m.entries());
  }, [visiblePins]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-950 to-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-center md:text-left">
            <h1 className="text-balance text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              SDMCET Campus Map
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Tap a pin (or pick from the list) to clearly identify locations like CSE, ISE, AIML,
              Mechanical, Civil, Chemical, Library, Temple, Administrative, Hostels, and Playground.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <label className="sr-only" htmlFor="place-search">
              Search places
            </label>
            <input
              id="place-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search (e.g., CSE, library, hostel)…"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-slate-400 shadow-sm outline-none ring-0 transition focus:border-cyan-300/40 focus:bg-white/10 focus:shadow-cyan-500/10 sm:w-80"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 shadow-lg shadow-black/30">
            <div className="relative w-full overflow-hidden rounded-xl bg-white">
              <div
                ref={mapRef}
                className="relative w-full"
                onClick={(e) => {
                  if (e.target?.closest?.("[data-pin='1']")) return;
                  setPicker(null);
                  if (!editPins) openPickerAtEvent(e);
                }}
              >
                <img
                  src={campusMap}
                  alt="Layout map of SDMCET campus"
                  className="block w-full h-auto select-none"
                  draggable="false"
                />

                {/* Route overlay (responsive; coordinates in %) */}
                <svg
                  className="pointer-events-none absolute inset-0 z-5 h-full w-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <filter id="routeGlow">
                      <feGaussianBlur stdDeviation="1.1" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0.6" stdDeviation="0.9" floodColor="rgba(0,0,0,0.35)" />
                    </filter>
                    <marker
                      id="routeArrow"
                      viewBox="0 0 10 10"
                      refX="7.5"
                      refY="5"
                      markerWidth="4"
                      markerHeight="4"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(59, 130, 246, 0.95)" />
                    </marker>
                  </defs>

                  {routePathD ? (
                    <>
                      {/* White outline */}
                      <path
                        d={routePathD}
                        fill="none"
                        stroke="rgba(255,255,255,0.92)"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#routeShadow)"
                      />

                      {/* Blue route (Google-ish) */}
                      <path
                        d={routePathD}
                        fill="none"
                        stroke="rgba(37, 99, 235, 0.96)"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#routeGlow)"
                        markerEnd="url(#routeArrow)"
                      />

                      {/* Animated flow overlay */}
                      <path
                        d={routePathD}
                        fill="none"
                        stroke="rgba(147, 197, 253, 0.95)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2.2 6.2"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          values="0;-24"
                          dur="1.4s"
                          repeatCount="indefinite"
                        />
                      </path>
                    </>
                  ) : null}

                  {/* Start/End dots */}
                  {route.length >= 2 ? (
                    <>
                      <circle
                        cx={(nodes[route[0]].x / MAP_W) * 100}
                        cy={(nodes[route[0]].y / MAP_H) * 100}
                        r="1.8"
                        fill="rgba(16, 185, 129, 0.95)"
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth="0.8"
                      />
                      <circle
                        cx={(nodes[route[route.length - 1]].x / MAP_W) * 100}
                        cy={(nodes[route[route.length - 1]].y / MAP_H) * 100}
                        r="1.8"
                        fill="rgba(245, 158, 11, 0.95)"
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth="0.8"
                      />
                    </>
                  ) : null}
                </svg>

                {visiblePins.map((pin) => {
                  const isSelected = pin.id === selectedId;
                  const tone =
                    pin.id === startId
                      ? "start"
                      : pin.id === endId
                        ? "end"
                        : isSelected
                          ? "selected"
                          : "default";
                  return (
                    <button
                      key={pin.id}
                      data-pin="1"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyPinChoice(pin.id);
                      }}
                      className={[
                        "group absolute z-10 -translate-x-1/2 -translate-y-full select-none",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                      ].join(" ")}
                      style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                      aria-label={pin.label}
                    >
                      <div className="relative">
                        <PinIcon tone={tone} />
                        {pin.id === endId && destinationBadge ? (
                          <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[55%] rounded-full border border-amber-400/60 bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-100 shadow">
                            {destinationBadge}
                          </span>
                        ) : null}
                        <span
                          className={[
                            "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[115%] whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold",
                            "border shadow-sm backdrop-blur",
                            tone === "start"
                              ? "border-emerald-400/50 bg-emerald-950/70 text-emerald-100"
                              : tone === "end"
                                ? "border-amber-400/50 bg-amber-950/70 text-amber-100"
                                : tone === "selected"
                                  ? "border-indigo-400/50 bg-indigo-950/70 text-indigo-100"
                                  : "border-white/10 bg-slate-950/70 text-slate-100 opacity-0 group-hover:opacity-100 group-focus:opacity-100",
                          ].join(" ")}
                        >
                          {pin.label}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {picker ? (
                  <div
                    className="absolute z-20 -translate-x-1/2 -translate-y-2"
                    style={{ left: picker.x, top: picker.y }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-56 overflow-hidden rounded-xl border border-white/15 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur">
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <p className="text-xs font-extrabold text-white">Which place?</p>
                        <button
                          type="button"
                          onClick={() => setPicker(null)}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/10"
                        >
                          Close
                        </button>
                      </div>
                      <div className="max-h-48 overflow-auto px-2 pb-2">
                        {picker.candidates.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => applyPinChoice(c.id)}
                            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-white/10"
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Controls + route details are shown in the right panel / mobile bottom sheet */}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-black/20 p-4 shadow-lg shadow-black/30">
            <div className="sticky top-4 space-y-4">
              <section className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold tracking-wide text-white">Directions</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectionsOpen(true);
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Open
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-200">
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                    Start: <span className="font-semibold text-emerald-200">{startPin?.label || "—"}</span>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                    Destination:{" "}
                    <span className="font-semibold text-amber-200">{endPin?.label || "—"}</span>
                  </div>
                  {hasRoute ? (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                      Distance:{" "}
                      <span className="font-semibold text-white">
                        {routeDistance >= 1000
                          ? `${(routeDistance / 1000).toFixed(2)} km`
                          : `${Math.round(routeDistance)} m`}
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-slate-300">
                      Tap pins to set start & destination.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPickMode("start")}
                      className={[
                        "rounded-lg border px-2 py-1 text-xs font-semibold transition",
                        pickMode === "start"
                          ? "border-emerald-400/40 bg-emerald-950/55 text-emerald-100"
                          : "border-emerald-400/25 bg-emerald-950/30 text-emerald-100 hover:bg-emerald-950/45",
                      ].join(" ")}
                    >
                      Pick start
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartId((s) => {
                          const nextStart = endId || s;
                          return nextStart;
                        });
                        setEndId((e) => startId || e);
                      }}
                      disabled={!startId || !endId}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Swap
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartId(null);
                        setEndId(null);
                        setDirectionsOpen(false);
                      }}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Desktop directions description + destination floor details */}
                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  {routeSteps.length ? (
                    <>
                      <p className="text-xs font-semibold text-white">Step-by-step</p>
                      <ol className="mt-2 space-y-1 text-xs text-slate-200">
                        {routeSteps.map((s, idx) => (
                          <li key={`${s.from}-${s.to}-${idx}`} className="flex gap-2">
                            <span className="mt-px inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                              {idx + 1}
                            </span>
                            <span>
                              {s.fromLabel} →{" "}
                              <span className="font-semibold text-white">{s.toLabel}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="text-xs text-slate-300">Pick start & destination pins to get directions.</p>
                  )}

                  {destinationDetails ? (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-xs font-semibold text-white">Floor details</p>
                      <p className="mt-1 text-xs text-slate-300">
                        <span className="font-semibold text-slate-100">{destinationDetails.title}</span>
                      </p>
                      {destinationDetails.floors?.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-200">
                          {destinationDetails.floors.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-slate-300">No floor details needed.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-extrabold tracking-wide text-white">
                  Location pin points (legend)
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Click a name to highlight its pin on the map.
                </p>

                <div className="mt-3 space-y-4">
                  {groups.map(([groupName, pins]) => (
                    <section key={groupName}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {groupName}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {pins.map((p) => {
                          const isSelected = p.id === selectedId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                applyPinChoice(p.id);
                              }}
                              className={[
                                "rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                                isSelected
                                  ? "border-cyan-300/40 bg-cyan-950/40 text-cyan-100"
                                  : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                              ].join(" ")}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </section>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                <p className="font-semibold text-white">Notes</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>
                    ISE is routed via the admin/cse node in the current campus graph; AIML is near
                    Mechanical block.
                  </li>
                  <li>Chemical is routed via the Physics/Chemistry block in the current graph.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom-sheet directions (easy access like Google Maps) */}
      <div className="md:hidden">
        <div
          className={[
            "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-6xl px-4 pb-4",
            directionsOpen ? "" : "pointer-events-none",
          ].join(" ")}
        >
          <div
            className={[
              "rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/60 backdrop-blur",
              "transition-transform duration-200",
              directionsOpen ? "translate-y-0" : "translate-y-[65%]",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={() => setDirectionsOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="text-sm font-extrabold text-white">Directions</span>
              <span className="text-xs font-semibold text-slate-300">
                {directionsOpen ? "Hide" : "Show"}
              </span>
            </button>
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                  Start:{" "}
                  <span className="font-semibold text-emerald-200">{startPin?.label || "—"}</span>
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                  Destination:{" "}
                  <span className="font-semibold text-amber-200">{endPin?.label || "—"}</span>
                </span>
                {hasRoute ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">
                    {routeDistance >= 1000
                      ? `${(routeDistance / 1000).toFixed(2)} km`
                      : `${Math.round(routeDistance)} m`}
                  </span>
                ) : null}
              </div>

              {destinationDetails ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-semibold text-white">Floor details</p>
                  <p className="mt-1 text-xs text-slate-300">
                    <span className="font-semibold text-slate-100">{destinationDetails.title}</span>
                  </p>
                  {destinationDetails.floors?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-200">
                      {destinationDetails.floors.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-300">No floor details needed.</p>
                  )}
                </div>
              ) : null}

              {routeSteps.length ? (
                <ol className="mt-3 space-y-1 text-xs text-slate-200">
                  {routeSteps.map((s, idx) => (
                    <li key={`${s.from}-${s.to}-${idx}`} className="flex gap-2">
                      <span className="mt-px inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <span>
                        {s.fromLabel} → <span className="font-semibold text-white">{s.toLabel}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-xs text-slate-300">Pick start & destination pins.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}