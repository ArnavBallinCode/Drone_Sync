import React from 'react';
import { Box, Card, Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import useSystemData from '../hooks/useSystemData';

const Documentation = () => {
  const systemData = useSystemData();

  const formatAttitude = (value) => {
    return systemData.attitude ? (value * 180 / Math.PI).toFixed(2) + '°' : 'N/A';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Documentation
      </Typography>

      <Grid container spacing={3}>
        {/* Real-time Data Table */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Real-Time System Parameters
            </Typography>

            <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Parameter</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Attitude Data */}
                  <TableRow>
                    <TableCell>Roll</TableCell>
                    <TableCell>{systemData.attitude ? formatAttitude(systemData.attitude.roll) : 'N/A'}</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pitch</TableCell>
                    <TableCell>{systemData.attitude ? formatAttitude(systemData.attitude.pitch) : 'N/A'}</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Yaw</TableCell>
                    <TableCell>{systemData.attitude ? formatAttitude(systemData.attitude.yaw) : 'N/A'}</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>

                  {/* Battery Status */}
                  <TableRow>
                    <TableCell>Battery Level</TableCell>
                    <TableCell>{systemData.battery.level}%</TableCell>
                    <TableCell>{systemData.battery.level > 20 ? 'Normal' : 'Low'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Battery Voltage</TableCell>
                    <TableCell>{systemData.battery.voltage}V</TableCell>
                    <TableCell>Normal</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Battery Current</TableCell>
                    <TableCell>{systemData.battery.current}A</TableCell>
                    <TableCell>Normal</TableCell>
                  </TableRow>

                  {/* Communication */}
                  <TableRow>
                    <TableCell>Signal Strength</TableCell>
                    <TableCell>{systemData.communication.signalStrength}%</TableCell>
                    <TableCell>{systemData.communication.signalStrength > 70 ? 'Strong' : 'Weak'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Link Quality</TableCell>
                    <TableCell>{systemData.communication.linkQuality}%</TableCell>
                    <TableCell>{systemData.communication.linkQuality > 90 ? 'Excellent' : 'Good'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Data Rate</TableCell>
                    <TableCell>{systemData.communication.dataRate} kbps</TableCell>
                    <TableCell>Normal</TableCell>
                  </TableRow>

                  {/* System Health */}
                  <TableRow>
                    <TableCell>CPU Load</TableCell>
                    <TableCell>{systemData.systemHealth.cpuLoad}%</TableCell>
                    <TableCell>{systemData.systemHealth.cpuLoad < 80 ? 'Normal' : 'High'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Memory Usage</TableCell>
                    <TableCell>{systemData.systemHealth.memoryUsage}%</TableCell>
                    <TableCell>{systemData.systemHealth.memoryUsage < 80 ? 'Normal' : 'High'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Temperature</TableCell>
                    <TableCell>{systemData.systemHealth.temperature}°C</TableCell>
                    <TableCell>{systemData.systemHealth.temperature < 70 ? 'Normal' : 'High'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Storage Usage</TableCell>
                    <TableCell>{systemData.systemHealth.storage}%</TableCell>
                    <TableCell>{systemData.systemHealth.storage < 80 ? 'Normal' : 'High'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Documentation; 