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
  Rating,
  Badge
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiCheckCircle,
  FiFlag,
  FiTag,
  FiUser,
  FiEye,
  FiClock,
  FiThumbsUp,
  FiDownload,
  FiBarChart2,
  FiAward
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const priorityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-amber-100 text-amber-800',
  'High': 'bg-red-100 text-red-800',
  'Critical': 'bg-purple-100 text-purple-800'
};

const CompletedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [projects, setProjects] = useState([]);
  const [timeRangeFilter, setTimeRangeFilter] = useState("all");
  const [stats, setStats] = useState({
    totalCompleted: 0,
    avgCompletionTime: 0,
    avgRating: 0
  });

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

        // Fetch tasks assigned to current user with status "Done"
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", user.uid),
          where("status", "==", "Done")
        );
        const querySnapshot = await getDocs(tasksQuery);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTasks(tasksData);
        
        // Calculate statistics
        const totalCompleted = tasksData.length;
        const totalTime = tasksData.reduce((sum, task) => {
          return sum + (task.timeSpent || 0);
        }, 0);
        const totalRating = tasksData.reduce((sum, task) => {
          return sum + (task.reviewRating || 0);
        }, 0);
        
        setStats({
          totalCompleted,
          avgCompletionTime: totalCompleted > 0 ? Math.round(totalTime / totalCompleted / 3600) : 0,
          avgRating: totalCompleted > 0 ? (totalRating / totalCompleted).toFixed(1) : 0
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
    
    // Time range filtering
    const now = new Date();
    const completedDate = new Date(task.completedAt || task.updatedAt);
    let matchesTimeRange = true;
    
    if (timeRangeFilter === "week") {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesTimeRange = completedDate >= oneWeekAgo;
    } else if (timeRangeFilter === "month") {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesTimeRange = completedDate >= oneMonthAgo;
    }
    
    return matchesSearch && matchesPriority && matchesProject && matchesTimeRange;
  });

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="mb-6">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Completed Tasks
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Review your completed work and performance metrics
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-3">
                <Avatar sx={{ bgcolor: '#ecfdf5', color: '#10b981' }}>
                  <FiCheckCircle size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Completed
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats.totalCompleted}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-3">
                <Avatar sx={{ bgcolor: '#eff6ff', color: '#3b82f6' }}>
                  <FiClock size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Time
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats.avgCompletionTime}h
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box className="flex items-center gap-3">
                <Avatar sx={{ bgcolor: '#fef3c7', color: '#f59e0b' }}>
                  <FiAward size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Rating
                  </Typography>
                  <Box className="flex items-center gap-1">
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {stats.avgRating}
                    </Typography>
                    <Rating value={parseFloat(stats.avgRating)} precision={0.1} readOnly size="small" />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={6} md={2}>
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
          <Grid item xs={6} md={2}>
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
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<FiDownload size={18} />}
              fullWidth
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              Export
            </Button>
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
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <ListItem
                secondaryAction={
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
                      <FiEye size={18} />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: '#ecfdf5', 
                    color: '#10b981',
                    width: 40,
                    height: 40
                  }}>
                    <FiCheckCircle size={20} />
                  </Avatar>
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
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Completed: {formatDate(task.completedAt || task.updatedAt)}
                          </Typography>
                        </Box>
                        {task.timeSpent && (
                          <Box className="flex items-center gap-1">
                            <FiClock size={14} className="text-gray-500" />
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              {formatTime(task.timeSpent)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      {task.reviewRating && (
                        <Box className="flex items-center gap-1 mt-1">
                          <Rating 
                            value={task.reviewRating} 
                            precision={0.5} 
                            readOnly 
                            size="small" 
                            icon={<FiThumbsUp fontSize="inherit" />}
                            emptyIcon={<FiThumbsUp fontSize="inherit" />}
                          />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {task.reviewRating.toFixed(1)}
                          </Typography>
                        </Box>
                      )}
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
          <FiBarChart2 size={48} className="text-indigo-500 mb-4" />
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            No completed tasks found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: '400px', textAlign: 'center' }}>
            {searchTerm ? 'No tasks match your search criteria' : 'Complete tasks to see them appear here.'}
          </Typography>
        </Box>
      )}

      {/* Task Details Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Completed Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box className="space-y-4 mt-3">
              <Box className="flex justify-between items-start">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedTask.title}
                </Typography>
                <Chip
                  label="Completed"
                  size="small"
                  sx={{
                    backgroundColor: '#ecfdf5',
                    color: '#10b981',
                    fontWeight: 'bold'
                  }}
                />
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
                    <Typography variant="body2">
                      {formatDate(selectedTask.dueDate)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Completed On
                  </Typography>
                  <Box className="flex items-center gap-1">
                    <FiCalendar size={16} className="text-gray-500" />
                    <Typography variant="body2">
                      {formatDate(selectedTask.completedAt || selectedTask.updatedAt)}
                    </Typography>
                  </Box>
                </Grid>
                {selectedTask.timeSpent && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Time Spent
                    </Typography>
                    <Box className="flex items-center gap-1">
                      <FiClock size={16} className="text-gray-500" />
                      <Typography variant="body2">
                        {formatTime(selectedTask.timeSpent)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {selectedTask.reviewRating && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Review Rating
                    </Typography>
                    <Box className="flex items-center gap-2">
                      <Rating 
                        value={selectedTask.reviewRating} 
                        precision={0.5} 
                        readOnly 
                        icon={<FiThumbsUp fontSize="inherit" />}
                        emptyIcon={<FiThumbsUp fontSize="inherit" />}
                      />
                      <Typography variant="body2">
                        {selectedTask.reviewRating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                )}
                {selectedTask.reviewComment && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Reviewer Feedback
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                      <Typography variant="body2">
                        {selectedTask.reviewComment}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
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
              // Handle re-open task if needed
              setOpenTaskDialog(false);
            }}
            variant="outlined"
            sx={{
              borderColor: '#e2e8f0',
              color: '#64748b'
            }}
          >
            Re-open Task
          </Button>
          <Button onClick={() => setOpenTaskDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompletedTasks;