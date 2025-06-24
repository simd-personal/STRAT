"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface SidebarLinkProps {
  href: string;
  label: string;
  isActive?: boolean;
}

function SidebarLink({ href, label, isActive }: SidebarLinkProps) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-mono text-sm ${
        isActive 
          ? 'bg-green-900/50 text-green-300 border border-green-700/50 shadow-lg' 
          : 'text-gray-200 hover:bg-green-900/30 hover:text-green-300 hover:shadow-md'
      }`}
    >
      <span>{label}</span>
    </Link>
  );
}

export default function HoverSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isManuallyToggled, setIsManuallyToggled] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsHovering(false);
        setIsManuallyToggled(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsHovering(false);
    setIsManuallyToggled(false);
  }, [pathname]);

  const handleMouseEnter = () => {
    if (!isManuallyToggled) {
      setIsHovering(true);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isManuallyToggled) {
      setIsHovering(false);
      // Add a small delay before closing to prevent flickering
      setTimeout(() => {
        if (!isHovering && !isManuallyToggled) {
          setIsOpen(false);
        }
      }, 150);
    }
  };

  const toggleSidebar = () => {
    setIsManuallyToggled(!isManuallyToggled);
    setIsOpen(!isOpen);
    setIsHovering(false);
  };

  const sidebarLinks = [
    { href: "/modules/route-optimization", label: "Route Optimization" },
    { href: "/modules/asset-allocation", label: "Asset Allocation" },
    { href: "/modules/contingency-plan", label: "Contingency Plan Generator" },
    { href: "/modules/sitrep-composer", label: "SITREP Composer" },
    { href: "/modules/aar-insights", label: "AAR Insights & Debrief" },
  ];

  return (
    <>
      {/* Toggle Button - Always visible */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg ${
          isOpen 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
        }`}
        title={isOpen ? "Hide Sidebar" : "Show Sidebar"}
      >
        <svg 
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>

      {/* Hover Area - invisible area that triggers sidebar */}
      <div
        ref={hoverAreaRef}
        className="fixed left-0 top-0 h-full w-4 z-30"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-gray-900/95 backdrop-blur-md border-r border-gray-800 flex flex-col z-40 transition-all duration-500 ease-in-out transform ${
          isOpen ? 'w-64 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header with Main Logo and Navigation */}
        <div className="px-6 py-5 border-b border-gray-800 min-w-64">
          <div className="flex items-center justify-between mb-4">
            <Link 
              href="/app" 
              className="flex items-center gap-3 group hover:bg-gray-800/50 rounded-lg p-2 transition-all duration-200"
            >
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-lg group-hover:scale-110 transition-transform duration-200"></div>
                <div className="absolute inset-0.5 bg-black rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-green-400 text-lg tracking-wider">STRATOS</span>
                <span className="text-xs text-gray-400">Mission Control</span>
              </div>
            </Link>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors duration-200"
              title="Close Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-400">
            AI Mission Modules
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 min-w-64 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <SidebarLink
              key={link.href}
              href={link.href}
              label={link.label}
              isActive={pathname === link.href}
            />
          ))}
        </nav>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 min-w-64">
          <div className="text-xs text-gray-500 text-center">
            {isManuallyToggled ? "Click button to close" : "Hover near left edge to open"}
          </div>
        </div>
      </div>

      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
} 