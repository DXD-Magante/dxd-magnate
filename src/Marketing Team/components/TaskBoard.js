import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  Tooltip,
  Badge,
  InputAdornment,
  FormControl,
  InputLabel,
  LinearProgress,
  Divider
} from "@mui/material";
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiMoreVertical,
  FiChevronDown,
  FiCalendar,
  FiTag,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiArchive,
  FiTrash2,
  FiEdit2
} from "react-icons/fi";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { auth, db } from "../../services/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

const statusColors = {
  'Backlog': '#e2e8f0',
  'To Do': '#bfdbfe',
  'In Progress': '#fed7aa',
  'Review': '#ddd6fe',
  'Done': '#bbf7d0',
  'Blocked': '#fecaca'
};

const priorityColors = {
  'Low': '#bbf7d0',
  'Medium': '#fed7aa',
  'High': '#fecaca',
  'Critical': '#ddd6fe'
};

const MarketingTaskBoard = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);

  // Fetch marketing collaborations where current user is mentor
  useEffect(() => {
    const fetchCollaborations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "marketing-collaboration"),
          where("MentorId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const collaborationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setCollaborations(collaborationsData);
        if (collaborationsData.length > 0) {
          setSelectedCollaboration(collaborationsData[0]);
        }
      } catch (error) {
        console.error("Error fetching collaborations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborations();
  }, []);

  // Fetch tasks for selected collaboration
  useEffect(() => {
    if (!selectedCollaboration) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "marketing-collaboration-tasks"),
        where("collaborationId", "==", selectedCollaboration.id)
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
  }, [selectedCollaboration]);

  // Fetch team members for the selected collaboration
  useEffect(() => {
    if (!selectedCollaboration) return;

    const members = selectedCollaboration.TeamMembers || [];
    setTeamMembers(members);
  }, [selectedCollaboration]);

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
        const taskRef = doc(db, "marketing-collaboration-tasks", taskId);
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
    if (!selectedCollaboration) return;
  
    try {
      const taskData = {
        ...newTask,
        collaborationId: selectedCollaboration.id,
        collaborationTitle: selectedCollaboration.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: newTask.assignee.id ? newTask.assignee : { name: 'Unassigned', avatar: 'UA' },
        labels: newTask.labels || []
      };
  
      // Add to Firestore
      const docRef = await addDoc(collection(db, "marketing-collaboration-tasks"), taskData);
      
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: 4,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Marketing Task Board
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Manage tasks for your marketing collaborations
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          width: { xs: '100%', md: 'auto' },
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          {collaborations.length > 0 && (
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="collaboration-select-label">Select Collaboration</InputLabel>
              <Select
                labelId="collaboration-select-label"
                value={selectedCollaboration?.id || ''}
                onChange={(e) => {
                  const collab = collaborations.find(c => c.id === e.target.value);
                  setSelectedCollaboration(collab);
                }}
                label="Select Collaboration"
                sx={{ backgroundColor: 'white' }}
              >
                {collaborations.map(collab => (
                  <MenuItem key={collab.id} value={collab.id}>
                    {collab.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => setOpenTaskDialog(true)}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              whiteSpace: 'nowrap'
            }}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.08)'
      }}>
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
              size="small"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              size="small"
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
              size="small"
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Paper>

      {/* Task Board */}
      {selectedCollaboration ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Grid container spacing={2}>
            {filteredColumns.map((column) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={column.id}>
                <Paper sx={{ 
                  borderRadius: 2, 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid rgba(0,0,0,0.08)'
                }}>
                  <Box sx={{ 
                    p: 2, 
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: statusColors[column.title] || '#f8fafc'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {column.title}
                      </Typography>
                      <Chip 
                        label={column.tasks.length} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          fontWeight: 500
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
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
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
                                  
                                  {task.labels?.length > 0 && (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
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
                                  )}
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip
                                        label={task.priority}
                                        size="small"
                                        sx={{
                                          backgroundColor: priorityColors[task.priority],
                                          color: '#1e293b',
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
                                    
                                    {task.dueDate && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                                        <FiCalendar size={14} style={{ marginRight: 4 }} />
                                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </Box>
                                    )}
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
      ) : (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px dashed #e2e8f0'
        }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
            {collaborations.length === 0 
              ? "You don't have any marketing collaborations yet" 
              : "Please select a collaboration to view tasks"}
          </Typography>
          {collaborations.length === 0 && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
            >
              Create Collaboration
            </Button>
          )}
        </Paper>
      )}

      {/* Add Task Dialog */}
      <Dialog 
        open={openTaskDialog} 
        onClose={() => setOpenTaskDialog(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Add New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                    const selectedMember = teamMembers.find(member => member.id === e.target.value);
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
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {teamMembers.map((member) => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                Labels
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Content', 'SEO', 'Social', 'Ads', 'Graphics', 'Video', 'Campaign'].map((label) => (
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
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenTaskDialog(false)}
            sx={{ color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTask.title}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
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

export default MarketingTaskBoard;