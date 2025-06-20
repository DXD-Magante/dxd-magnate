// In Dashboard.js
import React, { useState, useEffect } from "react";
import { Box, CssBaseline, useMediaQuery, useTheme, CircularProgress, Backdrop } from "@mui/material";
import MainContent from "./components/MainContent";
import Sidebar from "./components/ProjectManagerSidebar";
import { auth } from "../services/firebase"; // Import auth

const ProjectManagerDashboard = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [activeSubSection, setActiveSubSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // Store user object
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
        {user && ( // Only render when user is available
          <>
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
                currentUser={user} // Pass user as prop
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ProjectManagerDashboard;