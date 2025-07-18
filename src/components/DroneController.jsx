import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DroneController = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'position', label: 'Position', icon: '📍' },
    { id: 'attitude', label: 'Attitude', icon: '🎯' },
    { id: 'parameters', label: 'Parameters', icon: '⚙️' },
    { id: 'telemetry', label: 'Telemetry', icon: '📡' },
    { id: 'radio-control', label: 'Radio Control', icon: '📻' },
    { id: 'calibration', label: 'Calibration', icon: '🔧' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="content-section">
            <h2>Drone Control Dashboard</h2>
            <div className="dashboard-grid">
              <div className="status-card">
                <h3>Flight Status</h3>
                <p className="status-value">Ready</p>
              </div>
              <div className="status-card">
                <h3>Battery</h3>
                <p className="status-value">85%</p>
              </div>
              <div className="status-card">
                <h3>GPS Signal</h3>
                <p className="status-value">Good</p>
              </div>
              <div className="status-card">
                <h3>Altitude</h3>
                <p className="status-value">0m</p>
              </div>
            </div>
            <Link to="/safe-spots" className="nav-link">
              <button className="safe-spot-button">
                🎯 Safe Spot Detection
              </button>
            </Link>
          </div>
        );
      case 'position':
        return (
          <div className="content-section">
            <h2>Position Control</h2>
            <div className="position-controls">
              <div className="coordinate-display">
                <h3>Current Position</h3>
                <p>Latitude: 37.7749°</p>
                <p>Longitude: -122.4194°</p>
                <p>Altitude: 0m</p>
              </div>
              <div className="movement-controls">
                <h3>Movement Controls</h3>
                <div className="control-grid">
                  <button className="control-btn">↑ Forward</button>
                  <button className="control-btn">← Left</button>
                  <button className="control-btn">→ Right</button>
                  <button className="control-btn">↓ Backward</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'attitude':
        return (
          <div className="content-section">
            <h2>Attitude Control</h2>
            <div className="attitude-display">
              <div className="attitude-indicator">
                <h3>Roll: 0°</h3>
                <div className="indicator-bar">
                  <div className="indicator-value" style={{width: '50%'}}></div>
                </div>
              </div>
              <div className="attitude-indicator">
                <h3>Pitch: 0°</h3>
                <div className="indicator-bar">
                  <div className="indicator-value" style={{width: '50%'}}></div>
                </div>
              </div>
              <div className="attitude-indicator">
                <h3>Yaw: 0°</h3>
                <div className="indicator-bar">
                  <div className="indicator-value" style={{width: '50%'}}></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'parameters':
        return (
          <div className="content-section">
            <h2>Parameters</h2>
            <div className="parameter-list">
              <div className="parameter-item">
                <label>Max Speed:</label>
                <input type="number" defaultValue="10" />
                <span>m/s</span>
              </div>
              <div className="parameter-item">
                <label>Max Altitude:</label>
                <input type="number" defaultValue="100" />
                <span>m</span>
              </div>
              <div className="parameter-item">
                <label>Return Home Altitude:</label>
                <input type="number" defaultValue="50" />
                <span>m</span>
              </div>
            </div>
          </div>
        );
      case 'telemetry':
        return (
          <div className="content-section">
            <h2>Telemetry Data</h2>
            <div className="telemetry-grid">
              <div className="telemetry-item">
                <h4>GPS</h4>
                <p>Satellites: 12</p>
                <p>HDOP: 0.8</p>
              </div>
              <div className="telemetry-item">
                <h4>IMU</h4>
                <p>Accel X: 0.02 g</p>
                <p>Gyro Z: 0.01 rad/s</p>
              </div>
              <div className="telemetry-item">
                <h4>Power</h4>
                <p>Voltage: 12.6V</p>
                <p>Current: 2.3A</p>
              </div>
            </div>
          </div>
        );
      case 'radio-control':
        return (
          <div className="content-section">
            <h2>Radio Control</h2>
            <div className="rc-channels">
              <div className="channel">
                <label>Channel 1 (Roll):</label>
                <div className="channel-bar">
                  <div className="channel-value" style={{left: '50%'}}></div>
                </div>
                <span>1500</span>
              </div>
              <div className="channel">
                <label>Channel 2 (Pitch):</label>
                <div className="channel-bar">
                  <div className="channel-value" style={{left: '50%'}}></div>
                </div>
                <span>1500</span>
              </div>
              <div className="channel">
                <label>Channel 3 (Throttle):</label>
                <div className="channel-bar">
                  <div className="channel-value" style={{left: '10%'}}></div>
                </div>
                <span>1100</span>
              </div>
              <div className="channel">
                <label>Channel 4 (Yaw):</label>
                <div className="channel-bar">
                  <div className="channel-value" style={{left: '50%'}}></div>
                </div>
                <span>1500</span>
              </div>
            </div>
          </div>
        );
      case 'calibration':
        return (
          <div className="content-section">
            <h2>Calibration</h2>
            <div className="calibration-options">
              <button className="calibration-btn">Accelerometer Calibration</button>
              <button className="calibration-btn">Compass Calibration</button>
              <button className="calibration-btn">ESC Calibration</button>
              <button className="calibration-btn">Radio Calibration</button>
            </div>
            <div className="calibration-status">
              <h3>Calibration Status</h3>
              <p>✅ Accelerometer: Calibrated</p>
              <p>✅ Compass: Calibrated</p>
              <p>⚠️ ESC: Needs Calibration</p>
              <p>✅ Radio: Calibrated</p>
            </div>
          </div>
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="drone-controller">
      <header className="controller-header">
        <h1>Drone Control</h1>
      </header>
      
      <nav className="controller-nav">
        {navigationItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <main className="controller-main">
        {renderContent()}
      </main>
      
      <style jsx>{`
        .drone-controller {
          min-height: 100vh;
          background: #f5f5f5;
        }
        
        .controller-header {
          background: #2c3e50;
          color: white;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .controller-header h1 {
          margin: 0;
          font-size: 2rem;
        }
        
        .controller-nav {
          background: white;
          padding: 10px 20px;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          background: #ecf0f1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }
        
        .nav-item:hover {
          background: #d5dbdb;
        }
        
        .nav-item.active {
          background: #3498db;
          color: white;
        }
        
        .nav-icon {
          font-size: 1.2rem;
        }
        
        .nav-label {
          font-weight: 500;
        }
        
        .controller-main {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .content-section {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .content-section h2 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 1.8rem;
        }
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .status-card {
          background: #ecf0f1;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        
        .status-card h3 {
          margin: 0 0 10px 0;
          color: #34495e;
        }
        
        .status-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #27ae60;
          margin: 0;
        }
        
        .safe-spot-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s;
        }
        
        .safe-spot-button:hover {
          background: #218838;
        }
        
        .nav-link {
          text-decoration: none;
        }
        
        .position-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        .control-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          max-width: 200px;
        }
        
        .control-grid .control-btn:nth-child(1) { grid-column: 2; }
        .control-grid .control-btn:nth-child(2) { grid-column: 1; grid-row: 2; }
        .control-grid .control-btn:nth-child(3) { grid-column: 3; grid-row: 2; }
        .control-grid .control-btn:nth-child(4) { grid-column: 2; grid-row: 3; }
        
        .control-btn {
          background: #3498db;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .attitude-display {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .attitude-indicator {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .attitude-indicator h3 {
          min-width: 100px;
          margin: 0;
        }
        
        .indicator-bar {
          flex: 1;
          height: 20px;
          background: #ecf0f1;
          border-radius: 10px;
          position: relative;
        }
        
        .indicator-value {
          height: 100%;
          background: #3498db;
          border-radius: 10px;
        }
        
        .parameter-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .parameter-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .parameter-item label {
          min-width: 150px;
          font-weight: 500;
        }
        
        .parameter-item input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 100px;
        }
        
        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .telemetry-item {
          background: #ecf0f1;
          padding: 15px;
          border-radius: 6px;
        }
        
        .telemetry-item h4 {
          margin: 0 0 10px 0;
          color: #2c3e50;
        }
        
        .rc-channels {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .channel {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .channel label {
          min-width: 150px;
          font-weight: 500;
        }
        
        .channel-bar {
          flex: 1;
          height: 20px;
          background: #ecf0f1;
          border-radius: 10px;
          position: relative;
        }
        
        .channel-value {
          position: absolute;
          top: 0;
          width: 4px;
          height: 100%;
          background: #e74c3c;
          border-radius: 2px;
        }
        
        .calibration-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .calibration-btn {
          background: #f39c12;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .calibration-btn:hover {
          background: #e67e22;
        }
        
        .calibration-status h3 {
          color: #2c3e50;
          margin-bottom: 15px;
        }
        
        .calibration-status p {
          margin: 8px 0;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default DroneController;