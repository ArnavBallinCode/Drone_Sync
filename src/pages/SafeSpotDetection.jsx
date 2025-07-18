import React, { useState, useEffect } from 'react';
import './SafeSpotDetection.css';

const SafeSpotDetection = () => {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [detectedSpots, setDetectedSpots] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  const safeSpots = [
    { id: 1, name: "Safe Spot Alpha", x: 3.5, y: 6.5, color: "#4CAF50" },
    { id: 2, name: "Safe Spot Beta", x: 2.0, y: 9.0, color: "#2196F3" },
    { id: 3, name: "Safe Spot Gamma", x: 6.5, y: 9.0, color: "#FF9800" },
    { id: 4, name: "Home Base", x: 8.4, y: 1.6, color: "#9C27B0" }
  ];

  const DETECTION_THRESHOLD = 0.5;

  const calculateDistance = (pos1, pos2) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setTimeout(() => setAlertMessage(''), 3000);
  };

  useEffect(() => {
    safeSpots.forEach(spot => {
      const distance = calculateDistance(currentPosition, spot);
      if (distance <= DETECTION_THRESHOLD && !detectedSpots.includes(spot.id)) {
        setDetectedSpots(prev => [...prev, spot.id]);
        showAlert(`🎯 ${spot.name} DETECTED!`);
      }
    });
  }, [currentPosition]);

  const moveToSpot = (targetSpot) => {
    setCurrentPosition({ x: targetSpot.x, y: targetSpot.y });
  };

  const resetDetection = () => {
    setDetectedSpots([]);
    setCurrentPosition({ x: 0, y: 0 });
    showAlert('🔄 Detection system reset');
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
    showAlert(isConnected ? '📶 Drone disconnected' : '🔗 Drone connected');
  };

  return (
    <div className="safe-spot-container">
      <header className="page-header">
        <h1>🛡️ Safe Spot Detection System</h1>
        <div className="status-bar">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <button onClick={toggleConnection} className="connect-btn">
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </header>

      {alertMessage && (
        <div className="alert-banner">
          {alertMessage}
        </div>
      )}

      <div className="main-content">
        <div className="field-section">
          <div className="field-header">
            <h2>Field Overview</h2>
            <div className="field-stats">
              <span>Area: 9m × 12m</span>
              <span>Safe Spots: {detectedSpots.length}/{safeSpots.length}</span>
            </div>
          </div>
          
          <div className="field-visualization">
            <svg viewBox="0 0 9 12" className="field-svg">
              <defs>
                <pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse">
                  <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#e0e0e0" strokeWidth="0.02"/>
                </pattern>
              </defs>
              
              <rect width="9" height="12" fill="url(#grid)" stroke="#333" strokeWidth="0.05"/>
              
              {safeSpots.map(spot => (
                <g key={spot.id}>
                  <circle
                    cx={spot.x}
                    cy={12 - spot.y}
                    r={DETECTION_THRESHOLD}
                    fill={spot.color}
                    opacity="0.2"
                    stroke={spot.color}
                    strokeWidth="0.02"
                    strokeDasharray="0.1,0.1"
                  />
                  <rect
                    x={spot.x - 0.25}
                    y={12 - spot.y - 0.25}
                    width="0.5"
                    height="0.5"
                    fill={detectedSpots.includes(spot.id) ? '#00ff00' : spot.color}
                    stroke="#000"
                    strokeWidth="0.03"
                    className={detectedSpots.includes(spot.id) ? 'detected-spot' : ''}
                  />
                  <text
                    x={spot.x}
                    y={12 - spot.y - 0.6}
                    textAnchor="middle"
                    fontSize="0.25"
                    fill="#333"
                    fontWeight="bold"
                  >
                    {spot.name}
                  </text>
                </g>
              ))}
              
              <circle
                cx={currentPosition.x}
                cy={12 - currentPosition.y}
                r="0.15"
                fill="#ff4444"
                stroke="#000"
                strokeWidth="0.02"
                className="drone-position"
              />
              
              <text x="4.5" y="0.3" textAnchor="middle" fontSize="0.3" fill="#666">
                9m (≈ 30 ft.)
              </text>
              <text x="0.3" y="6" textAnchor="middle" fontSize="0.3" fill="#666" 
                    transform="rotate(-90, 0.3, 6)">
                12m (≈ 40 ft.)
              </text>
            </svg>
          </div>
        </div>

        <div className="control-section">
          <div className="position-panel">
            <h3>📍 Current Position</h3>
            <div className="coordinates">
              <div className="coord">
                <label>X:</label>
                <span>{currentPosition.x.toFixed(2)}m</span>
              </div>
              <div className="coord">
                <label>Y:</label>
                <span>{currentPosition.y.toFixed(2)}m</span>
              </div>
            </div>
          </div>

          <div className="spots-panel">
            <h3>🎯 Safe Spots Management</h3>
            <div className="spots-grid">
              {safeSpots.map(spot => {
                const distance = calculateDistance(currentPosition, spot);
                const isDetected = detectedSpots.includes(spot.id);
                
                return (
                  <div key={spot.id} className={`spot-card ${isDetected ? 'detected' : ''}`}>
                    <div className="spot-header">
                      <div className="spot-indicator" style={{backgroundColor: spot.color}}></div>
                      <h4>{spot.name}</h4>
                      <span className={`status-badge ${isDetected ? 'detected' : 'pending'}`}>
                        {isDetected ? '✅ DETECTED' : '⏳ PENDING'}
                      </span>
                    </div>
                    <div className="spot-info">
                      <p>Position: ({spot.x}, {spot.y})</p>
                      <p>Distance: {distance.toFixed(2)}m</p>
                    </div>
                    <button
                      onClick={() => moveToSpot(spot)}
                      className="goto-btn"
                      disabled={!isConnected}
                    >
                      Navigate Here
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="actions-panel">
            <h3>⚡ Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={resetDetection} className="reset-btn">
                🔄 Reset Detection
              </button>
              <button 
                onClick={() => moveToSpot(safeSpots[3])} 
                className="home-btn"
                disabled={!isConnected}
              >
                🏠 Return Home
              </button>
            </div>
          </div>

          <div className="stats-panel">
            <h3>📊 Mission Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{detectedSpots.length}</span>
                <span className="stat-label">Spots Detected</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{((detectedSpots.length / safeSpots.length) * 100).toFixed(0)}%</span>
                <span className="stat-label">Completion</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{DETECTION_THRESHOLD}m</span>
                <span className="stat-label">Detection Range</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeSpotDetection;
