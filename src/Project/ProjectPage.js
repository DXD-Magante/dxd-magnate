import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Grid, Paper, 
  Avatar, Chip, Divider, Tabs, Tab,
  Button, IconButton, LinearProgress, 
  Badge, List, ListItem, ListItemAvatar,
  ListItemText, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, InputAdornment, Tooltip, CircularProgress
} from "@mui/material";
import {
  FiCalendar, FiUsers, FiFileText, FiDollarSign,
  FiClock, FiCheckCircle, FiAlertCircle, 
  FiPlus, FiEdit2, FiTrash2, FiSearch,
  FiChevronDown, FiLink, FiDownload,
  FiShare2, FiMessageSquare, FiBarChart2
} from "react-icons/fi";
import { 
  FaRegDotCircle, FaRegClock,
  FaCheckCircle, FaRegCheckCircle,
  FaRupeeSign
} from "react-icons/fa";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { format } from "date-fns";
import TimelineComponent from "./Timeline";
import ResourcesComponent from "./Resources";

const statusStyles = {
  'Not started yet': { color: '#64748b', bgcolor: '#f1f5f9' },
  'In progress': { color: '#2563eb', bgcolor: '#dbeafe' },
  'On hold': { color: '#d97706', bgcolor: '#fef3c7' },
  'Completed': { color: '#059669', bgcolor: '#d1fae5' },
  'Cancelled': { color: '#dc2626', bgcolor: '#fee2e2' }
};

const priorityStyles = {
  'Low': { color: '#059669', bgcolor: '#d1fae5' },
  'Medium': { color: '#d97706', bgcolor: '#fef3c7' },
  'High': { color: '#dc2626', bgcolor: '#fee2e2' },
  'Critical': { color: '#7c3aed', bgcolor: '#ede9fe' }
};

const ProjectPage = () => {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [client, setClient] = useState(null);
  const [projectManager, setProjectManager] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignee: null,
    dueDate: '',
    labels: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Get project ID from URL
  const projectId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        
        // Fetch project details
        const projectRef = doc(db, 'dxd-magnate-projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (projectSnap.exists()) {
          const projectData = projectSnap.data();
          setProject({ id: projectSnap.id, ...projectData });
          
          // Fetch client details
          if (projectData.clientId) {
            const clientRef = doc(db, 'users', projectData.clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
              setClient({ id: clientSnap.id, ...clientSnap.data() });
            }
          }
          
          // Fetch project manager details
          if (projectData.projectManagerId) {
            const pmRef = doc(db, 'users', projectData.projectManagerId);
            const pmSnap = await getDoc(pmRef);
            if (pmSnap.exists()) {
              setProjectManager({ id: pmSnap.id, ...pmSnap.data() });
            }
          }
          
          // Fetch team members
          if (projectData.teamMembers && projectData.teamMembers.length > 0) {
            const memberIds = projectData.teamMembers.map(m => m.id);
            const membersQuery = query(
              collection(db, 'users'),
              where('uid', 'in', memberIds)
            );
            const membersSnapshot = await getDocs(membersQuery);
            const membersData = membersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTeamMembers(membersData);
          }
          
          // Fetch project tasks
          const tasksQuery = query(
            collection(db, 'project-tasks'),
            where('projectId', '==', projectId)
          );
          const tasksSnapshot = await getDocs(tasksQuery);
          const tasksData = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTasks(tasksData);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAddTask = async () => {
    try {
      const taskData = {
        ...newTask,
        projectId: project.id,
        projectTitle: project.title,
        clientId: project.clientId,
        clientName: project.clientName,
        status: 'To Do',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: newTask.assignee ? {
          id: newTask.assignee.id,
          name: newTask.assignee.name,
          avatar: newTask.assignee.name.split(' ').map(n => n[0]).join('')
        } : null
      };
      
      // Here you would add the task to Firestore
      // await addDoc(collection(db, 'project-tasks'), taskData);
      
      setTasks([...tasks, taskData]);
      setOpenTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        assignee: null,
        dueDate: '',
        labels: []
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Here you would update the task in Firestore
      // await updateDoc(doc(db, 'project-tasks', taskId), { status: newStatus });
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy');
  };

  const getProgressPercentage = () => {
    if (!tasks.length) return 0;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="textSecondary">
          Project not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="p-4 md:p-6">
      {/* Project Header */}
      <Box className="mb-6" sx={{marginTop:'60px'}}>
        <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <Box>
            <Typography variant="h3" className="font-bold text-gray-900">
              {project.title}
            </Typography>
            <Typography variant="body1" className="text-gray-600">
              {project.description}
            </Typography>
          </Box>
          <Box className="flex gap-3">
            <Button
              variant="outlined"
              startIcon={<FiDownload size={18} />}
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc'
                }
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<FiShare2 size={18} />}
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': {
                  backgroundColor: '#4338ca'
                }
              }}
            >
              Share
            </Button>
          </Box>
        </Box>

        {/* Project Status Bar */}
        <Paper className="p-4 mb-4 rounded-lg shadow-sm">
          <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Box className="flex-1">
              <Box className="flex items-center gap-3 mb-2">
                <Chip
                  label={project.status}
                  sx={{
                    color: statusStyles[project.status]?.color,
                    backgroundColor: statusStyles[project.status]?.bgcolor,
                    fontWeight: 'medium'
                  }}
                />
                <Typography variant="body2" className="text-gray-600">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getProgressPercentage()}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: '#4f46e5'
                  }
                }}
              />
              <Box className="flex justify-between mt-1">
                <Typography variant="caption" className="text-gray-500">
                  {getProgressPercentage()}% Complete
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  {tasks.filter(t => t.status === 'Done').length} of {tasks.length} tasks
                </Typography>
              </Box>
            </Box>
            <Box className="flex flex-col items-end">
              <Typography variant="h6" className="font-bold">
              ₹ {parseInt(project.budget).toLocaleString()}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                Total Budget
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} >
          {/* Tabs */}
          <Paper className="mb-4 rounded-lg shadow-sm">
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4f46e5'
    
                }
              }}
            >
              <Tab 
                label="Overview" 
                value="overview" 
                sx={{ 
                  textTransform: 'none',
                  '&.Mui-selected': { color: '#4f46e5' }
                }} 
              />
              <Tab 
                label="Tasks" 
                value="tasks" 
                sx={{ 
                  textTransform: 'none',
                  '&.Mui-selected': { color: '#4f46e5' }
                }} 
              />
              <Tab 
                label="Timeline" 
                value="timeline" 
                sx={{ 
                  textTransform: 'none',
                  '&.Mui-selected': { color: '#4f46e5' }
                }} 
              />
              <Tab 
                label="Files" 
                value="files" 
                sx={{ 
                  textTransform: 'none',
                  '&.Mui-selected': { color: '#4f46e5' }
                }} 
              />
              <Tab 
                label="Discussions" 
                value="discussions" 
                sx={{ 
                  textTransform: 'none',
                  '&.Mui-selected': { color: '#4f46e5' }
                }} 
              />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <Paper className="p-4 rounded-lg shadow-sm mb-4">
              <Typography variant="h6" className="font-bold mb-4">
                Project Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    Description
                  </Typography>
                  <Typography variant="body1" className="mb-4">
                    {project.description || 'No description provided'}
                  </Typography>

                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    Project Type
                  </Typography>
                  <Typography variant="body1" className="mb-4">
                    {project.type}
                  </Typography>

                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {project.duration}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    Start Date
                  </Typography>
                  <Typography variant="body1" className="mb-4">
                    {formatDate(project.startDate)}
                  </Typography>

                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    End Date
                  </Typography>
                  <Typography variant="body1" className="mb-4">
                    {formatDate(project.endDate)}
                  </Typography>

                  <Typography variant="subtitle2" className="text-gray-500 mb-1">
                    Payment Status
                  </Typography>
                  <Chip
                    label={project.paymentStatus === 'paid' ? 'Paid' : 'Not Paid'}
                    sx={{
                      backgroundColor: project.paymentStatus === 'paid' ? '#d1fae5' : '#fee2e2',
                      color: project.paymentStatus === 'paid' ? '#059669' : '#dc2626',
                      fontWeight: 'medium'
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {activeTab === 'tasks' && (
            <Box>
              {/* Task Filters */}
              <Paper className="p-4 rounded-lg shadow-sm mb-4">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FiSearch color="#94a3b8" />
                          </InputAdornment>
                        ),
                        sx: { backgroundColor: 'white' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Select
                      fullWidth
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: 'white' }}
                      IconComponent={FiChevronDown}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="To Do">To Do</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Done">Done</MenuItem>
                      <MenuItem value="Blocked">Blocked</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Select
                      fullWidth
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      displayEmpty
                      sx={{ backgroundColor: 'white' }}
                      IconComponent={FiChevronDown}
                    >
                      <MenuItem value="all">All Priorities</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
              </Paper>

              {/* Task List */}
              <Paper className="p-4 rounded-lg shadow-sm">
                <Box className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-bold">
                    Tasks ({filteredTasks.length})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<FiPlus size={18} />}
                    onClick={() => setOpenTaskDialog(true)}
                    sx={{
                      backgroundColor: '#4f46e5',
                      '&:hover': {
                        backgroundColor: '#4338ca'
                      }
                    }}
                  >
                    New Task
                  </Button>
                </Box>

                {filteredTasks.length > 0 ? (
                  <List>
                    {filteredTasks.map((task, index) => (
                      <React.Fragment key={task.id}>
                        <ListItem
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8fafc'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}>
                              {task.assignee?.name.split(' ').map(n => n[0]).join('') || 'T'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box className="flex items-center gap-2">
                                <Typography variant="subtitle1" className="font-medium">
                                  {task.title}
                                </Typography>
                                <Chip
                                  label={task.priority}
                                  size="small"
                                  sx={{
                                    color: priorityStyles[task.priority]?.color,
                                    backgroundColor: priorityStyles[task.priority]?.bgcolor,
                                    fontWeight: 'medium'
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" className="text-gray-600">
                                  {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                                </Typography>
                                <Box className="flex items-center gap-2 mt-1">
                                  <Typography variant="caption" className="text-gray-500">
                                    Due: {formatDate(task.dueDate)}
                                  </Typography>
                                  {task.labels?.map((label, idx) => (
                                    <Chip
                                      key={idx}
                                      label={label}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#f1f5f9',
                                        color: '#64748b',
                                        fontSize: '0.65rem'
                                      }}
                                    />
                                  ))}
                                </Box>
                              </>
                            }
                          />
                          <Select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            size="small"
                            sx={{
                              minWidth: 120,
                              backgroundColor: 
                                task.status === 'Done' ? '#ECFDF5' :
                                task.status === 'In Progress' ? '#EFF6FF' :
                                task.status === 'Blocked' ? '#FEE2E2' : '#F5F3FF',
                              color: 
                                task.status === 'Done' ? '#059669' :
                                task.status === 'In Progress' ? '#2563EB' :
                                task.status === 'Blocked' ? '#DC2626' : '#7C3AED',
                              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                            }}
                            IconComponent={FiChevronDown}
                          >
                            <MenuItem value="To Do">To Do</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Done">Done</MenuItem>
                            <MenuItem value="Blocked">Blocked</MenuItem>
                          </Select>
                        </ListItem>
                        {index < filteredTasks.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box className="text-center py-8">
                    <FiFileText className="mx-auto text-gray-400" size={48} />
                    <Typography variant="h6" className="mt-4 text-gray-600">
                      No tasks found
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mt-2">
                      {searchTerm ? 'Try adjusting your search criteria' : 'Add a new task to get started'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

{activeTab === 'timeline' && (
  <TimelineComponent projectId={projectId} />
)}

{activeTab === 'files' && (
  <ResourcesComponent projectId={projectId} />
)}


          {activeTab === 'discussions' && (
            <Paper className="p-4 rounded-lg shadow-sm">
              <Typography variant="h6" className="font-bold mb-4">
                Project Discussions
              </Typography>
              <Box className="text-center py-8">
                <FiMessageSquare className="mx-auto text-gray-400" size={48} />
                <Typography variant="h6" className="mt-4 text-gray-600">
                  Discussions
                </Typography>
                <Typography variant="body2" className="text-gray-500 mt-2">
                  Team conversations and project updates will appear here
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Project Team */}
          <Paper className="p-4 rounded-lg shadow-sm mb-4">
            <Typography variant="h6" className="font-bold mb-4">
              Project Team
            </Typography>
            <List>
              {projectManager && (
                <ListItem>
                  <ListItemAvatar>
                    <Avatar 
                      alt={projectManager.firstName + ' ' + projectManager.lastName}
                      src={projectManager.photoURL}
                      sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}
                    >
                      {projectManager.firstName?.charAt(0)}{projectManager.lastName?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={projectManager.firstName + ' ' + projectManager.lastName}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">
                          Project Manager
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {projectManager.email}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              )}

              {teamMembers.map((member, index) => (
                <React.Fragment key={member.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar 
                        alt={member.firstName + ' ' + member.lastName}
                        src={member.photoURL}
                        sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}
                      >
                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.firstName + ' ' + member.lastName}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary">
                            {member.role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < teamMembers.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}

              {teamMembers.length === 0 && (
                <Box className="text-center py-4">
                  <FiUsers className="mx-auto text-gray-400" size={32} />
                  <Typography variant="body2" className="text-gray-500 mt-2">
                    No team members assigned yet
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>

          {/* Client Information */}
          {client && (
            <Paper className="p-4 rounded-lg shadow-sm mb-4">
              <Typography variant="h6" className="font-bold mb-4">
                Client Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar 
                      alt={client.firstName + ' ' + client.lastName}
                      src={client.photoURL}
                      sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}
                    >
                      {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={client.firstName + ' ' + client.lastName}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary">
                          {client.company || 'No company specified'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {client.email}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          )}

          {/* Project Stats */}
          <Paper className="p-4 rounded-lg shadow-sm">
            <Typography variant="h6" className="font-bold mb-4">
              Project Stats
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box className="text-center p-2">
                  <Typography variant="h4" className="font-bold text-indigo-600">
                    {tasks.length}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    Total Tasks
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box className="text-center p-2">
                  <Typography variant="h4" className="font-bold text-green-600">
                    {tasks.filter(t => t.status === 'Done').length}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    Completed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box className="text-center p-2">
                  <Typography variant="h4" className="font-bold text-yellow-600">
                    {tasks.filter(t => t.status === 'In Progress').length}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    In Progress
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box className="text-center p-2">
                  <Typography variant="h4" className="font-bold text-red-600">
                    {tasks.filter(t => t.status === 'Blocked').length}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    Blocked
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Task Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create New Task</DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-3">
            <TextField
              fullWidth
              label="Task Title"
              variant="outlined"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
            
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Select
                  fullWidth
                  label="Priority"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  sx={{ textAlign: 'left' }}
                  IconComponent={FiChevronDown}
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </Grid>
            </Grid>

            <Select
              fullWidth
              label="Assignee"
              value={newTask.assignee?.id || ''}
              onChange={(e) => {
                const assignee = teamMembers.find(
                  member => member.uid === e.target.value
                );
                setNewTask({...newTask, assignee});
              }}
              sx={{ textAlign: 'left' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {teamMembers.map(member => (
                <MenuItem key={member.uid} value={member.uid}>
                  {member.firstName} {member.lastName}
                </MenuItem>
              ))}
            </Select>

            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                Labels
              </Typography>
              <Box className="flex flex-wrap gap-2">
                {['Frontend', 'Backend', 'Design', 'Content', 'Bug', 'Feature'].map(label => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    clickable
                    onClick={() => {
                      setNewTask(prev => ({
                        ...prev,
                        labels: prev.labels.includes(label) 
                          ? prev.labels.filter(l => l !== label)
                          : [...prev.labels, label]
                      }));
                    }}
                    sx={{
                      backgroundColor: newTask.labels.includes(label) ? '#E0E7FF' : '#F3F4F6',
                      color: newTask.labels.includes(label) ? '#4F46E5' : '#4B5563'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenTaskDialog(false)}
            sx={{ color: '#4B5563' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTask.title}
            sx={{
              backgroundColor: '#4F46E5',
              '&:hover': {
                backgroundColor: '#4338CA'
              },
              '&:disabled': {
                backgroundColor: '#E5E7EB',
                color: '#9CA3AF'
              }
            }}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectPage;