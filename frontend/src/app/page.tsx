"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center">
            <span className="text-gray-900 font-bold text-sm">S</span>
          </div>
          <span className="text-2xl font-bold text-green-400">STRATOS</span>
        </div>
        <Link 
          href="/app"
          className="bg-green-500 hover:bg-green-600 text-gray-900 px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          Launch Platform
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 py-20 text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            STRATOS
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-4xl mx-auto">
            The Next Generation AI-Powered Mission Planning Platform
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto">
            Light years ahead of legacy systems. Real-time AI-driven mission planning, 
            simulation, and execution for the modern battlefield.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/app"
              className="bg-green-500 hover:bg-green-600 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Experience STRATOS
            </Link>
            <button className="border border-green-400 text-green-400 hover:bg-green-400 hover:text-gray-900 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-green-400">
            Why STRATOS Outperforms Legacy Platforms
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Mission Planning */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-green-400 transition-all duration-300">
              <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-green-400">AI Mission Planning</h3>
              <p className="text-gray-300 mb-4">
                GPT-4 powered mission generation with real-time refinement, version control, and intelligent asset allocation.
              </p>
              <div className="text-sm text-gray-400">
                • Instant plan generation<br/>
                • Real-time AI refinement<br/>
                • Version control & comparison
              </div>
            </div>

            {/* Real-Time Simulation */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-green-400 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">Real-Time Simulation</h3>
              <p className="text-gray-300 mb-4">
                Advanced mission simulation with configurable speed, event injection, and comprehensive timeline tracking.
              </p>
              <div className="text-sm text-gray-400">
                • Fast & real-time modes<br/>
                • Event injection capability<br/>
                • Comprehensive logging
              </div>
            </div>

            {/* Route Optimization */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-green-400 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-400/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-purple-400">Route Optimization</h3>
              <p className="text-gray-300 mb-4">
                AI-driven route planning under threat with weather, terrain, and threat analysis integration.
              </p>
              <div className="text-sm text-gray-400">
                • Threat-aware routing<br/>
                • Weather integration<br/>
                • Terrain analysis
              </div>
            </div>

            {/* Asset Allocation */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-green-400 transition-all duration-300">
              <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Asset Allocation</h3>
              <p className="text-gray-300 mb-4">
                Intelligent resource management with real-time availability tracking and optimization algorithms.
              </p>
              <div className="text-sm text-gray-400">
                • Real-time tracking<br/>
                • Optimization algorithms<br/>
                • Resource management
              </div>
            </div>

            {/* SITREP Composer */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-green-400 transition-all duration-300">
              <div className="w-12 h-12 bg-red-400/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-red-400">SITREP Composer</h3>
              <p className="text-gray-300 mb-4">
                Automated situation report generation with AI assistance and real-time collaboration features.
              </p>
              <div className="text-sm text-gray-400">
                • AI-assisted generation<br/>
                • Real-time collaboration<br/>
                • Version control
              </div>
            </div>

            {/* AAR Insights */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 hover:border-green-400 transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-400/20 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-indigo-400">AAR Insights</h3>
              <p className="text-gray-300 mb-4">
                Advanced after-action review with AI-powered insights and automated lesson learned extraction.
              </p>
              <div className="text-sm text-gray-400">
                • AI-powered insights<br/>
                • Automated extraction<br/>
                • Performance analytics
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative z-10 px-8 py-20 bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-green-400">
            STRATOS vs Legacy Platforms
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-red-400">Legacy Systems</h3>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Slow, manual planning processes</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Limited AI integration</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Static, non-interactive interfaces</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>No real-time simulation</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Expensive, complex deployments</span>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-8 text-green-400">STRATOS</h3>
              <div className="space-y-4 text-gray-300">
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Instant AI-powered planning</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>GPT-4 Turbo integration</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Dynamic, real-time interfaces</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Advanced mission simulation</span>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Lightweight, modular architecture</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-green-400">
            Ready to Experience the Future of Mission Planning?
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Join the revolution in tactical decision-making. STRATOS is not just an upgrade—it's a complete paradigm shift.
          </p>
          <Link 
            href="/app"
            className="inline-block bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-12 py-6 rounded-lg font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Launch STRATOS Platform
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-6 h-6 bg-green-400 rounded flex items-center justify-center">
              <span className="text-gray-900 font-bold text-xs">S</span>
            </div>
            <span className="text-xl font-bold text-green-400">STRATOS</span>
          </div>
          <p className="text-gray-400 mb-6">
            Next Generation AI-Powered Mission Planning Platform
          </p>
          <div className="text-sm text-gray-500">
            Built with Next.js, FastAPI, OpenAI GPT-4, and cutting-edge AI technologies
          </div>
        </div>
      </footer>
    </div>
  );
} 