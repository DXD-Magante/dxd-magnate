import React, { useState, useEffect } from "react";
import { Box, CssBaseline, useMediaQuery, useTheme, CircularProgress, Backdrop } from "@mui/material";
import MainContent from "./components/CollaboratorMainContent";
import Sidebar from "./components/CollaboratorSidebar";
import CollaboratorNavbar from "./components/CollaboratorNavbar";
import { auth, db } from "../services/firebase";
import { getDoc, doc } from "firebase/firestore";


const CollaboratorDashboard = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDepartment, setUserDepartment] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserDepartment(userDoc.data().department);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchUserData();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CssBaseline />
      
      <CollaboratorNavbar 
        drawerWidth={drawerWidth}
        handleDrawerToggle={handleDrawerToggle}
      />
      
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
          activeSubsection={activeSubsection}
          setActiveSubsection={setActiveSubsection}
          userDepartment={userDepartment}
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
            activeSubsection={activeSubsection}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CollaboratorDashboard;