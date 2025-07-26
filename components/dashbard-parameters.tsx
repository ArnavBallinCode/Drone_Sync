"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, Axis3D, Battery, Cpu, CpuIcon, Gauge, MemoryStick, Plane, Store, Thermometer } from "lucide-react"
import { TelemetryOverview } from "./telemetry-overview"
import { useTelemetryData } from "@/app/hooks/useTelemetryData"
import { Progress } from "@/components/ui/progress"
import { FlightDataSimulator } from "./telemetry-overview"

export function DashboardParameters() {
  const [localPosition, setLocalPosition] = useState<any>(null)
  const [attitude, setAttitude] = useState<any>(null)
  const [battery, setBattery] = useState<any>(null)
  const [globalPosition, setGlobalPosition] = useState<any>(null)
  const flightSimulator = useRef(new FlightDataSimulator())
  const data = useTelemetryData()

  useEffect(() => {
    // Function to fetch parameter data or generate realistic simulated data
    const fetchParameterData = async () => {
      try {
        // Try to fetch real data first
        let useSimulatedData = false

        // Fetch LOCAL_POSITION_NED
        const localPositionRes = await fetch(`/params/LOCAL_POSITION_NED.json?t=${Date.now()}`)
        if (!localPositionRes.ok) {
          useSimulatedData = true
        } else {
          const localPositionData = await localPositionRes.json()
          setLocalPosition(localPositionData)
        }

        // Fetch ATTITUDE
        const attitudeRes = await fetch(`/params/ATTITUDE.json?t=${Date.now()}`)
        if (!attitudeRes.ok) {
          useSimulatedData = true
        } else {
          const attitudeData = await attitudeRes.json()
          setAttitude(attitudeData)
        }

        // Fetch BATTERY_STATUS
        const batteryRes = await fetch(`/params/BATTERY_STATUS.json?t=${Date.now()}`)
        if (!batteryRes.ok) {
          useSimulatedData = true
        } else {
          const batteryData = await batteryRes.json()
          setBattery(batteryData)
        }

        // Fetch GLOBAL_POSITION_INT
        const globalPositionRes = await fetch(`/params/GLOBAL_POSITION_INT.json?t=${Date.now()}`)
        if (!globalPositionRes.ok) {
          useSimulatedData = true
        } else {
          const globalPositionData = await globalPositionRes.json()
          setGlobalPosition(globalPositionData)
        }

        // If any fetch failed, use simulated data
        if (useSimulatedData) {
          const simulatedData = flightSimulator.current.update()
          setLocalPosition(simulatedData.localPosition)
          setAttitude(simulatedData.attitude)
          setBattery(simulatedData.battery)
          setGlobalPosition(simulatedData.globalPosition)
        }
      } catch (error) {
        console.error("Error fetching parameter data:", error)
        // Generate realistic simulated data if fetch fails
        const simulatedData = flightSimulator.current.update()
        setLocalPosition(simulatedData.localPosition)
        setAttitude(simulatedData.attitude)
        setBattery(simulatedData.battery)
        setGlobalPosition(simulatedData.globalPosition)
      }
    }

    // Initial fetch
    fetchParameterData()

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchParameterData, 1000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])


  return (
    <Tabs defaultValue="overview" className="space-y-6">

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-1 lg:grid-cols-3 ml-auto h-100" >
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
              <div className="text-base font-medium">{battery ? battery.battery_remaining + "%" : "Loading..."}</div>
              <p className="text-xs text-muted-foreground">
                {battery ? (battery.voltages[0] / 1000).toFixed(1) + "V" : ""}
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
                {globalPosition ? (-globalPosition.relative_alt / 1000).toFixed(2) + " m" : "Loading..."}
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
                {attitude ? (attitude.roll * (180 / Math.PI)).toFixed(1) + "°" : "Loading..."}
              </div>
              <p className="text-xs text-muted-foreground">
                {attitude
                  ? "P: " +
                  (attitude.pitch * (180 / Math.PI)).toFixed(1) +
                  "° Y: " +
                  (attitude.yaw * (180 / Math.PI)).toFixed(1) +
                  "°"
                  : ""}
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
                  ? (Math.sqrt(Math.pow(globalPosition.vx, 2) + Math.pow(globalPosition.vy, 2)) / 100).toFixed(2) +
                  " m/s"
                  : "Loading..."}
              </div>
              <p className="text-xs text-muted-foreground">
                {globalPosition
                  ? ((Math.sqrt(Math.pow(globalPosition.vx, 2) + Math.pow(globalPosition.vy, 2)) / 100) * 3.6).toFixed(
                    2,
                  ) + " km/h"
                  : ""}
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
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
                <div className="text-center py-8 text-muted-foreground">Loading position data...</div>
              )}
            </CardContent>
          </Card>

          {/* New row: Roll, Pitch, Yaw (Attitude) below Wx, Wy, Wz */}
          {/* Single long box for Roll, Pitch, Yaw - longer and better fit */}
          <Card className="w-full min-w-[420px] h-24 flex flex-row items-center justify-evenly px-10 mt-2">
            <div className="flex flex-col items-center flex-1">
              <CardTitle className="text-base font-semibold">Roll</CardTitle>
              <span className="text-2xl font-bold">{attitude?.roll?.toFixed(2) ?? '--'}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <CardTitle className="text-base font-semibold">Pitch</CardTitle>
              <span className="text-2xl font-bold">{attitude?.pitch?.toFixed(2) ?? '--'}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
              <CardTitle className="text-base font-semibold">Yaw</CardTitle>
              <span className="text-2xl font-bold">{attitude?.yaw?.toFixed(2) ?? '--'}</span>
            </div>
          </Card>

        </div>
      </TabsContent>

    </Tabs>
  )
}