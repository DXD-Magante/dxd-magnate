import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  Checkbox,
  ListItemText,
  Autocomplete,
  Tabs,
  Tab,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardActions
} from "@mui/material";
import {
  FiFilter,
  FiSearch,
  FiCalendar,
  FiPlus,
  FiRefreshCw,
  FiDownload,
  FiPrinter,
  FiShare2,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiUsers,
  FiTag,
  FiX,
  FiLink,
  FiFlag,
  FiAward,
  FiCheckSquare,
  FiTarget,
  FiBarChart2,
  FiEdit2,
  FiTrash2,
  FiMail
} from "react-icons/fi";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { format, isToday, isTomorrow, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

const MilestoneView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentView, setCurrentView] = useState("list");
  const [openModal, setOpenModal] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [clientDetails, setClientDetails] = useState(null);
  const [projectManager, setProjectManager] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    description: "",
    status: "upcoming",
    participants: [],
    project: "",
    projectId: "",
    color: "#8b5cf6"
  });

  const [milestones, setMilestones] = useState([]);

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
          setFormData(prev => ({
            ...prev,
            project: projectsData[0].title,
            projectId: projectsData[0].id
          }));
          fetchProjectTeam(projectsData[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch project team members, client and PM details
  const fetchProjectTeam = async (project) => {
    try {
      // Get team members
      const members = project.teamMembers || [];
      
      // Get client details
      let client = null;
      if (project.clientId) {
        const clientQuery = query(
          collection(db, "users"),
          where("uid", "==", project.clientId)
        );
        const clientSnapshot = await getDocs(clientQuery);
        if (!clientSnapshot.empty) {
          client = {
            id: project.clientId,
            name: project.clientName,
            ...clientSnapshot.docs[0].data()
          };
        }
      }
      
      // Get project manager details
      let pm = null;
      if (project.projectManagerId) {
        const pmQuery = query(
          collection(db, "users"),
          where("uid", "==", project.projectManagerId)
        );
        const pmSnapshot = await getDocs(pmQuery);
        if (!pmSnapshot.empty) {
          pm = {
            id: project.projectManagerId,
            name: project.projectManager,
            ...pmSnapshot.docs[0].data()
          };
        }
      }
      
      setTeamMembers(members);
      setClientDetails(client);
      setProjectManager(pm);
    } catch (error) {
      console.error("Error fetching project team:", error);
    }
  };

  // Handle project change
  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    setFormData(prev => ({
      ...prev,
      project: project.title,
      projectId: project.id
    }));
    await fetchProjectTeam(project);
  };

  // Fetch milestones for selected project
  useEffect(() => {
    if (!selectedProject) return;
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, "project-timeline"),
        where("projectId", "==", selectedProject.id),
        where("type", "==", "milestone")
      ),
      (snapshot) => {
        const milestonesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMilestones(milestonesData);
      },
      (error) => {
        console.error("Error fetching milestones:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedProject]);

  // Helper functions for date handling
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-800", icon: <FiClock className="text-blue-500" /> },
      "in-progress": { label: "In Progress", color: "bg-amber-100 text-amber-800", icon: <FiRefreshCw className="text-amber-500 animate-spin" /> },
      completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: <FiCheckCircle className="text-green-500" /> },
      delayed: { label: "Delayed", color: "bg-red-100 text-red-800", icon: <FiAlertCircle className="text-red-500" /> }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: <FiClock className="text-gray-500" /> };
    
    return (
      <Chip 
        label={statusInfo.label} 
        size="small" 
        icon={statusInfo.icon}
        className={`${statusInfo.color} text-xs font-medium`}
        sx={{ pl: 1 }}
      />
    );
  };

  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         milestone.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || milestone.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (milestone = null) => {
    if (milestone) {
      setCurrentMilestone(milestone);
      const milestoneDate = parseISO(milestone.date);
      setFormData({
        title: milestone.title,
        date: format(milestoneDate, "yyyy-MM-dd"),
        description: milestone.description,
        status: milestone.status,
        participants: milestone.participants || [],
        project: milestone.project,
        projectId: milestone.projectId,
        color: milestone.color || "#8b5cf6"
      });
    } else {
      setCurrentMilestone(null);
      setFormData({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        status: "upcoming",
        participants: [],
        project: selectedProject?.title || "",
        projectId: selectedProject?.id || "",
        color: "#8b5cf6"
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParticipantChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      participants: newValue
    }));
  };

  const handleSubmit = async () => {
    try {
      const milestoneData = {
        ...formData,
        date: new Date(`${formData.date}T00:00:00`).toISOString(),
        type: "milestone",
        createdAt: currentMilestone ? currentMilestone.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (currentMilestone) {
        // Update existing milestone
        await updateDoc(doc(db, "project-timeline", currentMilestone.id), milestoneData);
      } else {
        // Add new milestone
        await addDoc(collection(db, "project-timeline"), milestoneData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error("Error saving milestone:", error);
    }
  };

  const getAllParticipants = () => {
    const participants = [];
    
    // Add team members
    if (teamMembers && teamMembers.length > 0) {
      teamMembers.forEach(member => {
        participants.push({
          id: member.id,
          name: member.name,
          role: member.projectRole,
          type: 'team'
        });
      });
    }
    
    // Add client
    if (clientDetails) {
      participants.push({
        id: clientDetails.uid,
        name: clientDetails.firstName + ' ' + clientDetails.lastName,
        role: 'Client',
        type: 'client'
      });
    }
    
    // Add project manager
    if (projectManager) {
      participants.push({
        id: projectManager.uid,
        name: projectManager.firstName + ' ' + projectManager.lastName,
        role: 'Project Manager',
        type: 'pm'
      });
    }
    
    return participants;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="textSecondary">
          You don't have any projects assigned yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900">
            Project Milestones
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Track and manage all project milestones
          </Typography>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FiPlus />}
            onClick={() => handleOpenModal()}
          >
            New Milestone
          </Button>
        </div>
      </div>
      
      {/* Project Selector */}
      <Paper className="p-4 mb-6 rounded-lg shadow-sm">
        <FormControl fullWidth>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={selectedProject?.id || ''}
            onChange={handleProjectChange}
            label="Select Project"
          >
            {projects.map(project => (
              <MenuItem key={project.id} value={project.id}>
                {project.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Filters and Controls */}
      <Paper className="p-4 mb-6 rounded-lg shadow-sm">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search milestones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="delayed">Delayed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Milestones List */}
      <Paper className="p-4 rounded-lg shadow-sm">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-12">
            <FiFlag className="mx-auto text-gray-400" size={48} />
            <Typography variant="h6" className="mt-4 text-gray-600">
              No milestones found for {selectedProject?.title}
            </Typography>
            <Typography variant="body2" className="text-gray-500 mt-2">
              Try adjusting your filters or create a new milestone
            </Typography>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMilestones.map((milestone) => (
              <Card 
                key={milestone.id} 
                className="hover:shadow-lg transition-shadow"
                sx={{ borderLeft: `4px solid ${milestone.color || "#8b5cf6"}` }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: milestone.color || "#8b5cf6" }}>
                      <FiFlag className="text-white" />
                    </Avatar>
                  }
                  action={
                    <div className="flex gap-2">
                      <IconButton onClick={() => handleOpenModal(milestone)}>
                        <FiEdit2 size={18} />
                      </IconButton>
                      <IconButton>
                        <FiTrash2 size={18} />
                      </IconButton>
                    </div>
                  }
                  title={
                    <Typography variant="h6" className="font-medium">
                      {milestone.title}
                    </Typography>
                  }
                  subheader={
                    <div className="flex items-center gap-2 mt-1">
                      <FiCalendar className="text-gray-400" size={14} />
                      <Typography variant="body2" className="text-gray-600">
                        {formatDateTime(milestone.date)}
                      </Typography>
                      {getStatusBadge(milestone.status)}
                    </div>
                  }
                />
                <CardContent>
                  <Typography variant="body2" className="text-gray-600 mb-4">
                    {milestone.description}
                  </Typography>
                  
                  {milestone.participants && milestone.participants.length > 0 && (
                    <div className="mb-4">
                      <Typography variant="subtitle2" className="text-gray-500 mb-2">
                        Participants:
                      </Typography>
                      <div className="flex flex-wrap gap-2">
                        {milestone.participants.map((participant) => (
                          <Chip
                            key={participant.id}
                            avatar={<Avatar sx={{ width: 24, height: 24 }}>{participant.name.charAt(0)}</Avatar>}
                            label={`${participant.name} (${participant.role})`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardActions className="flex justify-between items-center border-t border-gray-100">
                  <Typography variant="caption" className="text-gray-500">
                    {milestone.project}
                  </Typography>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<FiMail />}
                      onClick={() => {
                        window.location.href = `mailto:?subject=Milestone: ${milestone.title}&body=Project: ${milestone.project}%0D%0A%0D%0ADate: ${formatDateTime(milestone.date)}%0D%0A%0D%0ADescription: ${milestone.description}`;
                      }}
                    >
                      Notify Team
                    </Button>
                  </div>
                </CardActions>
              </Card>
            ))}
          </div>
        )}
      </Paper>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Total Milestones
          </Typography>
          <Typography variant="h4" className="font-bold">
            {filteredMilestones.length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Completed
          </Typography>
          <Typography variant="h4" className="font-bold text-green-600">
            {filteredMilestones.filter(m => m.status === 'completed').length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Upcoming
          </Typography>
          <Typography variant="h4" className="font-bold text-blue-600">
            {filteredMilestones.filter(m => m.status === 'upcoming').length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Delayed
          </Typography>
          <Typography variant="h4" className="font-bold text-red-600">
            {filteredMilestones.filter(m => m.status === 'delayed').length}
          </Typography>
        </Paper>
      </div>

      {/* Milestone Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <Typography variant="h6">
              {currentMilestone ? "Edit Milestone" : "Create New Milestone"}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <FiX />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} className="mt-2">
            <TextField
              fullWidth
              label="Milestone Title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              variant="outlined"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiFlag className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              variant="outlined"
              multiline
              rows={4}
            />
            
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleFormChange}
              variant="outlined"
              InputLabelProps={{
                shrink: true,
              }}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiCalendar className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                label="Status"
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="delayed">Delayed</MenuItem>
              </Select>
            </FormControl>
            
            <Autocomplete
              multiple
              options={getAllParticipants()}
              getOptionLabel={(option) => `${option.name} (${option.role})`}
              value={formData.participants}
              onChange={handleParticipantChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Participants"
                  placeholder="Select attendees"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiUsers className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox checked={selected} />
                  <ListItemText 
                    primary={option.name} 
                    secondary={option.role} 
                  />
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    avatar={<Avatar sx={{ width: 24, height: 24 }}>{option.name.charAt(0)}</Avatar>}
                    label={`${option.name} (${option.role})`}
                    size="small"
                  />
                ))
              }
            />
            
            <TextField
              fullWidth
              label="Project"
              name="project"
              value={formData.project}
              disabled
              variant="outlined"
            />
            
            <div>
              <Typography variant="body2" className="mb-2 text-gray-600">
                Milestone Color
              </Typography>
              <div className="flex gap-2">
                {['#8b5cf6', '#3b82f6', '#4f46e5', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                  <div
                    key={color}
                    className={`w-8 h-8 rounded-full cursor-pointer ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentMilestone ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MilestoneView;