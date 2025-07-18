"use client"

import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold mb-8 text-center">Documentation</h1>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-blue-400">System Overview</h2>
                <p className="text-gray-300 mb-4">
                  The Drone Web Interface is a sophisticated real-time monitoring and control system designed
                  for UAV operations. It provides comprehensive telemetry visualization, system health monitoring,
                  and mission control capabilities.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">Key Components</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Real-time Telemetry Display</li>
                      <li>Battery Status Monitoring</li>
                      <li>System Health Dashboard</li>
                      <li>Communication Status</li>
                    </ul>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">Technology Stack</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Next.js & React</li>
                      <li>Python Backend</li>
                      <li>MAVLink Protocol</li>
                      <li>WebSocket Communication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="setup" className="mt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-blue-400">Installation & Setup</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">Prerequisites</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Python 3.8+</li>
                      <li>Node.js 16+</li>
                      <li>MAVLink compatible flight controller</li>
                      <li>USB or Telemetry connection</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">Quick Start</h3>
                    <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm">
                      <p className="text-green-400"># Clone the repository</p>
                      <p className="text-gray-300">git clone https://github.com/your-repo/drone-interface.git</p>
                      <p className="text-green-400 mt-2"># Install dependencies</p>
                      <p className="text-gray-300">npm install</p>
                      <p className="text-gray-300">pip install -r requirements.txt</p>
                      <p className="text-green-400 mt-2"># Start the application</p>
                      <p className="text-gray-300">npm run dev</p>
                      <p className="text-gray-300">python listen.py --connection /dev/ttyUSB0</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-blue-400">Features & Capabilities</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-blue-300">Telemetry Monitoring</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Real-time attitude data (Roll, Pitch, Yaw)</li>
                      <li>Battery status and consumption</li>
                      <li>GPS position and velocity</li>
                      <li>IMU sensor readings</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-blue-300">System Health</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>CPU and memory usage</li>
                      <li>Temperature monitoring</li>
                      <li>Storage status</li>
                      <li>Communication quality</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-blue-300">Communication</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>MAVLink protocol integration</li>
                      <li>Real-time data streaming</li>
                      <li>Automatic reconnection</li>
                      <li>Error handling and logging</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-blue-300">User Interface</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                      <li>Responsive design</li>
                      <li>Dark mode optimization</li>
                      <li>Real-time updates</li>
                      <li>Interactive visualizations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4 text-blue-400">API Reference</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">Data Endpoints</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-200">GET /params/ATTITUDE.json</h4>
                        <p className="text-gray-300 mt-2">Returns current attitude data including roll, pitch, and yaw.</p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-200">GET /params/BATTERY_STATUS.json</h4>
                        <p className="text-gray-300 mt-2">Returns battery status including voltage, current, and remaining capacity.</p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-200">GET /params/HEARTBEAT.json</h4>
                        <p className="text-gray-300 mt-2">Returns system status and mode information.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">WebSocket Events</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-200">telemetry_update</h4>
                        <p className="text-gray-300 mt-2">Real-time telemetry data updates.</p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-200">status_change</h4>
                        <p className="text-gray-300 mt-2">System status and mode changes.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-2">Error Handling</h3>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-300">
                        All API endpoints return standard HTTP status codes. Error responses include
                        a JSON object with an error message and additional details when available.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}