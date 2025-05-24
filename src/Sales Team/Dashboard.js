import React, { useState } from "react";
import { Box, CssBaseline, useMediaQuery, useTheme } from "@mui/material";
import SalesMainContent from "./components/SalesMainContent";
import SalesSidebar from "./components/SalesSidebar";
import { FiHome } from "react-icons/fi";

const SalesDashboard = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [activeSubSection, setActiveSubSection] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        pt: '64px' // Padding for navbar
      }}>
        {/* Sales Sidebar */}
        <SalesSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          activeSubSection={activeSubSection}
          setActiveSubSection={setActiveSubSection}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={drawerWidth}
        />
        
        {/* Main content area */}
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
            backgroundColor: '#f8fafc'
          }}
        >
          <SalesMainContent 
            activeSection={activeSection} 
            activeSubSection={activeSubSection}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SalesDashboard;