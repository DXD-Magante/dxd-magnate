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
  Autocomplete
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
  FiZoomIn,
  FiZoomOut,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiPauseCircle,
  FiUsers,
  FiTag,
  FiX,
  FiLink
} from "react-icons/fi";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../services/firebase";

const TimelineView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
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
    type: "meeting",
    participants: [],
    project: "",
    projectId: "",
    color: "#3b82f6",
    meetingLink: ""
  });

  const [timelineData, setTimelineData] = useState([]);

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
          // Fetch team members for the first project
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

  // Fetch timeline events for selected project
  useEffect(() => {
    if (!selectedProject) return;
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, "project-timeline"),
        where("projectId", "==", selectedProject.id)
      ),
      (snapshot) => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTimelineData(events);
      },
      (error) => {
        console.error("Error fetching timeline events:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedProject]);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  // Helper function to get just the time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredData = timelineData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesType = filterType === "all" || item.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleZoomIn = () => {
    if (zoomLevel < 2) setZoomLevel(zoomLevel + 0.25);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.25);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FiCheckCircle className="text-green-500" />;
      case "in-progress":
        return <FiRefreshCw className="text-yellow-500 animate-spin" />;
      case "upcoming":
        return <FiClock className="text-blue-500" />;
      case "delayed":
        return <FiAlertCircle className="text-red-500" />;
      default:
        return <FiClock className="text-gray-500" />;
    }
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      meeting: { label: "Meeting", color: "bg-indigo-100 text-indigo-800" },
      milestone: { label: "Milestone", color: "bg-green-100 text-green-800" },
      sprint: { label: "Sprint", color: "bg-amber-100 text-amber-800" },
      review: { label: "Review", color: "bg-blue-100 text-blue-800" },
      testing: { label: "Testing", color: "bg-purple-100 text-purple-800" }
    };
    
    const typeInfo = typeMap[type] || { label: type, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Chip 
        label={typeInfo.label} 
        size="small" 
        className={`${typeInfo.color} text-xs font-medium`}
      />
    );
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setCurrentEvent(event);
      setFormData({
        title: event.title,
        date: event.date.split('T')[0],
        description: event.description,
        status: event.status,
        type: event.type,
        participants: event.participants || [],
        project: event.project,
        projectId: event.projectId,
        color: event.color,
        meetingLink: event.meetingLink || ""
      });
    } else {
      setCurrentEvent(null);
      setFormData({
        title: "",
        date: "",
        description: "",
        status: "upcoming",
        type: "meeting",
        participants: [],
        project: selectedProject?.title || "",
        projectId: selectedProject?.id || "",
        color: "#3b82f6",
        meetingLink: ""
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
      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        createdAt: currentEvent ? currentEvent.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // If it's not a meeting, remove the meeting link
      if (eventData.type !== "meeting") {
        delete eventData.meetingLink;
      }

      if (currentEvent) {
        // Update existing event
        await updateDoc(doc(db, "project-timeline", currentEvent.id), eventData);
      } else {
        // Add new event
        await addDoc(collection(db, "project-timeline"), eventData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error("Error saving timeline event:", error);
    }
  };

  // Get all available participants (team members + client + project manager)
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
            Project Timeline
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Visualize all project events and milestones
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
            Add Event
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search events..."
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
          
          <Grid item xs={6} md={4}>
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
          
          <Grid item xs={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="meeting">Meeting</MenuItem>
                <MenuItem value="milestone">Milestone</MenuItem>
                <MenuItem value="sprint">Sprint</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="testing">Testing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Timeline Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Typography variant="body2" className="text-gray-600">
            Showing {filteredData.length} events for {selectedProject?.title}
          </Typography>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
              <FiZoomOut />
            </IconButton>
          </Tooltip>
          
          <Typography variant="body2" className="text-gray-600">
            {Math.round(zoomLevel * 100)}%
          </Typography>
          
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 2}>
              <FiZoomIn />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem />
          
          <Tooltip title="Export">
            <IconButton>
              <FiDownload />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Print">
            <IconButton>
              <FiPrinter />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Share">
            <IconButton>
              <FiShare2 />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      
      {/* Timeline */}
      <Paper className="p-4 rounded-lg shadow-sm" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <FiCalendar className="mx-auto text-gray-400" size={48} />
            <Typography variant="h6" className="mt-4 text-gray-600">
              No events found for {selectedProject?.title}
            </Typography>
            <Typography variant="body2" className="text-gray-500 mt-2">
              Try adjusting your filters or add a new event
            </Typography>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredData.map((item) => (
              <div key={item.id} className="flex group">
                {/* Timeline line and dot */}
                <div className="flex flex-col items-center mr-4">
                  <div className={`w-3 h-3 rounded-full mt-1`} style={{ backgroundColor: item.color }}>
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="w-px h-full bg-gray-300 my-1"></div>
                </div>
                
                {/* Event card */}
                <Paper className="p-4 rounded-lg shadow-xs hover:shadow-md transition-shadow flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Typography variant="subtitle1" className="font-medium">
                        {item.title}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600 mt-1">
                        {item.description}
                      </Typography>
                      {item.type === "meeting" && item.meetingLink && (
                        <div className="mt-2">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FiLink />}
                            onClick={() => window.open(item.meetingLink, '_blank')}
                          >
                            Join Meeting
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      {getTypeBadge(item.type)}
                      <Typography variant="caption" className="text-gray-500 mt-1">
                        {formatDate(item.date)}
                      </Typography>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.participants && item.participants.length > 0 && (
                      <Tooltip title={
                        <div>
                          {item.participants.map(p => (
                            <div key={p.id}>{p.name} ({p.role})</div>
                          ))}
                        </div>
                      }>
                        <Chip 
                          avatar={<Avatar sx={{ width: 20, height: 20 }}><FiUsers size={12} /></Avatar>}
                          label={`${item.participants.length} participants`}
                          size="small"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                    <Chip 
                      avatar={<Avatar sx={{ width: 20, height: 20, bgcolor: item.color }}></Avatar>}
                      label={item.project}
                      size="small"
                      variant="outlined"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    <Typography variant="caption" className="text-gray-500">
                      {formatTime(item.date)}
                    </Typography>
                    <div className="flex gap-2">
                      <Button size="small" variant="text" onClick={() => handleOpenModal(item)}>Edit</Button>
                    </div>
                  </div>
                </Paper>
              </div>
            ))}
          </div>
        )}
      </Paper>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Total Events
          </Typography>
          <Typography variant="h4" className="font-bold">
            {filteredData.length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Completed
          </Typography>
          <Typography variant="h4" className="font-bold text-green-600">
            {filteredData.filter(item => item.status === 'completed').length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            In Progress
          </Typography>
          <Typography variant="h4" className="font-bold text-yellow-600">
            {filteredData.filter(item => item.status === 'in-progress').length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Upcoming
          </Typography>
          <Typography variant="h4" className="font-bold text-blue-600">
            {filteredData.filter(item => item.status === 'upcoming').length}
          </Typography>
        </Paper>
      </div>

      {/* Event Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <Typography variant="h6">
              {currentEvent ? "Edit Event" : "Add New Event"}
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
              label="Event Title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              variant="outlined"
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              variant="outlined"
              multiline
              rows={3}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    label="Type"
                  >
                    <MenuItem value="meeting">Meeting</MenuItem>
                    <MenuItem value="milestone">Milestone</MenuItem>
                    <MenuItem value="sprint">Sprint</MenuItem>
                    <MenuItem value="review">Review</MenuItem>
                    <MenuItem value="testing">Testing</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            {formData.type === "meeting" && (
              <TextField
                fullWidth
                label="Meeting Link"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleFormChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiLink className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
                placeholder="https://meet.google.com/abc-xyz"
              />
            )}
            
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
                  placeholder="Select team members, client, or PM"
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
                Color
              </Typography>
              <div className="flex gap-2">
                {['#3b82f6', '#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map(color => (
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
            {currentEvent ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimelineView;