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

  // Use prop data if provided, else state
  const chartData = (data || historyData).map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString(),
    z: -(item.position?.z || 0), // Invert Z for intuitive display
  }));

  return (
    <div className="h-full w-full flex flex-col">
      {!data && loading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : chartData.length === 0 ? (
        <Alert>
          <AlertTitle>No Historical Data</AlertTitle>
          <AlertDescription>
            No telemetry data found. Start data collection to view Z vs Time analysis.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="w-5 h-5" />
              Z Position vs Time (Height Above Ground)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={270}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => `Time: ${value}`}
                  formatter={(value: number) => [value.toFixed(3) + ' m', 'Height Above Ground']}
                />
                <Area
                  type="monotone"
                  dataKey="z"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
