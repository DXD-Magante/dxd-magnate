import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Avatar,
  AvatarGroup,
  Paper,
  Divider,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme
} from "@mui/material";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiBarChart2,
  FiInfo,
  FiSearch,
  FiFilter,
  FiChevronDown
} from "react-icons/fi";
import { collection, getDocs, query, orderBy, where,  } from "firebase/firestore";
import { db } from "../../services/firebase";
import { format, differenceInDays } from "date-fns";

const ProgressTrackingDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const theme = useTheme();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsData);
        
        // Select first project by default if available
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
    const fetchTasks = async () => {
      if (!selectedProject) return;
      
      try {
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("projectId", "==", selectedProject.id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTasks(tasksData);
      } catch (error) {
        alert(error)
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate progress metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === "Done").length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate days remaining
  const today = new Date();
  const deadline = selectedProject?.endDate ? new Date(selectedProject.endDate) : null;
  const daysRemaining = deadline ? differenceInDays(deadline, today) : 0;
  const isOverdue = deadline && daysRemaining < 0;
  
  // Get team members (assuming team is stored in project data)
  const teamMembers = selectedProject?.teamMembers || [];

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 'bold', 
        mb: 3,
        color: theme.palette.text.primary,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiBarChart2 size={28} />
        Project Progress Dashboard
      </Typography>
      
      {/* Project Selection Section */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 3,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: theme.palette.divider,
        backgroundColor: theme.palette.background.paper
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Select Project
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
              sx: { backgroundColor: theme.palette.background.default }
            }}
          />
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{ 
              minWidth: 200,
              backgroundColor: theme.palette.background.default
            }}
            IconComponent={FiChevronDown}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="Not started">Not Started</MenuItem>
            <MenuItem value="In progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="On hold">On Hold</MenuItem>
          </Select>
          
          <Select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project);
            }}
            sx={{ 
              minWidth: 200,
              backgroundColor: theme.palette.background.default
            }}
            IconComponent={FiChevronDown}
          >
            {filteredProjects.map(project => (
              <MenuItem key={project.id} value={project.id}>
                {project.title} ({project.clientName || 'No client'})
              </MenuItem>
            ))}
          </Select>
        </Box>
        
        {filteredProjects.length === 0 && (
          <Typography variant="body1" sx={{ 
            textAlign: 'center', 
            py: 4,
            color: theme.palette.text.secondary
          }}>
            No projects found matching your criteria
          </Typography>
        )}
      </Paper>
      
      {selectedProject ? (
        <>
          {/* Project Overview Section */}
          <Paper elevation={0} sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.background.paper
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {selectedProject.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={selectedProject.status} 
                  size="small"
                  color={
                    selectedProject.status === "Completed" ? "success" :
                    selectedProject.status === "In progress" ? "info" :
                    selectedProject.status === "Not started" ? "warning" : "error"
                  }
                />
                <Chip 
                  label={selectedProject.priority || 'Medium'} 
                  size="small"
                  color={
                    selectedProject.priority === "High" ? "error" :
                    selectedProject.priority === "Medium" ? "warning" : "success"
                  }
                />
              </Box>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 3, color: theme.palette.text.secondary }}>
              {selectedProject.description || "No description available"}
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Overall Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {progressPercentage}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage} 
                sx={{ 
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: progressPercentage > 70 ? theme.palette.success.main :
                                   progressPercentage > 30 ? theme.palette.info.main :
                                   theme.palette.error.main,
                    borderRadius: 5
                  }
                }} 
              />
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mt: 1,
                color: theme.palette.text.secondary
              }}>
                <Typography variant="caption">
                  {completedTasks} of {totalTasks} tasks completed
                </Typography>
                <Typography variant="caption">
                  {totalTasks > 0 ? `${Math.round(completedTasks / totalTasks * 100)}%` : '0%'}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2
            }}>
              <OverviewCard 
                icon={<FiCalendar size={18} />}
                title="Timeline"
                value={
                  selectedProject.startDate && selectedProject.endDate 
                    ? `${format(new Date(selectedProject.startDate), 'MMM dd')} - ${format(new Date(selectedProject.endDate), 'MMM dd, yyyy')}`
                    : 'Not specified'
                }
                secondaryValue={
                  deadline 
                    ? isOverdue 
                      ? `${Math.abs(daysRemaining)} days overdue` 
                      : `${daysRemaining} days remaining`
                    : 'No deadline'
                }
                color={isOverdue ? 'error' : 'success'}
              />
              
              <OverviewCard 
                icon={<FiDollarSign size={18} />}
                title="Budget"
                value={selectedProject.budget ? `$${parseInt(selectedProject.budget).toLocaleString()}` : 'Not specified'}
              />
              
              <OverviewCard 
                icon={<FiUsers size={18} />}
                title="Team Members"
                value={teamMembers.length > 0 ? (
                  <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                    {teamMembers.map((member, index) => (
                      <Tooltip key={index} title={member.name || member}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32,
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
                ) : 'Not assigned'}
              />
              
              <OverviewCard 
                icon={<FiCheckCircle size={18} />}
                title="Task Completion"
                value={`${completedTasks}/${totalTasks}`}
                secondaryValue={`${progressPercentage}% complete`}
              />
            </Box>
          </Paper>
          
          {/* Detailed Progress Section */}
          <Paper elevation={0} sx={{ 
            p: 3,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: theme.palette.divider,
            backgroundColor: theme.palette.background.paper
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Detailed Progress Metrics
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Task Status Distribution
              </Typography>
              <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{ 
                  width: `${(completedTasks / totalTasks) * 100}%`, 
                  backgroundColor: theme.palette.success.main 
                }} />
                <Box sx={{ 
                  width: `${((totalTasks - completedTasks) / totalTasks) * 100}%`, 
                  backgroundColor: theme.palette.warning.main 
                }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                  Completed ({completedTasks})
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.warning.main }}>
                  Pending ({totalTasks - completedTasks})
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' },
              gap: 2
            }}>
              {['Backlog', 'To Do', 'In Progress', 'Review', 'Done'].map(status => {
                const count = tasks.filter(task => task.status === status).length;
                const percentage = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                
                return (
                  <StatusCard 
                    key={status}
                    status={status}
                    count={count}
                    percentage={percentage}
                    totalTasks={totalTasks}
                  />
                );
              })}
            </Box>
          </Paper>
        </>
      ) : (
        <Paper elevation={0} sx={{ 
          p: 3,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: theme.palette.divider,
          backgroundColor: theme.palette.background.paper,
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            No Project Selected
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Please select a project from the dropdown above to view progress metrics
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

// Helper Components
const OverviewCard = ({ icon, title, value, secondaryValue, color }) => {
  const theme = useTheme();
  
  return (
    <Paper sx={{ 
      p: 2,
      borderRadius: '8px',
      border: '1px solid',
      borderColor: theme.palette.divider,
      backgroundColor: theme.palette.background.default,
      height: '100%'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.main,
          mr: 1.5
        }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        {value}
      </Typography>
      {secondaryValue && (
        <Chip 
          label={secondaryValue}
          size="small"
          sx={{ 
            mt: 0.5,
            backgroundColor: color ? theme.palette[color].light : theme.palette.grey[200],
            color: color ? theme.palette[color].dark : theme.palette.text.secondary
          }}
        />
      )}
    </Paper>
  );
};

const StatusCard = ({ status, count, percentage, totalTasks }) => {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'Done': return theme.palette.success.main;
      case 'In Progress': return theme.palette.info.main;
      case 'Review': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'Done': return <FiCheckCircle size={16} />;
      case 'In Progress': return <FiInfo size={16} />;
      case 'Review': return <FiAlertTriangle size={16} />;
      default: return <FiCalendar size={16} />;
    }
  };
  
  return (
    <Paper sx={{ 
      p: 2,
      borderRadius: '8px',
      border: '1px solid',
      borderColor: theme.palette.divider,
      backgroundColor: theme.palette.background.default,
      height: '100%'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: `${getStatusColor()}20`,
          color: getStatusColor(),
          mr: 1.5
        }}>
          {getStatusIcon()}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {status}
        </Typography>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
        {count}
      </Typography>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{ 
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.palette.grey[200],
          '& .MuiLinearProgress-bar': {
            backgroundColor: getStatusColor()
          }
        }} 
      />
      <Typography variant="caption" sx={{ 
        display: 'block',
        mt: 0.5,
        color: theme.palette.text.secondary
      }}>
        {percentage}% of total tasks
      </Typography>
    </Paper>
  );
};

// Helper functions
const stringToColor = (string) => {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const getProfileInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.map(n => n[0]).join('').toUpperCase();
};

export default ProgressTrackingDashboard;