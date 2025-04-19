import React from "react";
import { 
  Box, Drawer, List, Toolbar, Typography, Avatar, useTheme, useMediaQuery 
} from "@mui/material";
import SidebarSection from "./SidebarSection";
import UserProfile from "../../admin/components/UserProfile";
import { styled } from "@mui/material/styles";
import { FiBarChart2, FiCalendar, FiFileText, FiHome, FiLayers, FiUsers } from "react-icons/fi";
import { MdOutlineAnalytics, MdOutlineManageAccounts } from "react-icons/md";

const drawerWidth = 260;

const sections = [
  {
    title: "Dashboard",
    icon: <FiHome size={20} />,
    items: []
  },
  {
    title: "Project Management",
    icon: <FiLayers size={20} />,
    items: ["All Projects", "Timeline View", "Task Board", "Resource Allocation", "Submissions"]
  },
  {
    title: "Team Collaboration",
    icon: <FiUsers size={20} />,
    items: ["Team Performance", "Task Assignment", "Communication"]
  },
  {
    title: "Client Interaction",
    icon: <MdOutlineManageAccounts size={20} />,
    items: ["Client Projects", "Feedback/Approvals", "Testimonials"]
  },
  {
    title: "Reporting",
    icon: <FiBarChart2 size={20} />,
    items: ["Project Reports", "Performance Metrics", "Custom Reports"]
  },
  {
    title: "Calendar",
    icon: <FiCalendar size={20} />,
    items: ["Milestones", "Meetings", "Deadlines"]
  },
  {
    title: "Analytics",
    icon: <MdOutlineAnalytics size={20} />,
    items: ["Project Health", "Budget Analysis", "Risk Assessment"]
  },
  {
    title: "Documents",
    icon: <FiFileText size={20} />,
    items: ["Project Files", "Templates", "Archives"]
  }
];

const MobileDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Sidebar = ({ 
  activeSection, 
  setActiveSection,
  activeSubSection,
  setActiveSubSection,
  mobileOpen, 
  handleDrawerToggle, 
  drawerWidth 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
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
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40, 
                bgcolor: '#4f46e5',
                fontWeight: 'bold'
              }}
            >
              PM
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              Project Manager
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
                activeSubSection={activeSubSection}
                setActiveSubSection={setActiveSubSection}
              />
            ))}
          </List>
        </Box>
        
        <UserProfile />
      </Drawer>
    </>
  );
};

export default Sidebar;