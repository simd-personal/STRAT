"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background with Grid Pattern */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgba(0,255,136,0.03)_1px,transparent_0)] bg-[length:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 backdrop-blur-sm bg-black/20 border-b border-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-black font-bold text-lg tracking-wider">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white tracking-widest">STRATOS</span>
            <span className="text-xs text-gray-400 tracking-widest">AI MISSION PLATFORM</span>
          </div>
        </div>
        <Link 
          href="/app"
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-black px-8 py-3 rounded-xl font-bold tracking-widest transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
        >
          LAUNCH PLATFORM
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 py-32 text-center">
        <div className={`transition-all duration-1500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Main Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
                <span className="text-black font-bold text-6xl tracking-widest">S</span>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-blue-500/20 rounded-3xl blur-xl animate-pulse"></div>
            </div>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold mb-8 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent tracking-widest">
            STRATOS
          </h1>
          
          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-3xl md:text-4xl text-gray-200 mb-6 font-light tracking-wide">
              The Next Generation
            </p>
            <p className="text-2xl md:text-3xl text-green-400 font-bold tracking-widest mb-4">
              AI-POWERED MISSION PLANNING PLATFORM
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Light years ahead of legacy systems. Real-time AI-driven mission planning, 
              simulation, and execution for the modern battlefield.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/app"
              className="group bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-black px-12 py-6 rounded-2xl font-bold text-xl tracking-widest transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-green-500/25 relative overflow-hidden"
            >
              <span className="relative z-10">EXPERIENCE STRATOS</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>
            <button className="group border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black px-12 py-6 rounded-2xl font-bold text-xl tracking-widest transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
              <span className="relative z-10">WATCH DEMO</span>
              <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-8 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-green-400 tracking-widest">
              WHY STRATOS OUTPERFORMS
            </h2>
            <p className="text-xl text-gray-400 tracking-wide">
              Legacy platforms can't compete with our AI-driven architecture
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Mission Planning */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-green-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-400 tracking-wide">AI Mission Planning</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                GPT-4 powered mission generation with real-time refinement, version control, and intelligent asset allocation.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Instant plan generation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Real-time AI refinement</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span>Version control & comparison</span>
                </div>
              </div>
            </div>

            {/* Real-Time Simulation */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-blue-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400 tracking-wide">Real-Time Simulation</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Advanced mission simulation with configurable speed, event injection, and comprehensive timeline tracking.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span>Fast & real-time modes</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span>Event injection capability</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                  <span>Comprehensive logging</span>
                </div>
              </div>
            </div>

            {/* Route Optimization */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-purple-400 tracking-wide">Route Optimization</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                AI-driven route planning under threat with weather, terrain, and threat analysis integration.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span>Threat-aware routing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span>Weather integration</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                  <span>Terrain analysis</span>
                </div>
              </div>
            </div>

            {/* Asset Allocation */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-yellow-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-yellow-400 tracking-wide">Asset Allocation</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Intelligent resource management with real-time availability tracking and optimization algorithms.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  <span>Optimization algorithms</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                  <span>Resource management</span>
                </div>
              </div>
            </div>

            {/* SITREP Composer */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400/20 to-red-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-red-400 tracking-wide">SITREP Composer</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Automated situation report generation with AI assistance and real-time collaboration features.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span>AI-assisted generation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span>Real-time collaboration</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span>Version control</span>
                </div>
              </div>
            </div>

            {/* AAR Insights */}
            <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:border-indigo-400/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-indigo-400 tracking-wide">AAR Insights</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Advanced after-action review with AI-powered insights and automated lesson learned extraction.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                  <span>AI-powered insights</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                  <span>Automated extraction</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mr-3"></div>
                  <span>Performance analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 px-8 py-32 bg-gradient-to-b from-gray-900/50 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-green-400 tracking-widest">
              STRATOS VS LEGACY PLATFORMS
            </h2>
            <p className="text-xl text-gray-400 tracking-wide">
              The future of mission planning vs. outdated systems
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl p-8 hover:border-red-400/50 transition-all duration-500">
                <h3 className="text-3xl font-bold mb-8 text-red-400 tracking-widest">LEGACY SYSTEMS</h3>
                <div className="space-y-6 text-gray-400">
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Slow, manual planning processes</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Limited AI integration</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Static, non-interactive interfaces</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">No real-time simulation</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Expensive, complex deployments</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-2xl p-8 hover:border-green-400/50 transition-all duration-500">
                <h3 className="text-3xl font-bold mb-8 text-green-400 tracking-widest">STRATOS</h3>
                <div className="space-y-6 text-gray-300">
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Instant AI-powered planning</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">GPT-4 Turbo integration</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Dynamic, real-time interfaces</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Advanced mission simulation</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg">Lightweight, modular architecture</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 py-32 text-center">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl font-bold mb-8 text-green-400 tracking-widest">
            READY TO EXPERIENCE THE FUTURE?
          </h2>
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
            Join the revolution in tactical decision-making. STRATOS is not just an upgrade—<br/>
            <span className="text-green-400 font-bold">it's a complete paradigm shift.</span>
          </p>
          <Link 
            href="/app"
            className="group inline-block bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-black px-16 py-8 rounded-3xl font-bold text-2xl tracking-widest transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-green-500/25 relative overflow-hidden"
          >
            <span className="relative z-10">LAUNCH STRATOS PLATFORM</span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-16 border-t border-gray-800/50 bg-black/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-sm tracking-wider">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white tracking-widest">STRATOS</span>
              <span className="text-xs text-gray-400 tracking-widest">AI MISSION PLATFORM</span>
            </div>
          </div>
          <p className="text-gray-400 mb-6 tracking-wide">
            Next Generation AI-Powered Mission Planning Platform
          </p>
          <div className="text-sm text-gray-500 tracking-wide">
            Built with Next.js, FastAPI, OpenAI GPT-4, and cutting-edge AI technologies
          </div>
        </div>
      </footer>
    </div>
  );
} 