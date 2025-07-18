import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SafeSpotDetection from './components/SafeSpotDetection';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          {/* ...existing navigation... */}
          <Link to="/safe-spots">Safe Spot Detection</Link>
        </nav>
        
        <Routes>
          {/* ...existing routes... */}
          <Route path="/safe-spots" element={<SafeSpotDetection />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;