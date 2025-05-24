import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Avatar, Button, Chip, Divider, 
  Card, CardContent, Grid, LinearProgress, Badge,
  List, ListItem, ListItemText, ListItemAvatar,
  Paper, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Tooltip,
  Tabs, Tab, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem, Switch
} from "@mui/material";
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar, 
  FiDollarSign, FiTrendingUp, FiPlus, FiFileText,
  FiClock, FiCheckCircle, FiXCircle, FiChevronRight,
  FiBarChart2, FiHome, FiBriefcase, FiUsers, FiPieChart,
  FiTarget, FiAward, FiActivity, FiRefreshCw, FiSettings,
  FiMessageSquare, FiStar, FiDownload, FiUpload, FiShare2,
  FiFilter, FiChevronDown, FiChevronUp, FiBell, FiLock,
  FiCreditCard, FiDatabase, FiShield, FiGlobe, FiTag
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import SettingsTab from "./Sales Tabs/Settings";
import LeadsTab from "./Sales Tabs/Lead";
import PerformanceTab from "./Sales Tabs/Performance";
import OverviewTab from "./Sales Tabs/Overview";

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
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    weeklyReport: true,
    dealUpdates: true
  });

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

  useEffect(() => {
    if (activeTab === 1) { // Leads tab
      fetchLeads();
    }
  }, [activeTab]);

  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const leadsQuery = query(
        collection(db, "leads"),
        where("assignedTo", "==", user.uid)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      
      const leadsData = leadsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      // Sort leads
      const sortedLeads = [...leadsData].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });

      setLeads(sortedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setSnackbarMessage("Failed to load leads");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLeadsLoading(false);
    }
  };

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

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
    fetchLeads(); // Re-fetch leads with new sort config
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
                label={`Rank #${userData.rank}`}
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
            label="Settings" 
            icon={<FiSettings className="mr-1" />} 
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
        />
      )}

      {activeTab === 1 && (
        <PerformanceTab 
          performanceData={performanceData} 
          progressValue={progressValue} 
          targetCompletion={targetCompletion} 
        />
      )}

{activeTab === 2 && (
        <LeadsTab 
          performanceData={performanceData} 
          leads={leads} 
          leadsLoading={leadsLoading} 
          sortConfig={sortConfig} 
          handleSort={handleSort} 
        />
      )}
          {activeTab === 3 && (
  <SettingsTab 
    userData={userData}
    notificationSettings={notificationSettings}
    handleNotificationChange={handleNotificationChange}
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