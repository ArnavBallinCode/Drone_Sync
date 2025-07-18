"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TelemetryStatus } from "@/components/telemetry-status"
import { TelemetryChart } from "@/components/telemetry-chart"

export default function RadioPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Radio Status</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryStatus />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Signal Strength</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryChart 
              parameters={["rssi", "noise"]}
              title="Signal Quality"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RC Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <TelemetryChart 
            parameters={["rc_1", "rc_2", "rc_3", "rc_4"]}
            title="RC Channel Values"
          />
        </CardContent>
      </Card>
    </div>
  )
} 