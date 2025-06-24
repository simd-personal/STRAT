"use client";

import React, { useState } from "react";
import HoverSidebar from "../../components/HoverSidebar";

interface AARInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  priority: 'high' | 'medium' | 'low';
  action_items: string[];
  timestamp: string;
}

interface MissionEvent {
  id: string;
  time: string;
  event: string;
  outcome: string;
  lessons: string[];
}

export default function AARInsights() {
  const [insights, setInsights] = useState<AARInsight[]>([
    {
      id: "1",
      category: "Communication",
      title: "Radio Frequency Interference",
      description: "Experienced intermittent comms during critical phase due to urban environment interference.",
      impact: 'negative',
      priority: 'high',
      action_items: ["Implement backup comms plan", "Test frequencies in urban environment", "Train on signal procedures"],
      timestamp: "2024-01-15T08:00:00Z"
    },
    {
      id: "2",
      category: "Tactics",
      title: "Successful Infiltration Route",
      description: "Route Alpha provided excellent cover and concealment, allowing undetected approach to objective.",
      impact: 'positive',
      priority: 'medium',
      action_items: ["Document route characteristics", "Share with other teams", "Consider for future missions"],
      timestamp: "2024-01-15T06:30:00Z"
    },
    {
      id: "3",
      category: "Equipment",
      title: "Night Vision Performance",
      description: "NVGs performed exceptionally well in low-light conditions, providing clear visibility.",
      impact: 'positive',
      priority: 'low',
      action_items: ["Maintain current NVG inventory", "Continue training program"],
      timestamp: "2024-01-15T07:15:00Z"
    }
  ]);

  const [events, setEvents] = useState<MissionEvent[]>([
    {
      id: "1",
      time: "0600",
      event: "Team Insertion",
      outcome: "Successful insertion at LZ Alpha",
      lessons: ["Insertion timing was optimal", "LZ selection provided good cover"]
    },
    {
      id: "2",
      time: "0630",
      event: "Route Movement",
      outcome: "Undetected movement to objective",
      lessons: ["Route planning was effective", "Team discipline maintained"]
    },
    {
      id: "3",
      time: "0800",
      event: "Objective Reached",
      outcome: "Successfully reached observation post",
      lessons: ["Timeline was accurate", "No enemy contact during movement"]
    }
  ]);

  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'neutral': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityBg = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-900 border-red-600';
      case 'medium': return 'bg-yellow-900 border-yellow-600';
      case 'low': return 'bg-green-900 border-green-600';
      default: return 'bg-gray-900 border-gray-600';
    }
  };

  const generateAARInsights = async () => {
    setAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalyzing(false);
    }, 3000);
  };

  const filteredInsights = selectedCategory === "all" 
    ? insights 
    : insights.filter(insight => insight.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <>
      <HoverSidebar />
      <div className="max-w-6xl mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-2">🔍 AAR Insights & Debrief</h1>
        <p className="text-gray-300 mb-6">AI analyzes the mission timeline for key decisions, errors, and lessons learned. Outputs actionable AAR insights for debrief.</p>
        
        {/* Mission Timeline */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-green-300 mb-4">⏰ Mission Timeline</h2>
          
          <div className="space-y-4">
            {events.map((event, idx) => (
              <div key={event.id} className="flex items-start gap-4">
                <div className="bg-blue-900 border border-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 bg-gray-700 rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{event.time} - {event.event}</h3>
                  </div>
                  <p className="text-gray-300 mb-3">{event.outcome}</p>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-400">Lessons:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {event.lessons.map((lesson, lessonIdx) => (
                        <li key={lessonIdx} className="flex items-start gap-2">
                          <span className="text-green-400">•</span>
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-center">
            <button 
              className="bg-blue-800 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg border border-blue-600 disabled:opacity-50"
              onClick={generateAARInsights}
              disabled={analyzing}
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Analyzing Mission...
                </span>
              ) : (
                "Generate AAR Insights"
              )}
            </button>
          </div>
        </div>

        {/* Insights Filter */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            <button 
              className={`px-4 py-2 rounded border text-sm font-bold ${
                selectedCategory === "all" 
                  ? 'bg-blue-800 border-blue-600 text-blue-200' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </button>
            <button 
              className={`px-4 py-2 rounded border text-sm font-bold ${
                selectedCategory === "communication" 
                  ? 'bg-blue-800 border-blue-600 text-blue-200' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory("communication")}
            >
              Communication
            </button>
            <button 
              className={`px-4 py-2 rounded border text-sm font-bold ${
                selectedCategory === "tactics" 
                  ? 'bg-blue-800 border-blue-600 text-blue-200' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory("tactics")}
            >
              Tactics
            </button>
            <button 
              className={`px-4 py-2 rounded border text-sm font-bold ${
                selectedCategory === "equipment" 
                  ? 'bg-blue-800 border-blue-600 text-blue-200' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setSelectedCategory("equipment")}
            >
              Equipment
            </button>
          </div>
        </div>

        {/* AAR Insights */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-green-300">💡 Key Insights</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInsights.map((insight) => (
              <div 
                key={insight.id} 
                className={`border rounded-lg p-4 ${getPriorityBg(insight.priority)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                    <p className="text-gray-400 text-sm">{insight.category}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getImpactColor(insight.impact)}`}>
                      {insight.impact}
                    </div>
                    <div className={`text-sm font-bold ${getPriorityColor(insight.priority)}`}>
                      {insight.priority} priority
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 text-sm mb-4">{insight.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-400">Action Items:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {insight.action_items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-400">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-3 text-xs text-gray-400">
                  {new Date(insight.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-300 mb-4">📊 Mission Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-900 border border-green-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{insights.filter(i => i.impact === 'positive').length}</div>
              <div className="text-sm text-gray-400">Positive</div>
            </div>
            <div className="bg-red-900 border border-red-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{insights.filter(i => i.impact === 'negative').length}</div>
              <div className="text-sm text-gray-400">Negative</div>
            </div>
            <div className="bg-yellow-900 border border-yellow-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{insights.filter(i => i.priority === 'high').length}</div>
              <div className="text-sm text-gray-400">High Priority</div>
            </div>
            <div className="bg-blue-900 border border-blue-700 rounded p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{events.length}</div>
              <div className="text-sm text-gray-400">Events</div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button className="bg-green-800 hover:bg-green-700 text-white font-bold px-6 py-2 rounded border border-green-600">
              Export AAR
            </button>
            <button className="bg-blue-800 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded border border-blue-600">
              Schedule Debrief
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded border border-gray-600">
              Share Insights
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 