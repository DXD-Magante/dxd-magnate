import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Button, Card, CardContent,
  Grid, Divider, Chip, List, ListItem, ListItemText,
  ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Tabs, Tab,
  Badge, IconButton, LinearProgress, Tooltip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Switch
} from '@mui/material';
import {
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar,
  FiUsers, FiBarChart2, FiFileText, FiFolder,
  FiMessageSquare, FiBell, FiCheckCircle,
  FiXCircle, FiChevronDown, FiChevronUp, FiLock,
  FiActivity, FiDownload, FiSettings, FiPlus,
  FiTrendingUp, FiAward, FiHome, FiStar, FiClock,
  FiCheck, FiX, FiUpload, FiEye, FiDollarSign,
  FiCreditCard, FiCheckSquare, FiMessageCircle,
  FiFile, FiDownloadCloud, FiShare2, FiClock as FiClockIcon,
  FiCalendar as FiCalendarIcon, FiClipboard, FiThumbsUp,
  FiThumbsDown, FiPaperclip, FiBookmark, FiSettings as FiSettingsIcon,
  FiChevronRight, FiSearch, FiTarget, FiLayers, FiPieChart
} from 'react-icons/fi';
import { MdOutlineCampaign, MdOutlineAnalytics } from 'react-icons/md';
import { BsGraphUp, BsPeople, BsLightning } from 'react-icons/bs';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

const MarketingProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tempData, setTempData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data - in a real app, this would come from your database
  const stats = [
    { title: "Active Campaigns", value: 4, icon: <MdOutlineCampaign size={24} />, change: "+1 this month" },
    { title: "Leads Generated", value: 250, icon: <BsPeople size={24} />, change: "18% increase" },
    { title: "Conversion Rate", value: "15.6%", icon: <FiTrendingUp size={24} />, change: "2.1% increase" },
    { title: "Ad Spend", value: "$10,000", icon: <FiDollarSign size={24} />, change: "$2,500 remaining" }
  ];

  const skills = [
    "SEO Optimization", "PPC Advertising", "Social Media Marketing",
    "Content Creation", "Email Marketing", "Google Analytics",
    "Marketing Automation", "Data Analysis"
  ];

  const certifications = [
    { name: "Google Ads Certified", issuer: "Google", date: "2024-03-15" },
    { name: "HubSpot Inbound Marketing", issuer: "HubSpot", date: "2024-01-10" },
    { name: "Facebook Blueprint", issuer: "Meta", date: "2023-11-22" }
  ];

  const ongoingCampaigns = [
    {
      id: 1,
      name: "Summer Sale Promo",
      platform: ["Google Ads", "Facebook Ads"],
      status: "Active",
      startDate: "2025-05-01",
      endDate: "2025-06-30",
      budget: 5000,
      spent: 3200,
      clicks: 1240,
      impressions: 45000,
      conversions: 186
    },
    {
      id: 2,
      name: "Product Launch 2025",
      platform: ["Instagram", "LinkedIn"],
      status: "Active",
      startDate: "2025-04-15",
      endDate: "2025-05-30",
      budget: 3000,
      spent: 1500,
      clicks: 850,
      impressions: 28000,
      conversions: 92
    }
  ];

  const completedCampaigns = [
    {
      id: 3,
      name: "Spring Clearance",
      platform: ["Google Ads", "Email"],
      status: "Completed",
      startDate: "2025-03-01",
      endDate: "2025-03-31",
      budget: 4000,
      spent: 3800,
      clicks: 2100,
      impressions: 65000,
      conversions: 315,
      roi: "4.2x"
    }
  ];

  const tasks = [
    {
      id: 1,
      title: "Create Facebook Ad Copy",
      campaign: "Summer Sale Promo",
      deadline: "2025-05-15",
      status: "In Progress",
      type: "Content Creation"
    },
    {
      id: 2,
      title: "Review Landing Page Design",
      campaign: "Product Launch 2025",
      deadline: "2025-04-20",
      status: "Pending Review",
      type: "Design Review"
    },
    {
      id: 3,
      title: "Analyze Q1 Campaign Data",
      campaign: "Spring Clearance",
      deadline: "2025-04-10",
      status: "Completed",
      type: "Data Analysis"
    }
  ];

  const activities = [
    {
      id: 1,
      type: "Campaign Update",
      title: "Updated Ad Copy for Summer Sale Promo",
      date: "2025-05-05",
      details: "Revised ad copy based on A/B test results"
    },
    {
      id: 2,
      type: "Task Completed",
      title: "Approved Social Media Post for Product Launch",
      date: "2025-04-18",
      details: "Reviewed and approved all social media assets"
    },
    {
      id: 3,
      type: "Campaign Launch",
      title: "Launched Summer Sale Promo",
      date: "2025-05-01",
      details: "Initiated campaign across all platforms"
    }
  ];

  const feedbacks = [
    {
      id: 1,
      from: "Alex Johnson (Sales Team)",
      message: "Great work on the Winter Campaign - exceeded lead targets by 20%!",
      date: "2025-03-10"
    },
    {
      id: 2,
      from: "Marketing Team Lead",
      message: "Excellent analysis of campaign metrics last quarter",
      date: "2025-04-05"
    }
  ];

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // First try to get user by username
      if (username) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setProfileData(doc.data());
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
            setProfileData(userSnap.data());
            setTempData(userSnap.data());
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

  useEffect(() => {
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
      // In a real app, you would update the data in Firestore here
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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
            />
          </Badge>
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600 mt-1">
              {profileData.role || "Marketing Team Member"} • DXD Magnate
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
            variant="outlined"
            startIcon={<FiMessageCircle />}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Send Message
          </Button>
          <Button
            variant="outlined"
            startIcon={<MdOutlineCampaign />}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Assign Campaign
          </Button>
          <Button
            variant="contained"
            startIcon={<BsGraphUp />}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            View Performance
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiEdit2 />}
            onClick={handleEditOpen}
            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" value="overview" icon={<FiHome size={18} />} iconPosition="start" />
          <Tab label="Campaigns" value="campaigns" icon={<MdOutlineCampaign size={18} />} iconPosition="start" />
          <Tab label="Tasks" value="tasks" icon={<FiCheckSquare size={18} />} iconPosition="start" />
          <Tab label="Skills" value="skills" icon={<BsLightning size={18} />} iconPosition="start" />
          <Tab label="Activity" value="activity" icon={<FiActivity size={18} />} iconPosition="start" />
          <Tab label="Feedback" value="feedback" icon={<FiThumbsUp size={18} />} iconPosition="start" />
          <Tab label="Settings" value="settings" icon={<FiSettings size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Box>
            {/* Key Metrics */}
            <Grid container spacing={3} className="mb-6">
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    height: '100%'
                  }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" className="font-bold">
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', mt: 1 }}>
                          {stat.icon && React.cloneElement(stat.icon, { className: "mr-1", size: 16 })}
                          {stat.change}
                        </Typography>
                      </div>
                      <div className={`p-2 rounded-lg ${
                        index === 0 ? 'bg-purple-100 text-purple-600' :
                        index === 1 ? 'bg-blue-100 text-blue-600' :
                        index === 2 ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {stat.icon}
                      </div>
                    </div>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Ongoing Campaigns */}
            <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
              <CardContent className="p-6">
                <Box className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-bold text-gray-800">
                    Ongoing Campaigns
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    className="text-indigo-600 hover:bg-indigo-50"
                  >
                    View All
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Campaign</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Platform</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Budget</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ongoingCampaigns.map((campaign) => (
                        <TableRow key={campaign.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" className="font-bold">
                              {campaign.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box className="flex flex-wrap gap-1">
                              {campaign.platform.map((platform, idx) => (
                                <Chip
                                  key={idx}
                                  label={platform}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={campaign.status}
                              size="small"
                              sx={{
                                backgroundColor: campaign.status === "Active" ? '#dcfce7' : '#fef3c7',
                                color: campaign.status === "Active" ? '#166534' : '#92400e'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(campaign.startDate)}
                            </Typography>
                            <Typography variant="caption" className="text-gray-600">
                              to {formatDate(campaign.endDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" className="font-medium">
                              ${campaign.spent.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" className="text-gray-600">
                              of ${campaign.budget.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box className="flex items-center">
                              <FiTarget className="mr-1 text-blue-500" />
                              <Typography variant="body2">
                                {campaign.conversions} conversions
                              </Typography>
                            </Box>
                            <Typography variant="caption" className="text-gray-600">
                              {campaign.clicks} clicks
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              size="small"
                              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                              endIcon={<FiChevronRight />}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-lg rounded-xl border border-gray-200">
              <CardContent className="p-6">
                <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                  Recent Activity
                </Typography>
                
                <List className="space-y-3">
                  {activities.slice(0, 4).map((activity) => (
                    <ListItem key={activity.id} className="p-0">
                      <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                        <Box className="flex items-start">
                          <Box className="mr-3 mt-1">
                            {activity.type === "Campaign Update" ? (
                              <MdOutlineCampaign className="text-purple-500" />
                            ) : activity.type === "Task Completed" ? (
                              <FiCheckCircle className="text-green-500" />
                            ) : (
                              <FiActivity className="text-blue-500" />
                            )}
                          </Box>
                          <Box className="flex-1">
                            <Typography variant="subtitle2" className="font-medium">
                              {activity.title}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {activity.details}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500 mt-1">
                              {formatDate(activity.date)}
                            </Typography>
                          </Box>
                          <Button
                            variant="text"
                            size="small"
                            className="text-indigo-600 hover:bg-indigo-50"
                          >
                            View
                          </Button>
                        </Box>
                      </Paper>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Ongoing Campaigns
                  </Typography>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>Campaign</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Platform</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Budget</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ongoingCampaigns.map((campaign) => (
                          <TableRow key={campaign.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2" className="font-bold">
                                {campaign.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box className="flex flex-wrap gap-1">
                                {campaign.platform.map((platform, idx) => (
                                  <Chip
                                    key={idx}
                                    label={platform}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={campaign.status}
                                size="small"
                                sx={{
                                  backgroundColor: campaign.status === "Active" ? '#dcfce7' : '#fef3c7',
                                  color: campaign.status === "Active" ? '#166534' : '#92400e'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(campaign.startDate)}
                              </Typography>
                              <Typography variant="caption" className="text-gray-600">
                                to {formatDate(campaign.endDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" className="font-medium">
                                ${campaign.spent.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" className="text-gray-600">
                                of ${campaign.budget.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outlined"
                                size="small"
                                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                                endIcon={<FiChevronRight />}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Completed Campaigns
                  </Typography>
                  
                  <List className="space-y-3">
                    {completedCampaigns.map((campaign) => (
                      <ListItem key={campaign.id} className="p-0">
                        <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                          <Box className="flex justify-between items-start">
                            <Box>
                              <Typography variant="subtitle2" className="font-medium">
                                {campaign.name}
                              </Typography>
                              <Typography variant="caption" className="text-gray-600">
                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                              </Typography>
                            </Box>
                            <Chip
                              label={`ROI: ${campaign.roi}`}
                              size="small"
                              color="success"
                            />
                          </Box>
                          <Box className="mt-2">
                            <Typography variant="body2" className="text-gray-600">
                              <span className="font-medium">{campaign.conversions}</span> conversions
                            </Typography>
                            <Typography variant="caption" className="text-gray-600">
                              <span className="font-medium">${campaign.spent.toLocaleString()}</span> spent
                            </Typography>
                          </Box>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            className="mt-3 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                            endIcon={<FiChevronRight />}
                          >
                            View Details
                          </Button>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Assigned Tasks
                  </Typography>
                  
                  <List className="space-y-3">
                    {tasks.filter(t => t.status !== "Completed").map((task) => (
                      <ListItem key={task.id} className="p-0">
                        <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                          <Box className="flex justify-between items-start">
                            <Box>
                              <Typography variant="subtitle2" className="font-medium">
                                {task.title}
                              </Typography>
                              <Typography variant="caption" className="text-gray-600">
                                {task.campaign} • Due {formatDate(task.deadline)}
                              </Typography>
                            </Box>
                            <Box className="flex space-x-2">
                              {task.status === "Pending Review" ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                                  startIcon={<FiEye />}
                                >
                                  Review
                                </Button>
                              ) : (
                                <Button
                                  variant="contained"
                                  size="small"
                                  className="bg-green-600 hover:bg-green-700"
                                  startIcon={<FiCheck />}
                                >
                                  Complete
                                </Button>
                              )}
                            </Box>
                          </Box>
                          <Box className="mt-2 flex items-center">
                            <Chip
                              label={task.status}
                              size="small"
                              sx={{
                                backgroundColor: task.status === "In Progress" ? '#e0f2fe' : 
                                                task.status === "Pending Review" ? '#fef3c7' : '#dcfce7',
                                color: task.status === "In Progress" ? '#0369a1' : 
                                       task.status === "Pending Review" ? '#92400e' : '#166534'
                              }}
                            />
                            <Typography variant="caption" className="text-gray-600 ml-2">
                              {task.type}
                            </Typography>
                          </Box>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Completed Tasks
                  </Typography>
                  
                  <List className="space-y-3">
                    {tasks.filter(t => t.status === "Completed").map((task) => (
                      <ListItem key={task.id} className="p-0">
                        <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                          <Box className="flex justify-between items-start">
                            <Box>
                              <Typography variant="subtitle2" className="font-medium">
                                {task.title}
                              </Typography>
                              <Typography variant="caption" className="text-gray-600">
                                {task.campaign} • Completed {formatDate(task.deadline)}
                              </Typography>
                            </Box>
                            <Chip
                              label="Completed"
                              size="small"
                              color="success"
                              icon={<FiCheckCircle size={14} />}
                            />
                          </Box>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Core Skills
                  </Typography>
                  
                  <Box className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        sx={{
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          fontWeight: 'medium'
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Certifications
                  </Typography>
                  
                  <List className="space-y-3">
                    {certifications.map((cert, index) => (
                      <ListItem key={index} className="p-0">
                        <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                          <Box className="flex justify-between items-start">
                            <Box>
                              <Typography variant="subtitle2" className="font-medium">
                                {cert.name}
                              </Typography>
                              <Typography variant="caption" className="text-gray-600">
                                Issued by {cert.issuer} • {formatDate(cert.date)}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                              startIcon={<FiDownload />}
                            >
                              View
                            </Button>
                          </Box>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Recent Activity Timeline
              </Typography>
              
              <List className="space-y-4">
                {activities.map((activity) => (
                  <ListItem key={activity.id} className="p-0">
                    <Paper className="w-full p-4 rounded-lg hover:shadow-sm">
                      <Box className="flex items-start">
                        <Box className="mr-3 mt-1">
                          {activity.type === "Campaign Update" ? (
                            <MdOutlineCampaign className="text-purple-500" size={20} />
                          ) : activity.type === "Task Completed" ? (
                            <FiCheckCircle className="text-green-500" size={20} />
                          ) : (
                            <FiActivity className="text-blue-500" size={20} />
                          )}
                        </Box>
                        <Box className="flex-1">
                          <Box className="flex justify-between items-start">
                            <Typography variant="subtitle2" className="font-medium">
                              {activity.title}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                              {formatDate(activity.date)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" className="text-gray-600 mt-1">
                            {activity.details}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Peer Feedback
                  </Typography>
                  
                  <List className="space-y-3">
                    {feedbacks.map((feedback) => (
                      <ListItem key={feedback.id} className="p-0">
                        <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                          <Box className="flex items-start">
                            <Box className="mr-3 mt-1">
                              <FiUser className="text-indigo-500" />
                            </Box>
                            <Box className="flex-1">
                              <Typography variant="subtitle2" className="font-medium">
                                {feedback.from}
                              </Typography>
                              <Typography variant="body2" className="text-gray-600 mt-1">
                                "{feedback.message}"
                              </Typography>
                              <Typography variant="caption" className="text-gray-500 mt-1">
                                {formatDate(feedback.date)}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Recognitions
                  </Typography>
                  
                  <Box className="space-y-4">
                    <Paper className="p-4 rounded-lg hover:shadow-sm">
                      <Box className="flex items-center">
                        <Avatar sx={{ bgcolor: '#f59e0b', width: 40, height: 40, mr: 2 }}>
                          <FiAward size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" className="font-medium">
                            Top Marketer of the Month
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            February 2025 • For outstanding campaign performance
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                    
                    <Paper className="p-4 rounded-lg hover:shadow-sm">
                      <Box className="flex items-center">
                        <Avatar sx={{ bgcolor: '#94a3b8', width: 40, height: 40, mr: 2 }}>
                          <FiStar size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" className="font-medium">
                            Excellence in Lead Generation
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            January 2025 • Generated 20% more leads than target
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Profile Settings
                  </Typography>
                  
                  <Box className="space-y-4">
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
                          src={profileData.photoURL}
                          sx={{ width: 80, height: 80, margin: '0 auto' }}
                        />
                      </Badge>
                    </Box>
                    
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName || ""}
                      variant="outlined"
                      size="small"
                    />
                    
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName || ""}
                      variant="outlined"
                      size="small"
                    />
                    
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email || ""}
                      variant="outlined"
                      size="small"
                      disabled
                    />
                    
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone || ""}
                      variant="outlined"
                      size="small"
                      placeholder="Enter phone number"
                    />
                    
                    <Box className="flex justify-end mt-4">
                      <Button
                        variant="contained"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        startIcon={<FiCheck />}
                      >
                        Save Changes
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card className="shadow-lg rounded-xl border border-gray-200">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Notification Preferences
                  </Typography>
                  
                  <Box className="space-y-4">
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">Campaign Updates</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Receive notifications about campaign changes
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">Task Assignments</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Get notified when new tasks are assigned
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">Performance Reports</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Receive weekly performance summaries
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">Team Messages</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Notifications from team members
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex justify-end mt-4">
                      <Button
                        variant="contained"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        startIcon={<FiCheck />}
                      >
                        Save Preferences
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg rounded-xl border border-gray-200 mt-6">
                <CardContent className="p-6">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Change Password
                  </Typography>
                  
                  <Box className="space-y-4">
                    <TextField
                      fullWidth
                      label="Current Password"
                      type="password"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: <FiLock className="mr-2 text-gray-400" />
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: <FiLock className="mr-2 text-gray-400" />
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: <FiLock className="mr-2 text-gray-400" />
                      }}
                    />
                    
                    <Box className="flex justify-end mt-4">
                      <Button
                        variant="contained"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        startIcon={<FiCheck />}
                      >
                        Update Password
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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
                />
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
            
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={tempData.address || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              multiline
              rows={2}
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

export default MarketingProfile;