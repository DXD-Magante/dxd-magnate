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
  ButtonBase
} from "@mui/material";
import { styled, alpha } from '@mui/material/styles';
import { 
  FiSearch, 
  FiBell, 
  FiMessageCircle,
  FiMenu,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiHelpCircle,
  FiDollarSign,
  FiUsers,
  FiGrid,
  FiClock, FiCheck, FiAlertCircle
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, where, query, onSnapshot, orderBy } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MdLeaderboard } from "react-icons/md";
import useUnreadChatCount from "../../Chats/components/UnReadCount";


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



const SalesNavbar = ({ drawerWidth, handleDrawerToggle }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
const [unreadCount, setUnreadCount] = useState(0);
const notificationOpen = Boolean(notificationAnchorEl);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  const unreadChatCount = useUnreadChatCount();


  useEffect(() => {
    if (!currentUser) return;
  
    const q = query(
      collection(db, "sales-notifications"),
      where("userId", "==", currentUser.uid),
    );
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifs = [];
      let unread = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifs.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to JS Date if it exists
          timestamp: data.timestamp?.toDate() || new Date()
        });
        
        if (!data.viewed) unread++;
      });
  
      setNotifications(notifs);
      setUnreadCount(unread);
    });
  
    return () => unsubscribe();
  }, [currentUser]);
  
  // Add these handler functions
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };
  
  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, "sales-notifications", notificationId);
      await updateDoc(notifRef, { viewed: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.viewed);
      const batch = [];
      
      unreadNotifications.forEach(notif => {
        batch.push(updateDoc(doc(db, "sales-notifications", notif.id), { viewed: true }));
      });
  
      await Promise.all(batch);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "Just now";
    
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return "Just now";
  };
  
  const updateLogoutActivityLog = async (userId, email) => {
    try {
      const host = window.location.hostname;
      const activityLogRef = doc(db, "Activity-logs", `${userId}_${Date.now()}`);
      
      await setDoc(activityLogRef, {
        action: "logout",
        userId,
        timestamp: serverTimestamp(),
        message: `Logged out from ${host}`,
        ip: host,
        email,
      });
    } catch (err) {
      console.error("Error updating logout activity log:", err);
    }
  };
  


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
      if (currentUser) {
        // Update activity log
        await updateLogoutActivityLog(currentUser.uid, currentUser.email);
        
        // Update user status to offline
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          profileStatus: 'offline',
          lastActive: serverTimestamp()
        });
      }
      await signOut(auth);
      handleMenuClose();
      window.location.href = "/"
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
        backgroundColor: 'white',
        color: '#1e293b',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
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
          <div className="flex items-center" onClick={() => window.location.href = "/"} style={{cursor:'pointer'}}>
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
          

          <IconButton
            size="large"
            aria-label="leaderboard"
            color="inherit"
            sx={{ mr: 1 }}
            onClick={() => window.location.href = "/sales-dashboard/leaderboard"}
          >
             <Badge badgeContent={unreadCount} color="error">
              <MdLeaderboard />
            </Badge>
          </IconButton>

   <IconButton
            size="large"
            aria-label={`show ${unreadChatCount} new messages`}
            color="inherit"
            sx={{ mr: 1 }}
            onClick={() => window.location.href ='/chats'}
          >
            <Badge badgeContent={unreadChatCount} color="error">
              <FiMessageCircle/>
            </Badge>
          </IconButton>
          {/* Notifications */}
          <IconButton
            size="large"
            aria-label="notifications"
            color="inherit"
            sx={{ mr: 1 }}
            onClick={handleNotificationClick}
          >
             <Badge badgeContent={unreadCount} color="error">
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
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
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
              <MenuItem onClick={()=> navigate(`/profile/sales/${currentUser.firstName.toLowerCase()}`)} sx={{ py: 1.5 }}>
                <ListItemIcon
                  
                >
                  <FiUser size={18} />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem onClick={() => window.location.href ="/"} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiGrid size={18} />
                </ListItemIcon>
               Dashboard
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

          <Menu
  anchorEl={notificationAnchorEl}
  open={notificationOpen}
  onClose={handleNotificationClose}
  onClick={(e) => e.stopPropagation()}
  PaperProps={{
    sx: {
      width: 380,
      maxWidth: '100%',
      maxHeight: '80vh',
      overflow: 'hidden',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      mt: 1.5,
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
    }
  }}
  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
>
  <div className="p-4 pb-2">
    <div className="flex items-center justify-between">
      <Typography variant="h6" className="font-bold text-gray-800">
        Notifications
      </Typography>
      {unreadCount > 0 && (
        <button 
          onClick={markAllAsRead}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Mark all as read
        </button>
      )}
    </div>
  </div>

  <Divider />

  <div className="overflow-y-auto max-h-[400px]">
    {notifications.length === 0 ? (
      <div className="p-4 text-center text-gray-500">
        No notifications yet
      </div>
    ) : (
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MenuItem 
              sx={{ 
                py: 1.5,
                borderLeft: notification.viewed ? 'none' : '3px solid #4f46e5',
                backgroundColor: notification.viewed ? 'inherit' : '#f8fafc',
                '&:hover': {
                  backgroundColor: '#f1f5f9'
                }
              }}
              onClick={() => {
                markAsRead(notification.id);
                // Add navigation logic based on notification type if needed
              }}
            >
              <div className="w-full">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    notification.type === 'lead' ? 'bg-indigo-100 text-indigo-600' :
                    notification.priority === 'high' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {notification.type === 'lead' ? <FiUser size={18} /> : 
                     notification.priority === 'high' ? <FiAlertCircle size={18} /> : 
                     <FiDollarSign size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Typography variant="subtitle2" className="font-semibold">
                        {notification.message}
                      </Typography>
                      {!notification.viewed && (
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      )}
                    </div>
                    <Typography variant="body2" className="text-gray-500 mt-1">
                      {notification.leadId ? `Lead ID: ${notification.leadId.slice(0, 6)}...` : ''}
                    </Typography>
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <FiClock className="mr-1" size={14} />
                      {formatTimeAgo(notification.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </MenuItem>
            <Divider sx={{ my: 0 }} />
          </motion.div>
        ))}
      </AnimatePresence>
    )}
  </div>

  {notifications.length > 0 && (
    <div className="p-2 text-center border-t">
      <button 
        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        onClick={() => window.location.href = "/sales-dashboard/notifications"}
      >
        View all notifications
      </button>
    </div>
  )}
</Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default SalesNavbar;