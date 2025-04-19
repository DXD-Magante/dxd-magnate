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
  FiStar, FiClock, FiCheck, FiX, FiUpload, FiEye
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

const ProjectManagerProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
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
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activities, setActivities] = useState([]);

  // Mock data - in a real app, this would come from your database
  const stats = [
    { title: "Total Projects Managed", value: 12, icon: <FiFolder size={24} /> },
    { title: "Milestones Completed", value: 45, icon: <FiCheckCircle size={24} /> },
    { title: "Current Team Size", value: 20, icon: <FiUsers size={24} /> },
    { title: "Completion Rate", value: "92%", icon: <FiTrendingUp size={24} /> }
  ];

  const skills = [
    "Agile/Scrum Methodology", "Risk Management", "Resource Allocation", 
    "Client Communication", "Budget Planning", "Team Leadership"
  ];

  const feedback = [
    {
      quote: "John ensured timely delivery and excellent communication throughout the project.",
      client: "TechCorp Inc.",
      date: "Feb 15, 2025"
    },
    {
      quote: "Exceptional project management skills that kept everything on track despite challenges.",
      client: "Innovate Solutions",
      date: "Jan 10, 2025"
    }
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
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

        // Fetch projects managed by this project manager
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", auth.currentUser.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Fetch team members (mock data in this example)
        const mockTeamMembers = [
          { id: 1, name: "Jane Smith", role: "UI/UX Designer", status: "Active", workload: 80 },
          { id: 2, name: "Michael Johnson", role: "Frontend Developer", status: "Active", workload: 65 },
          { id: 3, name: "Sarah Williams", role: "Backend Developer", status: "Active", workload: 90 },
          { id: 4, name: "David Brown", role: "QA Engineer", status: "On Leave", workload: 0 }
        ];
        setTeamMembers(mockTeamMembers);

        // Fetch activities (mock data in this example)
        const mockActivities = [
          { id: 1, type: "Completed Milestone", description: "Prototype Finalization", date: "Feb 10, 2025", project: "Website Redesign" },
          { id: 2, type: "Updated Status", description: "Marked Project X as Completed", date: "Feb 5, 2025", project: "Mobile App" },
          { id: 3, type: "Assigned Task", description: "UI Revamp for Project Y", date: "Feb 3, 2025", project: "Dashboard UI" },
          { id: 4, type: "Team Meeting", description: "Sprint Planning Session", date: "Jan 28, 2025", project: "All Projects" }
        ];
        setActivities(mockActivities);

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

  const toggleSecuritySection = () => {
    setSecurityOpen(!securityOpen);
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    setSnackbarMessage(`Two-factor authentication ${!twoFactorEnabled ? "enabled" : "disabled"}`);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
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
            <Box className="flex items-center space-x-2 mt-1">
              <Typography variant="subtitle1" className="text-gray-600">
                Project Manager
              </Typography>
              <Chip
                label="Active"
                color="success"
                size="small"
                icon={<FiCheckCircle size={14} />}
                className="text-xs"
              />
            </Box>
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
                </div>
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  {stat.icon}
                </div>
              </div>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Current Projects */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Current Projects
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FiPlus />}
                  size="small"
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  New Project
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.filter(p => p.status !== "Completed").map((project) => (
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
                            {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            to {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                              <Avatar 
                                key={i}
                                sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                                className="border-2 border-white"
                              >
                                {i === 1 ? 'JS' : i === 2 ? 'MJ' : 'SW'}
                              </Avatar>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <FiEye className="text-gray-600" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Team Management */}
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Team Management
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<FiPlus />}
                  size="small"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Member
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {teamMembers.map((member) => (
                  <Grid item xs={12} sm={6} key={member.id}>
                    <Paper className="p-4 rounded-lg hover:shadow-md transition-shadow">
                      <Box className="flex items-start space-x-3">
                        <Avatar
                          sx={{ width: 48, height: 48 }}
                          className="bg-indigo-100 text-indigo-600"
                        >
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box className="flex-1">
                          <Typography variant="subtitle1" className="font-bold">
                            {member.name}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600 mb-2">
                            {member.role}
                          </Typography>
                          <Box className="flex items-center justify-between">
                            <Chip
                              label={member.status}
                              size="small"
                              color={member.status === "Active" ? "success" : "warning"}
                            />
                            <Box className="text-right">
                              <Typography variant="caption" className="text-gray-600">
                                Workload
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={member.workload}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  width: '80px',
                                  backgroundColor: '#e2e8f0',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    backgroundColor: member.workload > 85 ? '#ef4444' : 
                                                    member.workload > 60 ? '#f59e0b' : '#10b981'
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      <Box className="flex justify-end space-x-2 mt-3">
                        <Button
                          variant="outlined"
                          size="small"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Reassign
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          className="hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Skills & Expertise */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Skills & Expertise
              </Typography>
              
              <Box className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  />
                ))}
              </Box>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FiPlus />}
                className="mt-4 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                Add Skill
              </Button>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Recent Activity
              </Typography>
              
              <List className="space-y-4">
                {activities.map((activity) => (
                  <ListItem key={activity.id} className="p-0">
                    <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                      <Box className="flex items-start">
                        <Box className="mr-3 mt-1">
                          {activity.type.includes("Completed") ? (
                            <FiCheckCircle className="text-green-500" />
                          ) : activity.type.includes("Updated") ? (
                            <FiRefreshCw className="text-blue-500" />
                          ) : activity.type.includes("Assigned") ? (
                            <FiUser className="text-purple-500" />
                          ) : (
                            <FiUsers className="text-amber-500" />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body2" className="font-medium">
                            {activity.type}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            {activity.description}
                          </Typography>
                          <Box className="flex items-center mt-1">
                            <Typography variant="caption" className="text-gray-500 mr-2">
                              {activity.date}
                            </Typography>
                            <Chip
                              label={activity.project}
                              size="small"
                              className="bg-gray-100 text-gray-700"
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
              
              <Button
                fullWidth
                variant="text"
                className="mt-3 text-indigo-600 hover:bg-indigo-50"
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Feedback & Recognition */}
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Feedback & Recognition
              </Typography>
              
              {feedback.map((item, index) => (
                <Box key={index} className="mb-4">
                  <Box className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="text-yellow-400" />
                    ))}
                  </Box>
                  <Typography variant="body2" className="italic mb-1">
                    "{item.quote}"
                  </Typography>
                  <Box className="flex justify-between">
                    <Typography variant="caption" className="text-gray-600">
                      - {item.client}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {item.date}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              <Divider className="my-4" />
              
              <Box>
                <Typography variant="subtitle2" className="text-gray-800 mb-2">
                  Awards & Recognition
                </Typography>
                <Box className="flex items-center space-x-2">
                  <FiAward className="text-amber-500" />
                  <Typography variant="body2">
                    Employee of the Month - January 2025
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
            <Grid item xs={12} className="text-center">
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
            </Grid>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={tempData.bio || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                multiline
                rows={3}
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

export default ProjectManagerProfile;