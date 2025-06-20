import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Divider,
  Avatar,
  Chip,
  Paper,
  Stack,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  FiBarChart2,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiChevronDown,
  FiRefreshCw,
  FiExternalLink
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [teamProductivity, setTeamProductivity] = useState([]);
  const [timeData, setTimeData] = useState({});

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get all projects where current user is a team member
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === user.uid);
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
          await fetchProjectAnalytics(projectsData[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectAnalytics(selectedProject);
    }
  }, [selectedProject]);

  const calculateEndDate = (startDate, duration) => {
    if (!startDate) return null;
    
    const date = new Date(startDate);
    const durationMatch = duration?.match(/(\d+)\s*(day|week|month|year)/i);
    
    if (durationMatch) {
      const amount = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      
      switch (unit) {
        case 'day':
          date.setDate(date.getDate() + amount);
          break;
        case 'week':
          date.setDate(date.getDate() + (amount * 7));
          break;
        case 'month':
          date.setMonth(date.getMonth() + amount);
          break;
        case 'year':
          date.setFullYear(date.getFullYear() + amount);
          break;
        default:
          // Default to 1 month if duration format is invalid
          date.setMonth(date.getMonth() + 1);
      }
    } else {
      // Default to 1 month if no duration is provided
      date.setMonth(date.getMonth() + 1);
    }
    
    return date;
  };

  const fetchProjectAnalytics = async (projectId) => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectDoc = await getDoc(doc(db, "dxd-magnate-projects", projectId));
      const projectData = projectDoc.data();
      
      // Fetch all tasks for this project
      const tasksQuery = query(
        collection(db, "project-tasks"),
        where("projectId", "==", projectId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const totalTasks = tasksData.length;
      const completedTasks = tasksData.filter(task => task.status === 'Done').length;
      const inProgressTasks = tasksData.filter(task => task.status === 'In Progress').length;
      const overdueTasks = tasksData.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
      ).length;
      
      // Calculate progress (completed tasks / total tasks)
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Task status distribution for pie chart
      const statusCounts = tasksData.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});
      const statusChartData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
      }));

      // Priority distribution for bar chart
      const priorityCounts = tasksData.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});
      const priorityChartData = Object.keys(priorityCounts).map(priority => ({
        name: priority,
        tasks: priorityCounts[priority]
      }));

      // Team productivity (tasks completed per member)
      const teamProductivityData = [];
      if (projectData.teamMembers) {
        for (const member of projectData.teamMembers) {
          const memberTasks = tasksData.filter(task => 
            task.assignee?.id === member.id
          );
          const completed = memberTasks.filter(task => task.status === 'Done').length;
          teamProductivityData.push({
            name: member.name,
            avatar: member.name.split(' ').map(n => n[0]).join(''),
            completed,
            total: memberTasks.length,
            percentage: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
          });
        }
      }

      // Enhanced Time metrics with duration fallback
      const now = new Date();
      const startDate = projectData.startDate ? new Date(projectData.startDate) : null;
      let endDate = projectData.endDate ? new Date(projectData.endDate) : null;
      
      // If no end date, calculate from duration
      if (!endDate && projectData.duration) {
        endDate = calculateEndDate(startDate, projectData.duration);
      }
      // If still no end date, default to 1 month from start
      if (!endDate && startDate) {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      let timeElapsed = 0;
      let timeRemaining = 0;
      let isCompleted = false;
      let progressPercentage = 0;
      
      if (startDate && endDate) {
        const totalDuration = endDate - startDate;
        timeElapsed = now - startDate;
        timeRemaining = endDate - now;
        
        if (now > endDate) {
          isCompleted = true;
          timeElapsed = totalDuration;
          timeRemaining = 0;
        }
        
        progressPercentage = Math.min(100, Math.max(0, (timeElapsed / totalDuration) * 100));
      }

      setStats({
        progress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        budget: projectData.budget || 0,
        teamSize: projectData.teamMembers?.length || 0
      });

      setTaskStatusData(statusChartData);
      setPriorityData(priorityChartData);
      setTeamProductivity(teamProductivityData);
      setTimeData({
        startDate,
        endDate,
        timeElapsed,
        timeRemaining,
        isCompleted,
        progressPercentage,
        duration: projectData.duration || null
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return "0 days";
    const days = Math.ceil(milliseconds / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return '#10b981';
      case 'In Progress': return '#f59e0b';
      case 'Review': return '#8b5cf6';
      case 'To Do': return '#3b82f6';
      case 'Backlog': return '#94a3b8';
      case 'Blocked': return '#ef4444';
      default: return '#64748b';
    }
  };

  const refreshData = async () => {
    if (selectedProject) {
      await fetchProjectAnalytics(selectedProject);
    }
  };

  const renderTimelineProgress = () => {
    if (!timeData.startDate || !timeData.endDate) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Timeline information not available
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {formatDate(timeData.startDate)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatDate(timeData.endDate)}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={timeData.progressPercentage || 0} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: timeData.isCompleted ? '#10b981' : '#4f46e5',
              borderRadius: 5
            }
          }} 
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" sx={{ 
            color: timeData.isCompleted ? '#10b981' : '#4f46e5',
            fontWeight: '500'
          }}>
            {timeData.isCompleted ? 'Completed' : `${Math.round(timeData.progressPercentage || 0)}%`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {timeData.isCompleted ? 
              `Completed in ${formatDuration(timeData.timeElapsed)}` : 
              `${formatDuration(timeData.timeRemaining)} remaining`
            }
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Project Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track performance, progress, and team productivity
          </Typography>
        </Box>
        
        <Box className="flex items-center gap-3">
          {projects.length > 0 && (
            <Select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
              sx={{ 
                minWidth: 250,
                backgroundColor: 'white',
                '& .MuiSelect-icon': {
                  color: '#64748b'
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
          
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={refreshData}
              sx={{
                backgroundColor: '#f1f5f9',
                '&:hover': {
                  backgroundColor: '#e2e8f0'
                }
              }}
            >
              <FiRefreshCw size={18} className="text-gray-600" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box className="flex justify-center items-center py-12">
          <CircularProgress />
        </Box>
      ) : !selectedProject ? (
        <Card sx={{ 
          textAlign: 'center', 
          p: 6,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px'
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiBarChart2 size={36} color="text.secondary" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: '600', mb: 1 }}>
            No project selected
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            Select a project from the dropdown to view analytics
          </Typography>
        </Card>
      ) : (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: '#e0e7ff', 
                      color: '#4f46e5',
                      width: 48,
                      height: 48
                    }}>
                      <FiTrendingUp size={24} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Project Progress
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.progress || 0}%
                      </Typography>
                    </Box>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.progress || 0} 
                    sx={{ 
                      mt: 2,
                      height: 8, 
                      borderRadius: 4,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#4f46e5',
                        borderRadius: 4
                      }
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: '#d1fae5', 
                      color: '#10b981',
                      width: 48,
                      height: 48
                    }}>
                      <FiCheckCircle size={24} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tasks Completed
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.completedTasks || 0}/{stats?.totalTasks || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: '#fef3c7', 
                      color: '#f59e0b',
                      width: 48,
                      height: 48
                    }}>
                      <FiClock size={24} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        In Progress
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.inProgressTasks || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: '#fee2e2', 
                      color: '#ef4444',
                      width: 48,
                      height: 48
                    }}>
                      <FiAlertCircle size={24} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Overdue Tasks
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {stats?.overdueTasks || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Project Overview */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Project Overview
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                      Task Status Distribution
                    </Typography>
                    
                    {taskStatusData.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={taskStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {taskStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              formatter={(value, name) => [`${value} tasks`, name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box className="flex justify-center items-center py-12">
                        <Typography variant="body2" color="text.secondary">
                          No task data available
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                      Tasks by Priority
                    </Typography>
                    
                    {priorityData.length > 0 ? (
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={priorityData}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Box className="flex justify-center items-center py-12">
                        <Typography variant="body2" color="text.secondary">
                          No priority data available
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                      Project Timeline
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Start Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: '500' }}>
                          {formatDate(timeData.startDate)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {timeData.duration ? 'Planned End Date' : 'End Date'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: '500' }}>
                          {formatDate(timeData.endDate)}
                          {timeData.duration && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              (based on {timeData.duration})
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                      
                      {renderTimelineProgress()}
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                      Team Details
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Team Size
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: '500' }}>
                          {stats?.teamSize || 0} members
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Budget
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: '500' }}>
                          {formatCurrency(stats?.budget || 0)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Project Status
                        </Typography>
                        <Chip 
                          label={timeData.isCompleted ? 'Completed' : 'In Progress'} 
                          sx={{ 
                            backgroundColor: timeData.isCompleted ? '#d1fae5' : '#e0e7ff',
                            color: timeData.isCompleted ? '#065f46' : '#3730a3'
                          }} 
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                      Team Productivity
                    </Typography>
                    
                    {teamProductivity.length > 0 ? (
                      <Stack spacing={2}>
                        {teamProductivity.map((member, index) => (
                          <Box key={index}>
                            <Box className="flex items-center justify-between mb-1">
                              <Box className="flex items-center gap-2">
                                <Avatar sx={{ 
                                  width: 28, 
                                  height: 28, 
                                  fontSize: '0.75rem',
                                  bgcolor: '#e0e7ff',
                                  color: '#4f46e5'
                                }}>
                                  {member.avatar}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                  {member.name}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: '500' }}>
                                {member.completed}/{member.total}
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={member.percentage} 
                              sx={{ 
                                height: 6, 
                                borderRadius: 3,
                                backgroundColor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: '#4f46e5',
                                  borderRadius: 3
                                }
                              }} 
                            />
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No team data available
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default Analytics;