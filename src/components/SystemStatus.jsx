import React from 'react';
import { Card, Grid, Typography, Box, Avatar, Chip, LinearProgress } from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import TeamImage from '../assets/Team_Dir_Image.jpeg';

const SystemStatus = ({ data }) => {
  const batteryColor = (level) => {
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Status - DroneSync GCS
      </Typography>

      {/* Team Information */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Team Members
        </Typography>
        <Grid container spacing={2}>
          {[
            'Arnav Angarkar',
            'Saurav Karki',
            'Krishna Sai',
            'Gourav Purohit',
            'Ranjith B'
          ].map((member) => (
            <Grid item key={member}>
              <Chip label={member} variant="outlined" />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2 }}>
          <img 
            src={TeamImage} 
            alt="DroneSync GCS with Director" 
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
          />
        </Box>
      </Card>

      {/* System Status Grid */}
      <Grid container spacing={3}>
        {/* Battery Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <BatteryFullIcon /> Battery Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Charge Level
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={78} 
                  color={batteryColor(78)}
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body1">78%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Voltage
                </Typography>
                <Typography variant="body1">11.8V</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Current
                </Typography>
                <Typography variant="body1">4.2A</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Time Remaining
                </Typography>
                <Typography variant="body1">~22min</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Communication Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <SignalCellularAltIcon /> Communication
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Signal Strength
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={92} 
                  color="success"
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body1">92%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Link Quality
                </Typography>
                <Typography variant="body1">98%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Data Rate
                </Typography>
                <Typography variant="body1">57.6 kbps</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Packet Loss
                </Typography>
                <Typography variant="body1">0.2%</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <MemoryIcon /> System Health
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  CPU Load
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={24} 
                  color="success"
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body1">24%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Memory Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={32} 
                  color="success"
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body1">32%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Temperature
                </Typography>
                <Typography variant="body1">32°C</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip label="Normal" color="success" size="small" />
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Storage Status */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <StorageIcon /> Storage
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Storage Usage
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={45} 
                  color="success"
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body1">45% used</Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemStatus; 