"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

interface AutoCollectContextType {
    autoCollect: boolean
    collecting: boolean
    graphData: any[]
    toggleAutoCollect: () => void
    refreshData: () => void
}

const AutoCollectContext = createContext<AutoCollectContextType | undefined>(undefined)

export function AutoCollectProvider({ children }: { children: React.ReactNode }) {
    const [autoCollect, setAutoCollect] = useState(false)
    const [collecting, setCollecting] = useState(false)
    const [graphData, setGraphData] = useState<any[]>([])
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch graph data
    const fetchGraphData = async () => {
        try {
            const response = await fetch('/api/history-data?days=1', { cache: 'no-store' })
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const result = await response.json()
            if (result.status === 'success') {
                setGraphData(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching graph data:', error)
        }
    }

    // Collect current data and update graph
    const collectCurrentData = async () => {
        setCollecting(true)
        try {
            const response = await fetch('/api/history-data?action=collect', {
                method: 'GET',
                cache: 'no-store'
            })
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const result = await response.json()
            if (result.status === 'success') {
                await fetchGraphData()
            }
        } catch (error) {
            console.error('Error collecting data:', error)
        } finally {
            setCollecting(false)
        }
    }

    // Toggle auto-collect
    const toggleAutoCollect = () => {
        if (autoCollect) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            setAutoCollect(false)
        } else {
            collectCurrentData()
            intervalRef.current = setInterval(collectCurrentData, 5000)
            setAutoCollect(true)
        }
    }

    // Refresh data manually
    const refreshData = () => {
        fetchGraphData()
    }

    // Initial fetch and cleanup
    useEffect(() => {
        fetchGraphData()
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [])

    return (
        <AutoCollectContext.Provider value={{
            autoCollect,
            collecting,
            graphData,
            toggleAutoCollect,
            refreshData
        }}>
            {children}
        </AutoCollectContext.Provider>
    )
}

export function useAutoCollect() {
    const context = useContext(AutoCollectContext)
    if (context === undefined) {
        throw new Error('useAutoCollect must be used within an AutoCollectProvider')
    }
    return context
}
