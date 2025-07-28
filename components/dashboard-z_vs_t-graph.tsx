"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TrendingUp } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

interface TelemetrySnapshot {
  timestamp: string
  position?: {
    z: number
  }
}


interface ZvsTimeChartProps {
  data?: TelemetrySnapshot[];
}

export default function ZvsTimeChart({ data }: ZvsTimeChartProps) {
  const [historyData, setHistoryData] = useState<TelemetrySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  // If no data prop, fetch internally (for legacy use)
  useEffect(() => {
    if (!data) {
      setLoading(true);
      fetch(`/api/history-data?days=1`, { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then((result) => {
          if (result.status === 'success') {
            setHistoryData(result.data || []);
          }
        })
        .catch((error) => {
          console.error('Error fetching history data:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [data]);

  // Generate system time-based data
  const generateSystemTimeData = () => {
    const baseData = data || historyData;

    // If no data, create dummy data with current system time
    if (baseData.length === 0) {
      const dummyData = [];
      const now = new Date();
      for (let i = 0; i < 20; i++) {
        const time = new Date(now.getTime() - (19 - i) * 5000); // 5 second intervals
        dummyData.push({
          timestamp: time.toLocaleTimeString(),
          z: 0,
          fullTime: time.toISOString()
        });
      }
      return dummyData;
    }

    // Use real data with actual timestamps
    return baseData.map((item) => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      z: -(item.position?.z || 0), // Invert Z for intuitive display
      fullTime: item.timestamp
    }));
  };

  const chartData = generateSystemTimeData(); return (
    <div className="h-full w-full flex flex-col">
      {!data && loading ? (
        <div className="text-center text-muted-foreground p-8">Loading...</div>
      ) : (
        <Card className="h-full flex flex-col">
          <CardHeader className="py-2 px-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="w-5 h-5" />
              Z Position vs Time (Height Above Ground)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 flex-1 flex flex-col" style={{ minHeight: '350px' }}>
            <div className="w-full h-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                    label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Height (m)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    labelFormatter={(value) => `Time: ${value}`}
                    formatter={(value: number) => [
                      (data || historyData).length === 0 ? 'No Data' : value.toFixed(3) + ' m',
                      'Height Above Ground'
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="z"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
