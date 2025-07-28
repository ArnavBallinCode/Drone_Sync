"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { useAutoCollect } from "@/contexts/auto-collect-context"

interface ZvsTimeChartProps {
  data?: any[];
}

export default function ZvsTimeChart({ data }: ZvsTimeChartProps) {
  const [graphData, setGraphData] = useState<number[]>(new Array(300).fill(0)); // 300 points for 5 minutes
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [currentZ, setCurrentZ] = useState(0);
  const { autoCollect, collecting } = useAutoCollect();

  // Fetch real Z position data
  const fetchZPosition = async () => {
    try {
      const response = await fetch('/params/LOCAL_POSITION_NED.json?t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const position = await response.json();
        console.log('Z position data:', position); // Debug log
        // Get raw Z value from NED coordinate system
        const rawZ = position?.z || 0;
        // For altitude display, use absolute value and convert to positive height
        const height = Math.abs(rawZ);
        // Show more precise values for small movements
        const clampedHeight = Math.max(0, Math.min(6, height));
        console.log(`Raw Z: ${rawZ}, Height: ${height}, Clamped: ${clampedHeight}`); // Debug log
        return clampedHeight;
      } else {
        console.log('Failed to fetch LOCAL_POSITION_NED.json:', response.status);
        return 0;
      }
    } catch (error) {
      console.log('Z position fetch error:', error);
      return 0;
    }
  };

  // Update graph every second when auto-collect is active (real-time monitoring)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoCollect && !collecting) {
      setIsActive(true);
      interval = setInterval(async () => {
        const newZ = await fetchZPosition();
        setCurrentZ(newZ); // Store current Z value

        setGraphData(prevData => {
          const newData = [...prevData];
          newData[currentIndex] = newZ;
          return newData;
        });

        setCurrentIndex(prev => (prev + 1) % 300); // 300 points for 5 minutes
      }, 1000); // Update every 1 second (300 seconds = 5 minutes)
    } else {
      setIsActive(false);
      // Clear graph when stopped
      if (!autoCollect) {
        setGraphData(new Array(300).fill(0)); // Reset to 300 points
        setCurrentIndex(0);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoCollect, collecting, currentIndex]);

  // Simple SVG chart - 5 minutes of real-time data
  const renderChart = () => {
    const width = 900;  // Wider for 5 minutes
    const height = 280;  // Taller for better visibility
    const padding = 60;  // More padding for cleaner labels
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Create path points for smooth ECG-style movement (300 points = 5 minutes)
    const points = graphData.map((z, index) => {
      const x = padding + (index / 299) * chartWidth; // 299 to get full width
      // Map 0-6m range to chart height (0m at bottom, 6m at top)
      const y = padding + chartHeight - (z / 6) * chartHeight;
      return { x, y, isActive: index === currentIndex };
    });

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="border-none rounded-lg bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <defs>
          {/* Enhanced gradient for professional line */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="75%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.95" />
          </linearGradient>

          {/* Subtle glow effect */}
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Current position glow */}
          <filter id="currentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines - 5 minute intervals */}
        {[0, 1, 2, 3, 4, 5].map(minute => (
          <g key={minute}>
            <line
              x1={padding + (minute / 5) * chartWidth}
              y1={padding}
              x2={padding + (minute / 5) * chartWidth}
              y2={height - padding}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.6"
            />
            <text
              x={padding + (minute / 5) * chartWidth}
              y={height - 20}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
              fontWeight="500"
            >
              {minute}min
            </text>
          </g>
        ))}

        {/* Y-axis labels - Height markers */}
        {[0, 1, 2, 3, 4, 5, 6].map(meter => (
          <g key={meter}>
            <line
              x1={padding}
              y1={padding + chartHeight - (meter / 6) * chartHeight}
              x2={width - padding}
              y2={padding + chartHeight - (meter / 6) * chartHeight}
              stroke="#f3f4f6"
              strokeWidth="1"
              opacity="0.5"
            />
            <text
              x={25}
              y={padding + chartHeight - (meter / 6) * chartHeight + 4}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
              fontWeight="500"
            >
              {meter}m
            </text>
          </g>
        ))}

        {/* Enhanced smooth line path for real-time data */}
        {autoCollect && graphData.some(value => value !== 0) && (
          <path
            d={(() => {
              const validPoints = points
                .map((point, index) => ({ ...point, value: graphData[index] }))
                .filter((point, index) => index <= currentIndex && point.value !== 0);

              if (validPoints.length === 0) return '';
              if (validPoints.length === 1) return `M ${validPoints[0].x},${validPoints[0].y}`;

              // Simple line path for better visibility
              const pathCommands = validPoints.map((point, index) =>
                `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`
              );
              
              return pathCommands.join(' ');
            })()}
            fill="none"
            stroke="#2563eb"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="1"
            style={{
              transition: 'all 0.1s ease-out'
            }}
          />
        )}

        {/* Enhanced current position indicator */}
        {autoCollect && currentZ > 0 && currentIndex > 0 && (
          <>
            {/* Outer glow ring */}
            <circle
              cx={points[currentIndex - 1]?.x || 0}
              cy={points[currentIndex - 1]?.y || 0}
              r="8"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
              opacity="0.4"
              filter="url(#currentGlow)"
            />
            {/* Main position dot */}
            <circle
              cx={points[currentIndex - 1]?.x || 0}
              cy={points[currentIndex - 1]?.y || 0}
              r="4"
              fill="#1e40af"
              stroke="#ffffff"
              strokeWidth="2"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.4))',
                transition: 'all 0.2s ease-out'
              }}
            />
          </>
        )}

        {/* Chart title and current value */}
        <text
          x={width / 2}
          y={25}
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          fontWeight="600"
        >
          Altitude Monitor - 5 Minute Window
        </text>

        {/* Current Z value display with enhanced styling */}
        <text
          x={width - 80}
          y={45}
          textAnchor="middle"
          fontSize="12"
          fill="#1e40af"
          fontWeight="700"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(30, 64, 175, 0.3))' }}
        >
          {currentZ.toFixed(3)}m
        </text>
      </svg>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="w-5 h-5" />
            Z Monitor - {isActive ? `Live Feed (${currentZ.toFixed(3)}m)` : autoCollect ? 'Starting...' : 'Stopped'}
            {collecting && (
              <span className="text-sm text-orange-500 font-normal">Collecting...</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 flex flex-col" style={{ minHeight: '350px' }}>
          <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
            {renderChart()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
