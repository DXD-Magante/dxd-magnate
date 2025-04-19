import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  Badge,
  CircularProgress
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFlag,
  FiTag,
  FiUser,
  FiArchive,
  FiRefreshCw,
  FiPause,
  FiCheck,
  FiEdit,
  FiMessageSquare
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const priorityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-amber-100 text-amber-800',
  'High': 'bg-red-100 text-red-800',
  'Critical': 'bg-purple-100 text-purple-800'
};

const InProgressTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [timeSpent, setTimeSpent] = useState({});
  const [timeTracking, setTimeTracking] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch projects where current user is assigned
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("teamMembers", "array-contains", { id: user.uid })
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Fetch tasks assigned to current user with status "In Progress"
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", user.uid),
          where("status", "==", "In Progress")
        );
        const querySnapshot = await getDocs(tasksQuery);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Initialize time tracking for each task
        const initialTimeSpent = {};
        const initialTimeTracking = {};
        tasksData.forEach(task => {
          initialTimeSpent[task.id] = task.timeSpent || 0;
          initialTimeTracking[task.id] = false;
        });
        
        setTimeSpent(initialTimeSpent);
        setTimeTracking(initialTimeTracking);
        setTasks(tasksData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    // Update time spent for tasks being tracked
    const interval = setInterval(() => {
      setTimeSpent(prev => {
        const updated = {...prev};
        Object.keys(timeTracking).forEach(taskId => {
          if (timeTracking[taskId]) {
            updated[taskId] = (updated[taskId] || 0) + 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeTracking]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
    return matchesSearch && matchesPriority && matchesProject;
  });

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, "project-tasks", taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === "Done" && { timeSpent: timeSpent[taskId] })
      });
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleTaskSelect = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      const updatePromises = selectedTasks.map(taskId => 
        updateDoc(doc(db, "project-tasks", taskId), {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === "Done" && { timeSpent: timeSpent[taskId] })
        })
      );
      
      await Promise.all(updatePromises);
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
    } catch (error) {
      console.error("Error updating tasks:", error);
    }
  };

  const toggleTimeTracking = (taskId) => {
    setTimeTracking(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTaskOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="mb-6">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          In Progress Tasks
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {filteredTasks.length} tasks currently being worked on
        </Typography>
      </Box>

      {/* Action Bar */}
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center gap-2">
          {selectedTasks.length > 0 && (
            <>
              <Tooltip title="Mark as Complete">
                <IconButton
                  size="small"
                  onClick={() => handleBulkStatusChange("Done")}
                  sx={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    '&:hover': { backgroundColor: '#bbf7d0' }
                  }}
                >
                  <FiCheck size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Move to Pending">
                <IconButton
                  size="small"
                  onClick={() => handleBulkStatusChange("To Do")}
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    '&:hover': { backgroundColor: '#fde68a' }
                  }}
                >
                  <FiPause size={16} />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                {selectedTasks.length} selected
              </Typography>
            </>
          )}
        </Box>
        
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks List */}
      {loading ? (
        <LinearProgress />
      ) : filteredTasks.length > 0 ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {filteredTasks.map((task) => (
            <Card 
              key={task.id} 
              sx={{ 
                mb: 2, 
                borderLeft: `4px solid ${
                  task.priority === 'High' ? '#ef4444' :
                  task.priority === 'Medium' ? '#f59e0b' :
                  task.priority === 'Low' ? '#10b981' : '#8b5cf6'
                }`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <ListItem
                secondaryAction={
                  <Box className="flex items-center gap-2">
                    <Tooltip title={timeTracking[task.id] ? "Pause tracking" : "Start tracking time"}>
                      <IconButton
                        edge="end"
                        onClick={() => toggleTimeTracking(task.id)}
                        sx={{
                          backgroundColor: timeTracking[task.id] ? '#fee2e2' : '#e0f2fe',
                          color: timeTracking[task.id] ? '#dc2626' : '#0369a1',
                          '&:hover': { 
                            backgroundColor: timeTracking[task.id] ? '#fecaca' : '#bae6fd'
                          }
                        }}
                      >
                        {timeTracking[task.id] ? <FiPause size={18} /> : <FiClock size={18} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Mark as Complete">
                      <IconButton
                        edge="end"
                        onClick={() => handleStatusChange(task.id, "Done")}
                        sx={{
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          '&:hover': { backgroundColor: '#bbf7d0' }
                        }}
                      >
                        <FiCheck size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View details">
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedTask(task);
                          setOpenTaskDialog(true);
                        }}
                        sx={{
                          backgroundColor: '#e0e7ff',
                          color: '#4f46e5',
                          '&:hover': { backgroundColor: '#c7d2fe' }
                        }}
                      >
                        <FiUser size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Checkbox
                    edge="start"
                    checked={selectedTasks.includes(task.id)}
                    onChange={() => handleTaskSelect(task.id)}
                    sx={{ mr: 1 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {task.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Box className="flex items-center gap-2 mt-1">
                        <Chip
                          icon={<FiFlag size={14} />}
                          label={task.priority}
                          size="small"
                          sx={{
                            backgroundColor: priorityColors[task.priority].split(' ')[0],
                            color: priorityColors[task.priority].split(' ')[1],
                            fontWeight: 'bold',
                            fontSize: '0.65rem'
                          }}
                        />
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {task.projectTitle}
                        </Typography>
                        <Box className="flex items-center gap-1">
                          <FiCalendar size={14} className="text-gray-500" />
                          <Typography variant="body2" sx={{ 
                            color: isTaskOverdue(task.dueDate) ? '#ef4444' : '#64748b',
                            fontWeight: isTaskOverdue(task.dueDate) ? 'bold' : 'normal'
                          }}>
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                            {isTaskOverdue(task.dueDate) && (
                              <span className="ml-1">• Overdue</span>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      <Box className="flex items-center gap-3 mt-2">
                        <Box className="flex items-center gap-1">
                          <FiClock size={14} className="text-gray-500" />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Time spent: {formatTime(timeSpent[task.id] || 0)}
                          </Typography>
                          {timeTracking[task.id] && (
                            <CircularProgress size={14} thickness={6} />
                          )}
                        </Box>
                        {task.labels && task.labels.length > 0 && (
                          <Box className="flex flex-wrap gap-1">
                            {task.labels.map((label, index) => (
                              <Chip
                                key={index}
                                icon={<FiTag size={12} />}
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
                        )}
                      </Box>
                    </>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 8,
          backgroundColor: '#f8fafc',
          borderRadius: 2
        }}>
          <FiCheckCircle size={48} className="text-green-500 mb-4" />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            No tasks in progress
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: '400px', textAlign: 'center' }}>
            {searchTerm ? 'No tasks match your search criteria' : 'All caught up! Move tasks from "To Do" to start working.'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="outlined"
              startIcon={<FiRefreshCw size={18} />}
              sx={{ mt: 3 }}
              onClick={() => window.location.hash = "#/collaborator/my-tasks/to-do"}
            >
              View To Do Tasks
            </Button>
          )}
        </Box>
      )}

      {/* Task Details Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box className="space-y-4 mt-3">
              <Box className="flex justify-between items-start">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedTask.title}
                </Typography>
                <Box className="flex items-center gap-2">
                  <Chip
                    label="In Progress"
                    size="small"
                    sx={{
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      fontWeight: 'bold'
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => toggleTimeTracking(selectedTask.id)}
                    sx={{
                      backgroundColor: timeTracking[selectedTask.id] ? '#fee2e2' : '#e0f2fe',
                      color: timeTracking[selectedTask.id] ? '#dc2626' : '#0369a1',
                    }}
                  >
                    {timeTracking[selectedTask.id] ? <FiPause size={16} /> : <FiClock size={16} />}
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {selectedTask.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Project
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.projectTitle}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Client
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.clientName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedTask.priority}
                    size="small"
                    sx={{
                      backgroundColor: priorityColors[selectedTask.priority].split(' ')[0],
                      color: priorityColors[selectedTask.priority].split(' ')[1],
                      fontWeight: 'bold'
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Due Date
                  </Typography>
                  <Box className="flex items-center gap-1">
                    <FiCalendar size={16} className="text-gray-500" />
                    <Typography variant="body2" sx={{ 
                      color: isTaskOverdue(selectedTask.dueDate) ? '#ef4444' : '#64748b',
                      fontWeight: isTaskOverdue(selectedTask.dueDate) ? 'bold' : 'normal'
                    }}>
                      {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      {isTaskOverdue(selectedTask.dueDate) && (
                        <span className="ml-1">• Overdue</span>
                      )}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Time Spent
                  </Typography>
                  <Box className="flex items-center gap-2">
                    <FiClock size={16} className="text-gray-500" />
                    <Typography variant="body2">
                      {formatTime(timeSpent[selectedTask.id] || 0)}
                    </Typography>
                    {timeTracking[selectedTask.id] && (
                      <CircularProgress size={16} thickness={6} />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Labels
                  </Typography>
                  <Box className="flex flex-wrap gap-1">
                    {selectedTask.labels?.map((label, index) => (
                      <Chip
                        key={index}
                        icon={<FiTag size={12} />}
                        label={label}
                        size="small"
                        sx={{
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          fontSize: '0.65rem'
                        }}
                      />
                    ))}
                    {(!selectedTask.labels || selectedTask.labels.length === 0) && (
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        No labels
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              handleStatusChange(selectedTask.id, "Done");
              setOpenTaskDialog(false);
            }}
            variant="contained"
            startIcon={<FiCheck />}
            sx={{
              backgroundColor: '#166534',
              '&:hover': { backgroundColor: '#14532d' }
            }}
          >
            Mark Complete
          </Button>
          <Button 
            onClick={() => {
              handleStatusChange(selectedTask.id, "To Do");
              setOpenTaskDialog(false);
            }}
            variant="outlined"
            startIcon={<FiPause />}
            sx={{
              borderColor: '#92400e',
              color: '#92400e',
              '&:hover': { borderColor: '#78350f' }
            }}
          >
            Move to Pending
          </Button>
          <Button onClick={() => setOpenTaskDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InProgressTasks;