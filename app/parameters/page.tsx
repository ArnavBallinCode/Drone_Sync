"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ParametersList } from "@/components/parameters-list"
import { ParameterCard } from "@/components/parameter-card"

export default function ParametersPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Parameters List</CardTitle>
          </CardHeader>
          <CardContent>
        <ParametersList />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Parameter Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ParameterCard />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
