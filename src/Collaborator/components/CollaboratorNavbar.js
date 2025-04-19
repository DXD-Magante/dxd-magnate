import React, { useState, useEffect } from "react";
import { 
  AppBar, Toolbar, IconButton, Typography, Box,
  Avatar, Badge, Menu, MenuItem, ListItemIcon, Divider, ButtonBase
} from "@mui/material";
import { FiMenu, FiBell, FiChevronDown, FiUser, FiSettings, FiLogOut, FiHelpCircle, FiMail } from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { styled, alpha } from '@mui/material/styles';

const CollaboratorNavbar = ({ drawerWidth, handleDrawerToggle }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUser({
            ...userDocSnap.data(),
            uid: user.uid,
            email: user.email,
            photoURL: user.photoURL || null
          });
        }
      }
    };
    fetchUserData();
  }, []);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = async () => {
    try {
      await auth.signOut();
      handleMenuClose();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  return (
   <AppBar 
        position="fixed"
        sx={{ 
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: '#1e293b',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        }}
      >
        <Toolbar sx={{ 
          paddingLeft: { xs: 2, sm: 3 },
          paddingRight: { xs: 2, sm: 3 },
          minHeight: '64px',
          overflowX: 'hidden'
        }}>
          {/* Mobile menu button and logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexShrink: 0,
            mr: 2
          }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <FiMenu />
            </IconButton>
            <div className="flex items-center">
              <img 
                src={require('../../assets/dxd-logo.png')}
                alt="DXD Magnate Logo" 
                className="h-8 w-auto mr-2"
              />
              <Typography 
                variant="h6" 
                noWrap 
                component="div"
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                DXD Magnate
              </Typography>
            </div>
          </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="large"
            aria-label="show notifications"
            color="inherit"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={5} color="error">
              <FiBell />
            </Badge>
          </IconButton>

          <ButtonBase
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '12px',
              padding: '4px',
              '&:hover': {
                backgroundColor: alpha('#4f46e5', 0.1),
              }
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: '#4f46e5',
                fontSize: '0.875rem',
                fontWeight: 'bold'
              }}
            >
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(currentUser?.displayName || currentUser?.firstName)
              )}
            </Avatar>
            <div className="hidden md:block ml-2 mr-1 text-left">
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {currentUser?.firstName || 'User'} {currentUser?.lastName || ''}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                Collaborator
              </Typography>
            </div>
            <FiChevronDown style={{ 
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0)' 
            }} />
          </ButtonBase>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                minWidth: 220,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => window.location.href = `/profile/collaborator/${currentUser?.username}`} sx={{ py: 1.5 }}>
              <ListItemIcon><FiUser size={18} /></ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <ListItemIcon><FiMail size={18} /></ListItemIcon>
              Messages
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <ListItemIcon><FiSettings size={18} /></ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => window.location.href = "/support"} sx={{ py: 1.5 }} >
              <ListItemIcon><FiHelpCircle size={18} /></ListItemIcon>
              Help & Support
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444' }}>
              <ListItemIcon sx={{ color: '#ef4444' }}><FiLogOut size={18} /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default CollaboratorNavbar;