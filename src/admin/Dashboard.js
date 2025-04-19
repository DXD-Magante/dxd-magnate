// Dashboard.js
import React, { useState, useEffect } from "react";
import { Box, CssBaseline, useMediaQuery, useTheme, CircularProgress, Backdrop } from "@mui/material";
import MainContent from "./components/MainContent";
import Sidebar from "./components/AdminSidebar";
import { FiHome } from "react-icons/fi";

const sections = [
  {
    title: "Dashboard",
    icon: <FiHome size={20} />,
    items: ["Overview"]
  },
];

const AdminDashboard = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Simulate loading (remove this in production)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      
      {/* Loading indicator */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)' // Low opacity background
        }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        pt: '64px', // Add padding top equal to navbar height
        opacity: loading ? 0.5 : 1, // Reduce opacity when loading
        pointerEvents: loading ? 'none' : 'auto' // Disable interactions when loading
      }}>
        {/* Sidebar */}
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={drawerWidth}
          activeSubsection={activeSubsection}
          setActiveSubsection={setActiveSubsection}
        />
        
        {/* Main content area */}
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            ml: isMobile ? 0 : `${drawerWidth}px`, // Use the passed drawerWidth
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <MainContent 
            activeSection={activeSection} 
            sections={sections} 
            activeSubsection={activeSubsection}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;