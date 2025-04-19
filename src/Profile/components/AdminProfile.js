import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, Button, Card, CardContent, 
  Grid, Divider, Chip, List, ListItem, ListItemText, 
  ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Snackbar, Alert, Tabs, Tab,
  Badge, IconButton, Collapse, LinearProgress, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Switch,
  CircularProgress,
} from '@mui/material';
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar, 
  FiUsers, FiBarChart2, FiFileText, FiFolder, 
  FiShield, FiMessageSquare, FiBell, FiCheckCircle,
  FiXCircle, FiChevronDown, FiChevronUp, FiLock,
  FiActivity, FiRefreshCw, FiDownload, FiSettings,
  FiPlus, FiTrendingUp, FiPieChart, FiAward, FiHome
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { styled } from '@mui/material/styles';
import { useParams } from 'react-router-dom';

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
  const [performanceData, setPerformanceData] = useState({
    totalUsers: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    revenueThisMonth: 0,
    conversionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

 
  useEffect(() => {
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

        setPerformanceData({
          totalUsers: usersSnapshot.size,
          activeProjects: projectsSnapshot.size,
          pendingApprovals: approvalsSnapshot.size,
          revenueThisMonth: 24500,
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

    fetchUserData();
  }, [username]);

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
            <Avatar
              alt={`${userData.firstName} ${userData.lastName}`}
              src={userData.profilePicture}
              sx={{ width: 100, height: 100 }}
              className="shadow-lg ring-2 ring-white"
            />
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
            icon={<FiLock className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={4}>
          {/* Profile Card */}
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Personal Details
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" className="text-gray-500 hover:bg-gray-100">
                    <FiRefreshCw size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Box className="space-y-4">
                <div className="flex items-center">
                  <FiMail className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    {userData.email}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiPhone className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    {userData.phoneNumber || "Not provided"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiUser className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    Employee ID: {userData.employeeId || "ADM-001"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    Joined {userData.joinDate || "Jan 15, 2022"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiShield className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    Admin since {userData.adminSince || "Mar 1, 2023"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiUsers className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    Department: {userData.department || "Management"}
                  </Typography>
                </div>
              </Box>
              
              <Divider className="my-4" />
              
              <Box>
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  System Access
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  <Chip label="Full Access" className="bg-green-50 text-green-700" />
                  <Chip label="User Management" className="bg-blue-50 text-blue-700" />
                  <Chip label="Billing" className="bg-purple-50 text-purple-700" />
                  <Chip label="Analytics" className="bg-yellow-50 text-yellow-700" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mt-4">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Platform Overview
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-indigo-50">
                    <Typography variant="subtitle2" className="text-indigo-600">
                      Total Users
                    </Typography>
                    <Typography variant="h4" className="font-bold text-indigo-900">
                      {performanceData.totalUsers}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-green-50">
                    <Typography variant="subtitle2" className="text-green-600">
                      Active Projects
                    </Typography>
                    <Typography variant="h4" className="font-bold text-green-900">
                      {performanceData.activeProjects}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-purple-50">
                    <Typography variant="subtitle2" className="text-purple-600">
                      Pending Approvals
                    </Typography>
                    <Typography variant="h4" className="font-bold text-purple-900">
                      {performanceData.pendingApprovals}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-amber-50">
                    <Typography variant="subtitle2" className="text-amber-600">
                      Revenue (Month)
                    </Typography>
                    <Typography variant="h4" className="font-bold text-amber-900">
                      ${performanceData.revenueThisMonth.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Middle Column */}
        <Grid item xs={12} md={5}>
          {/* Admin Access Panel */}
          <Card className="shadow-lg rounded-xl border border-gray-200 h-full">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Admin Access Panel
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Quick Actions
                </Typography>
              </Box>
              
              <Box className="grid grid-cols-2 gap-4 mb-6">
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiUsers />}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
                  size="large"
                >
                  Manage Users
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiBarChart2 />}
                  className="bg-blue-600 hover:bg-blue-700 shadow-md"
                  size="large"
                >
                  Platform Analytics
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiFileText />}
                  className="bg-green-600 hover:bg-green-700 shadow-md"
                  size="large"
                >
                  Invoices & Billing
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiFolder />}
                  className="bg-purple-600 hover:bg-purple-700 shadow-md"
                  size="large"
                >
                  Projects Overview
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiShield />}
                  className="bg-yellow-600 hover:bg-yellow-700 shadow-md"
                  size="large"
                >
                  Permissions & Roles
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiMessageSquare />}
                  className="bg-pink-600 hover:bg-pink-700 shadow-md"
                  size="large"
                >
                  Client Feedback
                </Button>
              </Box>
              
              <Divider className="my-4" />
              
              <Typography variant="subtitle2" className="text-gray-600 mb-3">
                Recent Activities
              </Typography>
              
              <List className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <ListItem key={index} className="p-0">
                    <Box className="flex items-start w-full p-3 rounded-lg hover:bg-gray-50">
                      <Box className="mr-3 mt-1">
                        {activity.type.includes("Approval") ? (
                          <FiCheckCircle className="text-green-500" />
                        ) : activity.type.includes("User") ? (
                          <FiUsers className="text-indigo-500" />
                        ) : activity.type.includes("Project") ? (
                          <FiFolder className="text-purple-500" />
                        ) : (
                          <FiBarChart2 className="text-blue-500" />
                        )}
                      </Box>
                      <Box className="flex-1">
                        <Typography variant="body2" className="font-medium">
                          {activity.type}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600">
                          {activity.name}
                        </Typography>
                        <Typography variant="caption" className="block text-gray-500">
                          {activity.date}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={3}>
          {/* Notifications & Approvals */}
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Approvals & Notifications
                </Typography>
                <Badge badgeContent={pendingApprovals.length} color="error">
                  <FiBell className="text-gray-600" />
                </Badge>
              </Box>
              
              {pendingApprovals.length > 0 ? (
                <>
                  <Typography variant="subtitle2" className="text-gray-600 mb-3">
                    Pending Approvals ({pendingApprovals.length})
                  </Typography>
                  
                  <List className="space-y-3">
                    {pendingApprovals.map((approval, index) => (
                      <ListItem key={index} className="p-0">
                        <Paper className="w-full p-3 rounded-lg">
                          <Typography variant="body2" className="font-medium">
                            {approval.type}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            Requested by: {approval.requestedBy}
                          </Typography>
                          <Typography variant="caption" className="block text-gray-500">
                            {approval.date}
                          </Typography>
                          <Box className="flex justify-end space-x-2 mt-2">
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<FiCheckCircle size={14} />}
                              onClick={() => handleApprove(approval.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<FiXCircle size={14} />}
                              onClick={() => handleReject(approval.id)}
                            >
                              Reject
                            </Button>
                          </Box>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Box className="text-center py-4">
                  <FiCheckCircle className="mx-auto text-green-500 text-4xl mb-2" />
                  <Typography variant="body2" className="text-gray-600">
                    No pending approvals
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mt-4">
            <CardContent className="p-6">
              <Box 
                className="flex justify-between items-center cursor-pointer"
                onClick={toggleSecuritySection}
              >
                <Typography variant="h6" className="font-bold text-gray-800">
                  Security Settings
                </Typography>
                {securityOpen ? <FiChevronUp /> : <FiChevronDown />}
              </Box>
              
              <Collapse in={securityOpen}>
                <Box className="mt-4 space-y-4">
                  <Box className="flex items-center justify-between">
                    <Typography variant="body2">Two-Factor Authentication</Typography>
                    <Switch
                      checked={twoFactorEnabled}
                      onChange={handleTwoFactorToggle}
                      color="primary"
                    />
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FiLock />}
                    className="border-gray-600 text-gray-600 hover:bg-gray-50"
                    size="medium"
                  >
                    Change Password
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FiActivity />}
                    className="border-gray-600 text-gray-600 hover:bg-gray-50"
                    size="medium"
                  >
                    View Activity Logs
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FiShield />}
                    className="border-gray-600 text-gray-600 hover:bg-gray-50"
                    size="medium"
                  >
                    Access Controls
                  </Button>
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mt-4">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Performance Summary
              </Typography>
              
              <Box className="mb-4">
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Lead Conversion Rate
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={performanceData.conversionRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e0e7ff',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #4f46e5, #8b5cf6)'
                    }
                  }}
                />
                <Typography variant="caption" className="text-gray-500 mt-1">
                  {performanceData.conversionRate.toFixed(1)}% team-wide
                </Typography>
              </Box>
              
              <Box className="mb-4">
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Monthly Report Generation
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiDownload />}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="medium"
                >
                  Download Report
                </Button>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Revenue Summary
                </Typography>
                <Box className="flex justify-between mb-1">
                  <Typography variant="caption">This Month</Typography>
                  <Typography variant="caption" className="font-medium">
                    ${performanceData.revenueThisMonth.toLocaleString()}
                  </Typography>
                </Box>
                <Box className="flex justify-between">
                  <Typography variant="caption">Projected</Typography>
                  <Typography variant="caption" className="font-medium">
                    ${(performanceData.revenueThisMonth * 1.15).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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