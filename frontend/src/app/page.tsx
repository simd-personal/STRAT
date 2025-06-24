"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";

const Map = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Map), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Marker), { ssr: false });

const MAPBOX_TOKEN = "pk.eyJ1Ijoic3NkMzYwIiwiYSI6ImNtYzlzNGh6NTF3bXMyanEwdWttajNrZjUifQ.9sOzbXQl4ORfE8Ys6oJOdg";

const SUGGESTED_PROMPTS = [
  "Plan evac in 4 stages using 3 Chinooks",
  "Generate comms plan for night operation",
  "Create QRF contingency for LZ Bravo",
  "List all air assets for extraction",
  "Draft SITREP for command staff"
];

const EVENT_TYPE_COLORS = {
  Intel: "bg-blue-700",
  Logistics: "bg-yellow-700",
  "Air Assets": "bg-green-700",
  Command: "bg-purple-700",
  User: "bg-gray-700",
  System: "bg-red-700",
};

export default function Home() {
  // State for PDF upload/summary
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [summarizing, setSummarizing] = useState(false);
  const [targetLocation, setTargetLocation] = useState<string | null>(null);
  const [mapCoords, setMapCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [viewState, setViewState] = useState<any>({
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
  const [logs, setLogs] = useState<any[]>([]);
  const [briefs, setBriefs] = useState<string[]>([]);
  const [logFilter, setLogFilter] = useState<string>("");

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mission plan state
  const [currentPlan, setCurrentPlan] = useState<{ content: string; updated_at?: string; updated_by?: string } | null>(null);
  const [planHistory, setPlanHistory] = useState<any[]>([]);
  const [masterPlan, setMasterPlan] = useState<any>(null);
  const [planEdit, setPlanEdit] = useState<string>("");
  const [planLoading, setPlanLoading] = useState(false);
  const [planViewIdx, setPlanViewIdx] = useState<number | null>(null);

  // Add new state for refinement
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [planError, setPlanError] = useState("");

  // Add new state for unsaved changes and warning
  const [unsaved, setUnsaved] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Add new state for plan comparison
  const [compareIdxA, setCompareIdxA] = useState<number | null>(null);
  const [compareIdxB, setCompareIdxB] = useState<number | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // SITREP/CONOPS state
  const [sitrep, setSitrep] = useState<string>("");
  const [sitrepStatus, setSitrepStatus] = useState<'draft' | 'approved'>("draft");
  const [sitrepHistory, setSitrepHistory] = useState<any[]>([]);
  const [sitrepVersion, setSitrepVersion] = useState(1);

  // Add new state for markdown preview
  const [sitrepPreview, setSitrepPreview] = useState(false);

  // Add offline/online toggle state
  const [isOffline, setIsOffline] = useState(false);

  // Track manual edits for unsaved changes
  useEffect(() => {
    if (planEdit !== (currentPlan?.content || "")) {
      setUnsaved(true);
    } else {
      setUnsaved(false);
    }
  }, [planEdit, currentPlan]);

  // Optionally persist unsaved plan in localStorage
  useEffect(() => {
    if (planEdit) {
      localStorage.setItem("stratos_unsaved_plan", planEdit);
    }
  }, [planEdit]);
  useEffect(() => {
    const saved = localStorage.getItem("stratos_unsaved_plan");
    if (saved && !planEdit) setPlanEdit(saved);
  }, []);

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

  // Real-time logs polling
  useEffect(() => {
    const fetchLogs = () => {
      let url = "http://localhost:8000/api/logs?limit=100";
      if (logFilter) url += `&event_type=${encodeURIComponent(logFilter)}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => setLogs(data.logs || []));
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [logFilter]);

  // Fetch current plan, history, and master plan on mount
  useEffect(() => {
    fetch("http://localhost:8000/api/plan/current").then(res => res.json()).then(data => {
      setCurrentPlan(data.plan);
      setPlanEdit(data.plan?.content || "");
    });
    fetch("http://localhost:8000/api/plan/history").then(res => res.json()).then(data => setPlanHistory(data.history || []));
    fetch("http://localhost:8000/api/plan/master").then(res => res.json()).then(data => setMasterPlan(data.master));
  }, []);

  // Handle PDF upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      logUserAction("Intel", "PDF file selected", { filename: e.target.files[0].name });
    }
  };

  const logUserAction = async (event_type: string, message: string, details: any = {}) => {
    await fetch("http://localhost:8000/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type, message, details }),
    });
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
      logUserAction("Intel", "PDF summarized", { summary: data.summary });
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

  // Fix quick prompts to fill the input and trigger plan generation
  const handleQuickPrompt = (prompt: string) => {
    setPlanPrompt(prompt);
  };

  // Confirm before AI actions if unsaved manual edits
  const confirmAIAction = async (action: () => Promise<void>) => {
    if (unsaved) {
      setShowUnsavedWarning(true);
      return;
    }
    await action();
  };

  // Generate plan with AI and put in editable area
  const handlePlan = async () => {
    await confirmAIAction(async () => {
      if (!planPrompt) return;
      setPlanning(true);
      setPlanError("");
      try {
        const formData = new FormData();
        formData.append("prompt", planPrompt);
        const res = await fetch("http://localhost:8000/api/plan", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setPlanEdit(data.plan || "No plan returned.");
        logUserAction("Command", "Mission plan generated", { prompt: planPrompt });
      } catch (e) {
        setPlanError("Error generating plan.");
      }
      setPlanning(false);
    });
  };

  // Refine plan with AI (requires backend support)
  const handleRefine = async () => {
    await confirmAIAction(async () => {
      if (!refinePrompt || !planEdit) return;
      setRefining(true);
      setPlanError("");
      try {
        const formData = new FormData();
        formData.append("prompt", refinePrompt);
        formData.append("plan", planEdit);
        const res = await fetch("http://localhost:8000/api/plan/refine", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setPlanEdit(data.plan || "No refined plan returned.");
        logUserAction("Command", "Mission plan refined", { refinePrompt, plan: planEdit });
      } catch (e) {
        setPlanError("Error refining plan.");
      }
      setRefining(false);
    });
  };

  // Save/update current plan
  const savePlan = async () => {
    setPlanLoading(true);
    await fetch("http://localhost:8000/api/plan/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planEdit, user: "user" }),
    });
    setCurrentPlan({ ...currentPlan, content: planEdit, updated_at: new Date().toISOString(), updated_by: "user" });
    logUserAction("Command", "Current plan updated", { plan: planEdit });
    setPlanLoading(false);
    setUnsaved(false);
    localStorage.removeItem("stratos_unsaved_plan");
  };

  // Archive current plan
  const archivePlan = async () => {
    setPlanLoading(true);
    const res = await fetch("http://localhost:8000/api/plan/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: `Archive ${planHistory.length + 1}` }),
    });
    const data = await res.json();
    setPlanHistory([...planHistory, data.archive]);
    logUserAction("Command", "Plan archived", data.archive);
    setPlanLoading(false);
  };

  // Restore archived plan
  const restorePlan = async (idx: number) => {
    setPlanLoading(true);
    const res = await fetch("http://localhost:8000/api/plan/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: idx, user: "user" }),
    });
    const data = await res.json();
    setCurrentPlan(data.plan);
    setPlanEdit(data.plan?.content || "");
    logUserAction("Command", "Plan restored from archive", { index: idx });
    setPlanLoading(false);
  };

  // Set master plan
  const setAsMasterPlan = async () => {
    setPlanLoading(true);
    const res = await fetch("http://localhost:8000/api/plan/master", { method: "POST" });
    const data = await res.json();
    setMasterPlan(data.master);
    logUserAction("Command", "Master plan set", data.master);
    setPlanLoading(false);
  };

  // Clear session handler
  const clearSession = async () => {
    setCurrentPlan(null);
    setPlanEdit("");
    setPlanHistory([]);
    setMasterPlan(null);
    setPlanPrompt("");
    setRefinePrompt("");
    setUnsaved(false);
    localStorage.removeItem("stratos_unsaved_plan");
    // Optionally, call backend endpoints to clear session data if needed
    // await fetch("http://localhost:8000/api/plan/clear", { method: "POST" });
  };

  // Helper to get plan content by index (from history or current)
  const getPlanByIdx = (idx: number | null) => {
    if (idx === null) return "";
    if (idx === -1 && currentPlan) return currentPlan.content;
    if (planHistory[idx]) return planHistory[idx].content;
    return "";
  };

  // Approve handlers
  const approveSitrep = () => {
    setSitrepStatus("approved");
    setSitrepHistory([...sitrepHistory, { content: sitrep, version: sitrepVersion, status: "approved", date: new Date().toISOString() }]);
    setSitrepVersion(sitrepVersion + 1);
  };
  // Share handlers (placeholder)
  const shareSitrep = () => alert("SITREP shared with team (placeholder)");

  // Add new function to start a new draft for SITREP
  const startNewSitrepDraft = () => {
    setSitrep("");
    setSitrepStatus("draft");
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
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 relative">
            <button
              className="absolute top-4 right-4 bg-red-800 hover:bg-red-900 text-xs text-white px-2 py-1 rounded font-mono border border-gray-700 z-10"
              onClick={clearSession}
              title="Clear session (reset all mission planning data)"
            >
              Clear Session
            </button>
            <h3 className="text-lg font-bold mb-2 text-white font-mono tracking-widest">Mission Planning</h3>
            <input
              type="text"
              placeholder="Write your own mission planning prompt..."
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
            {planError && <div className="text-red-400 mt-2 text-xs">{planError}</div>}
            {/* Dynamic Plan Editor */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-white">Dynamic Mission Plan</span>
                {masterPlan && masterPlan.content && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-green-800 text-xs font-bold">MASTER PLAN</span>
                )}
                <button
                  className="ml-auto bg-gray-800 hover:bg-purple-800 text-xs text-white px-3 py-1 rounded font-mono border border-gray-700"
                  onClick={archivePlan}
                  disabled={planLoading}
                >
                  Archive Plan
                </button>
                <button
                  className="bg-gray-800 hover:bg-green-800 text-xs text-white px-3 py-1 rounded font-mono border border-gray-700"
                  onClick={setAsMasterPlan}
                  disabled={planLoading}
                >
                  Set as Master Plan
                </button>
              </div>
              <textarea
                className="w-full min-h-[300px] bg-gray-800 text-gray-200 rounded px-4 py-3 font-mono tracking-widest mb-2 text-base leading-relaxed resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-700"
                value={planEdit}
                onChange={e => setPlanEdit(e.target.value)}
                disabled={planLoading}
                placeholder="Type or edit your mission plan here."
              />
              {unsaved && <div className="text-yellow-400 text-xs mb-2">You have unsaved changes.</div>}
              {showUnsavedWarning && (
                <div className="bg-yellow-900 text-yellow-200 p-4 rounded mb-2 flex flex-col gap-2">
                  <span>You have unsaved manual edits. Please save or discard them before using AI actions.</span>
                  <div className="flex gap-2">
                    <button className="bg-blue-800 px-3 py-1 rounded" onClick={() => { savePlan(); setShowUnsavedWarning(false); }}>Save & Continue</button>
                    <button className="bg-gray-700 px-3 py-1 rounded" onClick={() => { setPlanEdit(currentPlan?.content || ""); setShowUnsavedWarning(false); }}>Discard Changes</button>
                    <button className="bg-red-800 px-3 py-1 rounded" onClick={() => setShowUnsavedWarning(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Refine plan with AI (e.g., 'Add more detail to phase 2')"
                  value={refinePrompt}
                  onChange={e => setRefinePrompt(e.target.value)}
                  className="flex-1 bg-gray-800 text-gray-200 rounded px-3 py-2 font-mono tracking-widest"
                  disabled={refining}
                />
                <button
                  className="border border-gray-600 bg-purple-800 hover:bg-purple-900 text-white font-mono font-bold tracking-widest py-2 px-4 rounded transition disabled:opacity-50 shadow-md"
                  onClick={handleRefine}
                  disabled={!refinePrompt || refining}
                >
                  {refining ? "REFINING..." : "REFINE WITH AI"}
                </button>
              </div>
              <button
                className="border border-gray-600 bg-blue-800 hover:bg-blue-900 text-white font-mono font-bold tracking-widest py-2 px-6 rounded transition disabled:opacity-50 shadow-md"
                onClick={savePlan}
                disabled={planLoading || planEdit === (currentPlan?.content || "")}
              >
                {planLoading ? "SAVING..." : "SAVE/UPDATE PLAN"}
              </button>
              {masterPlan && masterPlan.content && (
                <div className="mt-4 p-2 bg-green-900/60 rounded">
                  <div className="font-bold text-green-300 mb-1">Master Plan (Locked)</div>
                  <pre className="text-xs text-green-100 whitespace-pre-wrap">{masterPlan.content}</pre>
                </div>
              )}
              {/* Plan History */}
              <div className="mt-6">
                <div className="font-bold text-white mb-2">Plan History</div>
                {planHistory.length === 0 ? (
                  <div className="text-gray-500 italic">No archived plans yet.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {planHistory.map((arch, idx) => (
                      <div key={idx} className="bg-gray-800/70 p-2 rounded flex items-center gap-2">
                        <span className="text-xs text-gray-400">{arch.label} ({new Date(arch.timestamp).toLocaleString()})</span>
                        <button
                          className="ml-auto bg-gray-700 hover:bg-blue-700 text-xs text-white px-2 py-1 rounded font-mono border border-gray-600"
                          onClick={() => setPlanViewIdx(idx)}
                        >
                          View
                        </button>
                        <button
                          className="bg-gray-700 hover:bg-purple-700 text-xs text-white px-2 py-1 rounded font-mono border border-gray-600"
                          onClick={() => restorePlan(idx)}
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Plan View Modal */}
                {planViewIdx !== null && planHistory[planViewIdx] && (
                  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full shadow-lg border border-gray-800 relative">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
                        onClick={() => setPlanViewIdx(null)}
                        aria-label="Close"
                      >
                        ×
                      </button>
                      <div className="font-bold text-white mb-2 text-lg">{planHistory[planViewIdx].label}</div>
                      <div className="text-xs text-gray-400 mb-4">{new Date(planHistory[planViewIdx].timestamp).toLocaleString()}</div>
                      <div className="overflow-y-auto max-h-[60vh] p-2 bg-gray-800 rounded mb-4 prose prose-invert prose-sm prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:whitespace-pre-wrap">
                        <ReactMarkdown>{planHistory[planViewIdx].content}</ReactMarkdown>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          className="bg-blue-800 hover:bg-blue-900 text-xs text-white px-3 py-1 rounded font-mono border border-gray-700"
                          onClick={() => {
                            setPlanEdit(planHistory[planViewIdx].content);
                            setPlanViewIdx(null);
                          }}
                        >
                          Copy to Editor
                        </button>
                        <button
                          className="bg-gray-700 hover:bg-gray-800 text-xs text-white px-3 py-1 rounded font-mono border border-gray-700"
                          onClick={() => setPlanViewIdx(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Plan Comparison Button */}
              <div className="flex gap-2 items-center mb-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-blue-700 text-white border border-gray-600"
                  onClick={() => setShowCompareModal(true)}
                  disabled={planHistory.length < 2 && !currentPlan}
                  title="Compare two plans side by side"
                >
                  Compare Plans
                </button>
              </div>
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
              <h4 className="font-bold text-white mb-2 font-mono tracking-widest flex items-center gap-2">
                Logs & Intel
                <select
                  className="ml-auto bg-gray-800 text-gray-200 rounded px-2 py-1 text-xs border border-gray-700"
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Intel">Intel</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Air Assets">Air Assets</option>
                  <option value="Command">Command</option>
                  <option value="User">User</option>
                  <option value="System">System</option>
                </select>
              </h4>
              <div className="text-xs text-gray-400 font-mono tracking-widest max-h-48 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.slice().reverse().map((log, i) => (
                    <div key={i} className="mb-2 p-2 rounded bg-gray-800/70 flex flex-col gap-1 border-l-4" style={{ borderColor: EVENT_TYPE_COLORS[log.event_type as keyof typeof EVENT_TYPE_COLORS] || '#444' }}>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${EVENT_TYPE_COLORS[log.event_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-700'}`}>{log.event_type}</span>
                        <span className="text-gray-500 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-white">{log.message}</span>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="text-gray-400 text-[10px]">
                          <summary>Details</summary>
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  ))
                ) : (
                  <div>Mission logs and intel threads will appear here.</div>
                )}
              </div>
            </div>
            {/* SITREP / CONOPS Panel (now just SITREP) */}
            <div className="bg-gray-900/90 rounded-xl p-6 flex flex-col gap-6 mt-4 max-w-xl w-full mx-auto shadow-lg border border-gray-800 overflow-x-auto">
              {/* SITREP Card */}
              <div className="flex flex-col gap-2 min-w-[260px] max-w-[520px] w-full mx-auto" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold tracking-wide text-white">SITREP</h3>
                  <span className={`text-xs px-2 py-0.5 rounded bg-${sitrepStatus === 'approved' ? 'green' : 'yellow'}-700 text-white ml-2`}>{sitrepStatus.toUpperCase()}</span>
                  <span className="text-xs text-gray-400 ml-2">v{sitrepVersion}</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button className="bg-green-800 hover:bg-green-700 text-xs px-3 py-1 rounded font-mono" onClick={approveSitrep} disabled={sitrepStatus==='approved'}>Approve</button>
                  <button className="bg-blue-800 hover:bg-blue-700 text-xs px-3 py-1 rounded font-mono" onClick={shareSitrep}>Share with team</button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1 rounded font-mono" onClick={startNewSitrepDraft} disabled={sitrepStatus==='draft'}>New Draft</button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1 rounded font-mono" onClick={()=>setSitrepPreview(!sitrepPreview)}>{sitrepPreview ? 'Edit' : 'Preview'}</button>
                </div>
                <div className="relative">
                  {sitrepPreview ? (
                    <div className="bg-gray-800 rounded p-4 min-h-[120px] max-h-[220px] text-gray-200 text-base overflow-auto border border-gray-700" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                      <ReactMarkdown>{sitrep || '*No SITREP provided.*'}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      className="w-full min-h-[120px] max-h-[220px] bg-gray-800 text-gray-200 rounded px-4 py-3 font-mono text-base leading-relaxed resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-700 border border-gray-700"
                      style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                      value={sitrep}
                      onChange={e => setSitrep(e.target.value)}
                      disabled={sitrepStatus==='approved'}
                      placeholder="Type or paste the latest SITREP here..."
                    />
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">(Situation Report: Up-to-date summary of the mission)</div>
                <div className="text-xs text-gray-400 mt-2">History: {sitrepHistory.length} versions</div>
              </div>
            </div>
        </div>
        </section>
      </main>

      {/* Offline Toggle - Fixed and always visible */}
      <div 
        className="fixed top-4 right-4 z-[9999] pointer-events-auto" 
        style={{ 
          position: 'fixed', 
          top: '16px', 
          right: '16px', 
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-2xl border-2 backdrop-blur-sm ${isOffline ? 'bg-red-600 border-red-500 text-white' : 'bg-green-600 border-green-500 text-white'} transition-all duration-200 hover:scale-105 hover:shadow-3xl`}
          onClick={() => setIsOffline(!isOffline)}
          title={isOffline ? 'Switch to Online Mode' : 'Switch to Offline Mode'}
          style={{ 
            pointerEvents: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            backgroundColor: isOffline ? '#dc2626' : '#16a34a',
            borderColor: isOffline ? '#ef4444' : '#22c55e'
          }}
        >
          <div className={`w-3 h-3 rounded-full ${isOffline ? 'bg-red-200' : 'bg-green-200'} animate-pulse`}></div>
          <span className="font-bold text-sm tracking-widest uppercase">
            {isOffline ? 'OFFLINE' : 'ONLINE'}
          </span>
        </button>
      </div>
      {isOffline && (
        <div className="fixed top-0 left-0 w-full bg-red-900 text-red-100 text-center py-2 z-40 font-bold tracking-widest shadow-lg">
          OFFLINE DEMO MODE ENABLED — No network actions will be performed.
        </div>
      )}

      {/* Plan Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-gray-900 rounded-xl p-6 max-w-5xl w-full shadow-lg border border-gray-800 relative flex flex-col gap-4 max-h-[90vh] overflow-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
              onClick={() => setShowCompareModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-2 text-center">Compare Mission Plans</h2>
            <div className="flex gap-4 mb-2 overflow-x-auto max-w-full">
              <div className="flex-1 min-w-[320px] max-w-[50vw]">
                <label className="block text-xs mb-1">Plan A</label>
                <select
                  className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 mb-2"
                  value={compareIdxA ?? -1}
                  onChange={e => setCompareIdxA(Number(e.target.value))}
                >
                  <option value={-1}>Current Plan</option>
                  {planHistory.map((plan, idx) => (
                    <option key={idx} value={idx}>Archived {plan.updated_at ? `(${plan.updated_at})` : `#${idx+1}`}</option>
                  ))}
                </select>
                <div className="bg-gray-800 rounded p-3 min-h-[200px] max-h-[400px] overflow-auto text-sm break-words overflow-wrap break-word whitespace-pre-line">
                  <ReactMarkdown>{getPlanByIdx(compareIdxA)}</ReactMarkdown>
                </div>
              </div>
              <div className="flex-1 min-w-[320px] max-w-[50vw]">
                <label className="block text-xs mb-1">Plan B</label>
                <select
                  className="w-full bg-gray-800 text-gray-200 rounded px-2 py-1 mb-2"
                  value={compareIdxB ?? (planHistory.length > 0 ? 0 : -1)}
                  onChange={e => setCompareIdxB(Number(e.target.value))}
                >
                  <option value={-1}>Current Plan</option>
                  {planHistory.map((plan, idx) => (
                    <option key={idx} value={idx}>Archived {plan.updated_at ? `(${plan.updated_at})` : `#${idx+1}`}</option>
                  ))}
                </select>
                <div className="bg-gray-800 rounded p-3 min-h-[200px] max-h-[400px] overflow-auto text-sm break-words overflow-wrap break-word whitespace-pre-line">
                  <ReactMarkdown>{getPlanByIdx(compareIdxB)}</ReactMarkdown>
                </div>
              </div>
            </div>
            {/* Optional: Add a simple diff view below (textual diff, highlight lines that differ) */}
            {compareIdxA !== null && compareIdxB !== null && (
              <div className="mt-2 flex flex-col md:flex-row gap-4 text-xs overflow-x-auto">
                <div className="flex-1 bg-gray-950 rounded p-2 overflow-auto min-w-[200px] max-w-[50vw] break-words overflow-wrap break-word whitespace-pre-line">
                  <span className="font-bold">Plan A only:</span>
                  <ul className="list-disc ml-4">
                    {getPlanByIdx(compareIdxA)
                      .split('\n')
                      .filter((line: string) => !getPlanByIdx(compareIdxB).split('\n').includes(line) && line.trim() !== "")
                      .map((line: string, i: number) => <li key={i} className="text-red-400">{line}</li>)}
                  </ul>
                </div>
                <div className="flex-1 bg-gray-950 rounded p-2 overflow-auto min-w-[200px] max-w-[50vw] break-words overflow-wrap break-word whitespace-pre-line">
                  <span className="font-bold">Plan B only:</span>
                  <ul className="list-disc ml-4">
                    {getPlanByIdx(compareIdxB)
                      .split('\n')
                      .filter((line: string) => !getPlanByIdx(compareIdxA).split('\n').includes(line) && line.trim() !== "")
                      .map((line: string, i: number) => <li key={i} className="text-green-400">{line}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
