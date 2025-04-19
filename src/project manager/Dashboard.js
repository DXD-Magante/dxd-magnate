import React, { useState, useEffect } from "react";
import { Box, CssBaseline, useMediaQuery, useTheme, CircularProgress, Backdrop } from "@mui/material";
import MainContent from "./components/MainContent";
import Sidebar from "./components/ProjectManagerSidebar";
import { FiHome, FiCalendar, FiUsers, FiLayers, FiBarChart2, FiFileText } from "react-icons/fi";
import { MdOutlineManageAccounts, MdOutlineAnalytics } from "react-icons/md";

const ProjectManagerDashboard = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [activeSubSection, setActiveSubSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc' }}>
      <CssBaseline />
      
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        pt: '64px',
        opacity: loading ? 0.5 : 1,
        pointerEvents: loading ? 'none' : 'auto'
      }}>
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={drawerWidth}
          activeSubSection={activeSubSection}
          setActiveSubSection={setActiveSubSection}
        />
        
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
          }}
        >
          <MainContent 
            activeSection={activeSection}
            activeSubSection={activeSubSection}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectManagerDashboard;