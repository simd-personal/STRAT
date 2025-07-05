"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import HoverSidebar from "../components/HoverSidebar";
import { notify } from '../components/notify';
import GoogleOpsMap from '../components/GoogleOpsMap';

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

const BACKEND_URL = 'http://localhost:8000';

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

  // Simulation state
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error' | 'stalled'>('idle');
  const [simulationTime, setSimulationTime] = useState('0600');
  const [simulationDuration, setSimulationDuration] = useState(0);
  const [simulationAssets, setSimulationAssets] = useState<any>({});
  const [simulationThreats, setSimulationThreats] = useState<any>({});
  const [simulationWeather, setSimulationWeather] = useState<any>({});
  const [simulationTimeline, setSimulationTimeline] = useState<any[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(5);
  const [showSimulationPanel, setShowSimulationPanel] = useState(true);
  const [injectEventDescription, setInjectEventDescription] = useState('');
  const [showInjectModal, setShowInjectModal] = useState(false);

  // Add new state for event buffer
  const eventBufferRef = useRef<any[]>([]);
  const [bufferedTimeline, setBufferedTimeline] = useState<any[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Add new state for simulation starting
  const [simulationStarting, setSimulationStarting] = useState(false);

  // Add new state for reports
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [aarReport, setAarReport] = useState<{ mission_name: string; summary: string } | null>(null);
  const [aarLoading, setAarLoading] = useState(false);
  const [aarError, setAarError] = useState<string | null>(null);

  // Incident Management state
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchUnit, setDispatchUnit] = useState("");
  const availableUnits = [
    "Alpha-1", "Alpha-2", "Bravo-1", "Bravo-2", 
    "Charlie-1", "Delta-1", "Echo-1", "Foxtrot-1"
  ];

  // Add state for units
  const [units, setUnits] = useState<any[]>([]);

  // Add new state for injecting event
  const [injectingEvent, setInjectingEvent] = useState(false);

  // Fetch units from /api/assets
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/assets');
        const data = await response.json();
        // Convert asset object to array with id
        const arr = Object.entries(data.assets || {}).map(([id, asset]) => (typeof asset === 'object' && asset !== null ? { ...asset, id } : { id }));
        setUnits(arr);
      } catch (error) {
        console.error('Failed to fetch units:', error);
      }
    };
    fetchUnits();
    const interval = setInterval(fetchUnits, 5000);
    return () => clearInterval(interval);
  }, []);

  // Disable controls if simulation is completed or stalled
  const controlsDisabled = simulationStatus === 'completed' || simulationStatus === 'stalled';

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

  // Fetch incidents on mount and poll for updates
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/incidents`);
        const data = await response.json();
        setIncidents(data.incidents || []);
      } catch (error) {
        console.error("Failed to fetch incidents:", error);
      }
    };
    
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
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
        notify.success(`Location extracted: ${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`);
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
          notify.success(`Location found: ${data.location_name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
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
    if (!mapCoords) {
      notify.info("No location data found in document. Map will show default view.");
    }
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
    setSitrepVersion(sitrepVersion + 1);
    setSitrepStatus("draft");
    setSitrepHistory([...sitrepHistory, { content: sitrep, version: sitrepVersion, status: sitrepStatus, date: new Date().toISOString() }]);
    setSitrep("");
  };

  // Simulation API functions
  const fetchSimulationStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/status`);
      const data = await response.json();
      setSimulationStatus(data.status);
      setSimulationTime(data.current_time);
      setSimulationDuration(data.mission_duration);
      setSimulationAssets(data.assets);
      setSimulationThreats(data.threats);
      setSimulationWeather(data.weather);
      setSimulationTimeline(data.timeline || []);
    } catch (error) {
      console.error('Error fetching simulation status:', error);
    }
  };

  const startSimulation = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/start`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setSimulationStatus('running');
        logUserAction("Simulation", "Mission simulation started");
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
    }
  };

  const startRealTimeSimulation = async () => {
    notify.info('Starting real-time simulation...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/start-realtime`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setSimulationStatus('running');
        notify.success('Real-time simulation started');
        logUserAction("Simulation", "Real-time mission simulation started");
      } else {
        notify.error('Failed to start real-time simulation');
      }
    } catch (error) {
      notify.error('Error starting real-time simulation');
    }
  };

  const pauseSimulation = async () => {
    notify.info('Pausing simulation...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/pause`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setSimulationStatus('paused');
        notify.success('Simulation paused');
        logUserAction("Simulation", "Simulation paused");
      } else {
        notify.error('Failed to pause simulation');
      }
    } catch (error) {
      notify.error('Error pausing simulation');
    }
  };

  const resumeSimulation = async () => {
    notify.info('Resuming simulation...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/resume`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setSimulationStatus('running');
        notify.success('Simulation resumed');
        logUserAction("Simulation", "Simulation resumed");
      } else {
        notify.error('Failed to resume simulation');
      }
    } catch (error) {
      notify.error('Error resuming simulation');
    }
  };

  const stopSimulation = async () => {
    notify.info('Stopping simulation...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/stop`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setSimulationStatus('idle');
        notify.success('Simulation stopped');
        logUserAction("Simulation", "Simulation stopped");
      } else {
        notify.error('Failed to stop simulation');
      }
    } catch (error) {
      notify.error('Error stopping simulation');
    }
  };

  const stepSimulation = async () => {
    notify.info('Stepping simulation...');
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/step`, { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        await fetchSimulationStatus();
        notify.success('Simulation step executed');
        logUserAction("Simulation", "Simulation step executed");
      } else {
        notify.error('Failed to step simulation');
      }
    } catch (error) {
      notify.error('Error stepping simulation');
    }
  };

  const injectEvent = async () => {
    if (!injectEventDescription.trim()) return;
    setInjectingEvent(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: injectEventDescription })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setInjectEventDescription('');
        setShowInjectModal(false);
        await fetchSimulationStatus();
        logUserAction("Simulation", `Event injected: ${injectEventDescription}`);
      }
    } catch (error) {
      notify.error('Error injecting event');
    } finally {
      setInjectingEvent(false);
    }
  };

  const updateSimulationSpeed = async (speed: number) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/simulation/set-speed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSimulationSpeed(speed);
        logUserAction("Simulation", `Simulation speed set to ${speed} seconds`);
      }
    } catch (error) {
      notify.error('Error setting simulation speed');
    }
  };

  // Buffer and smooth timeline updates
  useEffect(() => {
    if (simulationStatus === 'running') {
      setTimelineLoading(true);
      const bufferTimeout = setTimeout(() => {
        setBufferedTimeline(simulationTimeline);
        setTimelineLoading(false);
        // Hide spinner when the first event is received
        if (simulationTimeline.length > 0) {
          setSimulationStarting(false);
        }
      }, 1000);
      return () => clearTimeout(bufferTimeout);
    } else {
      setBufferedTimeline(simulationTimeline);
      setTimelineLoading(false);
    }
  }, [simulationTimeline, simulationStatus]);

  // Poll simulation status when running
  useEffect(() => {
    if (simulationStatus === 'running') {
      const interval = setInterval(fetchSimulationStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [simulationStatus]);

  // Initial fetch of simulation status
  useEffect(() => {
    fetchSimulationStatus();
  }, []);

  // Start fast simulation
  const startFastSimulation = async () => {
    setSimulationStarting(true);
    notify.info('Starting simulation...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/simulation/start-fast`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setSimulationStatus("running");
        notify.success('Simulation started');
      } else {
        notify.error('Failed to start simulation');
      }
    } catch (err) {
      notify.error('Error starting simulation');
    } finally {
      setSimulationStarting(false);
    }
  };

  // Update speed slider to control fast simulation speed
  const updateFastSimulationSpeed = async (speed: number) => {
    setSimulationSpeed(speed);
    await fetch(`${BACKEND_URL}/api/simulation/set-fast-speed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speed }),
    });
  };

  // Add a useEffect to watch simulationStatus and show toasts for completed/stalled
  useEffect(() => {
    if (simulationStatus === 'completed') {
      notify.success('Mission completed!');
      logUserAction('Simulation', 'Mission completed');
    } else if (simulationStatus === 'stalled') {
      notify.error('Simulation stalled: only weather events generated for several steps.');
      logUserAction('Simulation', 'Simulation stalled: only weather events generated for several steps.');
    }
  }, [simulationStatus]);

  // Fetch AAR
  const fetchAAR = async () => {
    setAarLoading(true);
    setAarError(null);
    try {
      const res = await fetch('http://localhost:8000/api/reports/aar');
      const data = await res.json();
      if (data.status === 'success') {
        setAarReport(data.aar);
      } else {
        setAarError(data.message || 'No report available');
      }
    } catch (err) {
      setAarError('Failed to fetch report');
    } finally {
      setAarLoading(false);
    }
  };

  // Incident Management Functions
  const handleIncidentClick = (incident: any) => {
    setSelectedIncident(incident);
    setShowIncidentModal(true);
  };

  const handleDispatchUnit = async () => {
    if (!selectedIncident || !dispatchUnit) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.incident_id,
          unit_id: dispatchUnit
        })
      });
      
      if (response.ok) {
        notify.success(`Unit ${dispatchUnit} dispatched to incident`);
        setShowDispatchModal(false);
        setSelectedIncident(null);
        setDispatchUnit("");
        // Refresh incidents
        const res = await fetch(`${BACKEND_URL}/api/incidents`);
        const data = await res.json();
        setIncidents(data.incidents || []);
      } else {
        notify.error("Failed to dispatch unit");
      }
    } catch (error) {
      notify.error("Failed to dispatch unit");
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "resolved" })
      });
      
      if (response.ok) {
        notify.success("Incident resolved");
        // Refresh incidents
        const res = await fetch(`${BACKEND_URL}/api/incidents`);
        const data = await res.json();
        setIncidents(data.incidents || []);
      } else {
        notify.error("Failed to resolve incident");
      }
    } catch (error) {
      notify.error("Failed to resolve incident");
    }
  };

  const getIncidentColor = (status: string) => {
    switch (status) {
      case "new": return "#3B82F6"; // blue
      case "dispatched": return "#F59E0B"; // yellow
      case "resolved": return "#10B981"; // green
      default: return "#6B7280"; // gray
    }
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

      <HoverSidebar />
      <div className="ml-64 relative z-50">
        {/* Main Dashboard Grid */}
        <main className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 relative z-50">
          {/* Upload Mission Docs (with summary inside) */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 min-h-[300px] flex flex-col">
            <h3 className="text-lg font-bold mb-2 text-white font-mono tracking-widest">Upload Mission Docs</h3>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-400">Accepts PDF, TXT, CSV, JSON, images, and video files</span>
              <input
                type="file"
                accept=".pdf,.txt,.csv,.json,image/*,video/*"
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
            {/* Improved AI Summary Card */}
            {(summary || pdfFile) && (
              <div className="bg-gray-900/90 rounded-xl p-6 mt-6 border border-gray-800 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20.5C7.305 20.5 3.5 16.695 3.5 12S7.305 3.5 12 3.5 20.5 7.305 20.5 12 16.695 20.5 12 20.5z" />
                  </svg>
                  <h4 className="text-lg font-bold text-white tracking-widest font-mono">AI-Generated Mission Summary</h4>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-h-60 overflow-y-auto">
                  {summary ? (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">AI-generated summary will appear here after upload.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Operational Map */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white font-mono tracking-widest">Operational Map</h3>
              <div className="flex items-center gap-2">
                {mapCoords && (
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded border border-green-700">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>Mission Location: {mapCoords.lat.toFixed(4)}, {mapCoords.lng.toFixed(4)}</span>
                  </div>
                )}
                {mapCoords && (
                  <button
                    onClick={() => {
                      setMapCoords(null);
                      notify.info("Location data cleared");
                    }}
                    className="text-xs text-gray-400 hover:text-red-400 bg-gray-800 hover:bg-red-900/50 px-2 py-1 rounded border border-gray-700 hover:border-red-700 transition-colors"
                    title="Clear location data"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500 italic border-2 border-dashed border-gray-700 rounded-lg relative z-10 overflow-hidden">
              <div className="w-full h-full relative z-10 overflow-hidden" style={{ minHeight: 200 }}>
                <GoogleOpsMap 
                  units={units} 
                  incidents={incidents} 
                  center={mapCoords || { lat: 39.8283, lng: -98.5795 }}
                  zoom={mapCoords ? 12 : 5}
                  missionLocation={mapCoords}
                />
              </div>
            </div>
          </div>

          {/* Mission Planning */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 min-h-[300px] flex flex-col relative">
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
                className="w-full min-h-[150px] bg-gray-800 text-gray-200 rounded px-4 py-3 font-mono tracking-widest mb-2 text-base leading-relaxed resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-700"
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

          {/* Mission Simulation */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white font-mono tracking-widest">Mission Simulation</h3>
              <button
                className="bg-blue-800 hover:bg-blue-900 text-xs text-white px-3 py-1 rounded font-mono border border-gray-700"
                onClick={() => setShowSimulationPanel(!showSimulationPanel)}
              >
                {showSimulationPanel ? 'Hide' : 'Show'} Timeline
              </button>
            </div>
            {/* Simulation Controls */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className="px-3 py-2 rounded font-mono text-xs font-bold border bg-blue-800 border-blue-600 text-blue-200 hover:bg-blue-700 transition"
                onClick={startFastSimulation}
                disabled={controlsDisabled || simulationStarting}
              >
                Start Simulation
              </button>
              <button
                className={`px-3 py-2 rounded font-mono text-xs font-bold border transition ${
                  simulationStatus === 'idle' 
                    ? 'bg-blue-800 border-blue-600 text-blue-200 hover:bg-blue-700' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
                onClick={startRealTimeSimulation}
                disabled={controlsDisabled}
              >
                Start Real-Time
              </button>
              <button
                className={`px-3 py-2 rounded font-mono text-xs font-bold border transition ${
                  simulationStatus === 'running' 
                    ? 'bg-yellow-800 border-yellow-600 text-yellow-200 hover:bg-yellow-700' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
                onClick={pauseSimulation}
                disabled={controlsDisabled}
              >
                Pause
              </button>
              <button
                className={`px-3 py-2 rounded font-mono text-xs font-bold border transition ${
                  simulationStatus === 'paused' 
                    ? 'bg-green-800 border-green-600 text-green-200 hover:bg-green-700' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
                onClick={resumeSimulation}
                disabled={controlsDisabled}
              >
                Resume
              </button>
              <button
                className={`px-3 py-2 rounded font-mono text-xs font-bold border transition ${
                  simulationStatus !== 'idle' 
                    ? 'bg-red-800 border-red-600 text-red-200 hover:bg-red-700' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
                onClick={stopSimulation}
                disabled={controlsDisabled}
              >
                Stop
              </button>
              <button
                className="px-3 py-2 rounded font-mono text-xs font-bold border bg-purple-800 border-purple-600 text-purple-200 hover:bg-purple-700 transition"
                onClick={stepSimulation}
                disabled={controlsDisabled}
              >
                Step Forward
              </button>
              <button
                className="px-3 py-2 rounded font-mono text-xs font-bold border bg-orange-800 border-orange-600 text-orange-200 hover:bg-orange-700 transition"
                onClick={() => setShowInjectModal(true)}
              >
                Inject Event
              </button>
              <button
                className="px-3 py-2 rounded font-mono text-xs font-bold border bg-gray-700 border-gray-600 text-white hover:bg-gray-800 transition"
                onClick={() => { setShowReportsModal(true); fetchAAR(); }}
              >
                Reports
              </button>
            </div>
            {/* Simulation Status */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="text-gray-400 font-mono">Status</div>
                <div className={`font-bold ${simulationStatus === 'running' ? 'text-green-400' : simulationStatus === 'paused' ? 'text-yellow-400' : simulationStatus === 'completed' ? 'text-blue-400' : 'text-gray-400'}`}>
                  {simulationStatus.toUpperCase()}
                </div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="text-gray-400 font-mono">Time</div>
                <div className="font-bold text-white">{simulationTime}</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="text-gray-400 font-mono">Duration</div>
                <div className="font-bold text-white">{simulationDuration} min</div>
              </div>
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                <div className="text-gray-400 font-mono">Speed</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={simulationSpeed}
                    onChange={(e) => updateFastSimulationSpeed(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-white">{simulationSpeed}s</span>
                </div>
              </div>
            </div>

            {/* Simulation Timeline */}
            {showSimulationPanel && (
              <div className="bg-gray-800/50 rounded border border-gray-700 p-6 max-h-96 overflow-y-auto relative z-30">
                <h4 className="font-bold text-white mb-4 font-mono tracking-widest text-lg">Timeline</h4>
                {simulationStarting && (
                  <div className="flex items-center justify-center gap-2 text-blue-400 mb-4 animate-pulse">
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <span>Starting simulation...</span>
                  </div>
                )}
                {timelineLoading && simulationStatus === 'running' && (
                  <div className="flex items-center justify-center gap-2 text-blue-400 mb-4 animate-pulse">
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <span>Waiting for next event...</span>
                  </div>
                )}
                {bufferedTimeline.length > 0 ? (
                  <div className="space-y-3">
                    {bufferedTimeline.slice().reverse().map((event, index) => (
                      <div key={index} className="bg-gray-700/50 p-4 rounded border-l-4 border-blue-500 hover:bg-gray-700/70 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-blue-400 font-mono">{event.time}</span>
                          <span className={`px-3 py-1 rounded text-sm font-bold ${
                            event.type === 'asset' ? 'bg-green-700' : 
                            event.type === 'threat' ? 'bg-red-700' : 
                            event.type === 'weather' ? 'bg-blue-700' : 'bg-gray-700'
                          }`}>
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-base text-white leading-relaxed">{event.narrative}</div>
                        {event.details && (
                          <details className="mt-3">
                            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 font-medium">Details</summary>
                            <pre className="text-sm text-gray-300 mt-2 bg-gray-800 p-3 rounded overflow-x-auto border border-gray-600">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center py-12 text-lg">No simulation events yet. Start the simulation to see the timeline.</div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Bottom Section - Logs & Intel and SITREP side by side */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Logs/Intel Threads - Bigger and better proportioned */}
          <div className="bg-gray-900/80 rounded-xl p-6 shadow-lg border border-gray-800 min-h-[400px] flex flex-col">
            <h4 className="font-bold text-white mb-4 font-mono tracking-widest text-lg flex items-center gap-2">
              Logs & Intel
              <select
                className="ml-auto bg-gray-800 text-gray-200 rounded px-3 py-1 text-sm border border-gray-700"
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
            <div className="text-sm text-gray-400 font-mono tracking-widest flex-1 overflow-y-auto">
              {logs.length > 0 ? (
                logs.slice().reverse().map((log, i) => (
                  <div key={i} className="mb-3 p-3 rounded bg-gray-800/70 flex flex-col gap-2 border-l-4" style={{ borderColor: EVENT_TYPE_COLORS[log.event_type as keyof typeof EVENT_TYPE_COLORS] || '#444' }}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm font-bold ${EVENT_TYPE_COLORS[log.event_type as keyof typeof EVENT_TYPE_COLORS] || 'bg-gray-700'}`}>{log.event_type}</span>
                      <span className="text-gray-500 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <span className="text-white text-base">{log.message}</span>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="text-gray-400 text-sm">
                        <summary className="cursor-pointer hover:text-gray-300">Details</summary>
                        <pre className="mt-2 bg-gray-900 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">Mission logs and intel threads will appear here.</div>
              )}
            </div>
          </div>

          {/* SITREP Panel - Bigger and better proportioned */}
          <div className="bg-gray-900/90 rounded-xl p-6 shadow-lg border border-gray-800 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-bold tracking-wide text-white">SITREP</h3>
              <span className={`text-xs px-2 py-1 rounded bg-${sitrepStatus === 'approved' ? 'green' : 'yellow'}-700 text-white ml-2`}>{sitrepStatus.toUpperCase()}</span>
              <span className="text-xs text-gray-400 ml-2">v{sitrepVersion}</span>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button className="bg-green-800 hover:bg-green-700 text-sm px-3 py-1 rounded font-mono" onClick={approveSitrep} disabled={sitrepStatus==='approved'}>Approve</button>
              <button className="bg-blue-800 hover:bg-blue-700 text-sm px-3 py-1 rounded font-mono" onClick={shareSitrep}>Share with team</button>
              <button className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1 rounded font-mono" onClick={startNewSitrepDraft} disabled={sitrepStatus==='draft'}>New Draft</button>
              <button className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1 rounded font-mono" onClick={()=>setSitrepPreview(!sitrepPreview)}>{sitrepPreview ? 'Edit' : 'Preview'}</button>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="relative flex-1">
                {sitrepPreview ? (
                  <div className="bg-gray-800 rounded p-4 h-full text-gray-200 text-base overflow-auto border border-gray-700" style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>
                    <ReactMarkdown>{sitrep || '*No SITREP provided.*'}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    className="w-full h-full bg-gray-800 text-gray-200 rounded px-4 py-3 font-mono text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-700 border border-gray-700"
                    style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}
                    value={sitrep}
                    onChange={e => setSitrep(e.target.value)}
                    disabled={sitrepStatus==='approved'}
                    placeholder="Type or paste the latest SITREP here..."
                  />
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">(Situation Report: Up-to-date summary of the mission)</div>
              <div className="text-xs text-gray-400 mt-1">History: {sitrepHistory.length} versions</div>
            </div>
          </div>
        </section>
      </div>

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

      {/* Inject Event Modal */}
      {showInjectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-800 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
              onClick={() => setShowInjectModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-white">Inject Event</h2>
            <p className="text-gray-400 text-sm mb-4">
              Describe an event to inject into the simulation (e.g., &quot;Sniper ambush from east&quot;, &quot;Weather change to heavy rain&quot;)
            </p>
            <textarea
              className="w-full bg-gray-800 text-gray-200 rounded px-4 py-3 font-mono text-sm leading-relaxed resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-700 border border-gray-700 mb-4"
              value={injectEventDescription}
              onChange={(e) => setInjectEventDescription(e.target.value)}
              placeholder="Describe the event to inject..."
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-mono text-sm"
                onClick={() => setShowInjectModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-orange-800 hover:bg-orange-700 text-white px-4 py-2 rounded font-mono text-sm flex items-center justify-center min-w-[120px]"
                onClick={injectEvent}
                disabled={!injectEventDescription.trim() || injectingEvent}
              >
                {injectingEvent ? (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : null}
                {injectingEvent ? 'Injecting...' : 'Inject Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-lg w-full shadow-lg border border-gray-800 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
              onClick={() => setShowReportsModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-white">After Action Report</h2>
            {aarLoading ? (
              <div className="flex items-center gap-2 text-blue-400 animate-pulse mb-4">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Loading report...</span>
              </div>
            ) : aarError ? (
              <div className="text-red-400 font-mono mb-4">{aarError}</div>
            ) : aarReport ? (
              <div>
                <div className="font-bold text-white mb-2">Mission: {aarReport.mission_name}</div>
                <button
                  className="mb-2 bg-blue-800 hover:bg-blue-900 text-xs text-white px-3 py-1 rounded font-mono border border-blue-700 transition"
                  onClick={() => {
                    navigator.clipboard.writeText(aarReport.summary);
                    notify.success('AAR copied to clipboard!');
                  }}
                >
                  Copy Report
                </button>
                <pre className="bg-gray-800 text-gray-200 rounded p-4 whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-700">{aarReport.summary}</pre>
              </div>
            ) : (
              <div className="text-gray-400 font-mono">No report available.</div>
            )}
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {showIncidentModal && selectedIncident && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-800 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
              onClick={() => setShowIncidentModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-white">Incident Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Type</label>
                <div className="text-white font-semibold">{selectedIncident.type}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Priority</label>
                <div className="text-white font-semibold capitalize">{selectedIncident.priority}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Status</label>
                <div className="text-white font-semibold capitalize">{selectedIncident.status}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Location</label>
                <div className="text-white font-mono text-sm">
                  {selectedIncident.location.lat.toFixed(4)}, {selectedIncident.location.lng.toFixed(4)}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Description</label>
                <div className="text-white">{selectedIncident.description || "No description"}</div>
              </div>
              <div>
                <label className="text-gray-400 text-sm">Created</label>
                <div className="text-white text-sm">
                  {new Date(selectedIncident.created_at).toLocaleString()}
                </div>
              </div>
              {selectedIncident.assigned_units && selectedIncident.assigned_units.length > 0 && (
                <div>
                  <label className="text-gray-400 text-sm">Assigned Units</label>
                  <div className="text-white text-sm">
                    {selectedIncident.assigned_units.join(", ")}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              {selectedIncident.status !== "resolved" && (
                <>
                  <button
                    onClick={() => {
                      setShowIncidentModal(false);
                      setShowDispatchModal(true);
                    }}
                    className="flex-1 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded font-mono text-sm"
                  >
                    Dispatch Unit
                  </button>
                  <button
                    onClick={() => {
                      handleResolveIncident(selectedIncident.incident_id);
                      setShowIncidentModal(false);
                    }}
                    className="flex-1 bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded font-mono text-sm"
                  >
                    Resolve
                  </button>
                </>
              )}
              <button
                onClick={() => setShowIncidentModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-mono text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedIncident && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-800 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
              onClick={() => setShowDispatchModal(false)}
              title="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-white">Dispatch Unit</h2>
            <p className="text-gray-400 text-sm mb-4">
              Assign a unit to incident: {selectedIncident.type}
            </p>
            <select
              value={dispatchUnit}
              onChange={(e) => setDispatchUnit(e.target.value)}
              className="w-full bg-gray-800 text-gray-200 rounded px-4 py-2 mb-4 border border-gray-700"
            >
              <option value="">Select Unit</option>
              {availableUnits.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleDispatchUnit}
                disabled={!dispatchUnit}
                className="flex-1 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded font-mono text-sm disabled:opacity-50"
              >
                Dispatch
              </button>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-mono text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
