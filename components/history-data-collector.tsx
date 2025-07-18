"use client"

import { useEffect, useRef } from 'react'

export function HistoryDataCollector() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCollectingRef = useRef(false)

  const collectData = async () => {
    if (isCollectingRef.current) return // Prevent concurrent calls
    
    isCollectingRef.current = true
    try {
      await fetch('/api/history-data?action=collect', {
        method: 'GET',
        cache: 'no-store'
      })
    } catch (error) {
      console.error('Background data collection error:', error)
    } finally {
      isCollectingRef.current = false
    }
  }

  useEffect(() => {
    // Start automatic data collection every 10 seconds
    intervalRef.current = setInterval(collectData, 10000)
    
    // Initial collection
    collectData()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return null // This component doesn't render anything
}
