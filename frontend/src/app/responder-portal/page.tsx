"use client";

import React, { useState, useEffect } from 'react';
import { WebSocketProvider } from '../components/WebSocketProvider';
import ResponderPortalContent from './ResponderPortalContent';
import Link from 'next/link';

const BACKEND_URL = 'http://localhost:8000';

const UNITS = [
  'Alpha-1', 'Alpha-2', 'Bravo-1', 'Bravo-2',
  'Charlie-1', 'Delta-1', 'Echo-1', 'Foxtrot-1'
];

interface Incident {
  incident_id: string;
  type: string;
  priority: string;
  location: { lat: number; lng: number };
  status: string;
  description: string;
  created_at: string;
  resolved_at?: string;
  assigned_units: string[];
}

export default function ResponderPortal() {
  return (
    <WebSocketProvider userType="responder">
      <ResponderPortalContent />
    </WebSocketProvider>
  );
} 