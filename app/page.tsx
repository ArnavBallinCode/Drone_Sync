"use client"
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

import React from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardParameters } from "@/components/dashbard-parameters"
import DashboardSafeSpot from "@/components/dashboard-safespot"
import ZvsTimeChart from "@/components/dashboard-z_vs_t-graph"
import { PositionSimulator } from "@/components/dashboard-livedata"
import LiveMonitoringPanel from "@/components/dashboard-livedata"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"


export default function DashboardPage() {
  // Auto-collect button logic and graph update
  const [autoCollect, setAutoCollect] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [collecting, setCollecting] = React.useState(false);
  const [graphData, setGraphData] = React.useState<any[]>([]);

  // Fetch graph data (like history page)
  const fetchGraphData = async () => {
    try {
      const response = await fetch('/api/history-data?days=1', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.status === 'success') {
        setGraphData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
    }
  };

  // Collect current data and update graph
  const collectCurrentData = async () => {
    setCollecting(true);
    try {
      const response = await fetch('/api/history-data?action=collect', { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.status === 'success') {
        await fetchGraphData();
      }
    } catch (error) {
      console.error('Error collecting data:', error);
    } finally {
      setCollecting(false);
    }
  };

  // Auto-collect logic
  const toggleAutoCollect = () => {
    if (autoCollect) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAutoCollect(false);
    } else {
      collectCurrentData();
      intervalRef.current = setInterval(collectCurrentData, 5000);
      setAutoCollect(true);
    }
  };

  // Initial fetch on mount
  React.useEffect(() => {
    fetchGraphData();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  // Events from Jetson Component
  function JetsonEventsBox() {
    const [events, setEvents] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/status-text', { cache: 'no-store' });
        const result = await response.json();
        if (result.status === 'success') {
          setEvents(result.data);
        } else {
          setError(result.message || 'Failed to fetch events');
        }
      } catch (err) {
        setError('Error fetching events');
      } finally {
        setLoading(false);
      }
    };

    React.useEffect(() => {
      fetchEvents();
      const interval = setInterval(fetchEvents, 5000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="bg-white border border-gray-300 p-4 h-full overflow-auto">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">Events from Jetson</h3>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{events}</pre>
        )}
      </div>
    );
  }

  const [view, setView] = React.useState<'dashboard' | 'analytics'>('dashboard');

  const handleToggle = () => {
    setView(view === 'dashboard' ? 'analytics' : 'dashboard');
  };

  return (
    <div className="max-h-screen w-full flex flex-col">
      {/* Auto-collect button at the top of the page */}
      <div className="flex items-center justify-end p-4">
        <Button
          onClick={toggleAutoCollect}
          variant={autoCollect ? "destructive" : "default"}
          size="sm"
          disabled={collecting}
        >
          {autoCollect ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {autoCollect ? "Stop" : "Start"} Auto-Collect
        </Button>
      </div>
      <main className="flex-1 h-full w-full">
        {view === 'dashboard' ? (
          <div
            className="
              grid
              h-full w-full
              grid-cols-[0.7fr_0.7fr_1.3fr_1.2fr]  
              gap-0
              border border-gray-300
            "
          >
            {/* Top Left Section: Safe Spot */}
            <section className="bg-white flex flex-col h-full w-full" style={{ minHeight: 0, maxHeight: 650 }}>
              <DashboardSafeSpot />
            </section>
            {/* Events from Jetson beside Safe Spot */}
            <section className="bg-white flex flex-col h-full w-full" style={{ minHeight: 0, maxHeight: 650 }}>
              <JetsonEventsBox />
            </section>
            {/* Top Middle Section: Parameters and Live Monitoring */}
            <section className="bg-white flex flex-col h-full w-full" style={{ minHeight: 0, maxHeight: 650 }}>
              <div className="pl-1">
                <DashboardParameters />
              </div>
              <div className="flex-1 flex flex-col justify-stretch items-stretch min-h-0">
                <LiveMonitoringPanel />
              </div>
            </section>
            {/* Top Right Section: YouTube feed shifted right */}
            <section className="bg-white flex flex-col h-full w-full pl-1" style={{ minHeight: 0, maxHeight: 640 }}>
              <iframe
                width="100%"
                height="640"
                src="https://www.youtube.com/embed/xRPjKQtRXR8?autoplay=1"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="YouTube Live Stream"
                style={{ background: '#000', display: 'block' }}
              />
            </section>
            {/* Bottom Full-width Section: Z vs Time chart shifted further down and made taller */}
            <section className="col-span-4 bg-white flex flex-col h-full w-full" style={{ minHeight: 0, maxHeight: 500, marginTop: 24 }}>
              <ZvsTimeChart data={graphData} />
            </section>
          </div>
        ) : (
          <div className="h-full w-full border border-gray-300">
            <section className="bg-white flex flex-col h-full w-full" style={{ minHeight: 0, maxHeight: 600 }}>
              <ZvsTimeChart />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}


