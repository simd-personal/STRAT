"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import HoverSidebar from "../../components/HoverSidebar";

const Map = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Map), { ssr: false });
const Marker = dynamic(() => import("react-map-gl/mapbox").then(mod => mod.Marker), { ssr: false });

const MAPBOX_TOKEN = "pk.eyJ1Ijoic3NkMzYwIiwiYSI6ImNtYzlzNGh6NTF3bXMyanEwdWttajNrZjUifQ.9sOzbXQl4ORfE8Ys6oJOdg";

interface Route {
  name: string;
  description: string;
  waypoints: Array<{lat: number; lng: number}>;
  scores: {
    stealth: number;
    time: number;
    risk: number;
  };
  total_score: number;
  estimated_time: string;
  notes: string;
}

interface RouteResults {
  routes: Route[];
  threat_analysis: string;
  recommendation: string;
  context: {
    start_location: string;
    end_location: string;
    weather: string;
    threats: string[];
  };
}

export default function RouteOptimization() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [threats, setThreats] = useState<string[]>([]);
  const [newThreat, setNewThreat] = useState("");
  const [weather, setWeather] = useState("Clear");
  const [terrain, setTerrain] = useState<File | null>(null);
  const [prompt, setPrompt] = useState(`Given the unit's start and end locations, threat locations, and terrain data, evaluate 3 possible infiltration routes. Score them on:\n- Stealth\n- Time to objective\n- Risk of enemy contact`);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState<RouteResults | null>(null);
  const [error, setError] = useState("");
  const [viewState, setViewState] = useState({
    longitude: -98.5795,
    latitude: 39.8283,
    zoom: 3,
    bearing: 0,
    pitch: 0,
  });

  const handleAddThreat = () => {
    if (newThreat.trim()) {
      setThreats([...threats, newThreat.trim()]);
      setNewThreat("");
    }
  };

  const handleRemoveThreat = (idx: number) => {
    setThreats(threats.filter((_, i) => i !== idx));
  };

  const evaluateRoutes = async () => {
    if (!start || !end) {
      setError("Start and end locations are required");
      return;
    }

    setEvaluating(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("start_location", start);
      formData.append("end_location", end);
      formData.append("threats", JSON.stringify(threats));
      formData.append("weather", weather);
      formData.append("custom_prompt", prompt);
      
      if (terrain) {
        formData.append("terrain_file", terrain);
      }

      const response = await fetch("http://localhost:8000/api/route-optimization/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (data.status === "success") {
        setResults(data);
        // Update map view to show routes
        if (data.routes && data.routes.length > 0) {
          const firstRoute = data.routes[0];
          if (firstRoute.waypoints && firstRoute.waypoints.length > 0) {
            const center = firstRoute.waypoints[Math.floor(firstRoute.waypoints.length / 2)];
            setViewState({
              longitude: center.lng,
              latitude: center.lat,
              zoom: 10,
              bearing: 0,
              pitch: 0,
            });
          }
        }
      } else {
        setError(data.message || "Failed to evaluate routes");
      }
    } catch (err) {
      setError("Error connecting to backend");
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return "text-green-400";
    if (score <= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score <= 3) return "bg-green-900";
    if (score <= 6) return "bg-yellow-900";
    return "bg-red-900";
  };

  return (
    <>
      <HoverSidebar />
      <div className="max-w-6xl mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-2">🎯 Route Optimization Under Threat</h1>
        <p className="text-gray-300 mb-6">AI selects the safest or fastest infiltration/exfil path based on mission plan, terrain, and threat data. Outputs a risk-ranked list of routes and map overlays.</p>
        
        {/* Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Start Location (lat,lng or name)</label>
              <input 
                className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-700 focus:border-green-500 focus:outline-none" 
                value={start} 
                onChange={e => setStart(e.target.value)} 
                placeholder="e.g. 34.05,-118.25 or LZ Alpha" 
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">End Location (lat,lng or name)</label>
              <input 
                className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-700 focus:border-green-500 focus:outline-none" 
                value={end} 
                onChange={e => setEnd(e.target.value)} 
                placeholder="e.g. 33.94,-117.40 or LZ Bravo" 
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Threat Locations</label>
              <div className="flex gap-2 mb-2">
                <input 
                  className="flex-1 bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-700 focus:border-green-500 focus:outline-none" 
                  value={newThreat} 
                  onChange={e => setNewThreat(e.target.value)} 
                  placeholder="e.g. 34.01,-118.20 or Enemy Outpost" 
                />
                <button 
                  className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded border border-green-600" 
                  onClick={handleAddThreat}
                >
                  Add
                </button>
              </div>
              <ul className="text-sm text-gray-300 space-y-1">
                {threats.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 bg-gray-800 p-2 rounded">
                    <span className="flex-1">{t}</span>
                    <button 
                      className="text-red-400 hover:text-red-600 text-xs" 
                      onClick={() => handleRemoveThreat(i)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Weather / Visibility</label>
              <select 
                className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-700 focus:border-green-500 focus:outline-none" 
                value={weather} 
                onChange={e => setWeather(e.target.value)}
              >
                <option>Clear</option>
                <option>Foggy</option>
                <option>Rainy</option>
                <option>Night</option>
                <option>Low Visibility</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Terrain Map (optional)</label>
              <input 
                type="file" 
                className="w-full text-gray-200 bg-gray-800 rounded px-3 py-2 border border-gray-700 focus:border-green-500 focus:outline-none" 
                onChange={e => setTerrain(e.target.files?.[0] || null)} 
              />
              {terrain && <div className="text-xs text-gray-400 mt-1">Selected: {terrain.name}</div>}
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Custom Prompt</label>
              {editingPrompt ? (
                <textarea 
                  className="w-full bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-700 focus:border-green-500 focus:outline-none" 
                  value={prompt} 
                  onChange={e => setPrompt(e.target.value)} 
                  rows={4} 
                />
              ) : (
                <pre className="bg-gray-800 rounded px-3 py-2 text-gray-200 border border-gray-700 whitespace-pre-wrap text-sm">{prompt}</pre>
              )}
              <div className="flex gap-2 mt-2">
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs border border-gray-600" 
                  onClick={() => setEditingPrompt(!editingPrompt)}
                >
                  {editingPrompt ? "Save" : "Edit Prompt"}
                </button>
                <button 
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs border border-gray-600" 
                  onClick={() => navigator.clipboard.writeText(prompt)}
                >
                  Copy Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action */}
        <div className="flex justify-center mb-8">
          <button 
            className="bg-blue-800 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={evaluateRoutes}
            disabled={evaluating || !start || !end}
          >
            {evaluating ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Evaluating Routes...
              </span>
            ) : (
              "Evaluate Routes"
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}
        
        {/* Results */}
        {results && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-green-300 mb-4">🧠 Route Evaluation Results</h2>
            
            {/* Route Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {results.routes.map((route, idx) => (
                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2">{route.name}</h3>
                  <p className="text-gray-300 text-sm mb-3">{route.description}</p>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Stealth:</span>
                      <span className={`font-bold ${getScoreColor(route.scores.stealth)}`}>
                        {route.scores.stealth}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Time:</span>
                      <span className={`font-bold ${getScoreColor(route.scores.time)}`}>
                        {route.scores.time}/10
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Risk:</span>
                      <span className={`font-bold ${getScoreColor(route.scores.risk)}`}>
                        {route.scores.risk}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded p-2 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{route.total_score}</div>
                      <div className="text-xs text-gray-400">Total Score</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-300">
                    <div className="mb-1"><strong>Time:</strong> {route.estimated_time}</div>
                    <div><strong>Notes:</strong> {route.notes}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Threat Analysis */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-300 mb-2">⚠️ Threat Analysis</h3>
              <p className="text-gray-300">{results.threat_analysis}</p>
            </div>
            
            {/* Recommendation */}
            <div className="bg-green-900 border border-green-700 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-200 mb-2">🎯 Recommendation</h3>
              <p className="text-green-100">{results.recommendation}</p>
            </div>
          </div>
        )}
        
        {/* Map Overlay */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-green-300 mb-4">🗺️ Route Map</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-96">
            <Map
              viewState={viewState}
              onMove={evt => setViewState(evt.viewState)}
              style={{ width: "100%", height: "100%", borderRadius: "0.5rem" }}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              {/* Start Marker */}
              {start && (
                <Marker longitude={-118.25} latitude={34.05} anchor="bottom">
                  <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    S
                  </div>
                </Marker>
              )}
              
              {/* End Marker */}
              {end && (
                <Marker longitude={-117.40} latitude={33.94} anchor="bottom">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    E
                  </div>
                </Marker>
              )}
              
              {/* Threat Markers */}
              {threats.map((threat, idx) => (
                <Marker key={idx} longitude={-118.20 + idx * 0.01} latitude={34.01 + idx * 0.01} anchor="bottom">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></div>
                </Marker>
              ))}
              
              {/* Route Waypoints */}
              {results?.routes.map((route, routeIdx) => 
                route.waypoints.map((waypoint, wpIdx) => (
                  <Marker key={`${routeIdx}-${wpIdx}`} longitude={waypoint.lng} latitude={waypoint.lat} anchor="bottom">
                    <div className={`w-3 h-3 rounded-full border-2 border-white ${
                      routeIdx === 0 ? 'bg-blue-500' : 
                      routeIdx === 1 ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                  </Marker>
                ))
              )}
            </Map>
          </div>
        </div>
      </div>
    </>
  );
} 