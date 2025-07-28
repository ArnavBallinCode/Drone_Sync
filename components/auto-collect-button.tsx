"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { useAutoCollect } from "@/contexts/auto-collect-context"

export function AutoCollectButton() {
    const { autoCollect, collecting, toggleAutoCollect } = useAutoCollect()

    return (
        <div className="flex items-center justify-start p-4">
            <Button
                onClick={toggleAutoCollect}
                variant={autoCollect ? "destructive" : "default"}
                size="sm"
                disabled={collecting}
            >
                {autoCollect ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {autoCollect ? "Abort" : "Get Data"}
            </Button>
        </div>
    )
}
