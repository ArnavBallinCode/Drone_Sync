"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Enhanced3DView } from "@/components/enhanced-3d-view"
import DroneArenaVisualizer from '@/src/components/DroneArenaVisualizer'
import { AlertTriangle, MapPin, Shield, Settings } from "lucide-react"

export default function ArenaPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arena Control</h1>
          <p className="text-muted-foreground">
            Manage flight arena boundaries, safe spots, and visualization settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Arena Active
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Arena Size</p>
                <p className="text-2xl font-bold">9×12m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Safe Spots</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flight Mode</p>
                <p className="text-2xl font-bold">AUTO</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 3D Arena Visualization */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>3D Arena View</CardTitle>
            <p className="text-sm text-muted-foreground">
              Real-time 3D visualization of the 9×12m flight arena
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Enhanced3DView />
          </CardContent>
        </Card>

        {/* Arena Control Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Arena Control Panel</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure arena boundaries and safety parameters
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button className="w-full" variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Set Arena Boundaries
              </Button>
              <Button className="w-full" variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Configure Safe Spots
              </Button>
              <Button className="w-full" variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Landing Zones
              </Button>
              <Button className="w-full" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Arena Settings
              </Button>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Current Arena Configuration</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Width:</span>
                  <span>9.0 meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Length:</span>
                  <span>12.0 meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Height:</span>
                  <span>3.0 meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Safety Buffer:</span>
                  <span>0.5 meters</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Arena Visualizer */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Arena Mapping</CardTitle>
          <p className="text-sm text-muted-foreground">
            GPS-based arena boundary detection and safe spot identification
          </p>
        </CardHeader>
        <CardContent>
          <DroneArenaVisualizer />
        </CardContent>
      </Card>
    </div>
  )
}
