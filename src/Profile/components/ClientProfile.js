import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, Button, Card, CardContent,
  Grid, Divider, Chip, List, ListItem, ListItemText,
  ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Tabs, Tab,
  Badge, IconButton, Collapse, LinearProgress, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Switch,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
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
  FiChevronRight, FiSearch,FiPrinter
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';

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

  // Mock data - in a real app, this would come from your database
  const stats = [
    { title: "Active Projects", value: 3, icon: <FiFolder size={24} />, change: "+1 this month" },
    { title: "Pending Invoices", value: "$4,500", icon: <FiDollarSign size={24} />, change: "2 invoices" },
    { title: "Tasks Pending", value: 2, icon: <FiCheckSquare size={24} />, change: "1 overdue" },
    { title: "Overall Progress", value: "75%", icon: <FiTrendingUp size={24} />, change: "5% increase" }
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
            variant="outlined"
            startIcon={<FiMessageCircle />}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Send Message
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiCalendar />}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Schedule Meeting
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" value="overview" icon={<FiHome size={18} />} iconPosition="start" />
          <Tab label="Projects" value="projects" icon={<FiFolder size={18} />} iconPosition="start" />
          <Tab label="Financial" value="financial" icon={<FiDollarSign size={18} />} iconPosition="start" />
          <Tab label="Tasks" value="tasks" icon={<FiCheckSquare size={18} />} iconPosition="start" />
          <Tab label="Communication" value="communication" icon={<FiMessageSquare size={18} />} iconPosition="start" />
          <Tab label="Resources" value="resources" icon={<FiFile size={18} />} iconPosition="start" />
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
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        {stat.icon}
                      </div>
                    </div>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Recent Projects */}
            <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
              <CardContent className="p-6">
                <Box className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-bold text-gray-800">
                    Recent Projects
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    className="text-indigo-600 hover:bg-indigo-50"
                  >
                    View All
                  </Button>
                </Box>
                
                <Grid container spacing={3}>
                  {projects.slice(0, 3).map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                      <Paper className="p-4 rounded-lg hover:shadow-md transition-shadow h-full">
                        <Box className="flex justify-between items-start mb-3">
                          <Typography variant="subtitle1" className="font-bold">
                            {project.title}
                          </Typography>
                          <Chip
                            label={project.status}
                            size="small"
                            sx={{
                              backgroundColor: project.status === "In Progress" ? '#e0f2fe' : 
                                              project.status === "On Hold" ? '#fef3c7' : '#dcfce7',
                              color: project.status === "In Progress" ? '#0369a1' : 
                                     project.status === "On Hold" ? '#92400e' : '#166534'
                            }}
                          />
                        </Box>
                        <Typography variant="body2" className="text-gray-600 mb-3">
                          {project.description?.substring(0, 100)}...
                        </Typography>
                        <Box className="mb-3">
                          <Typography variant="caption" className="text-gray-500">
                            Project Manager
                          </Typography>
                          <Typography variant="body2">
                            {project.projectManager || "Not assigned"}
                          </Typography>
                        </Box>
                        <Box className="mb-3">
                          <Typography variant="caption" className="text-gray-500">
                            Timeline
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(project.startDate)} - {formatDate(project.endDate)}
                          </Typography>
                        </Box>
                        <Box className="flex items-center justify-between">
                          <Box className="w-full mr-2">
                            <LinearProgress
                              variant="determinate"
                              value={project.progress || 0}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  backgroundColor: '#4f46e5'
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="caption">
                            {project.progress || 0}%
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
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-lg rounded-xl border border-gray-200">
              <CardContent className="p-6">
                <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                  Recent Activity
                </Typography>
                
                <List className="space-y-3">
                  {communications.slice(0, 4).map((activity) => (
                    <ListItem key={activity.id} className="p-0">
                      <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                        <Box className="flex items-start">
                          <Box className="mr-3 mt-1">
                            {activity.type === "Email" ? (
                              <FiMail className="text-blue-500" />
                            ) : activity.type === "Meeting" ? (
                              <FiUsers className="text-purple-500" />
                            ) : (
                              <FiMessageSquare className="text-green-500" />
                            )}
                          </Box>
                          <Box className="flex-1">
                            <Typography variant="subtitle2" className="font-medium">
                              {activity.subject}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {activity.summary}
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

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  All Projects
                </Typography>
                <Box className="flex space-x-2">
                  <TextField
                    size="small"
                    placeholder="Search projects..."
                    InputProps={{
                      startAdornment: <FiSearch className="mr-2 text-gray-400" />
                    }}
                    sx={{ width: 200 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Filter
                  </Button>
                </Box>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Project Manager</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-bold">
                            {project.title}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            {project.clientName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.status}
                            size="small"
                            sx={{
                              backgroundColor: project.status === "In Progress" ? '#e0f2fe' : 
                                              project.status === "On Hold" ? '#fef3c7' : '#dcfce7',
                              color: project.status === "In Progress" ? '#0369a1' : 
                                     project.status === "On Hold" ? '#92400e' : '#166534'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box className="flex items-center">
                            <LinearProgress
                              variant="determinate"
                              value={project.progress || 0}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                width: '80%',
                                mr: 1,
                                backgroundColor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  backgroundColor: '#4f46e5'
                                }
                              }}
                            />
                            <Typography variant="caption">
                              {project.progress || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(project.startDate)}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            to {formatDate(project.endDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {project.projectManager || "Not assigned"}
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
        )}

        {/* Financial Tab */}
        {activeTab === 'financial' && (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
          <CardContent className="p-6">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold text-gray-800">
                Transaction History
              </Typography>
              <Button
                variant="text"
                size="small"
                className="text-indigo-600 hover:bg-indigo-50"
                onClick={fetchTransactions}
                startIcon={<FiRefreshCw size={16} />}
              >
                Refresh
              </Button>
            </Box>
            
            {loadingTransactions ? (
              <Box className="flex flex-col items-center justify-center py-8">
                <CircularProgress />
                <Typography variant="body2" className="text-gray-600 mt-2">
                  Loading transactions...
                </Typography>
              </Box>
            ) : transactionError ? (
              <Alert severity="error" className="mb-4">
                {transactionError}
              </Alert>
            ) : transactions.length === 0 ? (
              <Box className="flex flex-col items-center justify-center py-8">
                <FiFileText size={48} className="text-gray-400 mb-4" />
                <Typography variant="h6" className="font-bold text-gray-800 mb-2">
                  No Transactions Found
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  You don't have any transactions yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Transaction #</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const status = getStatusColor(transaction.status);
                      
                      return (
                        <TableRow key={transaction.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {transaction.transactionNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transaction.projectTitle || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box className="flex items-center">
                              <FiCalendar className="mr-2 text-gray-400" />
                              <Typography variant="body2">
                                {transaction.formattedDate}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box className="flex items-center">
                              <FiDollarSign className="mr-2 text-gray-400" />
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                ₹{transaction.amount?.toLocaleString() || '0'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.status.toUpperCase()} 
                              size="small"
                              sx={{ 
                                backgroundColor: status.bg,
                                color: status.color,
                                fontWeight: 'medium'
                              }}
                              icon={status.icon}
                            />
                          </TableCell>
                          <TableCell>
                            <Box className="flex space-x-2">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadReceipt(transaction)}
                                className="text-indigo-600 hover:bg-indigo-50"
                              >
                                <FiDownload size={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handlePrintReceipt(transaction)}
                                className="text-indigo-600 hover:bg-indigo-50"
                              >
                                <FiPrinter size={16} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Financial Summary
            </Typography>
            
            <Box className="space-y-4">
              <Paper className="p-4 rounded-lg">
                <Typography variant="subtitle2" className="text-gray-600 mb-1">
                  TOTAL TRANSACTIONS
                </Typography>
                <Box className="flex justify-between items-center">
                  <Typography variant="h4" className="font-bold">
                    {transactions.length}
                  </Typography>
                  <Avatar sx={{ bgcolor: '#4f46e510' }}>
                    <FiFileText size={20} color="#4f46e5" />
                  </Avatar>
                </Box>
              </Paper>
              
              <Paper className="p-4 rounded-lg">
                <Typography variant="subtitle2" className="text-gray-600 mb-1">
                  TOTAL AMOUNT
                </Typography>
                <Box className="flex justify-between items-center">
                  <Typography variant="h4" className="font-bold text-green-600">
                    ₹{transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0).toLocaleString()}
                  </Typography>
                  <Avatar sx={{ bgcolor: '#10b98110' }}>
                    <FiDollarSign size={20} color="#10b981" />
                  </Avatar>
                </Box>
              </Paper>
              
            </Box>
            
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
                    Pending Tasks
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
                                {task.project} • Due {formatDate(task.dueDate)}
                              </Typography>
                            </Box>
                            <Box className="flex space-x-2">
                              <Button
                                variant="contained"
                                size="small"
                                className="bg-green-600 hover:bg-green-700"
                                startIcon={<FiCheck />}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                className="hover:bg-red-50"
                                startIcon={<FiX />}
                              >
                                Reject
                              </Button>
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
                                {task.project} • Completed {formatDate(task.dueDate)}
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

        {/* Communication Tab */}
        {activeTab === 'communication' && (
          <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                All Communications
              </Typography>
              
              <Box className="flex space-x-2 mb-4">
                <Button variant={activeTab === 'all' ? "contained" : "outlined"} size="small">All</Button>
                <Button variant="outlined" size="small" startIcon={<FiMail />}>Emails</Button>
                <Button variant="outlined" size="small" startIcon={<FiMessageSquare />}>Messages</Button>
                <Button variant="outlined" size="small" startIcon={<FiUsers />}>Meetings</Button>
              </Box>
              
              <List className="space-y-3">
                {communications.map((comm) => (
                  <ListItem key={comm.id} className="p-0">
                    <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                      <Box className="flex items-start">
                        <Box className="mr-3 mt-1">
                          {comm.type === "Email" ? (
                            <FiMail className="text-blue-500" />
                          ) : comm.type === "Meeting" ? (
                            <FiUsers className="text-purple-500" />
                          ) : (
                            <FiMessageSquare className="text-green-500" />
                          )}
                        </Box>
                        <Box className="flex-1">
                          <Typography variant="subtitle2" className="font-medium">
                            {comm.subject}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600">
                            {comm.summary}
                          </Typography>
                          <Typography variant="caption" className="text-gray-500 mt-1">
                            {formatDate(comm.date)}
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
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Shared Resources
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Uploaded On</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resources.map((resource) => (
                      <TableRow key={resource.id} hover>
                        <TableCell>
                          <Box className="flex items-center">
                            <FiFile className="mr-2 text-gray-500" />
                            <Typography variant="body2">
                              {resource.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={resource.type}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(resource.date)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {resource.size}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                            startIcon={<FiDownload />}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
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
                      label="Company"
                      value={profileData.company || ""}
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
                        <Typography variant="subtitle2">Email Notifications</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Receive important updates via email
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">Project Updates</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Get notified about project progress
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">Invoice Reminders</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Receive payment reminders
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">Task Assignments</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Notify when new tasks are assigned
                        </Typography>
                      </Box>
                      <Switch defaultChecked color="primary" />
                    </Box>
                    
                    <Box className="flex items-center justify-between">
                      <Box>
                        <Typography variant="subtitle2">SMS Notifications</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Receive urgent alerts via SMS
                        </Typography>
                      </Box>
                      <Switch color="primary" />
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