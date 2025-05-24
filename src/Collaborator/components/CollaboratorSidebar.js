import React, { useEffect, useState } from "react";
import { 
  Box, Drawer, List, Toolbar, Typography, Avatar, useTheme, useMediaQuery 
} from "@mui/material";
import SidebarSection from "./SidebarSection";
import { 
  FiHome, FiCheckSquare, FiLayers, FiFolder, FiCalendar, 
  FiMessageSquare, FiAward, FiUpload, FiHelpCircle, FiSettings 
} from "react-icons/fi";
import { styled } from '@mui/material/styles';
import UserProfile from "../../admin/components/UserProfile";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const drawerWidth = 280;

const CollaboratorSidebar = ({ 
  activeSection, setActiveSection, activeSubsection, setActiveSubsection, 
  mobileOpen, handleDrawerToggle, drawerWidth 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userDepartment, setUserDepartment] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserDepartment(userDoc.data().department);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Define base sections
  const baseSections = [
    {
      title: "Dashboard",
      icon: <FiHome size={20} />,
      items: []
    },
    {
      title: "My Tasks",
      icon: <FiCheckSquare size={20} />,
      items: [
        "All Tasks",
        "To Do",  
        "In Progress",     
        "Waiting Review",
        "Completed",
        "Backlogs",
        // "Collaboration Tasks" will be added conditionally below
      ]
    },
    {
      title: "Projects",
      icon: <FiLayers size={20} />,
      items: ["My Projects","Timelines", "Milestones", "Team Collaboration"]
    },
    {
      title: "Resources",
      icon: <FiFolder size={20} />,
      items: ["Training Materials", "Templates", "Internal Tools"]
    },
    {
      title: "Meetings",
      icon: <FiCalendar size={20} />,
      items: ["Upcoming", "Meeting Notes"]
    },
    {
      title: "Performance & Learning",
      icon: <FiAward size={20} />,
      items: ["My Courses","Progress", "Leaderboard", "Feedback"]
    },
    {
      title: "Submit Work",
      icon: <FiUpload size={20} />,
      items: ["Upload Files", "Submission Notes"]
    },
    {
      title: "Feedback & Queries",
      icon: <FiHelpCircle size={20} />,
      items: ["Request Feedback", "Submit Queries"]
    },
    {
      title: "Settings",
      icon: <FiSettings size={20} />,
      items: ["Profile", "Notifications"]
    }
  ];

  // Add "Collaboration Tasks" to My Tasks section if user is in Marketing department
  const sections = baseSections.map(section => {
    if (section.title === "My Tasks" && userDepartment === "Marketing") {
      return {
        ...section,
        items: [...section.items, "Collaboration Tasks"]
      };
    }
    return section;
  });

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          backgroundColor: '#1e293b',
          color: 'white',
          borderRight: 'none',
          boxSizing: 'border-box',
          position: 'fixed',
          zIndex: 1000,
          height: '100vh'
        },
      }}
    >
      {isMobile && <MobileDrawerHeader />}
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 3,
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <div className="flex items-center space-x-3">
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#4f46e5', fontWeight: 'bold' }}>
            C
          </Avatar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            Collaborator Panel
          </Typography>
        </div>
      </Toolbar>
      
      <Box sx={{ overflow: 'auto', px: 2 }}>
        <List>
          {sections.map((section) => (
            <SidebarSection 
              key={section.title}
              section={section}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              activeSubsection={activeSubsection}
              setActiveSubsection={setActiveSubsection}
            />
          ))}
        </List>
      </Box>
      
      <UserProfile />
    </Drawer>
  );
};

const MobileDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

export default CollaboratorSidebar;