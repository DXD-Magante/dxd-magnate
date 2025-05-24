import React, { useState, useEffect, useRef } from "react";
import { 
  AppBar, 
  Toolbar, 
  InputBase, 
  Badge, 
  Avatar, 
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  ButtonBase,
  useTheme,
  styled,
  alpha 
} from "@mui/material";
import { 
  FiSearch, 
  FiBell, 
  FiMenu,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiHelpCircle,
  FiDollarSign,
  FiUsers,
  FiSun,
  FiMoon
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useThemeContext } from "../../context/ThemeContext";

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const ThemeSwitchButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  marginRight: theme.spacing(1),
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
  },
}));

const ThemeSwitchTrack = styled('div')(({ theme }) => ({
  position: 'relative',
  width: 40,
  height: 20,
  borderRadius: 10,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  cursor: 'pointer',
  margin: '0 8px',
}));

const ThemeSwitchThumb = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 2,
  left: 2,
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark' ? '#4f46e5' : '#fff',
  transition: 'transform 0.3s ease',
  transform: theme.palette.mode === 'dark' ? 'translateX(20px)' : 'translateX(0)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
}));

const SalesNavbar = ({ drawerWidth, handleDrawerToggle }) => {
  const theme = useTheme();
  const { toggleTheme } = useThemeContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const avatarRef = useRef(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: `${userData.firstName} ${userData.lastName}`,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              photoURL: user.photoURL || null
            });
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "Sales",
              firstName: user.displayName?.split(' ')[0] || "Sales",
              lastName: user.displayName?.split(' ')[1] || "",
              role: "Sales",
              photoURL: user.photoURL || null
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Sales",
            firstName: user.displayName?.split(' ')[0] || "Sales",
            lastName: user.displayName?.split(' ')[1] || "",
            role: "Sales",
            photoURL: user.photoURL || null
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
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

  if (!currentUser) {
    return (
      <AppBar position="fixed" sx={{ 
        width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <Toolbar>
          <Typography>Not authenticated</Typography>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar 
      position="fixed"
      sx={{ 
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
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

        {/* Search Bar - Hidden on small screens */}
        <Box sx={{ 
          flexGrow: 1, 
          display: { xs: 'none', sm: 'flex' }, 
          justifyContent: 'center',
          maxWidth: '500px',
          mx: 2
        }}>
          <Search>
            <SearchIconWrapper>
              <FiSearch />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Search clients or products..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </Search>
        </Box>

        {/* Right Side Icons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          flexShrink: 0,
          ml: 'auto'
        }}>
          {/* Theme Switch */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <FiSun 
              size={16} 
              style={{ 
                color: theme.palette.mode === 'dark' ? '#64748b' : '#4f46e5',
                transition: 'color 0.3s ease'
              }} 
            />
            <ThemeSwitchTrack onClick={toggleTheme}>
              <ThemeSwitchThumb />
            </ThemeSwitchTrack>
            <FiMoon 
              size={16} 
              style={{ 
                color: theme.palette.mode === 'dark' ? '#4f46e5' : '#64748b',
                transition: 'color 0.3s ease'
              }} 
            />
          </Box>

          {/* Notifications */}
          <IconButton
            size="large"
            aria-label="notifications"
            color="inherit"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={5} color="error">
              <FiBell />
            </Badge>
          </IconButton>

          {/* User Profile with Dropdown */}
          <div className="flex items-center space-x-2 ml-2">
            <ButtonBase
              ref={avatarRef}
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
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(currentUser.displayName)
                )}
              </Avatar>
              <div className="hidden md:block ml-2 mr-1 text-left">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {currentUser.firstName || 'Sales'} {currentUser.lastName || ''}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  {currentUser.role || 'Sales'}
                </Typography>
              </div>
              <FiChevronDown style={{ 
                transition: 'transform 0.2s',
                transform: open ? 'rotate(180deg)' : 'rotate(0)' 
              }} />
            </ButtonBase>

            {/* Dropdown Menu */}
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
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiUser size={18} />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiDollarSign size={18} />
                </ListItemIcon>
                Sales Performance
              </MenuItem>
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiUsers size={18} />
                </ListItemIcon>
                My Clients
              </MenuItem>
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiSettings size={18} />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiHelpCircle size={18} />
                </ListItemIcon>
                Help & Support
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444' }}>
                <ListItemIcon sx={{ color: '#ef4444' }}>
                  <FiLogOut size={18} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default SalesNavbar;