import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Avatar, Button, Chip, Divider, 
  Card, CardContent, Grid, LinearProgress, Badge,
  List, ListItem, ListItemText, ListItemAvatar,
  Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Tooltip,
  Tabs, Tab, CircularProgress
} from "@mui/material";
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiPlus, FiFileText,
  FiClock, FiCheckCircle, FiXCircle, FiChevronRight,
  FiBarChart2, FiHome, FiBriefcase, FiUsers, FiPieChart,
  FiTarget, FiAward, FiActivity, FiRefreshCw, FiSettings,
  FiMessageSquare, FiStar, FiDownload, FiUpload, FiShare2
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

const SalesProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tempData, setTempData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [performanceData, setPerformanceData] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    monthlyTarget: 0,
    monthlyAchieved: 0,
    leadStatus: {
      new: 0,
      contacted: 0,
      proposalSent: 0,
      negotiation: 0,
      closedWon: 0,
      closedLost: 0
    }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch user profile data
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setTempData(data);
        }

        // Fetch performance data
        const leadsQuery = query(
          collection(db, "leads"),
          where("assignedTo", "==", user.uid)
        );
        const leadsSnapshot = await getDocs(leadsQuery);

        let totalLeads = 0;
        let convertedLeads = 0;
        const leadStatus = {
          new: 0,
          contacted: 0,
          proposalSent: 0,
          negotiation: 0,
          closedWon: 0,
          closedLost: 0
        };

        leadsSnapshot.forEach((doc) => {
          const lead = doc.data();
          totalLeads++;
          
          if (lead.status === "closed-won") {
            convertedLeads++;
          }

          if (leadStatus.hasOwnProperty(lead.status)) {
            leadStatus[lead.status]++;
          } else if (lead.status === "proposal-sent") {
            leadStatus.proposalSent++;
          }
        });

        // Fetch monthly target
        const now = new Date();
        const currentMonth = now.toLocaleString('default', { month: 'long' });
        const currentYear = now.getFullYear().toString();
        
        const targetQuery = query(
          collection(db, 'monthly-target'),
          where('department', '==', 'sales'),
          where('month', '==', currentMonth),
          where('year', '==', currentYear)
        );
        
        const targetSnapshot = await getDocs(targetQuery);
        let monthlyTarget = 50000; // Default value if no target is found
        let monthlyAchieved = 0;
        
        if (!targetSnapshot.empty) {
          targetSnapshot.forEach(doc => {
            monthlyTarget = parseInt(doc.data().target || 50000);
          });
        }

        // Calculate achieved amount
        leadsSnapshot.forEach(doc => {
          const lead = doc.data();
          if (lead.status === "closed-won" && lead.budget) {
            monthlyAchieved += parseInt(lead.budget);
          }
        });

        setPerformanceData({
          totalLeads,
          convertedLeads,
          conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
          monthlyTarget,
          monthlyAchieved,
          leadStatus
        });

        // Fetch recent activities
        const activities = [];
        leadsSnapshot.forEach(doc => {
          const lead = doc.data();
          if (lead.createdAt) {
            activities.push({
              id: doc.id,
              type: "Added new lead",
              name: lead.company || lead.fullName || "Unknown",
              date: lead.createdAt.toDate().toLocaleString(),
              status: lead.status || "new"
            });
          }
        });

        setRecentActivities(activities.slice(0, 5));
        setLoading(false);

      } catch (error) {
        console.error("Error fetching profile data:", error);
        setSnackbarMessage("Failed to load profile data");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-purple-100 text-purple-800';
      case 'proposal-sent': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const progressValue = performanceData.monthlyTarget > 0 ? 
  Math.min((performanceData.monthlyAchieved / performanceData.monthlyTarget) * 100, 100) : 0;
  const targetCompletion = progressValue.toFixed(1);

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
              sx={{ width: 80, height: 80 }}
              className="shadow-lg ring-2 ring-white"
            />
          </Badge>
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              {userData.firstName} {userData.lastName}
            </Typography>
            <Box className="flex items-center space-x-2 mt-1">
              <Typography variant="subtitle1" className="text-gray-600">
                {userData.designation || "Sales Executive"}
              </Typography>
              <Chip
                label="Top Performer"
                color="warning"
                size="small"
                icon={<FiAward size={14} />}
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
                label={`Rank #${Math.floor(Math.random() * 10) + 1}`}
                color="info"
                size="small"
                icon={<FiTrendingUp size={14} />}
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
          aria-label="profile tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5',
              height: 3
            }
          }}
        >
          <Tab 
            label="Overview" 
            icon={<FiActivity className="mr-1" />} 
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
            label="Leads" 
            icon={<FiUsers className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Documents" 
            icon={<FiFileText className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Settings" 
            icon={<FiSettings className="mr-1" />} 
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
                  Profile Information
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
                    {userData.phone || "Not provided"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiBriefcase className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    {userData.designation || "Sales Executive"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiCalendar className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    Joined {userData.joinDate || "N/A"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiHome className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    {userData.location || "N/A"}
                  </Typography>
                </div>
                <div className="flex items-center">
                  <FiUsers className="text-gray-500 mr-3 w-5 h-5" />
                  <Typography className="text-gray-700">
                    Reports to {userData.manager || "N/A"}
                  </Typography>
                </div>
              </Box>
              
              <Divider className="my-4" />
              
              <Box>
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Skills & Expertise
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  <Chip label="Consultative Selling" className="bg-blue-50 text-blue-700" />
                  <Chip label="CRM Software" className="bg-purple-50 text-purple-700" />
                  <Chip label="Negotiation" className="bg-green-50 text-green-700" />
                  <Chip label="Lead Generation" className="bg-yellow-50 text-yellow-700" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mt-4">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Quick Stats
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-indigo-50">
                    <Typography variant="subtitle2" className="text-indigo-600">
                      Total Leads
                    </Typography>
                    <Typography variant="h4" className="font-bold text-indigo-900">
                      {performanceData.totalLeads}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-green-50">
                    <Typography variant="subtitle2" className="text-green-600">
                      Converted
                    </Typography>
                    <Typography variant="h4" className="font-bold text-green-900">
                      {performanceData.convertedLeads}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-purple-50">
                    <Typography variant="subtitle2" className="text-purple-600">
                      Conversion Rate
                    </Typography>
                    <Typography variant="h4" className="font-bold text-purple-900">
                      {performanceData.conversionRate.toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper className="p-3 rounded-lg bg-amber-50">
                    <Typography variant="subtitle2" className="text-amber-600">
                      Avg. Deal Size
                    </Typography>
                    <Typography variant="h4" className="font-bold text-amber-900">
                      ₹{(performanceData.monthlyAchieved / (performanceData.convertedLeads || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Middle Column */}
        <Grid item xs={12} md={5}>
          {/* Performance Card */}
          <Card className="shadow-lg rounded-xl border border-gray-200 h-full">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Monthly Performance
                </Typography>
                <Box className="flex items-center">
                  <FiTarget className="text-gray-500 mr-2" />
                  <Typography variant="body2" className="text-gray-600">
                    {targetCompletion}% achieved
                  </Typography>
                </Box>
              </Box>
              
              <Box className="mb-4">
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#e0e7ff',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: 'linear-gradient(90deg, #4f46e5, #8b5cf6)'
                    }
                  }}
                />
                <Box className="flex justify-between mt-1">
                  <Typography variant="caption" className="text-gray-500">
                    ₹0
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    Target: ₹{performanceData.monthlyTarget.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    ₹{performanceData.monthlyAchieved.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>
              
              <Divider className="my-4" />
              
              <Typography variant="subtitle2" className="text-gray-600 mb-3">
                Lead Pipeline
              </Typography>
              
              <Box className="grid grid-cols-2 gap-4">
                <Box className="space-y-2">
                  <Box className="flex items-center">
                    <Box className="w-3 h-3 rounded-full bg-blue-500 mr-2"></Box>
                    <Typography variant="body2">New</Typography>
                    <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                      {performanceData.leadStatus.new}
                    </Typography>
                  </Box>
                  <Box className="flex items-center">
                    <Box className="w-3 h-3 rounded-full bg-purple-500 mr-2"></Box>
                    <Typography variant="body2">Contacted </Typography>
                    <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                      {performanceData.leadStatus.contacted}
                    </Typography>
                  </Box>
                  <Box className="flex items-center">
                    <Box className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></Box>
                    <Typography variant="body2">Proposal Sent</Typography>
                    <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                      {performanceData.leadStatus.proposalSent}
                    </Typography>
                  </Box>
                </Box>
                <Box className="space-y-2">
                  <Box className="flex items-center">
                    <Box className="w-3 h-3 rounded-full bg-orange-500 mr-2"></Box>
                    <Typography variant="body2">Negotiation</Typography>
                    <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                      {performanceData.leadStatus.negotiation}
                    </Typography>
                  </Box>
                  <Box className="flex items-center">
                    <Box className="w-3 h-3 rounded-full bg-green-500 mr-2"></Box>
                    <Typography variant="body2">Closed Won</Typography>
                    <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                      {performanceData.leadStatus.closedWon}
                    </Typography>
                  </Box>
                  <Box className="flex items-center">
                    <Box className="w-3 h-3 rounded-full bg-red-500 mr-2"></Box>
                    <Typography variant="body2">Closed Lost</Typography>
                    <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                      {performanceData.leadStatus.closedLost}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Divider className="my-4" />
              
              <Box className="flex justify-between items-center">
                <Typography variant="subtitle2" className="text-gray-600">
                  Conversion Funnel
                </Typography>
                <Button size="small" endIcon={<FiChevronRight />}>
                  View Details
                </Button>
              </Box>
              
              <Box className="mt-3">
                <Box className="flex items-center justify-between mb-1">
                  <Typography variant="caption">New Leads</Typography>
                  <Typography variant="caption" className="font-medium">
                    {performanceData.leadStatus.new}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
                />
                
                <Box className="flex items-center justify-between mb-1 mt-3">
                  <Typography variant="caption">Contacted</Typography>
                  <Typography variant="caption" className="font-medium">
                    {performanceData.leadStatus.contacted}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(performanceData.leadStatus.contacted / performanceData.leadStatus.new) * 100 || 0}
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
                />
                
                <Box className="flex items-center justify-between mb-1 mt-3">
                  <Typography variant="caption">Proposals Sent</Typography>
                  <Typography variant="caption" className="font-medium">
                    {performanceData.leadStatus.proposalSent}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(performanceData.leadStatus.proposalSent / performanceData.leadStatus.contacted) * 100 || 0}
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
                />
                
                <Box className="flex items-center justify-between mb-1 mt-3">
                  <Typography variant="caption">Closed Won</Typography>
                  <Typography variant="caption" className="font-medium">
                    {performanceData.leadStatus.closedWon}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(performanceData.leadStatus.closedWon / performanceData.leadStatus.proposalSent) * 100 || 0}
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={3}>
          {/* Quick Actions */}
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Quick Actions
              </Typography>
              
              <Box className="space-y-3">
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiPlus />}
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
                  size="large"
                >
                  Add New Lead
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FiFileText />}
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  size="large"
                >
                  Create Proposal
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FiMessageSquare />}
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  size="large"
                >
                  Send Message
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FiCalendar />}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  size="large"
                >
                  Schedule Meeting
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FiShare2 />}
                  className="border-gray-600 text-gray-600 hover:bg-gray-50"
                  size="large"
                >
                  Share Profile
                </Button>
              </Box>
              
              <Divider className="my-4" />
              
              <Typography variant="subtitle2" className="text-gray-600 mb-3">
                Upcoming Tasks
              </Typography>
              
              <List className="space-y-2">
                <ListItem className="bg-blue-50 rounded-lg p-3">
                  <ListItemAvatar>
                    <Avatar className="bg-blue-100 text-blue-600">
                      <FiCalendar size={18} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Client Meeting"
                    secondary="Today, 2:00 PM"
                  />
                </ListItem>
                <ListItem className="bg-purple-50 rounded-lg p-3">
                  <ListItemAvatar>
                    <Avatar className="bg-purple-100 text-purple-600">
                      <FiFileText size={18} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Proposal Deadline"
                    secondary="Tomorrow, 10:00 AM"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mt-4">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Recent Activities
                </Typography>
                <Button size="small" endIcon={<FiChevronRight />}>
                  View All
                </Button>
              </Box>
              
              <List className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <ListItem key={index} className="p-0">
                      <Box className={`flex items-start w-full p-3 rounded-lg hover:bg-gray-50 ${getStatusColor(activity.status)}`}>
                        <Box className="mr-3 mt-1">
                          {activity.type === "Added new lead" ? (
                            <FiUser className="text-indigo-500" />
                          ) : activity.type === "Sent Proposal" ? (
                            <FiFileText className="text-purple-500" />
                          ) : (
                            <FiCheckCircle className="text-green-500" />
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
                  ))
                ) : (
                  <Typography className="text-gray-500 text-center py-4">
                    No recent activities found
                  </Typography>
                )}
              </List>
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
              <TextField
                fullWidth
                label="Designation"
                name="designation"
                value={tempData.designation || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={tempData.location || ""}
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

export default SalesProfilePage;