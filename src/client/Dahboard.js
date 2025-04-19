import React, { useState } from "react";
import { Box, CssBaseline, useMediaQuery, useTheme } from "@mui/material";
import ClientMainContent from "./components/ClientMainContent";
import ClientSidebar from "./components/ClientSidebar";

const ClientDashboard = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [activeSubsection, setActiveSubsection] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <CssBaseline />
      
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        pt: '64px' // Padding for navbar
      }}>
        {/* Sidebar */}
        <ClientSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          activeSubsection={activeSubsection}
          setActiveSubsection={setActiveSubsection}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={drawerWidth}
        />
        
        {/* Main content */}
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            ml: isMobile ? 0 : `${drawerWidth}px`,
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            p: 3
          }}
        >
          <ClientMainContent 
            activeSection={activeSection} 
            activeSubsection={activeSubsection} 
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ClientDashboard;