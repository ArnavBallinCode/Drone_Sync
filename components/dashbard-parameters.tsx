"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, Axis3D, Battery, Cpu, CpuIcon, Gauge, MemoryStick, Plane, Store, Thermometer } from "lucide-react"
import { useTelemetryData } from "@/app/hooks/useTelemetryData"
import { Progress } from "@/components/ui/progress"

export function DashboardParameters() {
  const { data, isConnected } = useTelemetryData()

  // Use data from the centralized hook
  const localPosition = data.local_position
  const attitude = data.attitude
  const battery = data.battery
  const globalPosition = data.local_position // Use local position for altitude calculation

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Flight Parameters</CardTitle>
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              title={isConnected ? 'Connected' : 'Disconnected'}></div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsContent value="overview" className="flex-1 p-2">
              <div className="grid gap-1 lg:grid-cols-3 h-full" >
                {/* Top row: CPU Load, Memory, Battery */}
                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">CPU Load</CardTitle>
                    <CpuIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    <div className="text-base font-medium">
                      <span>{data.system_health?.cpu_load ?? 0}%</span>
                    </div>
                    <Progress value={data.system_health?.cpu_load ?? 0} />
                  </CardContent>
                </Card>
                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Memory</CardTitle>
                    <MemoryStick className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    <div className="text-base font-medium">
                      <span>{data.system_health?.memory_usage ?? 0}%</span>
                    </div>
                    <Progress value={data.system_health?.memory_usage ?? 0} />
                  </CardContent>
                </Card>
                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Battery</CardTitle>
                    <Battery className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    <div className="text-base font-medium">{battery ? battery.battery_remaining + "%" : "0%"}</div>
                    <p className="text-xs text-muted-foreground">
                      {battery ? (battery.voltages[0] / 1000).toFixed(1) + "V" : "0.0V"}
                    </p>
                  </CardContent>
                </Card>
                {/* Second row: Altitude, Attitude, Ground Speed */}
                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Altitude</CardTitle>
                    <ArrowUp className="h-3 w-3 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    <div className="text-base font-medium">
                      {globalPosition ? (-globalPosition.z).toFixed(2) + " m" : "0.00 m"}
                    </div>
                    <p className="text-xs text-muted-foreground">Relative to home</p>
                  </CardContent>
                </Card>
                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Attitude</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    <div className="text-base font-medium">
                      {attitude ? (attitude.roll * (180 / Math.PI)).toFixed(1) + "°" : "0.0°"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {attitude
                        ? "P: " +
                        (attitude.pitch * (180 / Math.PI)).toFixed(1) +
                        "° Y: " +
                        (attitude.yaw * (180 / Math.PI)).toFixed(1) +
                        "°"
                        : "P: 0.0° Y: 0.0°"}
                    </p>
                  </CardContent>
                </Card>
                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Ground Speed</CardTitle>
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    <div className="text-base font-medium">
                      {globalPosition
                        ? Math.sqrt(Math.pow(globalPosition.vx, 2) + Math.pow(globalPosition.vy, 2)).toFixed(2) +
                        " m/s"
                        : "0.00 m/s"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {globalPosition
                        ? (Math.sqrt(Math.pow(globalPosition.vx, 2) + Math.pow(globalPosition.vy, 2)) * 3.6).toFixed(
                          2,
                        ) + " km/h"
                        : "0.00 km/h"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">X</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.x.toFixed(2)} m</div>
                    ) : (
                      <div className="text-base font-medium">0.00 m</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Y</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.y.toFixed(2)} m</div>
                    ) : (
                      <div className="text-base font-medium">0.00 m</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Z</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.z.toFixed(2)} m</div>
                    ) : (
                      <div className="text-base font-medium">0.00 m</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Vx</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.vx.toFixed(2)} m/s</div>
                    ) : (
                      <div className="text-base font-medium">0.00 m/s</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Vy</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.vy.toFixed(2)} m/s</div>
                    ) : (
                      <div className="text-base font-medium">0.00 m/s</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Vz</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.vz.toFixed(2)} m/s</div>
                    ) : (
                      <div className="text-base font-medium">0.00 m/s</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Wx</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.vx.toFixed(2)} rad</div>
                    ) : (
                      <div className="text-base font-medium">0.00 rad</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Wy</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.vx.toFixed(2)} rad</div>
                    ) : (
                      <div className="text-base font-medium">0.00 rad</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Wz</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {localPosition ? (
                      <div className="text-base font-medium">{localPosition.vx.toFixed(2)} rad</div>
                    ) : (
                      <div className="text-base font-medium">0.00 rad</div>
                    )}
                  </CardContent>
                </Card>

                {/* New row: Roll, Pitch, Yaw (Attitude) below Wx, Wy, Wz */}
                {/* Individual cards for Roll, Pitch, Yaw - matching Wx, Wy, Wz style */}
                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Roll</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {attitude ? (
                      <div className="text-base font-medium">{(attitude.roll * (180 / Math.PI)).toFixed(2)}°</div>
                    ) : (
                      <div className="text-base font-medium">0.00°</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Pitch</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {attitude ? (
                      <div className="text-base font-medium">{(attitude.pitch * (180 / Math.PI)).toFixed(2)}°</div>
                    ) : (
                      <div className="text-base font-medium">0.00°</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="w-70 h-20">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-1 px-2">
                    <CardTitle className="text-lg font-bold">Yaw</CardTitle>
                    <Axis3D className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-2 py-0">
                    {attitude ? (
                      <div className="text-base font-medium">{(attitude.yaw * (180 / Math.PI)).toFixed(2)}°</div>
                    ) : (
                      <div className="text-base font-medium">0.00°</div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}