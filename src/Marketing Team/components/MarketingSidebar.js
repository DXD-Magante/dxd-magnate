import React from "react";
import { 
  Box, Drawer, List, Toolbar, Typography, Avatar, useTheme, useMediaQuery 
} from "@mui/material";
import MarketingSidebarSection from "./MarketingSidebarSection";
import MarketingUserProfile from "./MarketingUserProfile";
import { styled } from '@mui/material/styles';

const drawerWidth = 280;

const MobileDrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const MarketingSidebar = ({ 
  activeSection, 
  setActiveSection,
  activeSubsection, setActiveSubsection, 
  mobileOpen, 
  handleDrawerToggle, 
  drawerWidth,
  sections
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
                bgcolor: '#ec4899',
                fontWeight: 'bold'
              }}
            >
              M
            </Avatar>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              Marketing
            </Typography>
          </div>
        </Toolbar>
        
        <Box sx={{ overflow: 'auto', px: 2 }}>
          <List>
            {sections.map((section, index) => (
              <MarketingSidebarSection 
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
        
        <MarketingUserProfile />
      </Drawer>
    </>
  );
};

export default MarketingSidebar;