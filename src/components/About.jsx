import React from 'react';
import { Box, Card, Grid, Typography, LinearProgress, Chip } from '@mui/material';
import useSystemData from '../hooks/useSystemData';

const About = () => {
  const systemData = useSystemData();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        About DroneSync GCS
      </Typography>

      <Grid container spacing={3}>
        {/* Connection Status */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Real-Time System Status
            </Typography>

            {/* Attitude Data */}
            {systemData.attitude && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Attitude Data
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Roll</Typography>
                    <Typography>{(systemData.attitude.roll * 180 / Math.PI).toFixed(2)}°</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Pitch</Typography>
                    <Typography>{(systemData.attitude.pitch * 180 / Math.PI).toFixed(2)}°</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Yaw</Typography>
                    <Typography>{(systemData.attitude.yaw * 180 / Math.PI).toFixed(2)}°</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Battery Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Battery Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Charge Level</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={systemData.battery.level} 
                    sx={{ my: 1 }}
                  />
                  <Typography>{systemData.battery.level}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Voltage</Typography>
                  <Typography>{systemData.battery.voltage}V</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Current</Typography>
                  <Typography>{systemData.battery.current}A</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Capacity Used</Typography>
                  <Typography>{systemData.battery.capacityUsed}mAh</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Time Remaining</Typography>
                  <Typography>~{systemData.battery.timeRemaining}min</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Communication Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Communication Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Chip 
                    label={systemData.communication.status} 
                    color="success" 
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Signal Strength</Typography>
                  <Typography>{systemData.communication.signalStrength}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Link Quality</Typography>
                  <Typography>{systemData.communication.linkQuality}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Data Rate</Typography>
                  <Typography>{systemData.communication.dataRate} kbps</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Packet Loss</Typography>
                  <Typography>{systemData.communication.packetLoss}%</Typography>
                </Grid>
              </Grid>
            </Box>

            {/* System Health */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                System Health
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Chip 
                    label={systemData.systemHealth.status} 
                    color="success" 
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">CPU Load</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={systemData.systemHealth.cpuLoad} 
                    sx={{ my: 1 }}
                  />
                  <Typography>{systemData.systemHealth.cpuLoad}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Memory Usage</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={systemData.systemHealth.memoryUsage} 
                    sx={{ my: 1 }}
                  />
                  <Typography>{systemData.systemHealth.memoryUsage}%</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Temperature</Typography>
                  <Typography>{systemData.systemHealth.temperature}°C</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2" color="textSecondary">Storage</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={systemData.systemHealth.storage} 
                    sx={{ my: 1 }}
                  />
                  <Typography>{systemData.systemHealth.storage}% used</Typography>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default About; 