import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  InputAdornment
} from "@mui/material";
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiUser,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiRefreshCw,
  FiChevronDown,
  FiMoreVertical,
  FiCalendar,
  FiTag
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { styled } from '@mui/material/styles';

const TaskCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 10,
  marginBottom: theme.spacing(2),
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
}));

const PriorityTag = styled(Chip)(({ priority }) => ({
  backgroundColor: 
    priority === 'High' ? '#FEE2E2' : 
    priority === 'Medium' ? '#FEF3C7' : '#ECFDF5',
  color: 
    priority === 'High' ? '#DC2626' : 
    priority === 'Medium' ? '#D97706' : '#059669',
  fontWeight: 600,
  fontSize: '0.65rem',
  height: '22px'
}));

const TaskAssignment = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject) return;

    const fetchTasks = async () => {
      setRefreshing(true);
      try {
        const q = query(
          collection(db, "project-tasks"),
          where("projectId", "==", selectedProject.id)
        );
        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTasks(tasksData);
        setFilteredTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  useEffect(() => {
    const filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
    setFilteredTasks(filtered);
  }, [searchTerm, statusFilter, priorityFilter, tasks]);

  const handleAssignTask = async (taskId, assignee) => {
    try {
      const taskRef = doc(db, "project-tasks", taskId);
      const taskSnapshot = await getDoc(taskRef);
      const taskData = taskSnapshot.data();

      await updateDoc(doc(db, "project-tasks", taskId), {
        assignee: {
          id: assignee.id,
          name: assignee.name,
          avatar: assignee.name.split(' ').map(n => n[0]).join('')
        },
        updatedAt: new Date().toISOString()
      });


      // Add to project-activities
    await addDoc(collection(db, "project-activities"), {
      actionType: "task_assignment",
      message: `Task "${taskData.title}" assigned to ${assignee.name}`,
      projectId: selectedProject.id,
      projectName: selectedProject.title,
      timestamp: serverTimestamp(),
      type: "task",
      userFullName: assignee.name,
      userId: assignee.id
    });

    // Add to collaborator-notifications
    await addDoc(collection(db, "collaborator-notifications"), {
      userId: assignee.id,
      projectId: selectedProject.id,
      projectName: selectedProject.title,
      message: `You've been assigned to task: "${taskData.title}"`,
      type: "task_assignment",
      read: false,
      timestamp: serverTimestamp(),
      taskId: taskId,
      taskTitle: taskData.title
    });

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? {
          ...task,
          assignee: {
            id: assignee.id,
            name: assignee.name,
            avatar: assignee.name.split(' ').map(n => n[0]).join('')
          }
        } : task
      ));
    } catch (error) {
      console.error("Error assigning task:", error);
    }
  };

  const handleAddTask = async () => {
    if (!selectedProject) return;

    try {
      const taskData = {
        ...newTask,
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
        status: 'To Do',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: newTask.assignee ? {
          id: newTask.assignee.id,
          name: newTask.assignee.name,
          avatar: newTask.assignee.name.split(' ').map(n => n[0]).join('')
        } : null
      };

      await addDoc(collection(db, "project-tasks"), taskData);
      setOpenTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        assignee: null,
        dueDate: '',
        labels: []
      });
      // Trigger refresh
      setRefreshing(true);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, "project-tasks", taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return '#ECFDF5';
      case 'In Progress': return '#EFF6FF';
      case 'To Do': return '#F5F3FF';
      case 'Blocked': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Done': return '#059669';
      case 'In Progress': return '#2563EB';
      case 'To Do': return '#7C3AED';
      case 'Blocked': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <Box className="space-y-6">
      {/* Header with Project Selector */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Task Assignment
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Assign and manage tasks for your team members
          </Typography>
        </Box>
        
        <Box className="flex items-center gap-3">
          {projects.length > 0 && (
            <Select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project);
              }}
              sx={{ 
                minWidth: 250,
                backgroundColor: 'white',
                borderRadius: '8px',
                '& .MuiSelect-select': {
                  py: 1.5
                }
              }}
              IconComponent={FiChevronDown}
            >
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          )}
          
          <Button
            variant="contained"
            startIcon={<FiPlus size={18} />}
            onClick={() => setOpenTaskDialog(true)}
            sx={{
              backgroundColor: '#4F46E5',
              '&:hover': {
                backgroundColor: '#4338CA'
              }
            }}
          >
            New Task
          </Button>
          
          <Tooltip title="Refresh tasks">
            <IconButton
              onClick={() => setRefreshing(true)}
              sx={{
                backgroundColor: '#EFF6FF',
                color: '#3B82F6',
                '&:hover': {
                  backgroundColor: '#DBEAFE'
                }
              }}
            >
              <FiRefreshCw size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
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
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<FiFilter size={18} />}
              fullWidth
              sx={{
                borderColor: '#E5E7EB',
                color: '#4B5563',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#D1D5DB',
                  backgroundColor: '#F9FAFB'
                }
              }}
            >
              More Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      {loading || refreshing ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !selectedProject ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            No project selected
          </Typography>
        </Paper>
      ) : filteredTasks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            No tasks found matching your criteria
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              {filteredTasks.length} Tasks
            </Typography>
            
            {filteredTasks.map(task => (
              <TaskCard key={task.id}>
                <Box className="flex items-start justify-between mb-2">
                  <Box className="flex items-start space-x-3">
                    <Select
                      value={task.status || 'To Do'}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      size="small"
                      sx={{
                        minWidth: 120,
                        backgroundColor: getStatusColor(task.status),
                        color: getStatusTextColor(task.status),
                        fontWeight: 500,
                        borderRadius: '6px',
                        '& .MuiSelect-select': {
                          py: 0.5
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="To Do">To Do</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Done">Done</MenuItem>
                      <MenuItem value="Blocked">Blocked</MenuItem>
                    </Select>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton size="small">
                    <FiMoreVertical />
                  </IconButton>
                </Box>
                
                <Box className="flex flex-wrap gap-2 mb-3">
                  <PriorityTag label={task.priority} priority={task.priority} />
                  {task.labels?.map((label, index) => (
                    <Chip
                      key={index}
                      label={label}
                      size="small"
                      sx={{
                        backgroundColor: '#E5E7EB',
                        color: '#4B5563',
                        fontSize: '0.65rem'
                      }}
                    />
                  ))}
                </Box>
                
                <Box className="flex items-center justify-between">
                  <Box className="flex items-center space-x-2">
                    {task.assignee ? (
                      <>
                        <Tooltip title={task.assignee.name}>
                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              fontSize: '0.75rem',
                              bgcolor: '#E0E7FF',
                              color: '#4F46E5'
                            }}
                          >
                            {task.assignee.avatar}
                          </Avatar>
                        </Tooltip>
                        <Select
                          value={task.assignee.id}
                          onChange={(e) => {
                            const newAssignee = selectedProject.teamMembers.find(
                              member => member.id === e.target.value
                            );
                            if (newAssignee) {
                              handleAssignTask(task.id, newAssignee);
                            }
                          }}
                          size="small"
                          sx={{
                            minWidth: 160,
                            backgroundColor: '#F9FAFB',
                            borderRadius: '6px',
                            '& .MuiSelect-select': {
                              py: 0.5
                            }
                          }}
                          IconComponent={FiChevronDown}
                        >
                          {selectedProject.teamMembers?.map(member => (
                            <MenuItem key={member.id} value={member.id}>
                              {member.name} ({member.projectRole})
                            </MenuItem>
                          ))}
                        </Select>
                      </>
                    ) : (
                      <Select
                        value=""
                        onChange={(e) => {
                          const newAssignee = selectedProject.teamMembers.find(
                            member => member.id === e.target.value
                          );
                          if (newAssignee) {
                            handleAssignTask(task.id, newAssignee);
                          }
                        }}
                        displayEmpty
                        size="small"
                        sx={{
                          minWidth: 160,
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          '& .MuiSelect-select': {
                            py: 0.5
                          }
                        }}
                        IconComponent={FiChevronDown}
                      >
                        <MenuItem value="" disabled>
                          <em>Assign to...</em>
                        </MenuItem>
                        {selectedProject.teamMembers?.map(member => (
                          <MenuItem key={member.id} value={member.id}>
                            {member.name} ({member.projectRole})
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  </Box>
                  
                  <Box className="flex items-center text-sm text-gray-500">
                    <FiCalendar className="mr-1" size={14} />
                    <span>
                      {task.dueDate ? 
                        new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        }) : 'No due date'}
                    </span>
                  </Box>
                </Box>
              </TaskCard>
            ))}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                Team Availability
              </Typography>
              
              {selectedProject.teamMembers?.length > 0 ? (
                selectedProject.teamMembers.map(member => {
                  const memberTasks = tasks.filter(t => 
                    t.assignee && t.assignee.id === member.id
                  );
                  const completedTasks = memberTasks.filter(t => t.status === 'Done').length;
                  const progress = memberTasks.length > 0 ? 
                    Math.round((completedTasks / memberTasks.length) * 100) : 0;
                  
                  return (
                    <Box key={member.id} sx={{ mb: 3 }}>
                      <Box className="flex items-center justify-between mb-1">
                        <Box className="flex items-center space-x-2">
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: '0.75rem',
                              bgcolor: '#E0E7FF',
                              color: '#4F46E5'
                            }}
                          >
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {member.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {member.projectRole}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={`${memberTasks.length} tasks`}
                          size="small"
                          sx={{
                            backgroundColor: '#E5E7EB',
                            color: '#4B5563'
                          }}
                        />
                      </Box>
                      
                      <Box className="flex items-center justify-between mb-1">
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {progress}% completed
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {completedTasks}/{memberTasks.length} done
                        </Typography>
                      </Box>
                      
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#E5E7EB',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: progress >= 80 ? '#10B981' : 
                                           progress >= 50 ? '#F59E0B' : '#EF4444'
                          }
                        }}
                      />
                    </Box>
                  );
                })
              ) : (
                <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>
                  No team members assigned to this project
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

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
                const assignee = selectedProject.teamMembers.find(
                  member => member.id === e.target.value
                );
                setNewTask({...newTask, assignee});
              }}
              sx={{ textAlign: 'left' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {selectedProject?.teamMembers?.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  {member.name} ({member.projectRole})
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

export default TaskAssignment;