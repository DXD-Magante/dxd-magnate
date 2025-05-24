import React, { useState, useEffect } from "react"; 
import { 
  FiEdit2, FiEye, FiPlus, FiFilter, 
  FiCalendar, FiUser, FiClock, FiAlertTriangle,
  FiCheckCircle, FiPieChart, FiUsers, FiSearch 
} from "react-icons/fi";
import { 
  Box, Typography, Avatar, AvatarGroup, 
  Button, Chip, Divider, TextField,
  Menu, MenuItem, Badge, Tooltip,
  LinearProgress, Paper, Table, TableBody,
  TableCell, TableHead, TableRow, TablePagination, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputLabel, Select, FormControl, TableContainer,
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, } from "firebase/firestore";
import { db } from "../../services/firebase";

// Format date without timezone issues
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Calculate days remaining
const daysRemaining = (deadline) => {
  if (!deadline) return 0;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const statusColors = {
  "In progress": "success",
  "Not started yet": "warning",
  "Pending Review": "info",
  "Stalled": "error",
  "Completed": "primary"
};

const priorityColors = {
  "High": "error",
  "Medium": "warning",
  "Low": "success"
};

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const OngoingProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newManager, setNewManager] = useState("");
  const [projectManagers, setProjectManagers] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});


  useEffect(() => {
    const fetchProjectsAndTasks = async () => {
      try {
        // Fetch projects
        const projectsQuery = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = projectsQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch all tasks
        const tasksQuery = await getDocs(collection(db, "project-tasks"));
        const tasksData = tasksQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate task progress for each project
        const tasksByProject = {};
        tasksData.forEach(task => {
          if (!tasksByProject[task.projectId]) {
            tasksByProject[task.projectId] = {
              total: 0,
              completed: 0
            };
          }
          tasksByProject[task.projectId].total++;
          if (task.status === "Done") {
            tasksByProject[task.projectId].completed++;
          }
        });
        
        setTasksByProject(tasksByProject);
        
        // Map projects with progress data
        const enrichedProjects = projectsData.map(project => {
          const taskStats = tasksByProject[project.id] || { total: 0, completed: 0 };
          const progress = taskStats.total > 0 
            ? Math.round((taskStats.completed / taskStats.total) * 100)
            : calculateProgress(project.status);
            
          return {
            id: project.id,
            name: project.title || "Untitled Project",
            client: project.clientName || project.company || "Unknown Client",
            team: project.teamMembers || [],
            startDate: project.startDate || "",
            deadline: project.endDate || "",
            progress: progress,
            priority: project.priority ? capitalizeFirstLetter(project.priority) : "Medium",
            status: project.status ? capitalizeFirstLetter(project.status) : "Not started yet",
            manager: project.projectManager || "Not assigned",
            description: project.description || "No description available",
            budget: project.budget || "Not specified",
            type: project.type || "Unknown",
            totalTasks: taskStats.total,
            completedTasks: taskStats.completed
          };
        });
        
        setProjects(enrichedProjects);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAndTasks();
  }, []);



  useEffect(() => {
    const fetchProjectManagers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "Project Manager"),
          where("status", "==", "active")
        );
        const querySnapshot = await getDocs(q);
        const managers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fullName: `${doc.data().firstName} ${doc.data().lastName}`
        }));
        setProjectManagers(managers);
      } catch (error) {
        console.error("Error fetching project managers: ", error);
      }
    };
  
    fetchProjectManagers();
  }, []);


  

  const calculateProgress = (status) => {
    switch (status) {
      case "Not started yet":
        return 0;
      case "In progress":
        return 50;
      case "Completed":
        return 100;
      default:
        return 30;
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setNewManager(project.manager);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveChanges = async () => {
    try {
      const selectedManager = projectManagers.find(m => m.fullName === newManager);
      const isNewManagerAssigned = newManager !== "Not assigned" && selectedProject.manager !== newManager;
      
      // Prepare updates for the project
      const projectUpdates = {
        projectManager: newManager,
        projectManagerId: selectedManager?.id || null
      };
      
      // If this is a new manager assignment, also update status to "In Progress"
      if (isNewManagerAssigned) {
        projectUpdates.status = "In progress";
      }
      
      // Update local state
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id ? { 
          ...p, 
          ...projectUpdates,
          status: isNewManagerAssigned ? "In progress" : p.status
        } : p
      );
      setProjects(updatedProjects);
      
      // Update Firestore document
      if (selectedProject.id) {
        const projectRef = doc(db, "dxd-magnate-projects", selectedProject.id);
        await updateDoc(projectRef, projectUpdates);
        
        // If a new manager was assigned, create activity and notification
        if (isNewManagerAssigned && selectedManager) {
          // Create activity log
          const activitiesRef = collection(db, "project-activities");
          await addDoc(activitiesRef, {
            projectId: selectedProject.id,
            projectName: selectedProject.name,
            message: `Project manager assigned: ${newManager}`,
            type: "team",
            timestamp: new Date(),
            userId: selectedManager.id,
            userFullName: newManager,
            actionType: "manager_assignment"
          });
  
          // Create manager notification
          const notificationsRef = collection(db, "project-manager-notifications");
          await addDoc(notificationsRef, {
            projectId: selectedProject.id,
            projectName: selectedProject.name,
            userId: selectedManager.id,
            timestamp: new Date(),
            type: "Project",
            message: `You have been assigned as manager for project: ${selectedProject.name}`,
            viewed: false,
            actionType: "manager_assignment",
            priority: selectedProject.priority || "Medium"
          });
        }
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Error updating project: ", error);
      alert("Failed to update project: " + error.message);
    }
  };
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = selectedPriority === "All" || project.priority === selectedPriority;
    const matchesStatus = selectedStatus === "All" || project.status === selectedStatus;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredProjects.length - page * rowsPerPage);

  const getProfileInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const stringToColor = (string) => {
    let hash = 0;
    let i;
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <Typography variant="h6">Loading projects...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Ongoing Projects
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<FiPlus />}
          sx={{ 
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Add New Project
        </Button>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search projects..."
          InputProps={{
            startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
          }}
          sx={{ 
            width: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box>
          <Button
            variant="outlined"
            startIcon={<FiFilter />}
            onClick={handleFilterClick}
            sx={{ 
              textTransform: 'none',
              color: '#64748b',
              borderColor: '#e2e8f0',
              '&:hover': { borderColor: '#cbd5e1' },
              mr: 2
            }}
          >
            Filters
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={selectedPriority}
                  label="Priority"
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="All">All Priorities</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Not started yet">Not Started</MenuItem>
                  <MenuItem value="Pending Review">Pending Review</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <StyledTableCell>Project Name</StyledTableCell>
                <StyledTableCell>Client</StyledTableCell>
                <StyledTableCell>Team</StyledTableCell>
                <StyledTableCell>Timeline</StyledTableCell>
                <StyledTableCell>Progress</StyledTableCell>
                <StyledTableCell>Priority</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{project.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.manager} (Manager)
                      </Typography>
                    </TableCell>
                    <TableCell>{project.client}</TableCell>
                    <TableCell>
  <AvatarGroup max={4}>
    {project.team.map((member, index) => (
      <Tooltip key={index} title={member.name || member}>
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            fontSize: '0.75rem',
            bgcolor: stringToColor(member.name || member)
          }}
          alt={member.name || member}
          src={member.photoURL || undefined}
        >
          {getProfileInitials(member.name || member)}
        </Avatar>
      </Tooltip>
    ))}
  </AvatarGroup>
</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FiCalendar style={{ marginRight: 8, color: '#64748b' }} />
                        <Box>
                          <Typography variant="body2">
                            {formatDate(project.startDate)} - {formatDate(project.deadline)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {daysRemaining(project.deadline)} days left
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={project.progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: project.progress > 70 ? '#10b981' : 
                                               project.progress > 30 ? '#f59e0b' : '#ef4444'
                              }
                            }} 
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {project.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={project.priority} 
                        size="small"
                        color={priorityColors[project.priority]}
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={project.status} 
                        size="small"
                        color={statusColors[project.status]}
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<FiEye size={14} />}
                            onClick={() => handleViewDetails(project)}
                            sx={{ 
                              minWidth: 0, 
                              p: '6px 8px',
                              borderColor: '#e2e8f0',
                              color: '#64748b'
                            }}
                          >
                            View
                          </Button>
                        </Tooltip>
                        <Tooltip title="Edit Project">
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<FiEdit2 size={14} />}
                            sx={{ 
                              minWidth: 0, 
                              p: '6px 8px',
                              borderColor: '#e2e8f0',
                              color: '#64748b'
                            }}
                          >
                            Edit
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No projects found matching your criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {emptyRows > 0 && filteredProjects.length > 0 && (
                <TableRow style={{ height: 73 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>

      {/* Project Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 8, 
            height: 40, 
            backgroundColor: '#4f46e5', 
            borderRadius: 1, 
            mr: 2 
          }} />
          <Typography variant="h6" fontWeight="bold">
            {selectedProject?.name}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedProject && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Project Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProject.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(selectedProject.startDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Deadline
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(selectedProject.deadline)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Project Type
                  </Typography>
                  <Chip 
                    label={selectedProject.type} 
                    sx={{ 
                      backgroundColor: '#e0e7ff',
                      color: '#4f46e5',
                      fontWeight: 'medium'
                    }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Budget
                  </Typography>
                  <Typography variant="body2">
                    {selectedProject.budget}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ width: '100%', mr: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={selectedProject.progress} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: selectedProject.progress > 70 ? '#10b981' : 
                                 selectedProject.progress > 30 ? '#f59e0b' : '#ef4444'
                }
              }} 
            />
          </Box>
          <Typography variant="body2" fontWeight="bold">
            {selectedProject.progress}%
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {selectedProject.completedTasks} of {selectedProject.totalTasks} tasks completed
        </Typography>
      </Box>

              <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
              <Box sx={{ flex: 1 }}>
  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
    Team Members
  </Typography>
  <AvatarGroup max={6} sx={{ justifyContent: 'flex-start' }}>
    {selectedProject.team.map((member, index) => (
      <Tooltip key={index} title={member.name || member}>
        <Avatar 
          sx={{ 
            width: 40, 
            height: 40,
            bgcolor: stringToColor(member.name || member)
          }}
          alt={member.name || member}
          src={member.photoURL || undefined}
        >
          {getProfileInitials(member.name || member)}
        </Avatar>
      </Tooltip>
    ))}
  </AvatarGroup>
</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Project Manager
                  </Typography>
                  <FormControl fullWidth size="small">
                  <Select
      value={newManager}
      onChange={(e) => setNewManager(e.target.value)}
      sx={{ minWidth: 200 }}
      label="Project Manager"
    >
      <MenuItem value="Not assigned">Not assigned</MenuItem>
      {projectManagers.map((manager) => (
        <MenuItem key={manager.id} value={manager.fullName}>
          {manager.fullName}
        </MenuItem>
      ))}
      </Select>
                  </FormControl>
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Project Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip 
                    label={selectedProject.status} 
                    color={statusColors[selectedProject.status]}
                    sx={{ fontWeight: 'medium' }}
                  />
                  <Chip 
                    label={selectedProject.priority} 
                    color={priorityColors[selectedProject.priority]}
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: 2, 
                p: 2,
                border: '1px solid #e2e8f0'
              }}>
                {[
                  "Project created",
                  "Initial requirements gathered",
                  "Team assigned",
                  "Kickoff meeting scheduled"
                ].map((activity, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: '#4f46e5', 
                      mr: 2 
                    }} />
                    <Typography variant="body2">{activity}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: '#64748b',
              '&:hover': { backgroundColor: 'transparent' }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleSaveChanges}
            sx={{ 
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OngoingProjects;