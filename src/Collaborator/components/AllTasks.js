import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Pagination,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

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

const AllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const rowsPerPage = 8;

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

        // Fetch tasks assigned to current user
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", user.uid)
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
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const paginatedTasks = filteredTasks.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, "project-tasks", taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done': return <FiCheckCircle className="text-green-500" />;
      case 'Blocked': return <FiAlertCircle className="text-red-500" />;
      case 'In Progress': return <FiClock className="text-amber-500" />;
      default: return <FiClock className="text-blue-500" />;
    }
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="mb-6">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          All Tasks
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          View and manage all tasks assigned to you across projects
        </Typography>
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
          <Grid item xs={6} md={2}>
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
              <MenuItem value="Blocked">Blocked</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
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
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
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

      {/* Tasks Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTasks.length > 0 ? (
                  paginatedTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Box className="flex items-center gap-3">
                          <Tooltip title={task.status}>
                            <span>{getStatusIcon(task.status)}</span>
                          </Tooltip>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {task.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              {task.description.substring(0, 50)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {task.projectTitle}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {task.clientName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            backgroundColor: priorityColors[task.priority].split(' ')[0],
                            color: priorityColors[task.priority].split(' ')[1],
                            fontWeight: 'bold',
                            fontSize: '0.65rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          size="small"
                          sx={{
                            backgroundColor: statusColors[task.status].split(' ')[0],
                            color: statusColors[task.status].split(' ')[1],
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            '& .MuiSelect-icon': {
                              color: statusColors[task.status].split(' ')[1]
                            },
                            '&:before': { borderBottom: 'none' },
                            '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                          }}
                          IconComponent={FiChevronDown}
                        >
                          <MenuItem value="Backlog">Backlog</MenuItem>
                          <MenuItem value="To Do">To Do</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Review">Review</MenuItem>
                          <MenuItem value="Done">Done</MenuItem>
                          <MenuItem value="Blocked">Blocked</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Box className="flex items-center gap-1">
                          <FiCalendar size={14} className="text-gray-500" />
                          <Typography variant="body2">
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Typography>
                          {new Date(task.dueDate) < new Date() && task.status !== 'Done' && (
                            <Chip
                              label="Overdue"
                              size="small"
                              sx={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                fontSize: '0.65rem',
                                ml: 1
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box className="flex gap-2">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTask(task);
                                setOpenTaskDialog(true);
                              }}
                              sx={{
                                backgroundColor: '#e0e7ff',
                                color: '#4f46e5',
                                '&:hover': {
                                  backgroundColor: '#c7d2fe'
                                }
                              }}
                            >
                              <FiEye size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#64748b' }}>
                        No tasks found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredTasks.length > 0 && (
            <Box className="flex justify-center mt-4">
              <Pagination
                count={Math.ceil(filteredTasks.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                shape="rounded"
                color="primary"
              />
            </Box>
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
                <Chip
                  label={selectedTask.status}
                  size="small"
                  sx={{
                    backgroundColor: statusColors[selectedTask.status].split(' ')[0],
                    color: statusColors[selectedTask.status].split(' ')[1],
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
                      {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                    {new Date(selectedTask.dueDate) < new Date() && selectedTask.status !== 'Done' && (
                      <Chip
                        label="Overdue"
                        size="small"
                        sx={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          fontSize: '0.65rem',
                          ml: 1
                        }}
                      />
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
          <Button onClick={() => setOpenTaskDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllTasks;