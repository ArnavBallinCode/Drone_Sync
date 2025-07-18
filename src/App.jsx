import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import SystemStatus from './components/SystemStatus';
import About from './components/About';
import Documentation from './components/Documentation';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/status" element={<SystemStatus />} />
          <Route path="/about" element={<About />} />
          <Route path="/docs" element={<Documentation />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 