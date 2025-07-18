"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTelemetryData } from "@/hooks/useTelemetryData"

export function TelemetryStatus() {
  const data = useTelemetryData()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Battery Status */}
      <Card>
        <CardHeader>
          <CardTitle>Battery Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Charge Level</span>
                <span>{data.battery?.battery_remaining ?? 0}%</span>
              </div>
              <Progress value={data.battery?.battery_remaining ?? 0} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Voltage</span>
                <p className="text-2xl font-bold">{(data.battery?.voltage_battery ?? 0).toFixed(1)}V</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Current</span>
                <p className="text-2xl font-bold">{(data.battery?.current_battery ?? 0).toFixed(1)}A</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Capacity Used</span>
                <p className="text-2xl font-bold">{data.battery?.energy_consumed ?? 0}mAh</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Time Remaining</span>
                <p className="text-2xl font-bold">~{data.battery?.time_remaining ?? 0}min</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Communication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xl font-bold text-green-500">
                {data.heartbeat ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Signal Strength</span>
                <div className="flex items-center justify-between mb-2">
                  <span>{data.communication?.signal_strength ?? 0}%</span>
                </div>
                <Progress value={data.communication?.signal_strength ?? 0} />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Link Quality</span>
                <div className="flex items-center justify-between mb-2">
                  <span>{data.communication?.link_quality ?? 0}%</span>
                </div>
                <Progress value={data.communication?.link_quality ?? 0} />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Data Rate</span>
                <p className="text-2xl font-bold">{data.communication?.data_rate ?? 0} kbps</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Packet Loss</span>
                <p className="text-2xl font-bold">{data.communication?.packet_loss ?? 0}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xl font-bold text-green-500">
                {data.heartbeat ? "Normal" : "Unknown"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">CPU Load</span>
                <div className="flex items-center justify-between mb-2">
                  <span>{data.system_health?.cpu_load ?? 0}%</span>
                </div>
                <Progress value={data.system_health?.cpu_load ?? 0} />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Memory Usage</span>
                <div className="flex items-center justify-between mb-2">
                  <span>{data.system_health?.memory_usage ?? 0}%</span>
                </div>
                <Progress value={data.system_health?.memory_usage ?? 0} />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Temperature</span>
                <p className="text-2xl font-bold">{data.system_health?.temperature ?? 0}°C</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Storage</span>
                <div className="flex items-center justify-between mb-2">
                  <span>{data.system_health?.storage_usage ?? 0}% used</span>
                </div>
                <Progress value={data.system_health?.storage_usage ?? 0} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 