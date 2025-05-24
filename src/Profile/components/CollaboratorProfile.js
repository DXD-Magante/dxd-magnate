import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, Button, Card, CardContent,
  Grid, Divider, Chip, Tabs, Tab, Badge, IconButton,
  LinearProgress, List, ListItem, ListItemAvatar, ListItemText,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, CircularProgress
} from '@mui/material';
import {
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar,
  FiAward, FiCheckCircle, FiClock, FiAlertCircle,
  FiTrendingUp, FiFileText, FiMessageSquare, FiBell,
  FiChevronDown, FiChevronUp, FiLock, FiSettings,
  FiDownload, FiUpload, FiStar, FiUsers, FiBookmark,
  FiMessageCircle, FiExternalLink, FiRefreshCw, FiPlus
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, getCountFromServer, orderBy, limit, startAfter } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';

// Import tab components
import TasksTab from './CollaboratorTabs/TaskTab';
import LearningTab from './CollaboratorTabs/LearningTab';
import FeedbackTab from './CollaboratorTabs/FeedbackTab';
import SettingsTab from './CollaboratorTabs/SettingsTab';
import TeamTab from './CollaboratorTabs/TeamTab';

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
    performancePoints: 0,
    badgesEarned: 0,
    leaderboardRank: 0,
    tasksAssigned: 0,
    pendingApprovals: 0,
    totalUsers: 0 
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

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
        // 1. Fetch projects where the user is a team member
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("teamMembers", "array-contains", { id: userId })
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        let projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    
        // 2. If no projects found, set empty state and return basic stats
        if (projectsData.length === 0) {
          setProjects([]);
          setSelectedProject(null);
          
          // Return basic stats (similar to your existing stats calculation)
          const tasksQuery = query(
            collection(db, "project-tasks"),
            where("assignee.id", "==", userId)
          );
          const tasksSnapshot = await getDocs(tasksQuery);
          const allTasks = tasksSnapshot.docs.map(doc => doc.data());
          
          // Calculate basic stats
          const totalTasks = allTasks.length;
          const completedTasks = allTasks.filter(task => task.status === 'Done').length;
          const pendingApprovals = allTasks.filter(task => task.status === 'Review').length;
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          // Fetch user rank
          const usersQuery = query(collection(db, "users"), orderBy("performanceScore", "desc"));
          const usersSnapshot = await getDocs(usersQuery);
          const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const userRank = allUsers.findIndex(user => user.id === userId) + 1;
          const totalUsers = allUsers.length;
          
          // Fetch badges count
          const badgesQuery = query(collection(db, "user-badges"), where("userId", "==", userId));
          const badgesSnapshot = await getCountFromServer(badgesQuery);
          const badgesCount = badgesSnapshot.data().count;
          
          setStats({
            tasksCompleted: completedTasks,
            totalTasks: totalTasks,
            completionRate: completionRate,
            leaderboardRank: userRank,
            pendingApprovals: pendingApprovals,
            badgesEarned: badgesCount,
            topPercentage: totalUsers > 0 ? Math.ceil((userRank / totalUsers) * 100) : 0,
            totalUsers: totalUsers
          });
          
          return;
        }
    
        // 3. Enhance projects data with user details
        const enhancedProjects = await Promise.all(
          projectsData.map(async (project) => {
            // Enhance team members
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
    
            // Enhance project manager details if exists
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
        setSelectedProject(enhancedProjects[0]);
    
        // 4. Fetch task statistics (your existing code)
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
        const usersQuery = query(
          collection(db, "users"),
        );
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
    
        // 5. Set all stats
        setStats({
          tasksCompleted: completedTasks,
          totalTasks: totalTasks,
          completionRate: completionRate,
          leaderboardRank: userRank,
          pendingApprovals: pendingApprovals,
          badgesEarned: badgesCount,
          topPercentage: topPercentage,
          totalUsers: totalUsers
        });
    
        // 6. Fetch recent activity
        const recentTasks = allTasks
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 3)
          .map(task => ({
            id: task.id,
            type: "task",
            title: `Task ${task.status === 'Done' ? 'completed' : 'updated'}: ${task.title}`,
            date: new Date(task.updatedAt),
            icon: task.status === 'Done' ? <FiCheckCircle /> : <FiClock />,
            color: task.status === 'Done' ? "#10B981" : "#3B82F6"
          }));
        
        setRecentActivity(recentTasks);
    
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
    if (typeof date === 'string') date = new Date(date);
    return format(date, 'dd MMM yyyy');
  };

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Last seen: Unknown";
    
    if (typeof timestamp === 'string') {
      return `Last seen: ${new Date(timestamp).toLocaleString()}`;
    }
    
    return `Last seen: ${timestamp.toDate().toLocaleString()}`;
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <Typography>No profile data found</Typography>
      </Box>
    );
  }

  return (
    <Box className="bg-gray-50 min-h-screen p-6 max-w-7xl mx-auto" sx={{ marginTop: '60px' }}>
      {/* Header Section */}
      <Box className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <Box className="flex items-center space-x-4 mb-4 md:mb-0">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton size="small" color="primary" component="label">
                <FiEdit2 size={12} />
                <input type="file" hidden />
              </IconButton>
            }
          >
            <Avatar
              alt={`${profileData.firstName} ${profileData.lastName}`}
              src={profileData.photoURL}
              sx={{ width: 100, height: 100 }}
              className="shadow-lg ring-2 ring-white"
            >
              {getInitials(`${profileData.firstName} ${profileData.lastName}`)}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600 mt-1">
              {profileData.department || "Collaborator"} • {profileData.role}
            </Typography>
            <Box className="flex space-x-2 mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="mr-1" />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiPhone className="mr-1" />
                <span>{profileData.phone || "Not provided"}</span>
              </div>
            </Box>
          </Box>
        </Box>
        <Box className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<FiEdit2 />}
            onClick={handleEditOpen}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} className="mb-8">
  <Grid item xs={12} sm={6} md={4}>
    <Paper className="p-4 rounded-xl shadow-sm border border-gray-200">
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="subtitle2" className="text-gray-600">
            Tasks Completed
          </Typography>
          <Typography variant="h4" className="font-bold">
            {stats.tasksCompleted}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {stats.completionRate}% completion rate
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: '#ECFDF5', width: 48, height: 48 }}>
          <FiCheckCircle size={24} color="#10B981" />
        </Avatar>
      </Box>
    </Paper>
  </Grid>
  <Grid item xs={12} sm={6} md={4}>
    <Paper className="p-4 rounded-xl shadow-sm border border-gray-200">
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="subtitle2" className="text-gray-600">
            Total Tasks
          </Typography>
          <Typography variant="h4" className="font-bold">
            {stats.totalTasks}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {stats.pendingApprovals} pending approval
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: '#EFF6FF', width: 48, height: 48 }}>
          <FiFileText size={24} color="#3B82F6" />
        </Avatar>
      </Box>
    </Paper>
  </Grid>
  <Grid item xs={12} sm={6} md={4}>
    <Paper className="p-4 rounded-xl shadow-sm border border-gray-200">
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="subtitle2" className="text-gray-600">
            Leaderboard Rank
          </Typography>
          <Typography variant="h4" className="font-bold">
            #{profileData.allTimeRank}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            Top {Math.ceil((stats.leaderboardRank / stats.totalUsers) * 100)}% of users
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: '#FEF3C7', width: 48, height: 48 }}>
          <FiTrendingUp size={24} color="#F59E0B" />
        </Avatar>
      </Box>
    </Paper>
  </Grid>
</Grid>

      {/* Overview Metrics */}
      <Grid container spacing={3} className="mb-8">
        <Grid item xs={12} md={4}>
          <Card className="shadow-lg rounded-xl border border-gray-200 h-full">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Performance Overview
              </Typography>
              
              <Box>
  <Typography variant="subtitle2" className="text-gray-600 mb-1">
    COMPLETION RATE
  </Typography>
  <Box className="flex items-center justify-between">
    <Typography variant="h4" className="font-bold">
      {stats.completionRate}%
    </Typography>
    <Box className="w-1/2">
      <LinearProgress
        variant="determinate"
        value={stats.completionRate}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: '#E5E7EB',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundColor: '#4F46E5'
          }
        }}
      />
    </Box>
  </Box>
</Box>
            </CardContent>
          </Card>
        </Grid>
        
      
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
      <Tabs 
  value={activeTab} 
  onChange={handleTabChange} 
  variant="scrollable" 
  scrollButtons="auto"
>
  <Tab label="Tasks" value="tasks" icon={<FiCheckCircle size={18} />} iconPosition="start" />
  <Tab label="Team" value="team" icon={<FiUsers size={18} />} iconPosition="start" />
  <Tab label="Learning" value="learning" icon={<FiBookmark size={18} />} iconPosition="start" />
  <Tab label="Feedback" value="feedback" icon={<FiMessageSquare size={18} />} iconPosition="start" />
  <Tab label="Settings" value="settings" icon={<FiSettings size={18} />} iconPosition="start" />
</Tabs>
      </Box>

      {/* Tab Content */}
      <Box>
        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <TasksTab formatDate={formatDate} />
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <LearningTab formatDate={formatDate} />
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <FeedbackTab formatDate={formatDate} />
        )}

        {/* Team Tab */}
          {activeTab === 'team' && (
            <TeamTab 
              projects={projects} 
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              formatDate={formatDate}
            />
          )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab profileData={profileData} />
        )}
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
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
                  <IconButton size="small" color="primary" component="label">
                    <FiUpload size={16} />
                    <input type="file" hidden />
                  </IconButton>
                }
              >
                <Avatar
                  src={tempData.photoURL}
                  sx={{ width: 80, height: 80, margin: '0 auto' }}
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
            />
            
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={tempData.phone || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} className="text-gray-600 hover:bg-gray-100">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            className="bg-indigo-600 hover:bg-indigo-700"
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
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CollaboratorProfile;