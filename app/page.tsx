"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardParameters } from "@/components/dashbard-parameters"
import DashboardSafeSpot from "@/components/dashboard-safespot"
import ZvsTimeChart from "@/components/dashboard-z_vs_t-graph"
import LiveMonitoringPanel from "@/components/dashboard-livedata"
import { AutoCollectButton } from "@/components/auto-collect-button"
import { useAutoCollect } from "@/contexts/auto-collect-context"


export default function DashboardPage() {
  const { graphData } = useAutoCollect()

  // Events from Jetson Component
  function JetsonEventsBox() {
    const [events, setEvents] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchEvents = async () => {
      // Don't show loading for subsequent fetches to prevent flickering
      if (!events) setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/status-text', { cache: 'no-store' });
        const result = await response.json();
        if (result.status === 'success') {
          setEvents(result.data);
          setLoading(false);
        } else {
          setError(result.message || 'Failed to fetch events');
        }
      } catch (err) {
        setError('Error fetching events');
      }
    };

    React.useEffect(() => {
      fetchEvents();
      const interval = setInterval(fetchEvents, 3000); // Faster update - 3 seconds
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="bg-white border border-gray-300 p-4 h-full overflow-auto">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">Events from Jetson</h3>
        {loading && !events ? (
          <div className="text-gray-500">Loading...</div>
        ) : error && !events ? (
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
      <AutoCollectButton />
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

