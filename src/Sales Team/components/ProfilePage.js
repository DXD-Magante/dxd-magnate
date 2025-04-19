import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Avatar, Button, Chip, Divider, 
  Card, CardContent, Grid, LinearProgress, Badge,
  List, ListItem, ListItemText, ListItemAvatar,
  Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert
} from "@mui/material";
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiPlus, FiFileText,
  FiClock, FiCheckCircle, FiXCircle, FiChevronRight,
  FiBarChart2, FiHome, FiBriefcase, FiUsers
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";



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

        // Fetch recent activities (simplified for example)
        const activities = [];
        leadsSnapshot.forEach(doc => {
          const lead = doc.data();
          if (lead.createdAt) {
            activities.push({
              id: doc.id,
              type: "Added new lead",
              name: lead.company || lead.fullName || "Unknown",
              date: lead.createdAt.toDate().toLocaleString()
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

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <Typography>Loading profile...</Typography>
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

  const progressValue = (performanceData.monthlyAchieved / performanceData.monthlyTarget) * 100;

  return (
    <Box className="p-6 max-w-6xl mx-auto">
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
              className="shadow-md"
            />
          </Badge>
          <Box>
            <Typography variant="h4" className="font-bold">
              {userData.firstName} {userData.lastName}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600">
              {userData.designation || "Sales Executive"}
            </Typography>
            <Chip
              label="Active"
              color="success"
              size="small"
              className="mt-1"
              icon={<FiCheckCircle size={14} />}
            />
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FiEdit2 />}
          onClick={handleEditOpen}
          className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
        >
          Edit Profile
        </Button>
      </Box>

      {/* Basic Info Section */}
      <Card className="mb-8 shadow-sm rounded-xl">
        <CardContent>
          <Typography variant="h6" className="font-bold mb-4 flex items-center">
            <FiUser className="mr-2" /> Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <div className="flex items-center mb-3">
                <FiMail className="text-gray-500 mr-2" />
                <Typography>
                  <span className="text-gray-600">Email:</span> {userData.email}
                </Typography>
              </div>
              <div className="flex items-center mb-3">
                <FiPhone className="text-gray-500 mr-2" />
                <Typography>
                  <span className="text-gray-600">Phone:</span> {userData.phone || "Not provided"}
                </Typography>
              </div>
              <div className="flex items-center">
                <FiBriefcase className="text-gray-500 mr-2" />
                <Typography>
                  <span className="text-gray-600">Employee ID:</span> {userData.employeeId || "N/A"}
                </Typography>
              </div>
            </Grid>
            <Grid item xs={12} md={6}>
              <div className="flex items-center mb-3">
                <FiCalendar className="text-gray-500 mr-2" />
                <Typography>
                  <span className="text-gray-600">Date Joined:</span> {userData.joinDate || "N/A"}
                </Typography>
              </div>
              <div className="flex items-center mb-3">
                <FiHome className="text-gray-500 mr-2" />
                <Typography>
                  <span className="text-gray-600">Location:</span> {userData.location || "N/A"}
                </Typography>
              </div>
              <div className="flex items-center">
                <FiUsers className="text-gray-500 mr-2" />
                <Typography>
                  <span className="text-gray-600">Reporting Manager:</span> {userData.manager || "N/A"}
                </Typography>
              </div>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card className="mb-8 shadow-sm rounded-xl">
        <CardContent>
          <Typography variant="h6" className="font-bold mb-4 flex items-center">
            <FiTrendingUp className="mr-2" /> Performance Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <div className="grid grid-cols-2 gap-4">
                <Paper className="p-4 rounded-lg shadow-sm">
                  <Typography variant="subtitle2" className="text-gray-600">
                    Total Leads
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {performanceData.totalLeads}
                  </Typography>
                </Paper>
                <Paper className="p-4 rounded-lg shadow-sm">
                  <Typography variant="subtitle2" className="text-gray-600">
                    Converted Leads
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {performanceData.convertedLeads}
                  </Typography>
                </Paper>
                <Paper className="p-4 rounded-lg shadow-sm">
                  <Typography variant="subtitle2" className="text-gray-600">
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {performanceData.conversionRate.toFixed(1)}%
                  </Typography>
                </Paper>
                <Paper className="p-4 rounded-lg shadow-sm">
                  <Typography variant="subtitle2" className="text-gray-600">
                    Monthly Target
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    ₹{performanceData.monthlyTarget.toLocaleString()}
                  </Typography>
                </Paper>
              </div>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper className="p-4 rounded-lg shadow-sm h-full">
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Monthly Progress
                </Typography>
                <Typography variant="h5" className="font-bold mb-2">
                  ₹{performanceData.monthlyAchieved.toLocaleString()} / ₹{performanceData.monthlyTarget.toLocaleString()}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e7ff',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: progressValue > 75 ? '#10b981' : progressValue > 50 ? '#f59e0b' : '#ef4444',
                      borderRadius: 5
                    }
                  }}
                />
                <Typography variant="caption" className="text-gray-500 mt-2 block text-right">
                  {progressValue.toFixed(1)}% achieved
                </Typography>

                <Divider className="my-4" />

                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Lead Status
                </Typography>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    <Typography variant="caption">
                      New: {performanceData.leadStatus.new}
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                    <Typography variant="caption">
                      Contacted: {performanceData.leadStatus.contacted}
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    <Typography variant="caption">
                      Proposal Sent: {performanceData.leadStatus.proposalSent}
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                    <Typography variant="caption">
                      Negotiation: {performanceData.leadStatus.negotiation}
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <Typography variant="caption">
                      Closed Won: {performanceData.leadStatus.closedWon}
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                    <Typography variant="caption">
                      Closed Lost: {performanceData.leadStatus.closedLost}
                    </Typography>
                  </div>
                </div>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Activity Timeline and Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card className="shadow-sm rounded-xl h-full">
            <CardContent>
              <Typography variant="h6" className="font-bold mb-4 flex items-center">
                <FiClock className="mr-2" /> Recent Activities
              </Typography>
              {recentActivities.length > 0 ? (
                <List className="divide-y">
                  {recentActivities.map((activity, index) => (
                    <ListItem key={index} className="hover:bg-gray-50">
                      <ListItemAvatar>
                        <Avatar className="bg-indigo-100 text-indigo-600">
                          {activity.type === "Added new lead" ? (
                            <FiUser size={18} />
                          ) : activity.type === "Sent Proposal" ? (
                            <FiFileText size={18} />
                          ) : (
                            <FiCheckCircle size={18} />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.type}
                        secondary={`${activity.name} • ${activity.date}`}
                      />
                      <IconButton edge="end" size="small">
                        <FiChevronRight />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography className="text-gray-500 text-center py-4">
                  No recent activities found
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="shadow-sm rounded-xl h-full">
            <CardContent>
              <Typography variant="h6" className="font-bold mb-4 flex items-center">
                <FiBarChart2 className="mr-2" /> Quick Actions
              </Typography>
              <div className="space-y-3">
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FiPlus />}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Add New Lead
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FiFileText />}
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  View Sent Proposals
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FiCalendar />}
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  Schedule a Meeting
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FiTrendingUp />}
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  View Performance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold">Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} className="mt-2">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={tempData.firstName || ""}
                onChange={handleInputChange}
                variant="outlined"
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
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Designation"
                name="designation"
                value={tempData.designation || ""}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={tempData.location || ""}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} className="text-gray-600">
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
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesProfilePage;