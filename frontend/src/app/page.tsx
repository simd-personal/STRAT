"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Map), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Marker), { ssr: false });

const MAPBOX_TOKEN = "pk.eyJ1Ijoic3NkMzYwIiwiYSI6ImNtYzlzNGh6NTF3bXMyanEwdWttajNrZjUifQ.9sOzbXQl4ORfE8Ys6oJOdg";

export default function Home() {
  // State for PDF upload/summary
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [summarizing, setSummarizing] = useState(false);
  const [targetLocation, setTargetLocation] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3,
    bearing: 0,
    pitch: 0,
  });

  // State for mission planning
  const [planPrompt, setPlanPrompt] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [planning, setPlanning] = useState(false);

  // State for logs and briefs
  const [logs, setLogs] = useState<string[]>([]);
  const [briefs, setBriefs] = useState<string[]>([]);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load logs and briefs on mount
  useEffect(() => {
    fetch("http://localhost:8000/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []));
    fetch("http://localhost:8000/api/briefs")
      .then((res) => res.json())
      .then((data) => setBriefs(data.briefs || []));
  }, []);

  // Update viewState when mapCoords changes
  useEffect(() => {
    if (mapCoords) {
      setViewState({
        longitude: mapCoords.lng,
        latitude: mapCoords.lat,
        zoom: 10,
        bearing: 0,
        pitch: 0,
      });
    }
  }, [mapCoords]);

  // Handle PDF upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSummarize = async () => {
    if (!pdfFile) return;
    setSummarizing(true);
    setSummary("");
    setMapCoords(null);
    const formData = new FormData();
    formData.append("file", pdfFile);
    try {
      const res = await fetch("http://localhost:8000/api/brief", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log('PDF summary API response:', data); // Debug: log backend response
      setSummary(data.summary || "No summary returned.");
      // Each fallback must return immediately after a successful map update!
      // 1. Use coordinates directly from backend
      if (data.lat && data.lng) {
        const latNum = Number(data.lat);
        const lngNum = Number(data.lng);
        console.log('lat:', data.lat, typeof data.lat, 'lng:', data.lng, typeof data.lng);
        setMapCoords({ lat: latNum, lng: lngNum });
        console.log('Setting mapCoords:', { lat: latNum, lng: lngNum });
        setSummarizing(false);
        return;
      }
      // 2. Fallback: Geocode the location name from backend
      if (data.location_name) {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(data.location_name)}.json?access_token=${MAPBOX_TOKEN}`
        );
        const geoData = await geoRes.json();
        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].center;
          setMapCoords({ lat, lng });
          setSummarizing(false);
          return;
        }
      }
      // 3. Fallback: Try to extract a city/country from the summary and geocode it
      if (data.summary) {
        const match = data.summary.match(/([A-Z][a-z]+(?: [A-Z][a-z]+)*,? [A-Z][a-z]+)/);
        if (match) {
          const place = match[0];
          const geoRes = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${MAPBOX_TOKEN}`
          );
          const geoData = await geoRes.json();
          if (geoData.features && geoData.features.length > 0) {
            const [lng, lat] = geoData.features[0].center;
            setMapCoords({ lat, lng });
            setSummarizing(false);
            return;
          }
        }
      }
      // 4. Fallback: Try city+country from backend
      if (data.city && data.country) {
        const place = `${data.city}, ${data.country}`;
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(place)}.json?access_token=${MAPBOX_TOKEN}`
        );
        const geoData = await geoRes.json();
        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].center;
          setMapCoords({ lat, lng });
          setSummarizing(false);
          return;
        }
      }
      // 5. Fallback: Try city only
      if (data.city) {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(data.city)}.json?access_token=${MAPBOX_TOKEN}`
        );
        const geoData = await geoRes.json();
        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].center;
          setMapCoords({ lat, lng });
          setSummarizing(false);
          return;
        }
      }
      // 6. Fallback: Try country only
      if (data.country) {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(data.country)}.json?access_token=${MAPBOX_TOKEN}`
        );
        const geoData = await geoRes.json();
        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].center;
          setMapCoords({ lat, lng });
          setSummarizing(false);
          return;
        }
      }
    } catch {
      setSummary("Error summarizing PDF.");
    }
    setSummarizing(false);
  };

  // Handle mission planning
  const handlePlan = async () => {
    if (!planPrompt) return;
    setPlanning(true);
    setPlan("");
    const formData = new FormData();
    formData.append("prompt", planPrompt);
    try {
      const res = await fetch("http://localhost:8000/api/plan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPlan(data.plan || "No plan returned.");
    } catch {
      setPlan("Error generating plan.");
    }
    setPlanning(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-mono flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="w-full flex flex-col items-center mb-12">
        <div className="flex items-center gap-4 mb-4">
          <Image src="/stratos-logo.svg" alt="STRATOS Logo" width={48} height={48} />
          <h1 className="text-4xl sm:text-5xl font-bold tracking-widest uppercase text-white drop-shadow-lg font-mono">
            STRATOS
          </h1>
        </div>
        <h2 className="text-xl sm:text-2xl font-mono font-normal text-gray-300 tracking-widest text-center max-w-2xl">
          Mission-Ready AI Command Platform for Defense, Disaster Response, and Intelligence
        </h2>
      </header>

      {/* Main Dashboard Grid */}
      <main className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <section className="flex flex-col gap-8">
          {/* PDF Upload & Summary */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800">
            <h3 className="text-lg font-bold mb-2 text-white font-mono tracking-widest">Upload Mission Docs</h3>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="file:bg-gray-800 file:text-gray-200 file:border-none file:rounded file:px-4 file:py-2 file:mr-4 font-mono tracking-widest"
              />
              <button
                className="mt-2 border border-gray-600 bg-black/60 hover:bg-gray-800 text-white font-mono font-bold tracking-widest py-2 px-6 rounded transition disabled:opacity-50 shadow-md"
                onClick={handleSummarize}
                disabled={!pdfFile || summarizing}
              >
                {summarizing ? "SUMMARIZING..." : "SUMMARIZE WITH AI"}
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-400 italic min-h-[2em] font-mono tracking-widest">
              {summary ? summary : "AI-generated summary will appear here."}
            </div>
          </div>

          {/* Mission Planning (Natural Language) */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800">
            <h3 className="text-lg font-bold mb-2 text-white font-mono tracking-widest">Mission Planning</h3>
            <input
              type="text"
              placeholder="e.g., Plan evac in 4 stages using 3 Chinooks"
              value={planPrompt}
              onChange={e => setPlanPrompt(e.target.value)}
              className="w-full bg-gray-800 text-gray-200 rounded px-3 py-2 mb-2 font-mono tracking-widest"
            />
            <button
              className="border border-gray-600 bg-black/60 hover:bg-blue-800 text-white font-mono font-bold tracking-widest py-2 px-6 rounded transition disabled:opacity-50 shadow-md"
              onClick={handlePlan}
              disabled={!planPrompt || planning}
            >
              {planning ? "GENERATING..." : "GENERATE PLAN"}
            </button>
            <div className="mt-4 text-sm text-gray-400 italic min-h-[2em] font-mono tracking-widest">
              {plan ? plan : "AI-generated plan will appear here."}
            </div>
          </div>
        </section>

        {/* Right Column */}
        <section className="flex flex-col gap-8">
          {/* Interactive Ops Map */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 h-72 flex flex-col">
            <h3 className="text-lg font-bold mb-2 text-white font-mono tracking-widest">Operational Map</h3>
            <div className="flex-1 flex items-center justify-center text-gray-500 italic border-2 border-dashed border-gray-700 rounded-lg">
              <div className="w-full h-full" style={{ minHeight: 200 }}>
                <Map
                  viewState={viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  style={{ width: "100%", height: "200px", borderRadius: "0.5rem" }}
                  mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {mapCoords && (
                    <Marker longitude={mapCoords.lng} latitude={mapCoords.lat} anchor="bottom">
                      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="12" cy="10" rx="8" ry="8" fill="#38bdf8" fillOpacity="0.95"/>
                        <rect x="10" y="10" width="4" height="14" rx="2" fill="#38bdf8" fillOpacity="0.95"/>
                        <ellipse cx="12" cy="10" rx="3" ry="3" fill="#fff"/>
                      </svg>
                    </Marker>
                  )}
                </Map>
              </div>
            </div>
          </div>

          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Logs/Intel Threads */}
            <div className="bg-gray-900/80 rounded-xl p-4 shadow border border-gray-800">
              <h4 className="font-bold text-white mb-2 font-mono tracking-widest">Logs & Intel</h4>
              <div className="text-xs text-gray-400 italic min-h-[2em] font-mono tracking-widest">
                {logs.length > 0 ? logs.map((log, i) => <div key={i}>{log}</div>) : "Mission logs and intel threads will appear here."}
              </div>
            </div>
            {/* SITREP/CONOPS */}
            <div className="bg-gray-900/80 rounded-xl p-4 shadow border border-gray-800">
              <h4 className="font-bold text-white mb-2 font-mono tracking-widest">SITREP / CONOPS</h4>
              <div className="text-xs text-gray-400 italic min-h-[2em] font-mono tracking-widest">
                {briefs.length > 0 ? briefs.map((b, i) => <div key={i}>{b}</div>) : "Auto-generated briefs will appear here."}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Offline Toggle */}
      <div className="fixed bottom-6 right-6 bg-gray-900/90 border border-gray-800 rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
        <span className="text-gray-300 font-bold font-mono tracking-widest">OFFLINE MODE</span>
        <button className="w-10 h-6 bg-gray-700 rounded-full flex items-center transition duration-200 focus:outline-none border border-gray-600">
          <span className="w-4 h-4 bg-red-700 rounded-full shadow transform translate-x-1"></span>
        </button>
      </div>
    </div>
  );
}
