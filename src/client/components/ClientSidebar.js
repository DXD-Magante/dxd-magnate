import React from "react";
import { 
  Drawer, List, Toolbar, Typography, Avatar, 
  useTheme, useMediaQuery, styled, Box,  
} from "@mui/material";
import ClientSidebarSection from "./ClientSidebarSection";
import ClientUserProfile from "./ClientUserProfile";
import { 
  FiHome, FiFileText, FiCalendar, FiCheckCircle, 
  FiMessageSquare, FiSettings, FiDollarSign, FiUsers 
} from "react-icons/fi";

const drawerWidth = 260;

const sections = [
  {
    title: "Dashboard",
    icon: <FiHome size={20} />,
    items: []
  },
  {
    title: "Projects",
    icon: <FiFileText size={20} />,
    items: ["Active Projects", "Milestones", "Resources"]
  },
  {
    title: "Tasks",
    icon: <FiCheckCircle size={20} />,
    items: ["My Tasks", ]
  },
  {
    title: "Communications",
    icon: <FiMessageSquare size={20} />,
    items: ["Messages","Meetings", ]
  },
  {
    title: "Billing",
    icon: <FiDollarSign size={20} />,
    items: ["Pay now","Invoices", "Payment History", "Receipts"]
  },
  {
    title: "Team",
    icon: <FiUsers size={20} />,
    items: ["Contacts", "Roles & Responsibilities"]
  },
  {
    title: "Settings",
    icon: <FiSettings size={20} />,
    items: ["Profile", "Notifications"]
  }
];

const MobileDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const ClientSidebar = ({ 
  activeSection, 
  setActiveSection,
  activeSubsection,
  setActiveSubsection,
  mobileOpen, 
  handleDrawerToggle, 
  drawerWidth 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
          position:'fixed',
          zIndex:1000,
          height:'100vh'
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
            C
          </Avatar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            Client Portal
          </Typography>
        </div>
      </Toolbar>
      
      <Box sx={{ overflow: 'auto', px: 2 }}>
        <List>
          {sections.map((section) => (
            <ClientSidebarSection 
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
      
      <ClientUserProfile />
    </Drawer>
  );
};

export default ClientSidebar;