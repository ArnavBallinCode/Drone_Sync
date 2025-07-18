"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AttitudeData } from "@/components/attitude-data"
import { TelemetryChart } from "@/components/telemetry-chart"

export default function AttitudePage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Attitude Data</CardTitle>
          </CardHeader>
          <CardContent>
            <AttitudeData />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Attitude History</CardTitle>
          </CardHeader>
          <CardContent>
            <TelemetryChart 
              parameters={["roll", "pitch", "yaw"]}
              title="Attitude Over Time"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
