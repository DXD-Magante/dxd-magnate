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
  Badge
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
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiUsers,
  FiTag,
  FiX,
  FiLink,
  FiVideo,
  FiMapPin,
  FiMail,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { format, isToday, isTomorrow, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

const MeetingsView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentView, setCurrentView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openModal, setOpenModal] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [clientDetails, setClientDetails] = useState(null);
  const [projectManager, setProjectManager] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "09:00",
    description: "",
    status: "upcoming",
    participants: [],
    project: "",
    projectId: "",
    color: "#f59e0b",
    meetingLink: "",
    location: ""
  });

  const [meetings, setMeetings] = useState([]);

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

  // Fetch meetings for selected project
  useEffect(() => {
    if (!selectedProject) return;
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, "project-timeline"),
        where("projectId", "==", selectedProject.id),
        where("type", "==", "meeting")
      ),
      (snapshot) => {
        const meetingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMeetings(meetingsData);
      },
      (error) => {
        console.error("Error fetching meetings:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedProject]);

  // Helper functions for date handling
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "h:mm a");
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "EEE, MMM d");
  };

  const getDayMeetings = (date) => {
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.date);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         meeting.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || meeting.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (meeting = null) => {
    if (meeting) {
      setCurrentMeeting(meeting);
      const meetingDate = parseISO(meeting.date);
      setFormData({
        title: meeting.title,
        date: format(meetingDate, "yyyy-MM-dd"),
        time: format(meetingDate, "HH:mm"),
        description: meeting.description,
        status: meeting.status,
        participants: meeting.participants || [],
        project: meeting.project,
        projectId: meeting.projectId,
        color: meeting.color || "#f59e0b",
        meetingLink: meeting.meetingLink || "",
        location: meeting.location || ""
      });
    } else {
      setCurrentMeeting(null);
      setFormData({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        description: "",
        status: "upcoming",
        participants: [],
        project: selectedProject?.title || "",
        projectId: selectedProject?.id || "",
        color: "#f59e0b",
        meetingLink: "",
        location: ""
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
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      const meetingData = {
        ...formData,
        date: dateTime.toISOString(),
        type: "meeting",
        createdAt: currentMeeting ? currentMeeting.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (currentMeeting) {
        // Update existing meeting
        await updateDoc(doc(db, "project-timeline", currentMeeting.id), meetingData);
      } else {
        // Add new meeting
        await addDoc(collection(db, "project-timeline"), meetingData);
      }
      
      handleCloseModal();
    } catch (error) {
      console.error("Error saving meeting:", error);
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

  const navigateWeek = (direction) => {
    setCurrentDate(addDays(currentDate, direction * 7));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-800" },
      "in-progress": { label: "In Progress", color: "bg-amber-100 text-amber-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      delayed: { label: "Delayed", color: "bg-red-100 text-red-800" }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    
    return (
      <Chip 
        label={statusInfo.label} 
        size="small" 
        className={`${statusInfo.color} text-xs font-medium`}
      />
    );
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
            Meetings
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Schedule and manage all project meetings
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
            New Meeting
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
              placeholder="Search meetings..."
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
            <Tabs
              value={currentView}
              onChange={(e, newValue) => setCurrentView(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Day" value="day" />
              <Tab label="Week" value="week" />
              <Tab label="List" value="list" />
            </Tabs>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Calendar Navigation */}
      {currentView !== "list" && (
        <Paper className="p-4 mb-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <IconButton onClick={() => navigateWeek(-1)}>
                <FiChevronLeft />
              </IconButton>
              <Typography variant="h6" className="font-medium">
                {currentView === "week" ? 
                  `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}` : 
                  format(currentDate, "EEEE, MMMM d, yyyy")}
              </Typography>
              <IconButton onClick={() => navigateWeek(1)}>
                <FiChevronRight />
              </IconButton>
              <Button
                variant="outlined"
                onClick={() => setCurrentDate(new Date())}
                className="ml-2"
              >
                Today
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          
          {/* Week View */}
          {currentView === "week" && (
            <div className="grid grid-cols-7 gap-1">
              {getWeekDays().map((day, index) => {
                const dayMeetings = getDayMeetings(day);
                return (
                  <div key={index} className="border rounded-lg">
                    <div className={`p-2 text-center ${isToday(day) ? "bg-blue-50 font-bold" : ""}`}>
                      <Typography variant="subtitle2">
                        {format(day, "EEE")}
                      </Typography>
                      <Typography variant="body2">
                        {format(day, "d")}
                      </Typography>
                    </div>
                    <div className="p-1 min-h-24">
                      {dayMeetings.length > 0 ? (
                        dayMeetings.map(meeting => (
                          <div 
                            key={meeting.id} 
                            className="p-1 mb-1 rounded text-xs cursor-pointer hover:bg-gray-50"
                            style={{ borderLeft: `3px solid ${meeting.color || "#f59e0b"}` }}
                            onClick={() => handleOpenModal(meeting)}
                          >
                            <Typography variant="caption" className="font-medium truncate block">
                              {formatTime(meeting.date)}
                            </Typography>
                            <Typography variant="caption" className="truncate block">
                              {meeting.title}
                            </Typography>
                          </div>
                        ))
                      ) : (
                        <Typography variant="caption" className="text-gray-400 block text-center p-2">
                          No meetings
                        </Typography>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Day View */}
          {currentView === "day" && (
            <div className="space-y-4">
              {Array.from({ length: 24 }).map((_, hour) => {
                const hourStart = new Date(currentDate);
                hourStart.setHours(hour, 0, 0, 0);
                const hourEnd = new Date(currentDate);
                hourEnd.setHours(hour + 1, 0, 0, 0);
                
                const hourMeetings = meetings.filter(meeting => {
                  const meetingDate = parseISO(meeting.date);
                  return (
                    meetingDate >= hourStart && 
                    meetingDate < hourEnd &&
                    meetingDate.getDate() === currentDate.getDate() &&
                    meetingDate.getMonth() === currentDate.getMonth() &&
                    meetingDate.getFullYear() === currentDate.getFullYear()
                  );
                });
                
                return (
                  <div key={hour} className="flex">
                    <div className="w-16 text-right pr-2 pt-1">
                      <Typography variant="caption" className="text-gray-500">
                        {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                      </Typography>
                    </div>
                    <div className="flex-1 border-t border-gray-200 min-h-12">
                      {hourMeetings.map(meeting => (
                        <Paper 
                          key={meeting.id}
                          className="p-2 mb-2 rounded shadow-xs cursor-pointer hover:shadow-sm"
                          style={{ borderLeft: `3px solid ${meeting.color || "#f59e0b"}` }}
                          onClick={() => handleOpenModal(meeting)}
                        >
                          <div className="flex justify-between">
                            <Typography variant="subtitle2" className="font-medium">
                              {meeting.title}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                              {formatTime(meeting.date)}
                            </Typography>
                          </div>
                          {meeting.location && (
                            <div className="flex items-center mt-1">
                              <FiMapPin className="text-gray-400 mr-1" size={12} />
                              <Typography variant="caption" className="text-gray-600">
                                {meeting.location}
                              </Typography>
                            </div>
                          )}
                        </Paper>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Paper>
      )}
      
      {/* List View */}
      {currentView === "list" && (
        <Paper className="p-4 rounded-lg shadow-sm">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12">
              <FiCalendar className="mx-auto text-gray-400" size={48} />
              <Typography variant="h6" className="mt-4 text-gray-600">
                No meetings found for {selectedProject?.title}
              </Typography>
              <Typography variant="body2" className="text-gray-500 mt-2">
                Try adjusting your filters or schedule a new meeting
              </Typography>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <Paper 
                  key={meeting.id} 
                  className="p-4 rounded-lg shadow-xs hover:shadow-md transition-shadow"
                  onClick={() => handleOpenModal(meeting)}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: meeting.color || "#f59e0b" }}
                      >
                        <FiCalendar className="text-white" size={20} />
                      </div>
                      <div>
                        <Typography variant="subtitle1" className="font-medium">
                          {meeting.title}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          {formatDate(meeting.date)}
                        </Typography>
                        {meeting.location && (
                          <div className="flex items-center mt-1">
                            <FiMapPin className="text-gray-400 mr-1" size={14} />
                            <Typography variant="caption" className="text-gray-600">
                              {meeting.location}
                            </Typography>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getStatusBadge(meeting.status)}
                          {meeting.meetingLink && (
                            <Chip
                              icon={<FiVideo size={14} />}
                              label="Virtual"
                              size="small"
                              variant="outlined"
                              className="text-xs"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <Typography variant="caption" className="text-gray-500">
                        {meeting.project}
                      </Typography>
                      {meeting.participants && meeting.participants.length > 0 && (
                        <Tooltip title={
                          <div>
                            {meeting.participants.map(p => (
                              <div key={p.id}>{p.name} ({p.role})</div>
                            ))}
                          </div>
                        }>
                          <Chip 
                            avatar={<Avatar sx={{ width: 20, height: 20 }}><FiUsers size={12} /></Avatar>}
                            label={`${meeting.participants.length} participants`}
                            size="small"
                            variant="outlined"
                            className="mt-2"
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  
                  {meeting.description && (
                    <Typography variant="body2" className="text-gray-600 mt-3">
                      {meeting.description}
                    </Typography>
                  )}
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                    {meeting.meetingLink && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FiLink />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(meeting.meetingLink, '_blank');
                        }}
                      >
                        Join Meeting
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        size="small" 
                        variant="text" 
                        startIcon={<FiMail />}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:?subject=Meeting Invitation: ${meeting.title}&body=You are invited to attend: ${meeting.title}%0D%0A%0D%0ADate: ${formatDate(meeting.date)}%0D%0A%0D%0ADescription: ${meeting.description}%0D%0A%0D%0A${meeting.meetingLink ? 'Meeting Link: ' + meeting.meetingLink : ''}`;
                        }}
                      >
                        Send Invite
                      </Button>
                    </div>
                  </div>
                </Paper>
              ))}
            </div>
          )}
        </Paper>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Total Meetings
          </Typography>
          <Typography variant="h4" className="font-bold">
            {filteredMeetings.length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Upcoming
          </Typography>
          <Typography variant="h4" className="font-bold text-blue-600">
            {filteredMeetings.filter(m => m.status === 'upcoming').length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Today
          </Typography>
          <Typography variant="h4" className="font-bold text-amber-600">
            {filteredMeetings.filter(m => {
              const meetingDate = parseISO(m.date);
              return isToday(meetingDate);
            }).length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Tomorrow
          </Typography>
          <Typography variant="h4" className="font-bold text-purple-600">
            {filteredMeetings.filter(m => {
              const meetingDate = parseISO(m.date);
              return isTomorrow(meetingDate);
            }).length}
          </Typography>
        </Paper>
      </div>

      {/* Meeting Modal */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <div className="flex justify-between items-center">
            <Typography variant="h6">
              {currentMeeting ? "Edit Meeting" : "Schedule New Meeting"}
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
              label="Meeting Title"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              variant="outlined"
              required
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
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleFormChange}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleFormChange}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiMapPin className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              placeholder="Physical location or conference room"
            />
            
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
                Meeting Color
              </Typography>
              <div className="flex gap-2">
                {['#f59e0b', '#3b82f6', '#4f46e5', '#10b981', '#8b5cf6', '#ef4444'].map(color => (
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
            {currentMeeting ? "Update" : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingsView;