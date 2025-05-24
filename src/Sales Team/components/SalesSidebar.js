import React from "react";
import { 
  Box, Drawer, List, Toolbar, Typography, 
  Avatar, useTheme, useMediaQuery 
} from "@mui/material";
import SalesSidebarSection from "./SalesSidebarSection";
import { styled } from '@mui/material/styles';
import { 
  FiHome, FiTrendingUp, FiUsers, FiDollarSign, 
  FiLayers, FiShoppingCart, FiPieChart, 
  FiMessageSquare, FiSettings 
} from "react-icons/fi";
import UserProfile from "../../admin/components/UserProfile";
import { useThemeContext } from "../../context/ThemeContext";
import { auth, db } from "../../services/firebase";

const drawerWidth = 240;

const sections = [
  {
    title: "Dashboard",
    icon: <FiHome size={20} />,
    items: []
  },
  {
    title: "Sales Pipeline",
    icon: <FiTrendingUp size={20} />,
    items: ["Leads", "Opportunities", "Deals", "Forecast"]
  },
  {
    title: "Clients",
    icon: <FiUsers size={20} />,
    items: ["My Accounts", "New Leads", "Add Client", "Client Activity"]
  },
  {
    title: "Revenue",
    icon: <FiDollarSign size={20} />,
    items: ["Quotas", "Commissions", "Invoices"]
  },
  {
    title: "Products",
    icon: <FiShoppingCart size={20} />,
    items: ["Catalog", "Pricing", "Bundles"]
  },
  {
    title: "Reports",
    icon: <FiPieChart size={20} />,
    items: ["Sales Metrics", "Win/Loss", "Activity"]
  },
  {
    title: "Communications",
    icon: <FiMessageSquare size={20} />,
    items: ["Emails", "Meetings", "Tasks"]
  },
  {
    title: "Settings",
    icon: <FiSettings size={20} />,
    items: ["Profile", "Preferences"]
  }
];

const MobileDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const SalesSidebar = ({ activeSection, setActiveSection, mobileOpen, handleDrawerToggle, drawerWidth, activeSubSection, 
  setActiveSubSection, }) => {
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
          <Avatar sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: '#4f46e5',
            fontWeight: 'bold'
          }}>
            S
          </Avatar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            Sales Portal
          </Typography>
        </div>
      </Toolbar>
      
      <Box sx={{ overflow: 'auto', px: 2 }}>
        <List>
          {sections.map((section) => (
            <SalesSidebarSection 
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
      <UserProfile/>
    </Drawer>
  );
};

export default SalesSidebar;