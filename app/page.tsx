"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardParameters } from "@/components/dashbard-parameters"
import DashboardSafeSpot from "@/components/dashboard-safespot"
import ZvsTimeChart from "@/components/dashboard-z_vs_t-graph"
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
      <div className="h-full flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader className="py-2 px-3 flex-shrink-0">
            <CardTitle className="text-lg font-semibold">Events from Jetson</CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1 flex flex-col">
            <div className="flex-1 overflow-auto">
              {loading && !events ? (
                <div className="text-gray-500">Loading...</div>
              ) : error && !events ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{events}</pre>
              )}
            </div>
          </CardContent>
        </Card>
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
            <section className="bg-white flex flex-col h-full w-full items-end" style={{ minHeight: 0, maxHeight: 650 }}>
              <div className="h-full w-full">
                <DashboardSafeSpot />
              </div>
            </section>
            {/* Events from Jetson beside Safe Spot */}
            <section className="bg-white flex flex-col h-full w-full items-end" style={{ minHeight: 0, maxHeight: 650 }}>
              <div className="h-full w-full">
                <JetsonEventsBox />
              </div>
            </section>
            {/* Top Middle Section: Parameters only */}
            <section className="bg-white flex flex-col h-full w-full items-end" style={{ minHeight: 0, maxHeight: 650 }}>
              <div className="h-full w-full">
                <DashboardParameters />
              </div>
            </section>
            {/* Top Right Section: YouTube feed shifted right */}
            <section className="bg-white flex flex-col h-full w-full pl-1 items-end" style={{ minHeight: 0, maxHeight: 650 }}>
              <div className="h-full w-full">
                <iframe
                  width="100%"
                  height="650"
                  src="https://www.youtube.com/embed/xRPjKQtRXR8?autoplay=1"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="YouTube Live Stream"
                  style={{ background: '#000', display: 'block' }}
                />
              </div>
            </section>
            {/* Bottom Full-width Section: Z vs Time chart */}
            <section className="col-span-4 bg-white flex flex-col h-full w-full" style={{ minHeight: '400px', height: '500px' }}>
              <ZvsTimeChart data={graphData} />
            </section>
          </div>
        ) : (
          <div className="h-full w-full border border-gray-300">
            <section className="bg-white flex flex-col h-full w-full" style={{ minHeight: '400px', height: '500px' }}>
              <ZvsTimeChart />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

