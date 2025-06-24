"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="w-full flex items-center justify-between px-8 py-6 bg-black/80 border-b border-gray-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg tracking-wider">S</span>
          </div>
          <span className="text-2xl font-bold tracking-widest font-sans">STRATOS</span>
        </div>
        <Link
          href="/app"
          className="px-7 py-2 border-2 border-white rounded-lg font-semibold text-white hover:bg-white hover:text-black transition-colors duration-200 text-lg tracking-wide"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative w-full flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] py-24 md:py-36 overflow-hidden" style={{background: "linear-gradient(180deg, #111 60%, #23272f 100%)"}}>
        {/* Enhanced Spotlight/Gradient Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <div className="w-full h-full bg-gradient-radial from-blue-400/30 via-transparent to-black opacity-70 absolute top-0 left-0" style={{filter: 'blur(100px)'}}></div>
          <div className="w-full h-full bg-gradient-to-b from-black/80 via-black/70 to-gray-900/80 absolute top-0 left-0" />
        </div>
        {/* Main Slogan */}
        <div className="relative z-10 flex flex-col items-center w-full">
          <h1 className="text-[8vw] md:text-[5vw] font-extralight font-sans tracking-tight text-white text-center leading-tight" style={{letterSpacing: '-0.03em', fontFamily: 'Inter, Space Grotesk, DM Sans, sans-serif'}}>A new era of command power</h1>
          <p className="mt-8 text-2xl md:text-3xl font-light text-gray-200 text-center max-w-4xl">
            STRATOS is building the AI command system for the modern battlefield — a secure, deploy-anywhere platform that lets operators plan, simulate, and adapt missions in real time, with or without a connection.
          </p>
          {/* CTA Button */}
          <div className="mt-16 md:mt-20 flex justify-center w-full">
            <Link
              href="#features"
              className="px-10 py-4 border border-white rounded-lg font-semibold text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-200 text-lg tracking-wide relative group"
            >
              <span className="relative z-10">LEARN MORE</span>
              <span className="absolute inset-0 border border-white rounded-lg opacity-40 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></span>
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="w-full bg-gray-100 text-gray-900 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-12 text-center tracking-tight">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard title="AI Mission Planning" desc="AI-powered mission generation, refinement, and version control." />
            <FeatureCard title="Real-Time Simulation" desc="Simulate and adapt missions live, with speed control and event injection." />
            <FeatureCard title="Route Optimization" desc="Threat-aware, weather-integrated, and terrain-informed routing." />
            <FeatureCard title="Asset Allocation" desc="Intelligent resource management and optimization." />
            <FeatureCard title="Contingency Plan Generator" desc="Rapidly generate and test backup plans for any scenario." />
            <FeatureCard title="SITREP Composer" desc="AI-assisted, template-driven situation reports." />
            <FeatureCard title="AAR Insights & Debrief" desc="Automated after-action reviews and actionable insights." />
            <FeatureCard title="Secure, Deploy-Anywhere" desc="Run STRATOS on-prem, in the cloud, or at the edge." />
            <FeatureCard title="Offline/Disconnected Ops" desc="Full mission planning and simulation, even without a connection." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-6 text-gray-400 text-sm bg-black/80 border-t border-gray-800">
        &copy; {new Date().getFullYear()} STRATOS. The AI Command System for the Modern Battlefield.
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-start hover:shadow-xl transition-shadow duration-300 border border-gray-200">
      <h3 className="text-2xl font-semibold mb-3 font-sans tracking-tight">{title}</h3>
      <p className="text-gray-600 text-lg font-light">{desc}</p>
    </div>
  );
} 