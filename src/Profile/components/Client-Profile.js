import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Button, Card, CardContent,
  Grid, Divider, Chip, List, ListItem, ListItemText,
  ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Tabs, Tab,
  Badge, IconButton, Collapse, LinearProgress, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Switch,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, 
} from '@mui/material';
import {
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar,
  FiUsers, FiBarChart2, FiFileText, FiFolder,
  FiShield, FiMessageSquare, FiBell, FiCheckCircle,
  FiXCircle, FiChevronDown, FiChevronUp, FiLock,
  FiActivity, FiRefreshCw, FiDownload, FiSettings,
  FiPlus, FiTrendingUp, FiPieChart, FiAward, FiHome,
  FiStar, FiClock, FiCheck, FiX, FiUpload, FiEye,
  FiDollarSign, FiCreditCard, FiCheckSquare, FiMessageCircle,
  FiFile, FiDownloadCloud, FiShare2, FiClock as FiClockIcon,
  FiCalendar as FiCalendarIcon, FiClipboard, FiThumbsUp,
  FiThumbsDown, FiPaperclip, FiBookmark, FiSettings as FiSettingsIcon,
  FiChevronRight, FiSearch, FiPrinter, FiAlertCircle
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';

// Import tab components
import OverviewTab from './Client tabs/Overview';
import ProjectsTab from './Client tabs/Projects';
import FinancialTab from './Client tabs/Financials';
import TasksTab from './Client tabs/Tasks';
import CommunicationTab from './Client tabs/Communications';
import ResourcesTab from './Client tabs/Resources';
import SettingsTab from './Client tabs/Settings';

const ClientProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tempData, setTempData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [resources, setResources] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState(null);

  // Fetch transactions when financial tab is active
  useEffect(() => {
    if (activeTab === 'financial') {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      setTransactionError(null);
      
      const user = auth.currentUser;
      if (!user) return;

      const transactionsQuery = query(
        collection(db, "platform-transactions"),
        where("clientId", "==", user.uid),
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM yyyy') : 'N/A',
        transactionNumber: `TXN-${doc.id.slice(0, 8).toUpperCase()}`
      }));

      setTransactions(transactionsData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactionError("Failed to load transactions. Please try again.");
      alert(err)
    } finally {
      setLoadingTransactions(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#10B98110', color: '#10B981', icon: <FiCheckCircle /> };
      case 'pending':
        return { bg: '#F59E0B10', color: '#F59E0B', icon: <FiClock /> };
      case 'failed':
        return { bg: '#EF444410', color: '#EF4444', icon: <FiAlertCircle /> };
      default:
        return { bg: '#64748B10', color: '#64748B', icon: <FiFileText /> };
    }
  };

  const handleDownloadReceipt = (transaction) => {
    // Implement receipt download functionality
    // Similar to the Receipts.js component
  };

  const handlePrintReceipt = (transaction) => {
    // Implement receipt print functionality
    // Similar to the Receipts.js component
  };

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

      // Fetch projects for this client
      const projectsQuery = query(
        collection(db, "dxd-magnate-projects"),
        where("clientId", "==", auth.currentUser.uid)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);

      // Mock invoices data
      const mockInvoices = [
        { id: 1, number: "INV-2023-001", project: "Website Redesign", date: "2023-05-15", dueDate: "2023-06-15", amount: 2500, status: "Paid" },
        { id: 2, number: "INV-2023-002", project: "Mobile App Development", date: "2023-06-01", dueDate: "2023-07-01", amount: 4500, status: "Pending" },
        { id: 3, number: "INV-2023-003", project: "SEO Optimization", date: "2023-06-15", dueDate: "2023-07-15", amount: 1200, status: "Pending" }
      ];
      setInvoices(mockInvoices);

      // Mock tasks data
      const mockTasks = [
        { id: 1, title: "Approve Wireframe Design", project: "Website Redesign", dueDate: "2023-06-10", status: "Pending", type: "Approval" },
        { id: 2, title: "Provide Content for Homepage", project: "Website Redesign", dueDate: "2023-06-05", status: "Overdue", type: "Content" },
        { id: 3, title: "Review Final Design", project: "Mobile App Development", dueDate: "2023-06-20", status: "Pending", type: "Review" },
        { id: 4, title: "Approve Brand Guidelines", project: "SEO Optimization", dueDate: "2023-05-25", status: "Completed", type: "Approval" }
      ];
      setTasks(mockTasks);

      // Mock communications data
      const mockCommunications = [
        { id: 1, type: "Email", subject: "Project Update - Website Redesign", date: "2023-06-01", summary: "Sent latest design mockups for review" },
        { id: 2, type: "Meeting", subject: "Kickoff Call - Mobile App", date: "2023-05-28", summary: "Discussed project timeline and deliverables" },
        { id: 3, type: "Message", subject: "Question about invoice", date: "2023-05-20", summary: "Client had questions about payment terms" }
      ];
      setCommunications(mockCommunications);

      // Mock resources data
      const mockResources = [
        { id: 1, name: "Brand Guidelines.pdf", type: "Document", date: "2023-05-10", size: "2.4 MB" },
        { id: 2, name: "Design Mockups.zip", type: "Archive", date: "2023-06-01", size: "15.2 MB" },
        { id: 3, name: "Contract Agreement.docx", type: "Document", date: "2023-05-05", size: "1.1 MB" }
      ];
      setResources(mockResources);

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
              {profileData.company || "Client"}
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" value="overview" icon={<FiHome size={18} />} iconPosition="start" />
          <Tab label="Projects" value="projects" icon={<FiFolder size={18} />} iconPosition="start" />
          <Tab label="Financial" value="financial" icon={<FiDollarSign size={18} />} iconPosition="start" />
          <Tab label="Resources" value="resources" icon={<FiFile size={18} />} iconPosition="start" />
          <Tab label="Settings" value="settings" icon={<FiSettings size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <OverviewTab 
            profileData={profileData}
            projects={projects}
            communications={communications}
            formatDate={formatDate}
          />
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <ProjectsTab 
            projects={projects}
            formatDate={formatDate}
          />
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <FinancialTab
            transactions={transactions}
            loadingTransactions={loadingTransactions}
            transactionError={transactionError}
            fetchTransactions={fetchTransactions}
            getStatusColor={getStatusColor}
            handleDownloadReceipt={handleDownloadReceipt}
            handlePrintReceipt={handlePrintReceipt}
          />
        )}


        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <ResourcesTab 
            resources={resources}
            formatDate={formatDate}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsTab 
            profileData={profileData}
          />
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
              label="Company"
              name="company"
              value={tempData.company || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
            
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

export default ClientProfile;