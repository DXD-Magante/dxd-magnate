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
  Rating
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
  FiEye,
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiEdit,
  FiSend,
  FiCheck
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

const priorityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-amber-100 text-amber-800',
  'High': 'bg-red-100 text-red-800',
  'Critical': 'bg-purple-100 text-purple-800'
};

const reviewStatusColors = {
  'Pending': 'bg-gray-100 text-gray-800',
  'Approved': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Changes Requested': 'bg-yellow-100 text-yellow-800'
};

const WaitingReviewTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(3);

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

        // Fetch tasks assigned to current user with status "Waiting Review"
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", user.uid),
          where("status", "==", "Waiting Review")
        );
        const querySnapshot = await getDocs(tasksQuery);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTasks(tasksData);
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
    return matchesSearch && matchesPriority && matchesProject;
  });

  const handleStatusChange = async (taskId, newStatus, reviewData = {}) => {
    try {
      await updateDoc(doc(db, "project-tasks", taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...reviewData
      });
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus, ...reviewData } : task
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
          updatedAt: new Date().toISOString()
        })
      );
      
      await Promise.all(updatePromises);
      setTasks(tasks.filter(task => !selectedTasks.includes(task.id)));
      setSelectedTasks([]);
    } catch (error) {
      console.error("Error updating tasks:", error);
    }
  };

  const submitReviewResponse = (approved) => {
    const reviewData = {
      reviewStatus: approved ? "Approved" : "Changes Requested",
      reviewComment,
      reviewRating: approved ? reviewRating : null,
      reviewedAt: new Date().toISOString()
    };
    
    handleStatusChange(
      selectedTask.id, 
      approved ? "Done" : "In Progress", 
      reviewData
    );
    setOpenTaskDialog(false);
    setReviewComment("");
    setReviewRating(3);
  };

  const isTaskOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
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
          Waiting Review
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {filteredTasks.length} tasks submitted for review
        </Typography>
      </Box>

      {/* Action Bar */}
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center gap-2">
          {selectedTasks.length > 0 && (
            <>
              <Tooltip title="Withdraw for changes">
                <IconButton
                  size="small"
                  onClick={() => handleBulkStatusChange("In Progress")}
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    '&:hover': { backgroundColor: '#fde68a' }
                  }}
                >
                  <FiEdit size={16} />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                {selectedTasks.length} selected
              </Typography>
            </>
          )}
        </Box>
        
        <Box className="flex items-center gap-3">
          <Button
            variant="contained"
            startIcon={<FiPlus size={18} />}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            New Submission
          </Button>
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
                  task.reviewStatus === 'Approved' ? '#10b981' :
                  task.reviewStatus === 'Rejected' ? '#ef4444' :
                  task.reviewStatus === 'Changes Requested' ? '#f59e0b' : '#94a3b8'
                }`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <ListItem
                secondaryAction={
                  <Box className="flex items-center gap-2">
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
                    <Box className="flex items-center justify-between">
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      {task.reviewStatus && (
                        <Chip
                          label={task.reviewStatus}
                          size="small"
                          sx={{
                            backgroundColor: reviewStatusColors[task.reviewStatus].split(' ')[0],
                            color: reviewStatusColors[task.reviewStatus].split(' ')[1],
                            fontWeight: 'bold',
                            fontSize: '0.65rem'
                          }}
                        />
                      )}
                    </Box>
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
                            {formatDate(task.dueDate)}
                            {isTaskOverdue(task.dueDate) && (
                              <span className="ml-1">• Overdue</span>
                            )}
                          </Typography>
                        </Box>
                      </Box>
                      {task.submittedForReviewAt && (
                        <Box className="flex items-center gap-1 mt-1">
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Submitted on: {formatDate(task.submittedForReviewAt)}
                          </Typography>
                        </Box>
                      )}
                      {task.labels && task.labels.length > 0 && (
                        <Box className="flex flex-wrap gap-1 mt-2">
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
            No tasks waiting for review
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', maxWidth: '400px', textAlign: 'center' }}>
            {searchTerm ? 'No tasks match your search criteria' : 'All your submissions have been reviewed! Submit new work for review.'}
          </Typography>
          {!searchTerm && (
            <Button
              variant="outlined"
              startIcon={<FiSend size={18} />}
              sx={{ mt: 3 }}
              onClick={() => window.location.hash = "#/collaborator/my-tasks/in-progress"}
            >
              View In Progress Tasks
            </Button>
          )}
        </Box>
      )}

      {/* Task Review Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Review Submission</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box className="space-y-4 mt-3">
              <Box className="flex justify-between items-start">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedTask.title}
                </Typography>
                <Chip
                  label="Waiting Review"
                  size="small"
                  sx={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
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
                    <Typography variant="body2" sx={{ 
                      color: isTaskOverdue(selectedTask.dueDate) ? '#ef4444' : '#64748b',
                      fontWeight: isTaskOverdue(selectedTask.dueDate) ? 'bold' : 'normal'
                    }}>
                      {formatDate(selectedTask.dueDate)}
                      {isTaskOverdue(selectedTask.dueDate) && (
                        <span className="ml-1">• Overdue</span>
                      )}
                    </Typography>
                  </Box>
                </Grid>
                {selectedTask.submittedForReviewAt && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Submitted for Review
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(selectedTask.submittedForReviewAt)}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Review Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Add your review comments..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Quality Rating
                  </Typography>
                  <Rating
                    value={reviewRating}
                    onChange={(event, newValue) => {
                      setReviewRating(newValue);
                    }}
                    precision={0.5}
                    icon={<FiThumbsUp fontSize="inherit" />}
                    emptyIcon={<FiThumbsDown fontSize="inherit" />}
                    sx={{
                      '& .MuiRating-iconFilled': {
                        color: '#10b981',
                      },
                      '& .MuiRating-iconHover': {
                        color: '#059669',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => submitReviewResponse(false)}
            variant="outlined"
            startIcon={<FiEdit />}
            sx={{
              borderColor: '#f59e0b',
              color: '#92400e',
              '&:hover': { borderColor: '#d97706' }
            }}
          >
            Request Changes
          </Button>
          <Button 
            onClick={() => submitReviewResponse(true)}
            variant="contained"
            startIcon={<FiCheck />}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' }
            }}
          >
            Approve
          </Button>
          <Button onClick={() => setOpenTaskDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WaitingReviewTasks;