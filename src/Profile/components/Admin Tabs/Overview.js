import React, { useEffect, useState } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Divider, Chip, 
  List, ListItem, Paper, Button, Badge, IconButton, Tooltip,
  LinearProgress, Collapse, Switch, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  FiMail, FiPhone, FiUser, FiCalendar, FiUsers, FiShield, 
  FiCheckCircle, FiBarChart2, FiFileText, FiFolder, 
  FiMessageSquare, FiBell, FiXCircle, FiLock, FiActivity,
  FiRefreshCw, FiDownload, FiChevronDown, FiChevronUp, FiSearch, FiAlertCircle
} from 'react-icons/fi';
import { collection, query, getDocs, where } from "firebase/firestore";
import { auth, db } from "../../../services/firebase";
import { useNavigate } from 'react-router-dom';
import { uploadToCloudinary } from '../../../utils/cloudinaryUtils';

const OverviewTab = ({ 
  userData, performanceData, pendingApprovals,
  securityOpen, toggleSecuritySection, twoFactorEnabled, handleTwoFactorToggle,
  handleApprove, handleReject
}) => {
  const navigate = useNavigate();
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 10;

  const fetchRecentActivities = async () => {
    try {
      const activitiesQuery = query(
        collection(db, "admin-activities"),
        where("userId", "==", auth.currentUser.uid),
      );
      
      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString() || "Unknown"
      }));
      
      setRecentActivities(activities);
    } catch (error) {
      alert(error)
      console.error("Error fetching recent activities:", error);
    }
  };

  // Filter and sort activities
  useEffect(() => {
    let result = [...recentActivities];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(activity => 
        (activity.action || activity.activityType).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredActivities(result);
  }, [recentActivities, searchTerm, sortBy]);

  // Get current activities for pagination
  const getCurrentActivities = () => {
    const startIndex = (currentPage - 1) * activitiesPerPage;
    return filteredActivities.slice(startIndex, startIndex + activitiesPerPage);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);

  const formatActionName = (action) => {
    const actionsMap = {
      'password_change': 'Password Changed',
      'login': 'User Login',
      'logout': 'User Logout',
      'session_revoked': 'Session Revoked',
      'failed_login': 'Failed Login Attempt',
    };
    return actionsMap[action] || action.replace(/_/g, ' ');
  };
  
  const handleDownloadReport = async () => {
    try {
      setReportGenerating(true);
      
      // Generate report data
      const reportData = {
        user: userData,
        performance: performanceData,
        activities: recentActivities,
        generatedAt: new Date().toLocaleString()
      };
  
      // Basic PDF structure
      let pdfContent = `%PDF-1.1
%¥±ë

1 0 obj
<< /Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<< /Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<< /Type /Page
/Parent 2 0 R
/Resources << /Font << /F1 4 0 R >>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<< /Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<< /Length 6 0 R >>
stream
BT
/F1 12 Tf
72 720 Td
(Admin Dashboard Report) Tj
ET

BT
/F1 10 Tf
72 700 Td
(Generated on: ${reportData.generatedAt}) Tj
ET

BT
/F1 12 Tf
72 680 Td
(User Information) Tj
ET

BT
/F1 10 Tf
72 660 Td
(Email: ${reportData.user.email}) Tj
ET

BT
/F1 10 Tf
72 640 Td
(Employee ID: ${reportData.user.employeeId || "ADM-001"}) Tj
ET

BT
/F1 10 Tf
72 620 Td
(Department: ${reportData.user.department || "Management"}) Tj
ET

BT
/F1 12 Tf
72 580 Td
(Performance Metrics) Tj
ET

BT
/F1 10 Tf
72 560 Td
(Total Users: ${reportData.performance.totalUsers}) Tj
ET

BT
/F1 10 Tf
72 540 Td
(Active Projects: ${reportData.performance.activeProjects}) Tj
ET

BT
/F1 10 Tf
72 520 Td
(Monthly Revenue: ₹${reportData.performance.revenueThisMonth.toLocaleString()}) Tj
ET

BT
/F1 10 Tf
72 500 Td
(Potential Revenue: ₹${reportData.performance.potentialRevenue.toLocaleString()}) Tj
ET

BT
/F1 12 Tf
72 460 Td
(Recent Activities) Tj
ET
`;
  
      // Add activities to PDF
      reportData.activities.forEach((activity, index) => {
        const yPos = 440 - (index * 20);
        if (yPos > 50) { // Prevent going off the page
          pdfContent += `
BT
/F1 8 Tf
72 ${yPos} Td
(${activity.timestamp} - ${activity.userEmail || "System"}: ${activity.action ? formatActionName(activity.action) : activity.activityType}) Tj
ET
`;
        }
      });
  
      // Complete the PDF structure
      pdfContent += `
endstream
endobj

6 0 obj
${pdfContent.split('stream')[1].length - 1}
endobj

xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
0000000384 00000 n 
0000000397 00000 n 
trailer
<< /Size 7
/Root 1 0 R
>>
startxref
${pdfContent.length}
%%EOF
`;
  
      // Create download link
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const exportFileDefaultName = `admin-report-${new Date().toISOString().split('T')[0]}.pdf`;
  
      const linkElement = document.createElement('a');
      linkElement.href = url;
      linkElement.download = exportFileDefaultName;
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error generating PDF report:", error);
    } finally {
      setReportGenerating(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([
        fetchConversionRate(),
        fetchRecentActivities()
      ]);
    };
    
    fetchData();
  }, []);

  const fetchConversionRate = async () => {
    try {
      const leadsQuery = query(collection(db, "leads"));
      const leadsSnapshot = await getDocs(leadsQuery);
      
      let totalLeads = 0;
      let convertedCount = 0;

      leadsSnapshot.forEach(doc => {
        const lead = doc.data();
        totalLeads++;
        if (lead.status === "closed-won") {
          convertedCount++;
        }
      });

      const rate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;
      setConversionRate(rate);
    } catch (error) {
      console.error("Error fetching conversion rate:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = () => {
    navigate('/admin-dashboard', { 
      state: { 
        activeSection: 'Financial Management', 
        activeSubsection: 'Billing & Invoices' 
      } 
    });
  };

  const handleProjectClick = () => {
    navigate('/admin-dashboard', { 
      state: { 
        activeSection: 'Project Management', 
        activeSubsection: 'Ongoing Projects' 
      } 
    });
  };

  const handleAnalyticsClick = () => {
    navigate('/admin-dashboard', { 
      state: { 
        activeSection: 'Reports & Insights', 
        activeSubsection: 'Performance Metrics' 
      } 
    });
  };

  const handleManageUsersClick = () => {
    navigate('/admin-dashboard', { 
      state: { 
        activeSection: 'User & Client Management', 
        activeSubsection: 'Admin & Team Roles' 
      } 
    });
  };

  return (
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
                <Paper className="p-3 rounded-lg bg-amber-50">
                  <Typography variant="subtitle2" className="text-amber-600">
                    Revenue (Month)
                  </Typography>
                  <Typography variant="h4" className="font-bold text-amber-900">
                    ₹{performanceData.revenueThisMonth.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper className="p-3 rounded-lg bg-blue-50">
                  <Typography variant="subtitle2" className="text-blue-600">
                    Potential Revenue
                  </Typography>
                  <Typography variant="h4" className="font-bold text-blue-900">
                    ₹{performanceData.potentialRevenue.toLocaleString()}
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
                onClick={handleManageUsersClick}
              >
                Manage Users
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FiBarChart2 />}
                className="bg-blue-600 hover:bg-blue-700 shadow-md"
                size="large"
                onClick={handleAnalyticsClick}
              >
                Platform Analytics
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FiFileText />}
                className="bg-green-600 hover:bg-green-700 shadow-md"
                size="large"
                onClick={handleInvoiceClick}
              >
                Invoices & Billing
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FiFolder />}
                className="bg-purple-600 hover:bg-purple-700 shadow-md"
                size="large"
                onClick={handleProjectClick}
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
              {recentActivities.slice(0, 3).map((activity, index) => (
                <ListItem key={index} className="p-0">
                  <Box className="flex items-start w-full p-3 rounded-lg hover:bg-gray-50">
                    <Box className="mr-3 mt-1">
                      {activity.activityType === "security" ? (
                        <FiShield className="text-green-500" />
                      ) : activity.activityType === "user" ? (
                        <FiUsers className="text-indigo-500" />
                      ) : activity.activityType === "project" ? (
                        <FiFolder className="text-purple-500" />
                      ) : (
                        <FiBarChart2 className="text-blue-500" />
                      )}
                    </Box>
                    <Box className="flex-1">
                      <Typography variant="body2" className="font-medium">
                        {activity.action ? formatActionName(activity.action) : activity.activityType}
                      </Typography>
                      <Typography variant="caption" className="text-gray-600">
                        {activity.userEmail}
                      </Typography>
                      <Typography variant="caption" className="block text-gray-500">
                        {activity.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>

            {recentActivities.length > 3 && (
              <Button
                fullWidth
                variant="text"
                endIcon={<FiChevronDown />}
                onClick={() => setShowAllActivities(true)}
                className="text-indigo-600 hover:text-indigo-800 mt-2"
              >
                View All Activities
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Right Column */}
      <Grid item xs={12} md={3}>
        {/* Security Settings */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
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
                value={conversionRate}
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
                {conversionRate.toFixed(1)}% team-wide
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
                onClick={handleDownloadReport}
                disabled={reportGenerating}
              >
                {reportGenerating ? 'Generating...' : 'Download Report'}
              </Button>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" className="text-gray-600 mb-2">
                Revenue Summary
              </Typography>
              <Box className="flex justify-between mb-1">
                <Typography variant="caption">This Month</Typography>
                <Typography variant="caption" className="font-medium">
                  ₹{performanceData.revenueThisMonth.toLocaleString()}
                </Typography>
              </Box>
              <Box className="flex justify-between">
                <Typography variant="caption">Potential</Typography>
                <Typography variant="caption" className="font-medium">
                  ₹{performanceData.potentialRevenue.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* All Activities Modal */}
      <Dialog
        open={showAllActivities}
        onClose={() => setShowAllActivities(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', minHeight: '70vh' } }}
      >
        <DialogTitle className="font-bold bg-gray-50 border-b flex justify-between items-center">
          <Box className="flex items-center">
            <FiActivity className="mr-2 text-indigo-600" />
            All Activities
          </Box>
          <IconButton onClick={() => setShowAllActivities(false)}>
            <FiXCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent className="py-4">
          <Box className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: '100%', maxWidth: '400px' }}
            />
            
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <List className="divide-y">
            {getCurrentActivities().map((activity, index) => (
              <ListItem key={index} className="py-3 px-0">
                <Box className="flex items-start w-full">
                  <Box className="mr-3 mt-1">
                    {activity.activityType === "security" ? (
                      <FiShield className="text-green-500" />
                    ) : activity.activityType === "user" ? (
                      <FiUsers className="text-indigo-500" />
                    ) : activity.activityType === "project" ? (
                      <FiFolder className="text-purple-500" />
                    ) : (
                      <FiBarChart2 className="text-blue-500" />
                    )}
                  </Box>
                  <Box className="flex-1">
                    <Typography variant="body2" className="font-medium">
                      {activity.action ? formatActionName(activity.action) : activity.activityType}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      {activity.userEmail}
                    </Typography>
                    <Typography variant="caption" className="block text-gray-500">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
          
          {filteredActivities.length === 0 && (
            <Box className="flex flex-col items-center justify-center py-8">
              <FiAlertCircle className="text-gray-400 text-4xl mb-2" />
              <Typography variant="body2" className="text-gray-500">
                No activities found matching your criteria
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="border-t px-6 py-4 flex justify-between">
          <Typography variant="body2" className="text-gray-600">
            Showing {Math.min((currentPage - 1) * activitiesPerPage + 1, filteredActivities.length)}-
            {Math.min(currentPage * activitiesPerPage, filteredActivities.length)} of {filteredActivities.length} activities
          </Typography>
          <Box className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outlined"
              size="small"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              variant="outlined"
              size="small"
            >
              Next
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default OverviewTab;