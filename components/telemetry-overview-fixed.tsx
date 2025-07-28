"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUp, Battery, Gauge, Thermometer } from "lucide-react"

export function TelemetryOverview() {
    const [localPosition, setLocalPosition] = useState<any>(null)
    const [attitude, setAttitude] = useState<any>(null)
    const [battery, setBattery] = useState<any>(null)
    const [globalPosition, setGlobalPosition] = useState<any>(null)

    useEffect(() => {
        // Function to fetch parameter data without loading states
        const fetchParameterData = async () => {
            try {
                // Fetch LOCAL_POSITION_NED
                const localPositionRes = await fetch(`/params/LOCAL_POSITION_NED.json?t=${Date.now()}`)
                if (localPositionRes.ok) {
                    const localPositionData = await localPositionRes.json()
                    setLocalPosition(localPositionData)
                }

                // Fetch ATTITUDE
                const attitudeRes = await fetch(`/params/ATTITUDE.json?t=${Date.now()}`)
                if (attitudeRes.ok) {
                    const attitudeData = await attitudeRes.json()
                    setAttitude(attitudeData)
                }

                // Fetch BATTERY_STATUS
                const batteryRes = await fetch(`/params/BATTERY_STATUS.json?t=${Date.now()}`)
                if (batteryRes.ok) {
                    const batteryData = await batteryRes.json()
                    setBattery(batteryData)
                }

                // Fetch GLOBAL_POSITION_INT
                const globalPositionRes = await fetch(`/params/GLOBAL_POSITION_INT.json?t=${Date.now()}`)
                if (globalPositionRes.ok) {
                    const globalPositionData = await globalPositionRes.json()
                    setGlobalPosition(globalPositionData)
                }

            } catch (error) {
                console.error("Error fetching parameter data:", error)
                // Don't reset states on error - keep last known values
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
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="attitude">Attitude</TabsTrigger>
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Altitude</CardTitle>
                            <ArrowUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {globalPosition ? (-globalPosition.relative_alt / 1000).toFixed(2) + " m" : "0.00 m"}
                            </div>
                            <p className="text-xs text-muted-foreground">Relative to home</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ground Speed</CardTitle>
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {globalPosition
                                    ? (Math.sqrt(Math.pow(globalPosition.vx, 2) + Math.pow(globalPosition.vy, 2)) / 100).toFixed(2) +
                                    " m/s"
                                    : "0.00 m/s"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {globalPosition
                                    ? ((Math.sqrt(Math.pow(globalPosition.vx, 2) + Math.pow(globalPosition.vy, 2)) / 100) * 3.6).toFixed(
                                        2,
                                    ) + " km/h"
                                    : "0.00 km/h"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Battery</CardTitle>
                            <Battery className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{battery ? battery.battery_remaining + "%" : "0%"}</div>
                            <p className="text-xs text-muted-foreground">
                                {battery ? (battery.voltages[0] / 1000).toFixed(1) + "V" : "0.0V"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Attitude</CardTitle>
                            <Thermometer className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
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
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle>Attitude Data</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <div className="grid grid-cols-3 gap-4 h-full">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Roll</div>
                                    <div className="text-2xl font-mono">{attitude?.roll?.toFixed(2) || '0.00'}°</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Pitch</div>
                                    <div className="text-2xl font-mono">{attitude?.pitch?.toFixed(2) || '0.00'}°</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Yaw</div>
                                    <div className="text-2xl font-mono">{attitude?.yaw?.toFixed(2) || '0.00'}°</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Position Data</CardTitle>
                            <CardDescription>LOCAL_POSITION_NED</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {localPosition ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">X Position</div>
                                            <div className="font-mono text-sm">{localPosition.x.toFixed(2)} m</div>
                                        </div>
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">Y Position</div>
                                            <div className="font-mono text-sm">{localPosition.y.toFixed(2)} m</div>
                                        </div>
                                    </div>
                                    <div className="rounded-md border p-2">
                                        <div className="text-xs text-muted-foreground">Z Position (Altitude)</div>
                                        <div className="font-mono text-sm">{localPosition.z.toFixed(2)} m</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">X Velocity</div>
                                            <div className="font-mono text-sm">{localPosition.vx.toFixed(2)} m/s</div>
                                        </div>
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">Y Velocity</div>
                                            <div className="font-mono text-sm">{localPosition.vy.toFixed(2)} m/s</div>
                                        </div>
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">Z Velocity</div>
                                            <div className="font-mono text-sm">{localPosition.vz.toFixed(2)} m/s</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">X Position</div>
                                            <div className="font-mono text-sm">0.00 m</div>
                                        </div>
                                        <div className="rounded-md border p-2">
                                            <div className="text-xs text-muted-foreground">Y Position</div>
                                            <div className="font-mono text-sm">0.00 m</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="attitude">
                <Card>
                    <CardHeader>
                        <CardTitle>Attitude Data</CardTitle>
                        <CardDescription>Real-time attitude data</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[500px]">
                        <div className="grid grid-cols-2 gap-6 h-full">
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded">
                                    <div className="text-lg text-gray-600 dark:text-gray-400">Roll</div>
                                    <div className="text-4xl font-mono">{attitude?.roll?.toFixed(2) || '0.00'}°</div>
                                    <div className="text-sm text-gray-500">Roll Speed: {attitude?.rollspeed?.toFixed(2) || '0.00'} rad/s</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded">
                                    <div className="text-lg text-gray-600 dark:text-gray-400">Pitch</div>
                                    <div className="text-4xl font-mono">{attitude?.pitch?.toFixed(2) || '0.00'}°</div>
                                    <div className="text-sm text-gray-500">Pitch Speed: {attitude?.pitchspeed?.toFixed(2) || '0.00'} rad/s</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded">
                                    <div className="text-lg text-gray-600 dark:text-gray-400">Yaw</div>
                                    <div className="text-4xl font-mono">{attitude?.yaw?.toFixed(2) || '0.00'}°</div>
                                    <div className="text-sm text-gray-500">Yaw Speed: {attitude?.yawspeed?.toFixed(2) || '0.00'} rad/s</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded">
                                    <div className="text-lg text-gray-600 dark:text-gray-400">Status</div>
                                    <div className="text-2xl font-mono">{attitude ? 'Live' : 'Ready'}</div>
                                    <div className="text-sm text-gray-500">Time: {attitude?.time_boot_ms || 0}ms</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="parameters">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-mono">Active</div>
                            <div className="text-sm text-gray-500">All systems operational</div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    )
}
