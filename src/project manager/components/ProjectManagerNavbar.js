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
  Chip,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress
} from "@mui/material";
import { styled, alpha } from '@mui/material/styles';
import { 
  FiSearch, 
  FiBell, 
  FiMenu,
  FiChevronDown,
  FiUser,
  FiSettings,
  FiLogOut,
  FiHelpCircle,
  FiMail,
  FiGrid,
  FiMessageCircle,
  FiCheck,
  FiAlertCircle,
  FiFileText,
  FiClock,
  FiExternalLink,
  FiX,
  FiUsers
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from 'date-fns';
import ProjectManagerSearch from "./ProjectManagerSearch";

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
      width: '30ch',
    },
  },
}));

const ProjectManagerNavbar = ({ drawerWidth, handleDrawerToggle }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [assignedProjects, setAssignedProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const avatarRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  const open = Boolean(anchorEl);
  const notificationOpen = Boolean(notificationAnchorEl);

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
              photoURL: user.photoURL || null,
              username: userData.username
            });
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || "User",
              firstName: user.displayName?.split(' ')[0] || "User",
              lastName: user.displayName?.split(' ')[1] || "",
              role: "user",
              photoURL: user.photoURL || null
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "User",
            firstName: user.displayName?.split(' ')[0] || "User",
            lastName: user.displayName?.split(' ')[1] || "",
            role: "user",
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

  // Fetch project manager notifications
  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, "project-manager-notifications"),
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
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
        });
        
        if (!data.viewed) unread++;
      });
      
      // Sort by timestamp (newest first)
      notifs.sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(notifs);
      setUnreadCount(unread);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Fetch assigned projects and team members
  useEffect(() => {
    if (!currentUser) return;

    const fetchAssignedProjects = async () => {
      try {
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", currentUser.uid)
        );
        
        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
          const projects = [];
          snapshot.forEach(doc => {
            projects.push({
              id: doc.id,
              ...doc.data()
            });
          });
          setAssignedProjects(projects);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching assigned projects:", error);
      }
    };

    const fetchTeamMembers = async () => {
      try {
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", currentUser.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const members = new Map();
        
        projectsSnapshot.forEach(projectDoc => {
          const projectData = projectDoc.data();
          if (projectData.teamMembers) {
            projectData.teamMembers.forEach(member => {
              if (!members.has(member.id)) {
                members.set(member.id, {
                  ...member,
                  projects: [projectData.title]
                });
              } else {
                const existingMember = members.get(member.id);
                members.set(member.id, {
                  ...existingMember,
                  projects: [...existingMember.projects, projectData.title]
                });
              }
            });
          }
        });
        
        setTeamMembers(Array.from(members.values()));
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };

    fetchAssignedProjects();
    fetchTeamMembers();
  }, [currentUser]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, "project-manager-notifications", notificationId);
      await updateDoc(notifRef, { viewed: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.viewed);
      const batch = unreadNotifications.map(notif => 
        updateDoc(doc(db, "project-manager-notifications", notif.id), { viewed: true })
      );
      await Promise.all(batch);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
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

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    
    setSearchLoading(true);
    setSearchOpen(true);
    
    try {
      const lowerQuery = query.toLowerCase();
      
      // Search projects
      const filteredProjects = assignedProjects.filter(project => 
        project.title.toLowerCase().includes(lowerQuery) ||
        project.clientName.toLowerCase().includes(lowerQuery) ||
        project.description.toLowerCase().includes(lowerQuery)
      );
      
      // Search team members
      const filteredMembers = teamMembers.filter(member => 
        member.name.toLowerCase().includes(lowerQuery) ||
        member.email?.toLowerCase().includes(lowerQuery) ||
        member.projectRole?.toLowerCase().includes(lowerQuery)
      );
      
      setSearchResults([
        ...filteredProjects.map(p => ({ type: 'project', data: p })),
        ...filteredMembers.map(m => ({ type: 'member', data: m }))
      ]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchItemClick = (item) => {
    if (item.type === 'project') {
      navigate(`/project/${item.data.id}`);
    } else {
      navigate(`/colaborator-dashboard/profile/${item.data.id}`);
    }
    handleSearchClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'project':
        return <FiCheck className="text-indigo-600" />;
      case 'alert':
        return <FiAlertCircle className="text-red-600" />;
      case 'update':
        return <FiFileText className="text-blue-600" />;
      case 'team':
        return <FiUsers className="text-green-600" />;
      default:
        return <FiBell className="text-gray-600" />;
    }
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

       <ProjectManagerSearch 
  assignedProjects={assignedProjects} 
  teamMembers={teamMembers} 
/>

        {/* Right Side Icons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          flexShrink: 0,
          ml: 'auto'
        }}>
          {/* Messages */}
          <IconButton
            size="large"
            aria-label="messages"
            color="inherit"
            sx={{ mr: 1 }}
            onClick={() => navigate('/chats')}
          >
            <Badge color="error">
              <FiMessageCircle/>
            </Badge>
          </IconButton>

          {/* Notification */}
          <IconButton
            size="large"
            aria-label={`show ${unreadCount} new notifications`}
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
                  {currentUser.firstName || 'User'} {currentUser.lastName || ''}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                  {currentUser.role || 'User'}
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
              <MenuItem onClick={() => navigate(`/project-manager-dashboard/profile/${currentUser.username}`)} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiUser size={18} />
                </ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem onClick={() => navigate("/")} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiGrid size={18} />
                </ListItemIcon>
                Dashboard
              </MenuItem>
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiMail size={18} />
                </ListItemIcon>
                Messages
              </MenuItem>
              <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <FiSettings size={18} />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => navigate("/support")} sx={{ py: 1.5 }}>
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

          {/* Notifications Menu */}
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
                  No new notifications
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
                          if (notification.projectId) {
                            navigate(`/project/${notification.projectId}`);
                          }
                        }}
                      >
                        <div className="w-full">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              notification.type === 'Project' ? 'bg-indigo-100 text-indigo-600' :
                              notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {getNotificationIcon(notification.type)}
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
                              {notification.projectName && (
                                <Typography variant="body2" className="text-gray-500 mt-1">
                                  Project: {notification.projectName}
                                </Typography>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center text-xs text-gray-400">
                                  <FiClock className="mr-1" size={14} />
                                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                </div>
                                {notification.type === 'Project' && (
                                  <Chip 
                                    label="Project" 
                                    size="small" 
                                    variant="outlined"
                                    color="primary"
                                    sx={{ 
                                      height: '20px',
                                      fontSize: '0.65rem',
                                      '& .MuiChip-label': { padding: '0 6px' }
                                    }}
                                  />
                                )}
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
                  onClick={() => navigate("/project-manager-dashboard/notifications")}
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

export default ProjectManagerNavbar;