"use client";

import React, { useState } from "react";
import HoverSidebar from "../components/HoverSidebar";
import Link from "next/link";

interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function UserGuide() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const guideSections: GuideSection[] = [
    {
      id: "getting-started",
      title: "🚀 Getting Started",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-3">Welcome to STRATOS</h3>
            <p className="text-gray-300 mb-4">
              STRATOS is your AI-powered mission planning companion. This guide will help you master all features and become proficient in mission planning and execution.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Quick Navigation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span className="text-sm">Hover near left edge to open sidebar</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-sm">Click toggle button for manual control</span>
                </div>
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                  <span className="text-sm">Use STRATOS logo to return to main app</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-yellow-400">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                  <span className="text-sm">AI-generated content takes 2-5 seconds</span>
                </div>
                <div className="flex items-center gap-2 text-red-400">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  <span className="text-sm">Save your work frequently</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  <span className="text-sm">Use keyboard shortcuts for efficiency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "mission-planning",
      title: "📋 Mission Planning",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-3">AI-Powered Plan Generation</h3>
            <p className="text-gray-300 mb-4">
              Create comprehensive mission plans using AI assistance. The system generates detailed plans based on your inputs and mission requirements.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Best Practices</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-green-300 mb-2">1. Provide Clear Mission Objectives</h5>
                <p className="text-gray-300 text-sm">
                  Be specific about what you want to achieve. Include constraints, timelines, and success criteria.
                </p>
              </div>
              <div>
                <h5 className="font-bold text-green-300 mb-2">2. Use the AI Generate Button</h5>
                <p className="text-gray-300 text-sm">
                  Click "AI Generate" to create initial plans. The AI will structure your mission with proper phases and considerations.
                </p>
              </div>
              <div>
                <h5 className="font-bold text-green-300 mb-2">3. Edit and Refine</h5>
                <p className="text-gray-300 text-sm">
                  Review AI-generated content and make adjustments. Add specific details, constraints, or mission-specific requirements.
                </p>
              </div>
              <div>
                <h5 className="font-bold text-green-300 mb-2">4. Version Control</h5>
                <p className="text-gray-300 text-sm">
                  Save different versions of your plan. Use the history feature to compare approaches and track changes.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Plan Structure</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-bold text-blue-300 mb-2">Mission Overview</h5>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Clear objectives and goals</li>
                  <li>• Timeline and milestones</li>
                  <li>• Success criteria</li>
                  <li>• Risk assessment</li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-blue-300 mb-2">Execution Details</h5>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Phase-by-phase breakdown</li>
                  <li>• Resource allocation</li>
                  <li>• Communication protocols</li>
                  <li>• Contingency plans</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "simulation",
      title: "🎮 Mission Simulation",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-3">Live Mission Execution</h3>
            <p className="text-gray-300 mb-4">
              Test your mission plans in real-time with the simulation engine. Experience your mission before execution and identify potential issues.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Simulation Modes</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-green-300 mb-2">Fast Simulation</h5>
                <p className="text-gray-300 text-sm mb-2">
                  Quickly run through your mission to identify major issues and timing problems.
                </p>
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-xs text-gray-400">💡 <strong>Best for:</strong> Initial validation, quick iterations, identifying obvious flaws</p>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-green-300 mb-2">Real-Time Simulation</h5>
                <p className="text-gray-300 text-sm mb-2">
                  Experience your mission in real-time with the ability to pause, inject events, and make adjustments.
                </p>
                <div className="bg-gray-700 rounded p-3">
                  <p className="text-xs text-gray-400">💡 <strong>Best for:</strong> Detailed analysis, team training, final validation</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Simulation Controls</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-bold text-blue-300 mb-2">Timeline Controls</h5>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Play/Pause simulation</li>
                  <li>• Adjust simulation speed</li>
                  <li>• Jump to specific times</li>
                  <li>• Reset to beginning</li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-blue-300 mb-2">Event Injection</h5>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Add unexpected events</li>
                  <li>• Test contingency plans</li>
                  <li>• Simulate equipment failures</li>
                  <li>• Create emergency scenarios</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Pro Tips</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-yellow-400 text-lg">⚡</span>
                <div>
                  <p className="text-gray-300 text-sm"><strong>Start with Fast Mode:</strong> Use fast simulation to quickly identify major issues before detailed analysis.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-lg">🎯</span>
                <div>
                  <p className="text-gray-300 text-sm"><strong>Inject Realistic Events:</strong> Add events that could realistically occur during your mission.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">📊</span>
                <div>
                  <p className="text-gray-300 text-sm"><strong>Monitor Performance:</strong> Watch the timeline and logs for bottlenecks and inefficiencies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "modules",
      title: "🔧 AI Mission Modules",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-3">Specialized Decision Tools</h3>
            <p className="text-gray-300 mb-4">
              Access specialized AI modules for specific mission planning tasks. Each module provides focused intelligence for particular aspects of mission planning.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">🗺️ Route Optimization</h4>
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Optimize mission routes considering threats, weather, terrain, and multiple constraints.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">Input Requirements</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Start and end locations</li>
                      <li>• Known threats and their locations</li>
                      <li>• Weather conditions</li>
                      <li>• Terrain constraints</li>
                      <li>• Time constraints</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">Output</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Optimized route with waypoints</li>
                      <li>• Threat analysis and avoidance</li>
                      <li>• Estimated travel time</li>
                      <li>• Risk assessment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">📊 Asset Allocation</h4>
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Intelligently distribute resources and assets across mission requirements.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">Input Requirements</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Available assets and capabilities</li>
                      <li>• Mission requirements</li>
                      <li>• Priority levels</li>
                      <li>• Resource constraints</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">Output</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Optimized asset distribution</li>
                      <li>• Efficiency metrics</li>
                      <li>• Resource utilization</li>
                      <li>• Gap analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">📋 SITREP Composer</h4>
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Generate professional situation reports using AI assistance and military templates.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">SALUTE Format</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• <strong>S</strong>ituation: Current tactical situation</li>
                      <li>• <strong>A</strong>dministration: Personnel and logistics</li>
                      <li>• <strong>L</strong>ogistics: Equipment and supplies</li>
                      <li>• <strong>U</strong>nits: Unit status and locations</li>
                      <li>• <strong>T</strong>ime: Timeline and schedules</li>
                      <li>• <strong>E</strong>nemy: Enemy activity and disposition</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">Features</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• AI-assisted content generation</li>
                      <li>• Template-based formatting</li>
                      <li>• Real-time collaboration</li>
                      <li>• Version control</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-3">🔍 AAR Insights</h4>
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Analyze mission performance and generate insights for continuous improvement.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">Analysis Areas</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Mission objectives achievement</li>
                      <li>• Performance metrics</li>
                      <li>• Lessons learned</li>
                      <li>• Improvement recommendations</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-green-300 mb-2">Output</h5>
                    <ul className="text-gray-300 text-xs space-y-1">
                      <li>• Detailed performance report</li>
                      <li>• Trend analysis</li>
                      <li>• Actionable insights</li>
                      <li>• Training recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "best-practices",
      title: "⭐ Best Practices",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-3">Mission Planning Excellence</h3>
            <p className="text-gray-300 mb-4">
              Follow these proven practices to maximize the effectiveness of your mission planning and execution.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Planning Workflow</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <h5 className="font-bold text-blue-300 mb-1">Define Clear Objectives</h5>
                  <p className="text-gray-300 text-sm">Start with specific, measurable, achievable, relevant, and time-bound (SMART) objectives.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <h5 className="font-bold text-blue-300 mb-1">Generate AI Plan</h5>
                  <p className="text-gray-300 text-sm">Use AI to create initial structure, then customize for your specific requirements.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <h5 className="font-bold text-blue-300 mb-1">Simulate and Test</h5>
                  <p className="text-gray-300 text-sm">Run simulations to identify issues and validate your approach.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <h5 className="font-bold text-blue-300 mb-1">Refine and Iterate</h5>
                  <p className="text-gray-300 text-sm">Make adjustments based on simulation results and feedback.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</span>
                <div>
                  <h5 className="font-bold text-blue-300 mb-1">Execute and Monitor</h5>
                  <p className="text-gray-300 text-sm">Implement your plan and track performance in real-time.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Communication Best Practices</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-green-300 mb-2">SITREP Guidelines</h5>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Be concise and factual</li>
                  <li>• Use standard military format</li>
                  <li>• Include relevant metrics</li>
                  <li>• Update regularly</li>
                  <li>• Distribute to stakeholders</li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-green-300 mb-2">Team Coordination</h5>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Establish clear communication protocols</li>
                  <li>• Use consistent terminology</li>
                  <li>• Maintain regular check-ins</li>
                  <li>• Document decisions and rationale</li>
                  <li>• Share lessons learned</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Risk Management</h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-bold text-red-300 mb-2">Identify Risks Early</h5>
                <p className="text-gray-300 text-sm">Use simulation to identify potential issues before they become problems.</p>
              </div>
              <div>
                <h5 className="font-bold text-yellow-300 mb-2">Plan Contingencies</h5>
                <p className="text-gray-300 text-sm">Always have backup plans for critical mission elements.</p>
              </div>
              <div>
                <h5 className="font-bold text-green-300 mb-2">Monitor Continuously</h5>
                <p className="text-gray-300 text-sm">Track performance metrics and adjust plans as needed.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "keyboard-shortcuts",
      title: "⌨️ Keyboard Shortcuts",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-3">Efficiency Tips</h3>
            <p className="text-gray-300 mb-4">
              Master these keyboard shortcuts to navigate STRATOS efficiently and speed up your mission planning workflow.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Navigation Shortcuts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-blue-300 mb-2">General Navigation</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Toggle Sidebar</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + B</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Return to Main App</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + H</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Open User Guide</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">F1</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-blue-300 mb-2">Mission Planning</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Save Plan</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + S</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">AI Generate</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + G</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">New Plan</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + N</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Simulation Controls</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-green-300 mb-2">Playback Controls</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Play/Pause</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Space</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Fast Forward</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">→</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Rewind</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">←</kbd>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-green-300 mb-2">Event Management</h5>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Add Event</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + E</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Clear Events</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + Shift + E</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Reset Simulation</span>
                    <kbd className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">Ctrl + R</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-3">Pro Tips</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-yellow-400 text-lg">💡</span>
                <div>
                  <p className="text-gray-300 text-sm"><strong>Use the sidebar efficiently:</strong> Hover near the left edge for quick access, or use the toggle button for persistent navigation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400 text-lg">⚡</span>
                <div>
                  <p className="text-gray-300 text-sm"><strong>Save frequently:</strong> Use Ctrl+S to save your work regularly, especially after major changes.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">🎯</span>
                <div>
                  <p className="text-gray-300 text-sm"><strong>Master simulation:</strong> Use keyboard shortcuts to control simulation playback for efficient testing.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      <HoverSidebar />
      <div className="max-w-6xl mx-auto mt-12 p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-lg"></div>
            <div className="absolute inset-1 bg-black rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">📚</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">STRATOS User Guide</h1>
            <p className="text-gray-400">Master your mission planning workflow</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 sticky top-8">
              <h2 className="text-lg font-bold text-white mb-4">Quick Navigation</h2>
              <nav className="space-y-2">
                {guideSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeSection === section.id
                        ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
              
              <div className="mt-6 pt-6 border-t border-gray-700">
                <Link 
                  href="/app"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to App
                </Link>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
              {guideSections.find(section => section.id === activeSection)?.content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 