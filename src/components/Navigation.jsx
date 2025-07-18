import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InfoIcon from '@mui/icons-material/Info';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const Navigation = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DroneSync GCS
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<DashboardIcon />}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/status"
            startIcon={<AssessmentIcon />}
          >
            System Status
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/about"
            startIcon={<InfoIcon />}
          >
            About
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/docs"
            startIcon={<MenuBookIcon />}
          >
            Documentation
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 