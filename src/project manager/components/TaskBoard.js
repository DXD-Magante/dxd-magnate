import React, { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Paper, 
  Button, Chip, Avatar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, Tooltip, Badge, InputAdornment
} from "@mui/material";
import {
  FiPlus, FiFilter, FiSearch, FiMoreVertical,
  FiChevronDown, FiCalendar, FiTag, FiUser,
  FiCheckCircle, FiAlertCircle, FiClock, FiArchive
} from "react-icons/fi";
import { 
  FaRegCircle, FaCircle,
  FaRegCheckCircle, FaRegClock
} from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, doc, updateDoc, getDocs, query, where, onSnapshot } from "firebase/firestore";

const statusColors = {
  'Backlog': 'bg-gray-100 text-gray-800',
  'To Do': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  'Review': 'bg-purple-100 text-purple-800',
  'Done': 'bg-green-100 text-green-800',
  'Blocked': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-amber-100 text-amber-800',
  'High': 'bg-red-100 text-red-800',
  'Critical': 'bg-purple-100 text-purple-800'
};

const TaskBoard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [columns, setColumns] = useState({
    'backlog': { id: 'backlog', title: 'Backlog', tasks: [] },
    'todo': { id: 'todo', title: 'To Do', tasks: [] },
    'in-progress': { id: 'in-progress', title: 'In Progress', tasks: [] },
    'review': { id: 'review', title: 'Review', tasks: [] },
    'done': { id: 'done', title: 'Done', tasks: [] }
  });
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Backlog',
    assignee: { id: null, name: 'Unassigned', avatar: 'UA' },
    dueDate: '',
    labels: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [teamMembers, setTeamMembers] = useState([]);

  // Fetch projects where current user is project manager
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
      }
    };

    fetchProjects();
  }, []);

  // Fetch tasks for selected project
  useEffect(() => {
    if (!selectedProject) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "project-tasks"),
        where("projectId", "==", selectedProject.id)
      ),
      (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Organize tasks into columns
        const updatedColumns = { ...columns };
        Object.keys(updatedColumns).forEach(colId => {
          updatedColumns[colId].tasks = [];
        });

        tasks.forEach(task => {
          const columnId = getColumnIdFromStatus(task.status);
          if (columnId && updatedColumns[columnId]) {
            updatedColumns[columnId].tasks.push(task);
          }
        });

        setColumns(updatedColumns);
      },
      (error) => {
        console.error("Error fetching tasks:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedProject]);

  const getColumnIdFromStatus = (status) => {
    switch (status) {
      case 'Backlog': return 'backlog';
      case 'To Do': return 'todo';
      case 'In Progress': return 'in-progress';
      case 'Review': return 'review';
      case 'Done': return 'done';
      default: return 'backlog';
    }
  };

  const getStatusFromColumnId = (columnId) => {
    switch (columnId) {
      case 'backlog': return 'Backlog';
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'review': return 'Review';
      case 'done': return 'Done';
      default: return 'Backlog';
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) return;

    const startColumn = columns[source.droppableId];
    const finishColumn = columns[destination.droppableId];
    const taskId = draggableId;

    if (startColumn === finishColumn) {
      // Reordering within same column
      const newTasks = Array.from(startColumn.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newColumn = {
        ...startColumn,
        tasks: newTasks
      };

      setColumns({
        ...columns,
        [newColumn.id]: newColumn
      });
    } else {
      // Moving between columns - update status in Firestore
      try {
        const taskRef = doc(db, "project-tasks", taskId);
        await updateDoc(taskRef, {
          status: getStatusFromColumnId(destination.droppableId),
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error updating task status:", error);
      }
    }
  };

  const handleAddTask = async () => {
    if (!selectedProject) return;
  
    try {
      const taskData = {
        ...newTask,
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
        clientId: selectedProject.clientId,
        clientName: selectedProject.clientName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: newTask.assignee.id ? newTask.assignee : { name: 'Unassigned', avatar: 'UA' },
        labels: newTask.labels || []
      };
  
      // Add to Firestore
      const docRef = await addDoc(collection(db, "project-tasks"), taskData);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Backlog',
        assignee: { id: null, name: 'Unassigned', avatar: 'UA' },
        dueDate: '',
        labels: []
      });
      setOpenTaskDialog(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const filteredColumns = Object.values(columns).map(column => {
    return {
      ...column,
      tasks: column.tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            task.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
    };
  });

  return (
    <Box className="space-y-6">
      {/* Header with Actions */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <Box className="flex items-center gap-4">
          {projects.length > 0 && (
            <Select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project);
              }}
              sx={{ minWidth: 200, backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          )}
          </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Task Board
          </Typography>
          <Typography variant="h6" sx={{ color: '#64748b', textAlign:'center' }}>
              {selectedProject ? `Managing tasks for ${selectedProject.title}` : 'Select a project'}
            </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Drag and drop tasks to manage your workflow
          </Typography>
        </Box>
        <Box className="flex items-center gap-3">
          <Button 
            variant="contained" 
            startIcon={<FiPlus size={18} />}
            onClick={() => setOpenTaskDialog(true)}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca',
              }
            }}
          >
            Add Task
          </Button>
        </Box>
      </Box>

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
              <MenuItem value="Backlog">Backlog</MenuItem>
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Review">Review</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
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
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<FiFilter size={18} />}
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
              Advanced
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Task Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={3}>
          {filteredColumns.map((column) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={column.id}>
              <Paper sx={{ 
                borderRadius: 2, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Box sx={{ 
                  p: 2, 
                  borderBottom: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc'
                }}>
                  <Box className="flex items-center justify-between">
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {column.title}
                    </Typography>
                    <Chip 
                      label={column.tasks.length} 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0'
                      }} 
                    />
                  </Box>
                </Box>
                
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <Box 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ 
                        p: 2, 
                        flexGrow: 1,
                        minHeight: '100px',
                        backgroundColor: column.tasks.length === 0 ? '#f8fafc' : 'white'
                      }}
                    >
                      {column.tasks.length > 0 ? (
                        column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                sx={{ 
                                  p: 2, 
                                  mb: 2, 
                                  borderRadius: 2,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  cursor: 'grab',
                                  '&:hover': {
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                  }
                                }}
                              >
                                <Box className="flex justify-between items-start mb-2">
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {task.title}
                                  </Typography>
                                  <IconButton size="small">
                                    <FiMoreVertical size={16} />
                                  </IconButton>
                                </Box>
                                
                                <Typography variant="body2" sx={{ 
                                  color: '#64748b', 
                                  mb: 2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {task.description}
                                </Typography>
                                
                                <Box className="flex flex-wrap gap-1 mb-3">
                                  {task.labels.map((label, idx) => (
                                    <Chip
                                      key={idx}
                                      label={label}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#f1f5f9',
                                        color: '#64748b',
                                        fontSize: '0.65rem',
                                        height: '20px'
                                      }}
                                    />
                                  ))}
                                </Box>
                                
                                <Box className="flex items-center justify-between">
                                  <Box className="flex items-center space-x-2">
                                    <Chip
                                      label={task.priority}
                                      size="small"
                                      sx={{
                                        backgroundColor: priorityColors[task.priority].split(' ')[0],
                                        color: priorityColors[task.priority].split(' ')[1],
                                        fontSize: '0.65rem',
                                        height: '20px'
                                      }}
                                    />
                                    <Tooltip title={task.assignee.name}>
                                      <Avatar 
                                        sx={{ 
                                          width: 24, 
                                          height: 24, 
                                          fontSize: '0.65rem',
                                          bgcolor: '#e0e7ff',
                                          color: '#4f46e5'
                                        }}
                                      >
                                        {task.assignee.avatar}
                                      </Avatar>
                                    </Tooltip>
                                  </Box>
                                  
                                  <Box className="flex items-center text-sm text-gray-500">
                                    <FiCalendar size={14} className="mr-1" />
                                    <span>
                                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </Box>
                                </Box>
                              </Paper>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          height: '100px',
                          color: '#94a3b8'
                        }}>
                          <FiArchive size={24} />
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            No tasks here
                          </Typography>
                        </Box>
                      )}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
                
                <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                  <Button 
                    fullWidth 
                    startIcon={<FiPlus size={16} />}
                    onClick={() => {
                      setNewTask(prev => ({ ...prev, status: column.title }));
                      setOpenTaskDialog(true);
                    }}
                    sx={{
                      color: '#64748b',
                      '&:hover': {
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  >
                    Add Task
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>

      {/* Add Task Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add New Task</DialogTitle>
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
                  label="Status"
                  value={newTask.status}
                  onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                  sx={{ textAlign: 'left' }}
                  IconComponent={FiChevronDown}
                >
                  <MenuItem value="Backlog">Backlog</MenuItem>
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Review">Review</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                </Select>
              </Grid>
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
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
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
              <Grid item xs={6}>
              <Select
  fullWidth
  label="Assignee"
  value={newTask.assignee?.id || ''}
  onChange={(e) => {
    const selectedMember = selectedProject?.teamMembers?.find(member => member.id === e.target.value);
    if (selectedMember) {
      setNewTask({
        ...newTask, 
        assignee: {
          id: selectedMember.id,
          name: selectedMember.name,
          avatar: selectedMember.name.split(' ').map(n => n[0]).join('')
        }
      });
    }
  }}
  sx={{ textAlign: 'left' }}
  IconComponent={FiChevronDown}
>
  <MenuItem value="">
    <em>Unassigned</em>
  </MenuItem>
  {selectedProject?.teamMembers?.map((member) => (
    <MenuItem key={member.id} value={member.id}>
      {member.name} ({member.projectRole})
    </MenuItem>
  ))}
</Select>
              </Grid>
            </Grid>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                Labels
              </Typography>
              <Box className="flex flex-wrap gap-2">
                {['Frontend', 'Backend', 'API', 'UI/UX', 'Bug', 'Marketing','Strategy', 'Content', 'QA'].map((label) => (
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
                      backgroundColor: newTask.labels.includes(label) ? '#e0e7ff' : '#f1f5f9',
                      color: newTask.labels.includes(label) ? '#4f46e5' : '#64748b'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTask.title}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca',
              },
              '&:disabled': {
                backgroundColor: '#e2e8f0',
                color: '#94a3b8'
              }
            }}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskBoard;