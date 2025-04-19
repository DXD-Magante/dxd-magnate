import React, { useState, useEffect } from "react";
import { Box, CssBaseline, useMediaQuery, useTheme, CircularProgress, Backdrop } from "@mui/material";
import MarketingMainContent from "./components/MarketingMainContent";
import MarketingSidebar from "./components/MarketingSidebar";
import { FiHome, FiTrendingUp, FiBarChart2, FiCalendar, FiUsers, FiMail } from "react-icons/fi";
import { MdOutlineCampaign, MdOutlineAnalytics } from "react-icons/md";

const sections = [
  {
    title: "Dashboard",
    icon: <FiHome size={20} />,
    items: []
  },
  {
    title: "Campaigns",
    icon: <MdOutlineCampaign size={20} />,
    items: ["All Campaigns", "Performance Metrics", "A/B Testing"]
  },
  {
    title: "Lead Analytics",
    icon: <FiTrendingUp size={20} />,
    items: ["Conversion Funnel", "Lead Sources", "ROI Analysis"]
  },
  {
    title: "SEO & Ads",
    icon: <MdOutlineAnalytics size={20} />,
    items: ["Keyword Performance", "Ad Spend", "CTR Analysis"]
  },
  {
    title: "Content Calendar",
    icon: <FiCalendar size={20} />,
    items: ["Upcoming Posts", "Content Performance", "Ideation Board"]
  },
  {
    title: "Social Media",
    icon: <FiUsers size={20} />,
    items: ["Engagement Metrics", "Follower Growth", "Top Performing Posts"]
  },
  {
    title: "Email Marketing",
    icon: <FiMail size={20} />,
    items: ["Open Rates", "Click Rates", "Campaign Performance"]
  },
  {
    title: "Reports",
    icon: <FiBarChart2 size={20} />,
    items: ["Weekly Summary", "Custom Reports", "Export Data"]
  }
];

const MarketingDashboard = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [activeSubsection, setActiveSubsection] = useState(null);
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
        <MarketingSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          activeSubsection={activeSubsection}
          setActiveSubsection={setActiveSubsection}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={drawerWidth}
          sections={sections}
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
            backgroundColor: '#f8fafc'
          }}
        >
          <MarketingMainContent 
            activeSection={activeSection} 
            activeSubsection={activeSubsection}
            sections={sections} 
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MarketingDashboard;