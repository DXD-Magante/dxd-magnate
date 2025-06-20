import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, Button, Card, CardContent,
  Grid, Divider, Chip, Tabs, Tab, Badge, IconButton,
  LinearProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Snackbar, Alert, CircularProgress,
  Paper, useTheme, Tooltip, Skeleton
} from '@mui/material';
import {
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar,
  FiAward, FiCheckCircle, FiClock, FiAlertCircle,
  FiTrendingUp, FiFileText, FiMessageSquare, FiBell,
  FiChevronDown, FiChevronUp, FiLock, FiSettings,
  FiDownload, FiUpload, FiStar, FiUsers, FiBookmark,
  FiMessageCircle, FiExternalLink, FiRefreshCw, FiPlus,
  FiBarChart2, FiActivity, FiAperture, FiGlobe, FiLinkedin,
  FiGithub, FiTwitter, FiFigma, FiCode, FiDatabase
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, getCountFromServer, orderBy } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

// Import tab components
import TasksTab from './CollaboratorTabs/TaskTab';
import LearningTab from './CollaboratorTabs/LearningTab';
import FeedbackTab from './CollaboratorTabs/FeedbackTab';
import SettingsTab from './CollaboratorTabs/SettingsTab';
import TeamTab from './CollaboratorTabs/TeamTab';
import { FaTrophy } from 'react-icons/fa';

const CollaboratorProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tempData, setTempData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeTab, setActiveTab] = useState('tasks');
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    completionRate: 0,
    totalTasks: 0,
    leaderboardRank: 0,
    pendingApprovals: 0,
    badgesEarned: 0,
    topPercentage: 0,
    totalUsers: 0,
    performanceScore: 0
  });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // Get user by username
        if (username) {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", username));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const userData = doc.data();
            setProfileData(userData);
            setTempData(userData);
            
            // Fetch additional data
            await fetchCollaboratorData(userData.uid);
          } else {
            throw new Error("User not found");
          }
        } else {
          // Fallback to current auth user if no username in params
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setProfileData(userData);
              setTempData(userData);
              await fetchCollaboratorData(user.uid);
            } else {
              throw new Error("User data not found");
            }
          } else {
            throw new Error("Not authenticated");
          }
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setSnackbarMessage(err.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchCollaboratorData = async (userId) => {
      try {
        // Fetch projects where the user is a team member
        const projectsQuery = query(collection(db, "dxd-magnate-projects"));
        const projectsSnapshot = await getDocs(projectsQuery);
        let projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter projects where user is a team member
        projectsData = projectsData.filter(project => 
          project.teamMembers?.some(member => member.id === userId)
        );

        // Enhance projects data with user details
        const enhancedProjects = await Promise.all(
          projectsData.map(async (project) => {
            const enhancedMembers = await Promise.all(
              project.teamMembers.map(async (member) => {
                try {
                  const userRef = doc(db, "users", member.id);
                  const userSnap = await getDoc(userRef);
                  
                  if (userSnap.exists()) {
                    const userData = userSnap.data();
                    return {
                      ...member,
                      name: `${userData.firstName} ${userData.lastName}`,
                      email: userData.email,
                      phone: userData.phone,
                      photoURL: userData.photoURL,
                      department: userData.department || member.department
                    };
                  }
                  return member;
                } catch (error) {
                  console.error(`Error fetching user ${member.id}:`, error);
                  return member;
                }
              })
            );

            let enhancedProject = { ...project, teamMembers: enhancedMembers };
            
            if (project.projectManagerId) {
              try {
                const pmRef = doc(db, "users", project.projectManagerId);
                const pmSnap = await getDoc(pmRef);
                
                if (pmSnap.exists()) {
                  const pmData = pmSnap.data();
                  enhancedProject = {
                    ...enhancedProject,
                    projectManager: `${pmData.firstName} ${pmData.lastName}`,
                    projectManagerEmail: pmData.email,
                    projectManagerPhone: pmData.phone,
                    projectManagerPhotoURL: pmData.photoURL
                  };
                }
              } catch (error) {
                console.error(`Error fetching project manager ${project.projectManagerId}:`, error);
              }
            }

            return enhancedProject;
          })
        );

        setProjects(enhancedProjects);
        setSelectedProject(enhancedProjects[0] || null);

        // Fetch task statistics
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", userId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const allTasks = tasksSnapshot.docs.map(doc => doc.data());
        
        // Calculate task stats
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(task => task.status === 'Done').length;
        const pendingApprovals = allTasks.filter(task => task.status === 'Review').length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Fetch user rank and total user count
        const usersQuery = query(collection(db, "users"), orderBy("performanceScore", "desc"));
        const usersSnapshot = await getDocs(usersQuery);
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const userRank = allUsers.findIndex(user => user.id === userId) + 1;
        const totalUsers = allUsers.length;
        const topPercentage = totalUsers > 0 ? Math.ceil((userRank / totalUsers) * 100) : 0;
        
        // Fetch badges count
        const badgesQuery = query(
          collection(db, "user-badges"),
          where("userId", "==", userId)
        );
        const badgesSnapshot = await getCountFromServer(badgesQuery);
        const badgesCount = badgesSnapshot.data().count;

        // Get performance score from profile data or calculate
        const performanceScore = profileData?.performanceScore || 
          Math.round((completionRate * 0.7) + (badgesCount * 5) + ((totalUsers - userRank + 1) * 0.3));

        setStats({
          tasksCompleted: completedTasks,
          totalTasks: totalTasks,
          completionRate: completionRate,
          leaderboardRank: userRank,
          pendingApprovals: pendingApprovals,
          badgesEarned: badgesCount,
          topPercentage: topPercentage,
          totalUsers: totalUsers,
          performanceScore: performanceScore
        });

      } catch (error) {
        console.error("Error fetching collaborator data:", error);
        setSnackbarMessage("Failed to load collaborator data");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    };
    
    fetchProfileData();
  }, [username]);

  const handleEditOpen = () => {
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setTempData(profileData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (!auth.currentUser) return;
      
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        firstName: tempData.firstName,
        lastName: tempData.lastName,
        phone: tempData.phone
      });
      
      setProfileData(tempData);
      setEditOpen(false);
      setSnackbarMessage("Profile updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbarMessage("Failed to update profile");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      // Handle both string dates and Date objects
      const parsedDate = typeof date === 'string' ? parseISO(date) : date;
      return format(parsedDate, 'dd MMM yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const renderSocialLinks = () => {
    const socialLinks = [
      { icon: <FiLinkedin />, url: profileData?.linkedin, color: '#0A66C2' },
      { icon: <FiGithub />, url: profileData?.github, color: '#181717' },
      { icon: <FiTwitter />, url: profileData?.twitter, color: '#1DA1F2' },
      { icon: <FiGlobe />, url: profileData?.website, color: theme.palette.primary.main },
    ].filter(link => link.url);

    if (socialLinks.length === 0) return null;

    return (
      <Box className="flex gap-2 mt-3">
        {socialLinks.map((link, index) => (
          <Tooltip key={index} title={link.url}>
            <IconButton
              component="a"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: link.color,
                backgroundColor: `${link.color}10`,
                '&:hover': {
                  backgroundColor: `${link.color}20`,
                }
              }}
            >
              {link.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto" sx={{ marginTop: '60px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: '12px', mb: 3 }}>
              <CardContent>
                <Box className="flex flex-col items-center py-4">
                  <Skeleton variant="circular" width={100} height={100} />
                  <Skeleton variant="text" width={200} height={40} sx={{ mt: 2 }} />
                  <Skeleton variant="text" width={150} height={24} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: '12px' }}>
              <CardContent>
                <Skeleton variant="rectangular" height={400} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <Typography variant="h6" className="text-gray-600">
          No profile data found
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen p-4 md:p-6 max-w-7xl mx-auto" sx={{ marginTop: '60px' }}>
      {/* Header Section */}
      <Box className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <Box className="flex items-start md:items-center space-x-4">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton 
                size="small" 
                className="bg-indigo-100 hover:bg-indigo-200"
                component="label"
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light,
                  }
                }}
              >
                <FiEdit2 size={12} className="text-indigo-600" />
                <input type="file" hidden />
              </IconButton>
            }
          >
            <Avatar
              alt={`${profileData.firstName} ${profileData.lastName}`}
              src={profileData.photoURL}
              sx={{ 
                width: 100, 
                height: 100,
                boxShadow: theme.shadows[3],
                border: `3px solid ${theme.palette.background.paper}`,
                fontSize: '2.5rem'
              }}
              className="hover:shadow-lg transition-shadow duration-300"
            >
              {getInitials(`${profileData.firstName} ${profileData.lastName}`)}
            </Avatar>
          </Badge>
          
          <Box>
            <Box className="flex items-center flex-wrap">
              <Typography variant="h4" className="font-bold text-gray-800">
                {profileData.firstName} {profileData.lastName}
              </Typography>
              {profileData.allTimeRank && (
                  <Chip 
                    label={`Rank #${profileData.allTimeRank}`}
                    size="small" 
                    color="primary" 
                    className="ml-2" 
                    sx={{
                      ml: 1,
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #ffd700 30%, #ffbf00 90%)',
                      color: '#000',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      '.MuiChip-icon': { color: '#fff' }
                    }}
                  />
                )}
            </Box>
            
            <Typography variant="subtitle1" className="text-gray-600 mt-1">
              {profileData.department || "Collaborator"} • {profileData.role}
            </Typography>
            
            <Box className="flex flex-wrap gap-2 mt-2">
              <Chip 
                icon={<FiMail size={14} />}
                label={profileData.email}
                size="small"
                variant="outlined"
                className="text-gray-600"
              />
              {profileData.phone && (
                <Chip 
                  icon={<FiPhone size={14} />}
                  label={profileData.phone}
                  size="small"
                  variant="outlined"
                  className="text-gray-600"
                />
              )}
              {profileData.lastActive && (
                <Chip 
                  icon={<FiClock size={14} />}
                  label={`Active ${formatDate(profileData.lastActive)}`}
                  size="small"
                  variant="outlined"
                  className="text-gray-600"
                />
              )}
            </Box>

            {renderSocialLinks()}
          </Box>
        </Box>
        
        <Box className="flex space-x-2">
          <Button
            variant="contained"
            startIcon={<FiEdit2 />}
            onClick={handleEditOpen}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 8px rgba(79, 70, 229, 0.3)',
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.dark} 100%)`,
              }
            }}
          >
            Edit Profile
          </Button>
         
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} className="mb-6">
        {/* Tasks Completed Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            className="h-full hover:shadow-md transition-shadow duration-300" 
            sx={{ 
              borderRadius: '12px',
              borderLeft: `4px solid ${theme.palette.success.main}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <CardContent className="p-4">
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography variant="subtitle2" className="text-gray-500">
                    Tasks Completed
                  </Typography>
                  <Typography variant="h4" className="font-bold text-gray-800">
                    {stats.tasksCompleted}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    of {stats.totalTasks} total
                  </Typography>
                </Box>
                <Box className="p-3 rounded-full bg-green-50">
                  <FiCheckCircle size={24} className="text-green-500" />
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats.completionRate || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  mt: 2,
                  backgroundColor: '#E5E7EB',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.success.main
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Performance Score Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            className="h-full hover:shadow-md transition-shadow duration-300" 
            sx={{ 
              borderRadius: '12px',
              borderLeft: `4px solid ${theme.palette.info.main}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <CardContent className="p-4">
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography variant="subtitle2" className="text-gray-500">
                    Performance Score
                  </Typography>
                  <Typography variant="h4" className="font-bold text-gray-800">
                    {stats.performanceScore}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {stats.completionRate}% completion
                  </Typography>
                </Box>
                <Box className="p-3 rounded-full bg-blue-50">
                  <FiActivity size={24} className="text-blue-500" />
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(stats.performanceScore, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  mt: 2,
                  backgroundColor: '#E5E7EB',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.info.main
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Leaderboard Rank Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            className="h-full hover:shadow-md transition-shadow duration-300" 
            sx={{ 
              borderRadius: '12px',
              borderLeft: `4px solid ${theme.palette.warning.main}`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              }
            }}
          >
            <CardContent className="p-4">
              <Box className="flex items-center justify-between">
                <Box>
                  <Typography variant="subtitle2" className="text-gray-500">
                    Leaderboard Rank
                  </Typography>
                  <Typography variant="h4" className="font-bold text-gray-800">
                    #{profileData.allTimeRank}
                  </Typography>
              
                </Box>
                <Box className="p-3 rounded-full bg-amber-50">
                  <FiTrendingUp size={24} className="text-amber-500" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
       </Grid>

      {/* Performance Overview Section */}
      <Card className="mb-6 hover:shadow-md transition-shadow duration-300" 
        sx={{ 
          borderRadius: '12px',
          '&:hover': {
            boxShadow: theme.shadows[4]
          }
        }}
      >
        <CardContent className="p-4">
          <Typography variant="h6" className="font-bold text-gray-800 mb-4">
            Performance Overview
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} className="p-4 rounded-lg" sx={{ backgroundColor: theme.palette.grey[50] }}>
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Task Completion Rate
                </Typography>
                <Box className="flex items-center space-x-4">
                  <Box className="relative w-24 h-24">
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={96}
                      thickness={4}
                      sx={{
                        position: 'absolute',
                        color: theme.palette.grey[300],
                      }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={stats.completionRate || 0}
                      size={96}
                      thickness={4}
                      sx={{
                        color: theme.palette.primary.main,
                      }}
                    />
                    <Box className="absolute inset-0 flex items-center justify-center">
                      <Typography variant="h5" className="font-bold">
                        {stats.completionRate}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Box className="flex items-center space-x-2 mb-1">
                      <Box className="w-3 h-3 rounded-full bg-indigo-600"></Box>
                      <Typography variant="caption" className="text-gray-600">
                        Completed: {stats.tasksCompleted}
                      </Typography>
                    </Box>
                    <Box className="flex items-center space-x-2 mb-1">
                      <Box className="w-3 h-3 rounded-full bg-gray-200"></Box>
                      <Typography variant="caption" className="text-gray-600">
                        Pending: {stats.totalTasks - stats.tasksCompleted}
                      </Typography>
                    </Box>
                    <Box className="flex items-center space-x-2">
                      <Box className="w-3 h-3 rounded-full bg-yellow-500"></Box>
                      <Typography variant="caption" className="text-gray-600">
                        In Review: {stats.pendingApprovals}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={0} className="p-4 rounded-lg h-full" sx={{ backgroundColor: theme.palette.grey[50] }}>
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Current Projects
                </Typography>
                {projects.length > 0 ? (
                  <Box className="space-y-3">
                    {projects.slice(0, 2).map(project => (
                      <Box key={project.id} className="flex items-center space-x-3">
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40,
                            bgcolor: theme.palette.primary.light,
                            color: theme.palette.primary.dark,
                            fontWeight: 'bold'
                          }}
                        >
                          {project.title?.charAt(0) || 'P'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" className="font-medium">
                            {project.title || 'Untitled Project'}
                          </Typography>
                          <Typography variant="caption" className="text-gray-500">
                            {project.status} • Due {formatDate(project.endDate)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    {projects.length > 2 && (
                      <Typography variant="caption" className="text-indigo-600">
                        +{projects.length - 2} more projects
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" className="text-gray-500">
                    No active projects
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              backgroundColor: theme.palette.primary.main,
            }
          }}
        >
          <Tab 
            label="Tasks" 
            value="tasks" 
            icon={<FiCheckCircle size={18} />} 
            iconPosition="start" 
            sx={{ 
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }}
          />
          <Tab 
            label="Team" 
            value="team" 
            icon={<FiUsers size={18} />} 
            iconPosition="start" 
            sx={{ 
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }}
          />
          <Tab 
            label="Learning" 
            value="learning" 
            icon={<FiBookmark size={18} />} 
            iconPosition="start" 
            sx={{ 
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }}
          />
          <Tab 
            label="Feedback" 
            value="feedback" 
            icon={<FiMessageSquare size={18} />} 
            iconPosition="start" 
            sx={{ 
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }}
          />
          <Tab 
            label="Settings" 
            value="settings" 
            icon={<FiSettings size={18} />} 
            iconPosition="start" 
            sx={{ 
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 'tasks' && (
          <TasksTab formatDate={formatDate} userId={profileData?.uid} />
        )}

        {activeTab === 'learning' && (
          <LearningTab formatDate={formatDate} />
        )}

        {activeTab === 'feedback' && (
          <FeedbackTab formatDate={formatDate} />
        )}

        {activeTab === 'team' && (
          <TeamTab 
            projects={projects} 
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab profileData={profileData} />
        )}
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editOpen} 
        onClose={handleEditClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle className="font-bold text-gray-800">
          Edit Profile
        </DialogTitle>
        <DialogContent dividers>
          <Box className="space-y-4 pt-2">
            <Box className="text-center mb-4">
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton 
                    size="small" 
                    className="bg-indigo-100 hover:bg-indigo-200"
                    component="label"
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                      }
                    }}
                  >
                    <FiUpload size={16} className="text-indigo-600" />
                    <input type="file" hidden />
                  </IconButton>
                }
              >
                <Avatar
                  src={tempData.photoURL}
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    margin: '0 auto',
                    boxShadow: theme.shadows[3],
                    fontSize: '2rem'
                  }}
                >
                  {getInitials(`${tempData.firstName} ${tempData.lastName}`)}
                </Avatar>
              </Badge>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={tempData.firstName || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={tempData.lastName || ""}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                    }
                  }}
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={tempData.email || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              disabled
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={tempData.phone || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />

            <TextField
              fullWidth
              label="LinkedIn"
              name="linkedin"
              value={tempData.linkedin || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <Box sx={{ marginRight: 1, display: 'flex' }}>
                    <FiLinkedin color="#0A66C2" />
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />

            <TextField
              fullWidth
              label="GitHub"
              name="github"
              value={tempData.github || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <Box sx={{ marginRight: 1, display: 'flex' }}>
                    <FiGithub color="#181717" />
                  </Box>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={handleEditClose} 
            variant="outlined"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              padding: '8px 16px',
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.grey[100]
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              padding: '8px 16px',
              boxShadow: 'none',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                boxShadow: '0 4px 6px rgba(79, 70, 229, 0.2)',
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.dark} 100%)`,
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: theme.shadows[3],
            alignItems: 'center'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CollaboratorProfile;