"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Download, Play, Pause, Database, Clock, TrendingUp, Trash2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { AutoCollectButton } from "@/components/auto-collect-button"
import { useAutoCollect } from "@/contexts/auto-collect-context"

interface TelemetrySnapshot {
  timestamp: string
  time_boot_ms: number
  battery?: {
    voltage: number
    current: number
    remaining: number
    temperature: number
  }
  position?: {
    x: number
    y: number
    z: number
    lat: number
    lon: number
    alt: number
    relative_alt: number
  }
  attitude?: {
    roll: number
    pitch: number
    yaw: number
    rollspeed: number
    pitchspeed: number
    yawspeed: number
  }
  velocity?: {
    vx: number
    vy: number
    vz: number
  }
  imu?: {
    xacc: number
    yacc: number
    zacc: number
    xgyro: number
    ygyro: number
    zgyro: number
    xmag: number
    ymag: number
    zmag: number
  }
  rangefinder?: {
    distance: number
  }
  heartbeat?: {
    system_status: number
    base_mode: number
    custom_mode: number
  }
}

export default function HistoryAnalysisPage() {
  const { graphData, autoCollect, collecting, refreshData } = useAutoCollect()
  const [historyData, setHistoryData] = useState<TelemetrySnapshot[]>([])
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [selectedDays, setSelectedDays] = useState('1')
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [dataCount, setDataCount] = useState(0)
  const [selectedTimeRange, setSelectedTimeRange] = useState('all')

  // Use the shared graphData from context
  useEffect(() => {
    setHistoryData(graphData)
    setDataCount(graphData.length)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [graphData])

  // Fetch historical data (for changing days filter)
  const fetchHistoryData = async (days: number = 1) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/history-data?days=${days}`, {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        setHistoryData(result.data || [])
        setDataCount(result.count || 0)
        setLastUpdate(new Date().toLocaleTimeString())
      } else {
        console.error('Failed to fetch history data:', result.error)
      }
    } catch (error) {
      console.error('Error fetching history data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Clear all history data
  const clearHistoryData = async () => {
    if (!confirm('Are you sure you want to clear all historical data? This action cannot be undone.')) {
      return
    }

    setClearing(true)
    try {
      const response = await fetch('/api/history-data?action=clear', {
        method: 'GET',
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.status === 'success') {
        // Clear local state and refresh
        setHistoryData([])
        setDataCount(0)
        setLastUpdate(new Date().toLocaleTimeString())
        alert(`Successfully cleared ${result.deletedFiles} history files`)
      } else {
        console.error('Failed to clear history data:', result.error)
        alert('Failed to clear history data: ' + result.error)
      }
    } catch (error) {
      console.error('Error clearing history data:', error)
      alert('Error clearing history data: ' + error)
    } finally {
      setClearing(false)
    }
  }

  // Filter data based on time range
  const getFilteredData = () => {
    if (selectedTimeRange === 'all') return historyData

    const now = new Date()
    const hours = parseInt(selectedTimeRange)
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000)

    return historyData.filter(item => new Date(item.timestamp) >= cutoff)
  }

  // Prepare chart data
  const prepareChartData = () => {
    const filtered = getFilteredData()
    return filtered.map((item, index) => ({
      index,
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      fullTime: item.timestamp,

      // Position data (NED coordinate system - invert Z for intuitive display)
      x: item.position?.x || 0,
      y: item.position?.y || 0,
      z: -(item.position?.z || 0), // Invert Z: NED down is positive, but we want up to be positive
      altitude: item.position?.relative_alt || 0,

      // Attitude data
      roll: item.attitude?.roll ? (item.attitude.roll * 180 / Math.PI) : 0,
      pitch: item.attitude?.pitch ? (item.attitude.pitch * 180 / Math.PI) : 0,
      yaw: item.attitude?.yaw ? (item.attitude.yaw * 180 / Math.PI) : 0,

      // Velocity data
      vx: item.velocity?.vx || 0,
      vy: item.velocity?.vy || 0,
      vz: item.velocity?.vz || 0,

      // Battery data
      voltage: item.battery?.voltage || 0,
      current: item.battery?.current || 0,
      batteryRemaining: item.battery?.remaining || 0,

      // IMU data (convert mg to m/s²)
      xacc: item.imu?.xacc ? (item.imu.xacc * 9.80665 / 1000) : 0,
      yacc: item.imu?.yacc ? (item.imu.yacc * 9.80665 / 1000) : 0,
      zacc: item.imu?.zacc ? (item.imu.zacc * 9.80665 / 1000) : 0,
      xgyro: item.imu?.xgyro || 0,
      ygyro: item.imu?.ygyro || 0,
      zgyro: item.imu?.zgyro || 0,

      // Rangefinder
      distance: item.rangefinder?.distance || 0
    }))
  }

  const chartData = prepareChartData()

  // Download data as JSON
  const downloadDataJSON = () => {
    const dataStr = JSON.stringify(historyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `telemetry_history_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Download data as CSV
  const downloadDataCSV = () => {
    if (historyData.length === 0) return

    // Define CSV headers
    const headers = [
      'timestamp',
      'time_boot_ms',
      'battery_voltage',
      'battery_current',
      'battery_remaining',
      'battery_temperature',
      'position_x',
      'position_y',
      'position_z',
      'position_lat',
      'position_lon',
      'position_alt',
      'position_relative_alt',
      'attitude_roll_deg',
      'attitude_pitch_deg',
      'attitude_yaw_deg',
      'attitude_rollspeed',
      'attitude_pitchspeed',
      'attitude_yawspeed',
      'velocity_vx',
      'velocity_vy',
      'velocity_vz',
      'imu_xacc',
      'imu_yacc',
      'imu_zacc',
      'imu_xgyro',
      'imu_ygyro',
      'imu_zgyro',
      'imu_xmag',
      'imu_ymag',
      'imu_zmag',
      'rangefinder_distance',
      'heartbeat_system_status',
      'heartbeat_base_mode',
      'heartbeat_custom_mode'
    ]

    // Convert data to CSV rows
    const csvRows = historyData.map(item => [
      item.timestamp,
      item.time_boot_ms,
      item.battery?.voltage || '',
      item.battery?.current || '',
      item.battery?.remaining || '',
      item.battery?.temperature || '',
      item.position?.x || '',
      item.position?.y || '',
      -(item.position?.z || 0), // Invert Z for intuitive display
      item.position?.lat || '',
      item.position?.lon || '',
      item.position?.alt || '',
      item.position?.relative_alt || '',
      item.attitude?.roll ? (item.attitude.roll * 180 / Math.PI) : '',
      item.attitude?.pitch ? (item.attitude.pitch * 180 / Math.PI) : '',
      item.attitude?.yaw ? (item.attitude.yaw * 180 / Math.PI) : '',
      item.attitude?.rollspeed || '',
      item.attitude?.pitchspeed || '',
      item.attitude?.yawspeed || '',
      item.velocity?.vx || '',
      item.velocity?.vy || '',
      item.velocity?.vz || '',
      item.imu?.xacc || '',
      item.imu?.yacc || '',
      item.imu?.zacc || '',
      item.imu?.xgyro || '',
      item.imu?.ygyro || '',
      item.imu?.zgyro || '',
      item.imu?.xmag || '',
      item.imu?.ymag || '',
      item.imu?.zmag || '',
      item.rangefinder?.distance || '',
      item.heartbeat?.system_status || '',
      item.heartbeat?.base_mode || '',
      item.heartbeat?.custom_mode || ''
    ])

    // Create CSV content
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Download CSV
    const dataBlob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `telemetry_history_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Initial fetch
  useEffect(() => {
    fetchHistoryData(parseInt(selectedDays))
  }, [selectedDays])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📊 History Analysis</h1>
        <div className="flex items-center gap-4">
          <Badge variant={autoCollect ? 'default' : 'secondary'}>
            <Database className="w-4 h-4 mr-1" />
            Auto-Collect: {autoCollect ? 'ON' : 'OFF'}
          </Badge>
          <Badge variant="outline">
            <Clock className="w-4 h-4 mr-1" />
            {dataCount} data points
          </Badge>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Data Collection & Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={selectedDays} onValueChange={setSelectedDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 1 Day</SelectItem>
                  <SelectItem value="3">Last 3 Days</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Range</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Data</SelectItem>
                  <SelectItem value="1">Last 1 Hour</SelectItem>
                  <SelectItem value="6">Last 6 Hours</SelectItem>
                  <SelectItem value="24">Last 24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <AutoCollectButton />

              <Button
                onClick={refreshData}
                disabled={collecting}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${collecting ? 'animate-spin' : ''}`} />
                Refresh Now
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => fetchHistoryData(parseInt(selectedDays))}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>

              <Button
                onClick={downloadDataJSON}
                variant="outline"
                size="sm"
                disabled={historyData.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>

              <Button
                onClick={downloadDataCSV}
                variant="outline"
                size="sm"
                disabled={historyData.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={clearHistoryData}
                disabled={clearing || historyData.length === 0}
                variant="destructive"
                size="sm"
              >
                <Trash2 className={`w-4 h-4 mr-2 ${clearing ? 'animate-spin' : ''}`} />
                {clearing ? 'Clearing...' : 'Clear History'}
              </Button>

              <div className="text-xs text-muted-foreground text-center">
                Permanently deletes all data
              </div>
            </div>
          </div>

          {lastUpdate && (
            <div className="mt-4 text-sm text-muted-foreground">
              Last Update: {lastUpdate} |
              Auto-collect interval: 5 seconds |
              Data points in chart: {chartData.length}
            </div>
          )}
        </CardContent>
      </Card>

      {historyData.length === 0 ? (
        <Alert>
          <AlertTitle>Live Not Connected</AlertTitle>
          <AlertDescription>
            No telemetry data found. Start auto-collect or manually collect data to begin analysis.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="position" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="position">Position</TabsTrigger>
            <TabsTrigger value="attitude">Attitude</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="battery">Battery</TabsTrigger>
            <TabsTrigger value="imu">IMU</TabsTrigger>
            <TabsTrigger value="sensors">Sensors</TabsTrigger>
          </TabsList>

          {/* Position Charts */}
          <TabsContent value="position" className="space-y-6">
            <div className="grid gap-6">
              {/* Z vs Time - Special Highlight */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Z Position vs Time (Height Above Ground)
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Positive values indicate height above starting point (NED Z-axis inverted for intuitive display)
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => `Time: ${value}`}
                        formatter={(value: number, name: string) => [value.toFixed(3) + 'm', 'Height Above Ground']}
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

              {/* XYZ Position */}
              <Card>
                <CardHeader>
                  <CardTitle>XYZ Position vs Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="x" stroke="#8884d8" name="X Position (m)" />
                      <Line type="monotone" dataKey="y" stroke="#82ca9d" name="Y Position (m)" />
                      <Line type="monotone" dataKey="z" stroke="#ffc658" name="Z Height (m)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Altitude */}
              <Card>
                <CardHeader>
                  <CardTitle>Relative Altitude vs Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="altitude" stroke="#ff7300" name="Relative Altitude (m)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attitude Charts */}
          <TabsContent value="attitude" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attitude vs Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="roll" stroke="#8884d8" name="Roll (°)" />
                    <Line type="monotone" dataKey="pitch" stroke="#82ca9d" name="Pitch (°)" />
                    <Line type="monotone" dataKey="yaw" stroke="#ffc658" name="Yaw (°)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Velocity Charts */}
          <TabsContent value="velocity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Velocity vs Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="vx" stroke="#8884d8" name="Vx (m/s)" />
                    <Line type="monotone" dataKey="vy" stroke="#82ca9d" name="Vy (m/s)" />
                    <Line type="monotone" dataKey="vz" stroke="#ffc658" name="Vz (m/s)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Battery Charts */}
          <TabsContent value="battery" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Battery Voltage vs Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="voltage" stroke="#8884d8" name="Voltage (mV)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Battery Current vs Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="current" stroke="#82ca9d" name="Current (mA)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Battery Remaining vs Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="batteryRemaining" stroke="#ffc658" name="Remaining %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMU Charts */}
          <TabsContent value="imu" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Acceleration vs Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="xacc" stroke="#8884d8" name="X Accel (m/s²)" />
                      <Line type="monotone" dataKey="yacc" stroke="#82ca9d" name="Y Accel (m/s²)" />
                      <Line type="monotone" dataKey="zacc" stroke="#ffc658" name="Z Accel (m/s²)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gyroscope vs Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="xgyro" stroke="#8884d8" name="X Gyro" />
                      <Line type="monotone" dataKey="ygyro" stroke="#82ca9d" name="Y Gyro" />
                      <Line type="monotone" dataKey="zgyro" stroke="#ffc658" name="Z Gyro" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sensors Charts */}
          <TabsContent value="sensors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rangefinder Distance vs Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="distance"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Distance (m)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
