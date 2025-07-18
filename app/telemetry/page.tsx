"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TelemetryOverview } from "@/components/telemetry-overview"
import { TelemetryChart } from "@/components/telemetry-chart"
import { TelemetryStatus } from "@/components/telemetry-status"

export default function TelemetryPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Telemetry Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryOverview showAllParameters />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryStatus />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Altitude History</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryChart 
              parameters={["relative_alt", "alt"]}
              title="Altitude Over Time"
            />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Velocity History</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryChart 
              parameters={["vx", "vy", "vz"]}
              title="Velocity Over Time"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 