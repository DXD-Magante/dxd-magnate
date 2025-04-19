import React from "react";
import { 
  MdOutlineManageAccounts, MdOutlineAnalytics, 
  MdOutlineCampaign, MdOutlineReceipt 
} from "react-icons/md";
import { Box, Drawer, List, Toolbar, Typography, Avatar, useTheme, useMediaQuery } from "@mui/material";
import SidebarSection from "./SidebarSection";
import UserProfile from "./UserProfile";
import { FiCalendar, FiDollarSign, FiFileText, FiHome, FiLayers, FiSettings, FiShoppingCart, FiUsers } from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { styled, } from '@mui/material/styles';
const drawerWidth = 280;

const sections = [
  {
    title: "Dashboard",
    icon: <FiHome size={20} />,
    items: []
  },
  {
    title: "Financial Management",
    icon: <FiDollarSign size={20} />,
    items: ["Revenue & Profit Analysis", "Cost Management", "Billing & Invoices"]
  },
  {
    title: "Marketing Analytics",
    icon: <MdOutlineCampaign size={20} />,
    items: ["Campaign Performance", "Lead Conversions", "SEO & Ad Metrics"]
  },
  {
    title: "Sales & CRM",
    icon: <FiShoppingCart size={20} />,
    items: ["Sales Pipeline", "Lead Management", "Conversion Metrics"]
  },
  {
    title: "Project Management",
    icon: <FiLayers size={20} />,
    items: ["Ongoing Projects", "Team Resource Allocation", "Progress Tracking"]
  },
  {
    title: "User & Client Management",
    icon: <FiUsers size={20} />,
    items: ["Clients Overview", "Admin & Team Roles", "Permissions & Access", "Monthly Target", "Forecast Management"]
  },
  {
    title: "Events & Engagement",
    icon: <FiCalendar size={20} />,
    items: ["Upcoming Business Events", "Webinars & Conferences"]
  },
  {
    title: "Reports & Insights",
    icon: <FiFileText size={20} />,
    items: ["Custom Reports", "Performance Metrics"]
  },
  {
    title: "Settings",
    icon: <FiSettings size={20} />,
    items: ["General Configurations", "Email & Notification Preferences"]
  }
];



const MobileDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const Sidebar = ({ activeSection, setActiveSection, activeSubsection, setActiveSubsection, mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
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
              A
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              AdminPanel
            </Typography>
          </div>
        </Toolbar>
        
        <Box sx={{ overflow: 'auto', px: 2 }}>
          <List>
            {sections.map((section, index) => (
              <SidebarSection 
                key={section.title}
                section={section}
                index={index}
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
    </>
  );
};

export default Sidebar;