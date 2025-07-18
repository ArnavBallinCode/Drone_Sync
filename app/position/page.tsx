"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PositionData } from "@/components/position-data"
import { PositionMap } from "@/components/position-map"

export default function PositionPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Position Data</CardTitle>
          </CardHeader>
          <CardContent>
          <PositionData />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Map View</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <PositionMap />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
