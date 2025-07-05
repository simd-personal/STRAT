"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#181A1B] text-[#F3F3E7] flex flex-col font-sans">
      {/* Top Navigation */}
      <nav className="w-full flex items-center justify-between px-8 py-6 bg-[#181A1B] border-b border-[#23272f]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#F3F3E7] rounded-lg flex items-center justify-center">
            <span className="text-[#181A1B] font-bold text-lg tracking-wider">S</span>
          </div>
          <span className="text-2xl font-bold tracking-widest font-sans">STRATOS</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative w-full flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] py-24 md:py-36 overflow-hidden">
        {/* American-Style Flag Accent with More Stripes */}
        <div className="flex items-center justify-center mb-8">
          <svg width="58" height="36" viewBox="0 0 58 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Flag background */}
            <rect x="0" y="0" width="58" height="36" rx="4" fill="#A3B18A" />
            {/* Canton (upper left square) */}
            <rect x="5" y="5" width="13" height="13" rx="2" fill="#181A1B" />
            {/* Stripes (5 total) */}
            <rect x="5" y="20" width="48" height="2.2" rx="1.1" fill="#181A1B" />
            <rect x="5" y="24" width="48" height="2.2" rx="1.1" fill="#181A1B" />
            <rect x="5" y="28" width="48" height="2.2" rx="1.1" fill="#181A1B" />
            <rect x="5" y="32" width="48" height="2.2" rx="1.1" fill="#181A1B" />
            <rect x="5" y="36" width="48" height="2.2" rx="1.1" fill="#181A1B" />
            {/* Small "stars" as dots in canton */}
            <circle cx="8.5" cy="8.5" r="0.7" fill="#A3B18A" />
            <circle cx="11.5" cy="8.5" r="0.7" fill="#A3B18A" />
            <circle cx="14.5" cy="8.5" r="0.7" fill="#A3B18A" />
            <circle cx="8.5" cy="11.5" r="0.7" fill="#A3B18A" />
            <circle cx="11.5" cy="11.5" r="0.7" fill="#A3B18A" />
            <circle cx="14.5" cy="11.5" r="0.7" fill="#A3B18A" />
          </svg>
        </div>
        <h1 className="text-[7vw] md:text-[5vw] font-extralight font-sans tracking-tight text-[#F3F3E7] text-center leading-tight" style={{letterSpacing: '-0.03em', fontFamily: 'Inter, Space Grotesk, DM Sans, sans-serif'}}>A new era of command power</h1>
        <p className="mt-8 text-2xl md:text-3xl font-light text-[#F3F3E7] text-center max-w-4xl">
          STRATOS is building the AI command system for the modern battlefield — a secure, deploy-anywhere platform that lets operators plan, simulate, and adapt missions in real time, with or without a connection.
        </p>
        {/* CTA Button */}
        <div className="mt-16 md:mt-20 flex justify-center w-full">
          <Link
            href="#features"
            className="px-10 py-4 border border-[#F3F3E7] rounded-lg font-semibold text-[#F3F3E7] bg-transparent hover:bg-[#A3B18A] hover:text-[#181A1B] transition-colors duration-200 text-lg tracking-wide relative group"
          >
            <span className="relative z-10">LEARN MORE</span>
            <span className="absolute inset-0 border border-[#F3F3E7] rounded-lg opacity-40 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></span>
          </Link>
        </div>
        {/* Centered action buttons below Learn More */}
        <div className="mt-6 flex justify-center gap-4 w-full">
          <Link
            href="/app"
            className="px-5 py-2 border-2 border-[#F3F3E7] rounded-lg font-semibold text-[#F3F3E7] hover:bg-[#A3B18A] hover:text-[#181A1B] transition-colors duration-200 text-base tracking-wide"
          >
            Get Started
          </Link>
          <Link
            href="/first-responder-portal"
            className="px-5 py-2 border-2 border-[#F3F3E7] rounded-lg font-semibold text-[#F3F3E7] hover:bg-[#A3B18A] hover:text-[#181A1B] transition-colors duration-200 text-base tracking-wide"
          >
            First Responder Portal
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="w-full bg-[#23272f] text-[#F3F3E7] py-24 px-4">
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
      <footer className="w-full text-center py-6 text-[#A3B18A] text-sm bg-[#181A1B] border-t border-[#23272f]">
        &copy; {new Date().getFullYear()} STRATOS. The AI Command System for the Modern Battlefield.
      </footer>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-[#23272f] rounded-2xl shadow-md p-8 flex flex-col items-start hover:shadow-xl transition-shadow duration-300 border border-[#A3B18A]">
      <h3 className="text-2xl font-semibold mb-3 font-sans tracking-tight text-[#A3B18A]">{title}</h3>
      <p className="text-[#F3F3E7] text-lg font-light">{desc}</p>
    </div>
  );
} 