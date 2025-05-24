import React, { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Paper, Avatar, Chip, Button,
  Select, MenuItem, Divider, LinearProgress, Tooltip,
  IconButton, TextField, InputAdornment, CircularProgress
} from "@mui/material";
import {
  FiBarChart2, FiFilter, FiDownload, FiRefreshCw,
  FiDollarSign, FiCalendar, FiUsers, FiCheckCircle,
  FiClock, FiAlertTriangle, FiTrendingUp, FiChevronDown,
  FiSearch, FiPieChart, FiActivity, FiLayers
} from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { styled } from '@mui/material/styles';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
  }
}));

const ProjectReports = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch tasks for selected project
  useEffect(() => {
    if (!selectedProject) return;

    const fetchTasks = async () => {
      setRefreshing(true);
      try {
        const q = query(
          collection(db, "project-tasks"),
          where("projectId", "==", selectedProject.id)
        );
        
        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  // Calculate project statistics
  const calculateStats = () => {
    if (!selectedProject || tasks.length === 0) return null;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "Done").length;
    const inProgressTasks = tasks.filter(task => task.status === "In Progress").length;
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === "Done") return false;
      return new Date(task.dueDate) < new Date();
    }).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Budget utilization
    const budget = parseInt(selectedProject.budget) || 0;
    const paidAmount = parseInt(selectedProject.paidAmount) || 0;
    const budgetUtilization = budget > 0 ? Math.round((paidAmount / budget) * 100) : 0;

    // Team allocation
    const teamMembers = selectedProject.teamMembers?.length || 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      budget,
      paidAmount,
      budgetUtilization,
      teamMembers
    };
  };

  const stats = calculateStats();

  // Prepare data for charts
  const getStatusDistributionData = () => {
    if (!tasks || tasks.length === 0) return [];

    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    }));
  };

  const getPriorityDistributionData = () => {
    if (!tasks || tasks.length === 0) return [];

    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(priorityCounts).map(priority => ({
      name: priority,
      value: priorityCounts[priority]
    }));
  };

  const getTeamPerformanceData = () => {
    if (!selectedProject?.teamMembers || tasks.length === 0) return [];

    return selectedProject.teamMembers.map(member => {
      const memberTasks = tasks.filter(task => 
        task.assignee && task.assignee.id === member.id
      );
      const completed = memberTasks.filter(task => task.status === "Done").length;
      
      return {
        name: member.name,
        tasks: memberTasks.length,
        completed,
        efficiency: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
      };
    });
  };

  const handleRefresh = () => {
    if (!selectedProject) return;
    setTasks([]);
    setRefreshing(true);
  };

  const handleExport = () => {
    // In a real app, this would generate a PDF or CSV report
    alert("Export functionality would generate a detailed report");
  };

  return (
    <Box className="space-y-6">
      {/* Header with Project Selector */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Project Reports
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Comprehensive analytics and insights for your projects
          </Typography>
        </Box>
        
        <Box className="flex items-center gap-3">
          {projects.length > 0 && (
            <Select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project);
              }}
              sx={{ 
                minWidth: 250,
                backgroundColor: 'white',
                borderRadius: '8px',
                '& .MuiSelect-select': {
                  py: 1.5
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
              onClick={handleRefresh}
              sx={{
                backgroundColor: '#EFF6FF',
                color: '#3B82F6',
                '&:hover': {
                  backgroundColor: '#DBEAFE'
                }
              }}
            >
              <FiRefreshCw size={18} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search reports..."
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
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="contained"
              startIcon={<FiDownload size={18} />}
              onClick={handleExport}
              fullWidth
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: '#4f46e5',
                '&:hover': {
                  backgroundColor: '#4338ca',
                }
              }}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !selectedProject ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            No projects available to generate reports
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Project Progress
                  </Typography>
                  <Box className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <FiActivity size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats?.completionRate || 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={stats?.completionRate || 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: '#4f46e5'
                    }
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1 }}>
                  {stats?.completedTasks || 0} of {stats?.totalTasks || 0} tasks completed
                </Typography>
              </StyledPaper>
            </Grid>
        
            
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Team Allocation
                  </Typography>
                  <Box className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <FiUsers size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats?.teamMembers || 0}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {selectedProject.teamMembers?.map(m => m.projectRole).join(', ')}
                </Typography>
              </StyledPaper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Project Duration
                  </Typography>
                  <Box className="p-2 rounded-lg bg-purple-100 text-purple-600">
                    <FiCalendar size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {selectedProject.duration || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {new Date(selectedProject.startDate).toLocaleDateString()} -{' '}
                  {new Date(selectedProject.endDate).toLocaleDateString()}
                </Typography>
              </StyledPaper>
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Task Status Distribution
                </Typography>
                {tasks.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getStatusDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {getStatusDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No task data available for chart
                    </Typography>
                  </Box>
                )}
              </StyledPaper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Task Priority Distribution
                </Typography>
                {tasks.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getPriorityDistributionData()}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#4f46e5" name="Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No task data available for chart
                    </Typography>
                  </Box>
                )}
              </StyledPaper>
            </Grid>
          </Grid>

          {/* Team Performance */}
          <StyledPaper sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
              Team Performance Breakdown
            </Typography>
            
            {selectedProject.teamMembers && selectedProject.teamMembers.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getTeamPerformanceData().map((member, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}>
                                {member.name.charAt(0)}
                              </Avatar>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {selectedProject.teamMembers.find(m => m.name === member.name)?.projectRole || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.tasks}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.completed}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Chip
                            label={`${member.efficiency}%`}
                            size="small"
                            sx={{
                              backgroundColor: member.efficiency >= 80 ? '#D1FAE5' : 
                                            member.efficiency >= 50 ? '#FEF3C7' : '#FEE2E2',
                              color: member.efficiency >= 80 ? '#065F46' : 
                                   member.efficiency >= 50 ? '#92400E' : '#991B1B'
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <LinearProgress
                            variant="determinate"
                            value={member.efficiency}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#E5E7EB',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: member.efficiency >= 80 ? '#10B981' : 
                                              member.efficiency >= 50 ? '#F59E0B' : '#EF4444'
                              }
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No team members assigned to this project
                </Typography>
              </Box>
            )}
          </StyledPaper>

          {/* Project Details */}
          <StyledPaper sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
              Project Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Project Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Title:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {selectedProject.title}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Client:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {selectedProject.clientName} ({selectedProject.company})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Type:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {selectedProject.type}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Status:</Typography>
                    <Chip
                      label={selectedProject.status}
                      size="small"
                      sx={{
                        backgroundColor: selectedProject.status === 'Completed' ? '#D1FAE5' :
                                        selectedProject.status === 'In Progress' ? '#DBEAFE' :
                                        selectedProject.status === 'On Hold' ? '#FEF3C7' : '#F3F4F6',
                        color: selectedProject.status === 'Completed' ? '#065F46' :
                              selectedProject.status === 'In Progress' ? '#1E40AF' :
                              selectedProject.status === 'On Hold' ? '#92400E' : '#6B7280'
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Financial Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Budget:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      ${selectedProject.budget?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Paid Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      ${selectedProject.paidAmount?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Payment Status:</Typography>
                    <Chip
                      label={selectedProject.paymentStatus || 'N/A'}
                      size="small"
                      sx={{
                        backgroundColor: selectedProject.paymentStatus === 'paid' ? '#D1FAE5' : '#FEE2E2',
                        color: selectedProject.paymentStatus === 'paid' ? '#065F46' : '#991B1B'
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Payment Method:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {selectedProject.paymentMethod || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </StyledPaper>
        </>
      )}
    </Box>
  );
};

export default ProjectReports;