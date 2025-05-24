import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, Button, Card, CardContent, 
  Grid, Divider, Chip, List, ListItem, ListItemText, 
  ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Snackbar, Alert, Tabs, Tab,
  Badge, IconButton, Collapse, LinearProgress, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Switch,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stepper, Step, StepLabel, StepContent, Accordion, AccordionSummary, AccordionDetails,FormControlLabel
} from '@mui/material';
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar, 
  FiUsers, FiBarChart2, FiFileText, FiFolder, 
  FiShield, FiMessageSquare, FiBell, FiCheckCircle,
  FiXCircle, FiChevronDown, FiChevronUp, FiLock,
  FiActivity, FiRefreshCw, FiDownload, FiSettings,
  FiPlus, FiTrendingUp, FiPieChart, FiAward, FiHome, FiTool, FiClipboard, FiCheckSquare, FiRepeat,
  FiLogOut, FiEye, FiEyeOff, FiKey, FiAlertCircle,
  FiHardDrive, FiDatabase, FiServer, FiCode, FiLayers, FiCamera
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { styled } from '@mui/material/styles';
import { useParams } from 'react-router-dom';
import SecurityTab from './Admin Tabs/Security';
import ReportsTab from './Admin Tabs/Reports';
import PerformanceTab from './Admin Tabs/Performance';
import OverviewTab from './Admin Tabs/Overview';
import { uploadToCloudinary } from '../../utils/cloudinaryUtils';
import { updateProfile } from 'firebase/auth';
 
const AdminProfilePage = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tempData, setTempData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeTab, setActiveTab] = useState(0);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    totalUsers: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    revenueThisMonth: 0,
    conversionRate: 0
  });
  const [performanceMetrics] = useState({
    activeProjects: 42,
    teamMembers: 26,
    tasksTracked: 1128,
    projectsCompleted: 8,
    taskCompletionRate: 87
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: 'MacBook Pro (Chrome)', location: 'San Francisco, CA', lastActive: '2 hours ago', current: true },
    { id: 2, device: 'iPhone 13 (Safari)', location: 'San Jose, CA', lastActive: '5 days ago', current: false },
    { id: 3, device: 'Windows PC (Edge)', location: 'New York, NY', lastActive: '3 weeks ago', current: false }
  ]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [accessLogs, setAccessLogs] = useState([
    { id: 1, action: 'Password changed', timestamp: '2023-05-15 14:30', ip: '192.168.1.1' },
    { id: 2, action: 'Failed login attempt', timestamp: '2023-05-14 09:15', ip: '203.0.113.42' },
    { id: 3, action: 'Role permissions updated', timestamp: '2023-05-10 16:45', ip: '192.168.1.1' }
  ]);

 
  
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to get user by username
        if (username) {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", username));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setUserData(doc.data());
            setTempData(doc.data());
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
              setUserData(userSnap.data());
              setTempData(userSnap.data());
            } else {
              throw new Error("User data not found");
            }
          } else {
            throw new Error("Not authenticated");
          }
        }

        // Fetch admin performance data
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        
        const projectsQuery = query(collection(db, "projects"));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const approvalsQuery = query(
          collection(db, "approvals"),
          where("status", "==", "pending")
        );
        const approvalsSnapshot = await getDocs(approvalsQuery);

        const transactionsQuery = query(
          collection(db, "platform-transactions"),
          where("status", "==", "completed")
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const revenueThisMonth = transactionsSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().amount || 0);
        }, 0);
    
        // Fetch potential revenue from projects
        const dxdProjectsQuery = query(collection(db, "dxd-magnate-projects"));
        const dxdProjectsSnapshot = await getDocs(dxdProjectsQuery);
        const potentialRevenue = dxdProjectsSnapshot.docs.reduce((sum, doc) => {
          const budget = doc.data().budget;
          // Convert budget to number if it's a string, default to 0 if empty
          const budgetValue = budget ? parseInt(budget) : 0;
          return sum + budgetValue;
        }, 0);

        setPerformanceData({
          totalUsers: usersSnapshot.size,
          activeProjects: dxdProjectsSnapshot.size,
          pendingApprovals: approvalsSnapshot.size,
          revenueThisMonth: revenueThisMonth,
          potentialRevenue: potentialRevenue,
          conversionRate: 32.5
        });

        // Fetch recent activities
        const activities = [];
        approvalsSnapshot.forEach(doc => {
          const approval = doc.data();
          activities.push({
            id: doc.id,
            type: "Approval Request",
            name: approval.type,
            date: approval.createdAt?.toDate().toLocaleString() || new Date().toLocaleString(),
            status: approval.status
          });
        });

        // Add mock activities
        activities.push(
          {
            id: "act1",
            type: "User Management",
            name: "Updated permissions for Sales Team",
            date: new Date(Date.now() - 3600000).toLocaleString(),
            status: "completed"
          },
          {
            id: "act2",
            type: "Project Assignment",
            name: "Assigned Project Manager to XYZ Project",
            date: new Date(Date.now() - 86400000).toLocaleString(),
            status: "completed"
          }
        );

        setRecentActivities(activities.slice(0, 5));

        // Fetch pending approvals
        const approvals = [];
        approvalsSnapshot.forEach(doc => {
          const approval = doc.data();
          approvals.push({
            id: doc.id,
            type: approval.type,
            requestedBy: approval.requestedBy,
            date: approval.createdAt?.toDate().toLocaleString() || new Date().toLocaleString(),
            status: approval.status
          });
        });

        setPendingApprovals(approvals);

      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err.message);
        setSnackbarMessage(err.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchUserData();
    }, [username,]);

  const handleEditOpen = () => {
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setTempData(userData);
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
      // In a real app, you would update the data in Firestore here
      setUserData(tempData);
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbarMessage("Passwords don't match");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (passwordStrength < 3) {
      setSnackbarMessage("Password is too weak");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      // In a real app, you would update the password in your auth system
      setSnackbarMessage("Password changed successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error("Error changing password:", error);
      setSnackbarMessage("Failed to change password");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Add password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    return strength;
  };

  // Add handler for password input
  const handlePasswordInput = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Add session revoke handler
  const handleRevokeSession = (id) => {
    setActiveSessions(activeSessions.filter(session => session.id !== id));
    setSnackbarMessage("Session revoked successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // Add logout all handler
  const handleLogoutAll = () => {
    setActiveSessions(activeSessions.filter(session => session.current));
    setSnackbarMessage("Logged out from all other devices");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleSecuritySection = () => {
    setSecurityOpen(!securityOpen);
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    setSnackbarMessage(`Two-factor authentication ${!twoFactorEnabled ? "enabled" : "disabled"}`);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleApprove = (id) => {
    // In a real app, you would update the approval status in Firestore
    setPendingApprovals(pendingApprovals.filter(approval => approval.id !== id));
    setSnackbarMessage("Approval request processed");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleReject = (id) => {
    // In a real app, you would update the approval status in Firestore
    setPendingApprovals(pendingApprovals.filter(approval => approval.id !== id));
    setSnackbarMessage("Approval request rejected");
    setSnackbarSeverity("warning");
    setSnackbarOpen(true);
  };

  const handleProfilePicUpload = async (file) => {
    if (!file) return;
    
    try {
      setProfilePicUploading(true);
      
      // Upload to Cloudinary
      const uploadedImage = await uploadToCloudinary(file);
      
      // Update Firestore
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoURL: uploadedImage.url
      });
      
      // Update Auth user profile using updateProfile
      await updateProfile(auth.currentUser, {
        photoURL: uploadedImage.url
      });
      
      // Refresh user data
      await fetchUserData();
      
      setSnackbarMessage("Profile picture updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      alert(error)
      console.error("Error updating profile picture:", error);
      setSnackbarMessage("Failed to update profile picture");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setProfilePicUploading(false);
    }
  };


  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!userData) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <Typography>No user data found</Typography>
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
              <Box className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></Box>
            }
          >
            <Box sx={{ position: 'relative' }}>
              <Avatar
                alt={`${userData.firstName} ${userData.lastName}`}
                src={userData.photoURL}
                sx={{ width: 100, height: 100 }}
                className="shadow-lg ring-2 ring-white"
              />
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-pic-upload"
                type="file"
                onChange={(e) => handleProfilePicUpload(e.target.files[0])}
              />
              <label htmlFor="profile-pic-upload">
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="span"
                  disabled={profilePicUploading}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  {profilePicUploading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <FiCamera size={20} />
                  )}
                </IconButton>
              </label>
            </Box>
          </Badge>
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              {userData.firstName} {userData.lastName}
            </Typography>
            <Box className="flex items-center space-x-2 mt-1">
              <Typography variant="subtitle1" className="text-gray-600">
                {userData.role || "System Administrator"}
              </Typography>
              <Chip
                label="Super Admin"
                color="primary"
                size="small"
                icon={<FiShield size={14} />}
                className="text-xs"
              />
            </Box>
            <Box className="flex space-x-2 mt-2">
              <Chip
                label="Active"
                color="success"
                size="small"
                icon={<FiCheckCircle size={14} />}
                className="text-xs"
              />
              <Chip
                label="Verified"
                color="info"
                size="small"
                icon={<FiAward size={14} />}
                className="text-xs"
              />
            </Box>
          </Box>
        </Box>
        <Box className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<FiDownload />}
            className="bg-gray-800 hover:bg-gray-700"
          >
            Export Data
          </Button>
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

       {/* Tabs Navigation */}
       <Box className="mb-6">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="admin profile tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5',
              height: 3
            }
          }}
        >
          <Tab 
            label="Overview" 
            icon={<FiHome className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Performance" 
            icon={<FiTrendingUp className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Reports" 
            icon={<FiPieChart className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Security" 
            icon={<FiShield className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>

  
{activeTab === 0 && (
        <OverviewTab 
          userData={userData}
          performanceData={performanceData}
          recentActivities={recentActivities}
          pendingApprovals={pendingApprovals}
          handleApprove={handleApprove}
          handleReject={handleReject}
          toggleSecuritySection={toggleSecuritySection}
          securityOpen={securityOpen}
          twoFactorEnabled={twoFactorEnabled}
          handleTwoFactorToggle={handleTwoFactorToggle}
          handleEditOpen = {handleEditOpen}
          handleEditClose = {handleEditClose}
        />
      )}

      {activeTab === 1 && (
        <PerformanceTab performanceMetrics={performanceMetrics} />
      )}

      {activeTab === 2 && (
        <ReportsTab />
      )}

      {activeTab === 3 && (
        <SecurityTab 
          twoFactorEnabled={twoFactorEnabled}
          handleTwoFactorToggle={handleTwoFactorToggle}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          passwordData={passwordData}
          handlePasswordInput={handlePasswordInput}
          passwordStrength={passwordStrength}
          handlePasswordChange={handlePasswordChange}
          activeSessions={activeSessions}
          handleRevokeSession={handleRevokeSession}
          handleLogoutAll={handleLogoutAll}
          accessLogs={accessLogs}
        />
      )}

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editOpen} 
        onClose={handleEditClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle className="font-bold bg-gray-50 border-b">
          <Box className="flex items-center">
            <FiEdit2 className="mr-2 text-indigo-600" />
            Edit Profile
          </Box>
        </DialogTitle>
        <DialogContent className="py-6">
          <Grid container spacing={3}>
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
            <Grid item xs={12}>
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={tempData.phone || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  label="Department"
                  name="department"
                  value={tempData.department || ""}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Management">Management</MenuItem>
                  <MenuItem value="Administration">Administration</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="IT">IT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee ID"
                name="employeeId"
                value={tempData.employeeId || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="border-t px-6 py-4">
          <Button 
            onClick={handleEditClose} 
            variant="outlined"
            className="border-gray-300 text-gray-700"
          >
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

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminProfilePage;