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
  LinearProgress,
  CircularProgress,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Tabs,
  Tab,
  FormControl,
  InputLabel
} from "@mui/material";
import {
    FiUsers,
  FiCalendar,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiPlus,
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiDownload,
  FiPrinter,
  FiShare2,
  FiMoreVertical,
  FiExternalLink,
  FiX
} from "react-icons/fi";
import { format, parseISO, isToday, isTomorrow, isPast, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";

const statusColors = {
  'upcoming': 'bg-blue-100 text-blue-800',
  'overdue': 'bg-red-100 text-red-800',
  'completed': 'bg-green-100 text-green-800',
  'today': 'bg-amber-100 text-amber-800'
};

const priorityColors = {
  'high': 'bg-red-100 text-red-800',
  'medium': 'bg-amber-100 text-amber-800',
  'low': 'bg-green-100 text-green-800'
};

const DeadlinesView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentView, setCurrentView] = useState("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid),
          orderBy("endDate")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const projectsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setProjects(projectsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project => {
      if (!project.endDate) return false;
      
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "upcoming" && !isPast(parseISO(project.endDate))) ||
        (statusFilter === "overdue" && isPast(parseISO(project.endDate)) && project.status !== "completed") ||
        (statusFilter === "completed" && project.status === "completed") ||
        (statusFilter === "today" && isToday(parseISO(project.endDate)));
      
      const matchesPriority = priorityFilter === "all" || 
        (priorityFilter === "high" && project.priority === "high") ||
        (priorityFilter === "medium" && project.priority === "medium") ||
        (priorityFilter === "low" && project.priority === "low");
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter, priorityFilter]);

  const getStatus = (endDate, projectStatus) => {
    if (projectStatus === "completed") return "completed";
    if (isToday(parseISO(endDate))) return "today";
    if (isPast(parseISO(endDate))) return "overdue";
    return "upcoming";
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const deadline = parseISO(endDate);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const navigateWeek = (direction) => {
    setCurrentDate(addDays(currentDate, direction * 7));
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const getDayProjects = (date) => {
    return filteredProjects.filter(project => {
      const projectDate = parseISO(project.endDate);
      return (
        projectDate.getDate() === date.getDate() &&
        projectDate.getMonth() === date.getMonth() &&
        projectDate.getFullYear() === date.getFullYear()
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900">
            Project Deadlines
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Track and manage all project deadlines
          </Typography>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Tooltip title="Export deadlines">
            <Button
              variant="outlined"
              startIcon={<FiDownload />}
            >
              Export
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Filters */}
      <Paper className="p-4 mb-6 rounded-lg shadow-sm">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search projects..."
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
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Priority"
              >
                <MenuItem value="all">All Priorities</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Tabs
              value={currentView}
              onChange={(e, newValue) => setCurrentView(newValue)}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="List" value="list" />
              <Tab label="Week" value="week" />
            </Tabs>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Calendar Navigation */}
      {currentView === "week" && (
        <Paper className="p-4 mb-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <IconButton onClick={() => navigateWeek(-1)}>
                <FiChevronLeft />
              </IconButton>
              <Typography variant="h6" className="font-medium">
                {`${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`}
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
          <div className="grid grid-cols-7 gap-1">
            {getWeekDays().map((day, index) => {
              const dayProjects = getDayProjects(day);
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
                    {dayProjects.length > 0 ? (
                      dayProjects.map(project => (
                        <div 
                          key={project.id} 
                          className="p-1 mb-1 rounded text-xs cursor-pointer hover:bg-gray-50"
                          style={{ borderLeft: `3px solid ${project.color || "#f59e0b"}` }}
                          onClick={() => handleViewDetails(project)}
                        >
                          <Typography variant="caption" className="font-medium truncate block">
                            {project.title}
                          </Typography>
                          <Typography variant="caption" className="truncate block">
                            {project.clientName}
                          </Typography>
                        </div>
                      ))
                    ) : (
                      <Typography variant="caption" className="text-gray-400 block text-center p-2">
                        No deadlines
                      </Typography>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Paper>
      )}
      
      {/* List View */}
      {currentView === "list" && (
        <Paper className="p-4 rounded-lg shadow-sm">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FiCalendar className="mx-auto text-gray-400" size={48} />
              <Typography variant="h6" className="mt-4 text-gray-600">
                No deadlines found
              </Typography>
              <Typography variant="body2" className="text-gray-500 mt-2">
                Try adjusting your filters or create a new project
              </Typography>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const status = getStatus(project.endDate, project.status);
                const daysRemaining = getDaysRemaining(project.endDate);
                
                return (
                  <Paper 
                    key={project.id} 
                    className="p-4 rounded-lg shadow-xs hover:shadow-md transition-shadow"
                    onClick={() => handleViewDetails(project)}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: project.color || "#f59e0b" }}
                        >
                          <FiCalendar className="text-white" size={20} />
                        </div>
                        <div>
                          <Typography variant="subtitle1" className="font-medium">
                            {project.title}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600 mt-1">
                            Client: {project.clientName}
                          </Typography>
                          <div className="flex items-center mt-1">
                            <FiClock className="text-gray-400 mr-1" size={14} />
                            <Typography variant="caption" className="text-gray-600">
                              {format(parseISO(project.endDate), "MMM d, yyyy")}
                            </Typography>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Chip 
                              label={status === "upcoming" ? `${daysRemaining} days remaining` : 
                                     status === "today" ? "Due today" : 
                                     status === "overdue" ? `${Math.abs(daysRemaining)} days overdue` : "Completed"}
                              size="small"
                              className={`${statusColors[status]} text-xs font-medium`}
                            />
                            {project.priority && (
                              <Chip
                                label={project.priority}
                                size="small"
                                className={`${priorityColors[project.priority.toLowerCase()]} text-xs font-medium`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <Typography variant="caption" className="text-gray-500">
                          Budget: ₹{project.budget || "N/A"}
                        </Typography>
                        {project.teamMembers && project.teamMembers.length > 0 && (
                          <Tooltip title={
                            <div>
                              {project.teamMembers.map(member => (
                                <div key={member.id}>{member.name} ({member.projectRole})</div>
                              ))}
                            </div>
                          }>
                            <Chip 
                              avatar={<Avatar sx={{ width: 20, height: 20 }}><FiUsers size={12} /></Avatar>}
                              label={`${project.teamMembers.length} team members`}
                              size="small"
                              variant="outlined"
                              className="mt-2"
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                    
                    {project.description && (
                      <Typography variant="body2" className="text-gray-600 mt-3">
                        {project.description}
                      </Typography>
                    )}
                    
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Typography variant="caption" className="text-gray-500">
                          {project.type || "Project"}
                        </Typography>
                        <Divider orientation="vertical" flexItem />
                        <Typography variant="caption" className="text-gray-500">
                          {project.duration || "N/A"}
                        </Typography>
                      </div>
                      <Button
                        size="small"
                        variant="text"
                        endIcon={<FiExternalLink size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to project details
                        }}
                      >
                        View Project
                      </Button>
                    </div>
                  </Paper>
                );
              })}
            </div>
          )}
        </Paper>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Total Projects
          </Typography>
          <Typography variant="h4" className="font-bold">
            {filteredProjects.length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Upcoming
          </Typography>
          <Typography variant="h4" className="font-bold text-blue-600">
            {filteredProjects.filter(p => getStatus(p.endDate, p.status) === 'upcoming').length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Overdue
          </Typography>
          <Typography variant="h4" className="font-bold text-red-600">
            {filteredProjects.filter(p => getStatus(p.endDate, p.status) === 'overdue').length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Today
          </Typography>
          <Typography variant="h4" className="font-bold text-amber-600">
            {filteredProjects.filter(p => isToday(parseISO(p.endDate))).length}
          </Typography>
        </Paper>
      </div>

      {/* Project Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        {selectedProject && (
          <>
            <DialogTitle>
              <div className="flex justify-between items-center">
                <Typography variant="h6" className="font-bold">
                  {selectedProject.title}
                </Typography>
                <IconButton onClick={handleCloseDetails}>
                  <FiX />
                </IconButton>
              </div>
              <Typography variant="body2" className="text-gray-500">
                Deadline: {format(parseISO(selectedProject.endDate), "MMMM d, yyyy")}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" className="font-bold mb-2">
                    Project Details
                  </Typography>
                  <div className="space-y-2">
                    <div className="flex">
                      <Typography variant="body2" className="text-gray-600 w-32">
                        Client:
                      </Typography>
                      <Typography variant="body2">
                        {selectedProject.clientName}
                      </Typography>
                    </div>
                    <div className="flex">
                      <Typography variant="body2" className="text-gray-600 w-32">
                        Status:
                      </Typography>
                      <Chip 
                        label={getStatus(selectedProject.endDate, selectedProject.status) === "upcoming" ? "Upcoming" : 
                               getStatus(selectedProject.endDate, selectedProject.status) === "today" ? "Due Today" : 
                               getStatus(selectedProject.endDate, selectedProject.status) === "overdue" ? "Overdue" : "Completed"}
                        size="small"
                        className={`${statusColors[getStatus(selectedProject.endDate, selectedProject.status)]} mr-2`}
                      />
                    </div>
                    <div className="flex">
                      <Typography variant="body2" className="text-gray-600 w-32">
                        Priority:
                      </Typography>
                      {selectedProject.priority && (
                        <Chip
                          label={selectedProject.priority}
                          size="small"
                          className={`${priorityColors[selectedProject.priority.toLowerCase()]}`}
                        />
                      )}
                    </div>
                    <div className="flex">
                      <Typography variant="body2" className="text-gray-600 w-32">
                        Budget:
                      </Typography>
                      <Typography variant="body2">
                        ₹{selectedProject.budget || "N/A"}
                      </Typography>
                    </div>
                    <div className="flex">
                      <Typography variant="body2" className="text-gray-600 w-32">
                        Duration:
                      </Typography>
                      <Typography variant="body2">
                        {selectedProject.duration || "N/A"}
                      </Typography>
                    </div>
                    <div className="flex">
                      <Typography variant="body2" className="text-gray-600 w-32">
                        Days Remaining:
                      </Typography>
                      <Typography variant="body2">
                        {getDaysRemaining(selectedProject.endDate)} days
                      </Typography>
                    </div>
                  </div>
                  
                  <Typography variant="subtitle1" className="font-bold mt-4 mb-2">
                    Description
                  </Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {selectedProject.description || "No description provided"}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" className="font-bold mb-2">
                    Team Members
                  </Typography>
                  {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.teamMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                          <Avatar 
                            sx={{ width: 40, height: 40, bgcolor: '#e0e7ff', color: '#4f46e5' }}
                          >
                            {member.name.charAt(0)}
                          </Avatar>
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {member.name}
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                              {member.projectRole || member.role}
                            </Typography>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Typography variant="body2" className="text-gray-500">
                      No team members assigned
                    </Typography>
                  )}
                  
                  <Typography variant="subtitle1" className="font-bold mt-4 mb-2">
                    Project Timeline
                  </Typography>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Typography variant="body2" className="text-gray-600">
                        Start Date
                      </Typography>
                      <Typography variant="body2">
                        {selectedProject.startDate ? format(parseISO(selectedProject.startDate), "MMM d, yyyy") : "N/A"}
                      </Typography>
                    </div>
                    <div className="flex justify-between items-center">
                      <Typography variant="body2" className="text-gray-600">
                        Deadline
                      </Typography>
                      <Typography variant="body2">
                        {format(parseISO(selectedProject.endDate), "MMM d, yyyy")}
                      </Typography>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={
                        selectedProject.startDate && selectedProject.endDate ? 
                        Math.min(100, Math.max(0, 
                          ((new Date() - parseISO(selectedProject.startDate)) / 
                          (parseISO(selectedProject.endDate) - parseISO(selectedProject.startDate)) * 100
                        ))) : 0
                      }
                      sx={{ height: 8, borderRadius: 4, mt: 2 }}
                      color={
                        getStatus(selectedProject.endDate, selectedProject.status) === "overdue" ? "error" :
                        getStatus(selectedProject.endDate, selectedProject.status) === "today" ? "warning" :
                        "primary"
                      }
                    />
                  </div>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => {
                  // Navigate to project
                  handleCloseDetails();
                }}
              >
                Go to Project
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DeadlinesView;