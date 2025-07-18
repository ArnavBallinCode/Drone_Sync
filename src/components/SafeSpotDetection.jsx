import React, { useState, useEffect, useRef } from 'react';

// Position data simulator for fallback (similar to other components)
class PositionSimulator {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.radius = 4;
    this.angle = 0;
    this.angleIncrement = 0.02;
  }

  update() {
    this.angle += this.angleIncrement;
    this.x = this.radius * Math.sin(this.angle) + 4.5; // Center around field
    this.y = this.radius * Math.cos(this.angle) + 6;
    return { x: this.x, y: this.y };
  }
}

const SafeSpotDetection = () => {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [detectedSpots, setDetectedSpots] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const simulatorRef = useRef(new PositionSimulator());
  
  // Safe spot coordinates based on the diagram (in meters)
  const safeSpots = [
    { id: 1, name: "Safe Spot 1", x: 3.5, y: 6.5 },
    { id: 2, name: "Safe Spot 2", x: 2.0, y: 9.0 },
    { id: 3, name: "Safe Spot 3", x: 6.5, y: 9.0 },
    { id: 4, name: "Home Position", x: 8.4, y: 1.6 }
  ];

  // Detection threshold (0.5 meters)
  const DETECTION_THRESHOLD = 0.5;

  // Calculate distance between two points
  const calculateDistance = (pos1, pos2) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  };

  // Fetch real-time position data (similar to other components in your workspace)
  useEffect(() => {
    const fetchPositionData = async () => {
      try {
        // Try to fetch LOCAL_POSITION_NED data first
        const localResponse = await fetch(`/params/LOCAL_POSITION_NED.json?t=${Date.now()}`);
        
        if (localResponse.ok) {
          const localData = await localResponse.json();
          if (localData && typeof localData.x === 'number' && typeof localData.y === 'number') {
            // Convert NED coordinates to field coordinates (adjust scale as needed)
            const fieldX = localData.x + 4.5; // Offset to center of field
            const fieldY = localData.y + 6;   // Offset to center of field
            
            setCurrentPosition({ x: fieldX, y: fieldY });
            setConnectionStatus('Connected - Live Data');
            return;
          }
        }

        // Fallback to GLOBAL_POSITION_INT if LOCAL_POSITION_NED fails
        const globalResponse = await fetch(`/params/GLOBAL_POSITION_INT.json?t=${Date.now()}`);
        
        if (globalResponse.ok) {
          const globalData = await globalResponse.json();
          if (globalData && globalData.lat && globalData.lon) {
            // For demonstration, convert GPS to field coordinates (you may need to adjust this)
            const fieldX = (globalData.lat % 1000) / 100; // Simplified conversion
            const fieldY = (globalData.lon % 1000) / 100;
            
            setCurrentPosition({ x: fieldX, y: fieldY });
            setConnectionStatus('Connected - GPS Data');
            return;
          }
        }

        // If both fail, use simulated data
        throw new Error('No real data available');

      } catch (error) {
        console.error('Error fetching position data:', error);
        // Use simulated data as fallback
        const simulatedPos = simulatorRef.current.update();
        setCurrentPosition(simulatedPos);
        setConnectionStatus('Simulated Data');
      }
    };

    // Initial fetch
    fetchPositionData();

    // Set up interval for periodic updates (similar to other components)
    const intervalId = setInterval(fetchPositionData, 500); // Update every 500ms

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Check if drone is at any safe spot
  useEffect(() => {
    safeSpots.forEach(spot => {
      const distance = calculateDistance(currentPosition, spot);
      if (distance <= DETECTION_THRESHOLD && !detectedSpots.includes(spot.id)) {
        setDetectedSpots(prev => [...prev, spot.id]);
        // Create a more professional notification
        console.log(`🎯 ${spot.name} Detected! Distance: ${distance.toFixed(2)}m`);
        
        // You can replace this with a proper notification system
        if (window.confirm(`🎯 ${spot.name} Detected!\nDistance: ${distance.toFixed(2)}m\nClick OK to acknowledge.`)) {
          console.log(`${spot.name} detection acknowledged`);
        }
      }
    });
  }, [currentPosition, detectedSpots]);

  // Simulate drone movement (for testing purposes)
  const simulateMovement = (targetSpot) => {
    setCurrentPosition({ x: targetSpot.x, y: targetSpot.y });
  };

  // Calculate field bounds for proper scaling
  const fieldWidth = 9;  // meters
  const fieldHeight = 12; // meters
  const svgWidth = 450;   // pixels
  const svgHeight = 600;  // pixels

  return (
    <div className="safe-spot-detection">
      <h1>Safe Spot Detection System</h1>
      
      <div className="status-bar">
        <div className={`connection-status ${connectionStatus.includes('Connected') ? 'connected' : 'disconnected'}`}>
          <span className="status-dot">●</span>
          {connectionStatus}
        </div>
        <div className="position-info">
          Position: X: {currentPosition.x.toFixed(2)}m, Y: {currentPosition.y.toFixed(2)}m
        </div>
      </div>
      
      <div className="field-container">
        <div className="field-diagram">
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${fieldWidth} ${fieldHeight}`} className="field-svg">
            {/* Field boundary */}
            <rect x="0" y="0" width={fieldWidth} height={fieldHeight} fill="#e8f5e8" stroke="#000" strokeWidth="0.1"/>
            
            {/* Grid lines for better visualization */}
            {[1,2,3,4,5,6,7,8].map(i => (
              <line key={`v${i}`} x1={i} y1="0" x2={i} y2={fieldHeight} stroke="#ddd" strokeWidth="0.02"/>
            ))}
            {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
              <line key={`h${i}`} x1="0" y1={i} x2={fieldWidth} y2={i} stroke="#ddd" strokeWidth="0.02"/>
            ))}
            
            {/* Safe spots */}
            {safeSpots.map(spot => (
              <g key={spot.id}>
                {/* Detection radius circle */}
                <circle 
                  cx={spot.x} 
                  cy={fieldHeight - spot.y} 
                  r={DETECTION_THRESHOLD}
                  fill={detectedSpots.includes(spot.id) ? "rgba(0,255,0,0.2)" : "rgba(0,102,204,0.1)"}
                  stroke={detectedSpots.includes(spot.id) ? "#00ff00" : "#0066cc"}
                  strokeWidth="0.03"
                  strokeDasharray="0.1,0.1"
                />
                
                {/* Safe spot marker */}
                <rect 
                  x={spot.x - 0.3} 
                  y={fieldHeight - spot.y - 0.3} 
                  width="0.6" 
                  height="0.6" 
                  fill={detectedSpots.includes(spot.id) ? "#00ff00" : "#0066cc"}
                  stroke="#000"
                  strokeWidth="0.02"
                />
                
                {/* Spot label */}
                <text 
                  x={spot.x} 
                  y={fieldHeight - spot.y + 0.8} 
                  textAnchor="middle" 
                  fontSize="0.3"
                  fill="#000"
                  fontWeight="bold"
                >
                  {spot.name}
                </text>
              </g>
            ))}
            
            {/* Current drone position */}
            <g>
              <circle 
                cx={currentPosition.x} 
                cy={fieldHeight - currentPosition.y} 
                r="0.25" 
                fill="#ff0000"
                stroke="#fff"
                strokeWidth="0.05"
              />
              <circle 
                cx={currentPosition.x} 
                cy={fieldHeight - currentPosition.y} 
                r="0.15" 
                fill="#fff"
              />
              <text 
                x={currentPosition.x} 
                y={fieldHeight - currentPosition.y - 0.5} 
                textAnchor="middle" 
                fontSize="0.25"
                fill="#ff0000"
                fontWeight="bold"
              >
                DRONE
              </text>
            </g>
            
            {/* Field dimensions */}
            <text x={fieldWidth/2} y="0.5" textAnchor="middle" fontSize="0.3" fill="#666">
              {fieldWidth}m (≈ 30 ft.)
            </text>
            <text x="0.5" y={fieldHeight/2} textAnchor="middle" fontSize="0.3" fill="#666" 
                  transform={`rotate(-90, 0.5, ${fieldHeight/2})`}>
              {fieldHeight}m (≈ 40 ft.)
            </text>
          </svg>
        </div>
        
        <div className="control-panel">
          <h3>Live Position Data</h3>
          <div className="data-display">
            <p><strong>X:</strong> {currentPosition.x.toFixed(3)}m</p>
            <p><strong>Y:</strong> {currentPosition.y.toFixed(3)}m</p>
            <p><strong>Source:</strong> {connectionStatus}</p>
          </div>
          
          <h3>Safe Spots Status</h3>
          <div className="spots-list">
            {safeSpots.map(spot => {
              const distance = calculateDistance(currentPosition, spot);
              const isDetected = detectedSpots.includes(spot.id);
              
              return (
                <div key={spot.id} className={`spot-status ${isDetected ? 'detected' : 'pending'}`}>
                  <div className="spot-info">
                    <span className={`status-indicator ${isDetected ? 'detected' : 'pending'}`}>
                      ●
                    </span>
                    <div className="spot-details">
                      <span className="spot-name">{spot.name}</span>
                      <span className="spot-coords">({spot.x}, {spot.y})</span>
                      <span className="distance">Distance: {distance.toFixed(2)}m</span>
                    </div>
                    <span className={`status-text ${isDetected ? 'detected-text' : 'pending-text'}`}>
                      {isDetected ? 'DETECTED' : 'PENDING'}
                    </span>
                  </div>
                  <button 
                    onClick={() => simulateMovement(spot)}
                    className="move-button"
                    title="Simulate movement to this position"
                  >
                    Test Go to {spot.name}
                  </button>
                </div>
              );
            })}
          </div>
          
          <h3>Detection Summary</h3>
          <div className="summary">
            <p><strong>Detected:</strong> {detectedSpots.length}/{safeSpots.length} safe spots</p>
            <p><strong>Detection Range:</strong> {DETECTION_THRESHOLD}m radius</p>
            <p><strong>Update Rate:</strong> 2Hz (500ms)</p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .safe-spot-detection {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #e9ecef;
        }
        
        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        
        .connection-status.connected .status-dot {
          color: #28a745;
        }
        
        .connection-status.disconnected .status-dot {
          color: #dc3545;
        }
        
        .position-info {
          font-family: 'Courier New', monospace;
          background: #ffffff;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid #dee2e6;
        }
        
        .field-container {
          display: flex;
          gap: 30px;
          margin-top: 20px;
        }
        
        .field-diagram {
          flex: 1.2;
        }
        
        .field-svg {
          border: 2px solid #333;
          background: white;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-radius: 8px;
        }
        
        .control-panel {
          flex: 1;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        }
        
        .data-display {
          background: #ffffff;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-family: 'Courier New', monospace;
        }
        
        .spots-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .spot-status {
          margin: 12px 0;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #dee2e6;
          transition: all 0.3s ease;
        }
        
        .spot-status.detected {
          border-color: #28a745;
          background: #f8fff9;
        }
        
        .spot-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        
        .spot-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .spot-name {
          font-weight: bold;
          font-size: 14px;
        }
        
        .spot-coords {
          font-size: 12px;
          color: #6c757d;
          font-family: 'Courier New', monospace;
        }
        
        .distance {
          font-size: 11px;
          color: #495057;
        }
        
        .status-indicator.detected {
          color: #28a745;
          font-size: 18px;
        }
        
        .status-indicator.pending {
          color: #6c757d;
          font-size: 18px;
        }
        
        .detected-text {
          color: #28a745;
          font-weight: bold;
          font-size: 12px;
        }
        
        .pending-text {
          color: #6c757d;
          font-size: 12px;
        }
        
        .move-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          transition: background-color 0.2s;
          width: 100%;
        }
        
        .move-button:hover {
          background: #0056b3;
        }
        
        .summary {
          background: #ffffff;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        
        h1 {
          text-align: center;
          color: #343a40;
          margin-bottom: 30px;
        }
        
        h3 {
          color: #495057;
          margin-bottom: 15px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 5px;
        }
      `}</style>
    </div>
  );
};

export default SafeSpotDetection;