"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CalibrationService } from '@/lib/mavlink/calibration'
import { CALIBRATION_STATUS } from '@/lib/mavlink/mavlink-enums'
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CalibrationPage() {
  const [calibrationService, setCalibrationService] = useState<CalibrationService | null>(null)
  const [activeCalibration, setActiveCalibration] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'calibrating' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState("")
  const [statusHistory, setStatusHistory] = useState<string[]>([])
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    const service = new CalibrationService('ws://localhost:8765')
    setCalibrationService(service)
    service.onCalibrationStatus((status, progress) => {
      if (status.includes('success')) {
        setStatus('success')
        setStatusMessage(`${activeCalibration} calibration completed successfully`)
      } else if (status.includes('failed')) {
        setStatus('error')
        setStatusMessage(`${activeCalibration} calibration failed`)
      } else {
        setStatus('calibrating')
        setStatusMessage(status)
        if (progress !== undefined) {
          setProgress(progress)
        }
      }
      setStatusHistory(prev => [...prev, status])
    })
  }, [activeCalibration])

  const startCalibration = (type: string, command: string) => {
    setActiveCalibration(type)
    setStatus('calibrating')
    setStatusMessage(`Starting ${type} calibration...`)
    setStatusHistory([`Starting ${type} calibration...`])
    setProgress(0)
    calibrationService?.startCalibration(command)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sensor Calibration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gyroscope Calibration</CardTitle>
              <CardDescription>Keep the drone completely still on a level surface.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => startCalibration('Gyroscope', 'gyro_calibration')} 
                disabled={status === 'calibrating'}
                className="w-full"
              >
                Start Gyro Calibration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accelerometer Calibration</CardTitle>
              <CardDescription>
                You will need to place the vehicle in 6 different orientations:
                level, on each side, nose down, and nose up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => startCalibration('Accelerometer', 'accel_calibration')} 
                disabled={status === 'calibrating'}
                className="w-full"
              >
                Start Accelerometer Calibration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Magnetometer Calibration</CardTitle>
              <CardDescription>
                Rotate the drone around all axes. Keep away from metal objects.
                Continue rotation for at least 30 seconds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => startCalibration('Magnetometer', 'mag_calibration')} 
                disabled={status === 'calibrating'}
                className="w-full"
              >
                Start Magnetometer Calibration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Barometer Calibration</CardTitle>
              <CardDescription>
                Keep the drone still and at a stable temperature.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => startCalibration('Barometer', 'baro_calibration')} 
                disabled={status === 'calibrating'}
                className="w-full"
              >
                Start Barometer Calibration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Full Calibration</CardTitle>
              <CardDescription>
                Run all calibrations in sequence (Gyro → Mag → Accel → Baro).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => startCalibration('Full', 'all_calibration')} 
                disabled={status === 'calibrating'}
                className="w-full"
              >
                Start Full Calibration
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {status !== 'idle' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Current Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert 
                    variant={
                      status === 'success' ? 'default' : 
                      status === 'error' ? 'destructive' : 
                      'default'
                    }
                  >
                    <AlertTitle>
                      {status === 'success' ? 'Success' : 
                       status === 'error' ? 'Error' : 
                       'Calibrating...'}
                    </AlertTitle>
                    <AlertDescription>{statusMessage}</AlertDescription>
                  </Alert>
                  {status === 'calibrating' && progress > 0 && (
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center">{progress}% Complete</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] rounded-md border p-4">
                    {statusHistory.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className="text-sm py-1 border-b last:border-0"
                      >
                        {msg}
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}