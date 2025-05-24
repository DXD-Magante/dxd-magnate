import React, { useState, useEffect } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, Avatar, 
  LinearProgress, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import { 
  FiTool, FiUsers, FiClipboard, FiCheckSquare, 
  FiTrendingUp, FiPieChart, FiBarChart2
} from 'react-icons/fi';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#A4DE6C', '#D0ED57'];

const PerformanceTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    teamMembers: 0,
    tasksTracked: 0,
    projectsCompleted: 0,
    taskCompletionRate: 0
  });
  const [taskDistribution, setTaskDistribution] = useState([]);
  const [projectStatusData, setProjectStatusData] = useState([]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects data
        const projectsQuery = query(collection(db, "dxd-magnate-projects"));
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : null,
          completedAt: doc.data().completedAt ? new Date(doc.data().completedAt) : null
        }));
        
        // Calculate project status distribution
        const statusCounts = {};
        projectsData.forEach(project => {
          const status = project.status || 'Unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        const projectStatusDistribution = Object.keys(statusCounts).map(status => ({
          name: status,
          value: statusCounts[status],
          count: statusCounts[status]
        }));
        
        setProjectStatusData(projectStatusDistribution);

        // Calculate active and completed projects
        const activeProjects = projectsData.length
        const completedProjects = projectsData.filter(
          project => project.status === "Completed"
        ).length;

        // Fetch users data
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        
        // Fetch tasks data
        const tasksQuery = query(collection(db, "project-tasks"));
        const tasksSnapshot = await getDocs(tasksQuery);
        
        // Calculate task completion rate
        const totalTasks = tasksSnapshot.size;
        const completedTasks = tasksSnapshot.docs.filter(
          doc => doc.data().status === "Done"
        ).length;
        const completionRate = totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

        // Prepare task distribution by status
        const taskStatusCounts = {};
        tasksSnapshot.forEach(doc => {
          const status = doc.data().status || 'Unknown';
          taskStatusCounts[status] = (taskStatusCounts[status] || 0) + 1;
        });
        
        const taskDistribution = Object.keys(taskStatusCounts).map(status => ({
          name: status,
          value: taskStatusCounts[status]
        }));

        setMetrics({
          activeProjects,
          teamMembers: usersSnapshot.size,
          tasksTracked: totalTasks,
          projectsCompleted: completedProjects,
          taskCompletionRate: completionRate
        });
        
        setTaskDistribution(taskDistribution);
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Performance Metrics Cards */}
      <Grid item xs={12}>
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', mr: 2 }}>
                    <FiTool size={20} />
                  </Avatar>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Projects
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {metrics.activeProjects}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(metrics.activeProjects / (metrics.activeProjects + metrics.projectsCompleted)) * 100} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: '#E0E7FF',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4F46E5',
                      borderRadius: 3
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', mr: 2 }}>
                    <FiUsers size={20} />
                  </Avatar>
                  <Typography variant="subtitle2" color="text.secondary">
                    Team Members
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {metrics.teamMembers}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: '#E0E7FF',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#3B82F6',
                      borderRadius: 3
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#F5F3FF', color: '#8B5CF6', mr: 2 }}>
                    <FiClipboard size={20} />
                  </Avatar>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tasks Tracked
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {metrics.tasksTracked.toLocaleString()}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.taskCompletionRate} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: '#EDE9FE',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#8B5CF6',
                      borderRadius: 3
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', mr: 2 }}>
                    <FiCheckSquare size={20} />
                  </Avatar>
                  <Typography variant="subtitle2" color="text.secondary">
                    Projects Completed
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {metrics.projectsCompleted}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: '#D1FAE5',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#10B981',
                      borderRadius: 3
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Card sx={{ 
              height: '100%', 
              borderRadius: 2, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#FFFBEB', color: '#F59E0B', mr: 2 }}>
                    <FiTrendingUp size={20} />
                  </Avatar>
                  <Typography variant="subtitle2" color="text.secondary">
                    Task Completion
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {metrics.taskCompletionRate}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.taskCompletionRate} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: '#FEF3C7',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#F59E0B',
                      borderRadius: 3
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

<Grid sx={{width:'100%'}}>
      {/* Project Status Distribution - Now full width */}
      <Grid item xs={12} sx={{marginBottom:'20px'}}>
        <Card sx={{ 
          height: '100%', 
          borderRadius: 2, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Project Status Distribution
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
  data={projectStatusData}
  margin={{
    top: 20,
    right: 30,
    left: 20,
    bottom: 20,
  }}
>
  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip 
    formatter={(value) => [`${value} projects`, 'Count']}
    contentStyle={{
      borderRadius: '8px',
      border: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}
  />
  <Bar 
    dataKey="count" 
    fill="#8884d8" 
    radius={[4, 4, 0, 0]}
    barSize={30}
  >
    {projectStatusData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Bar>
</BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Task Distribution - Now full width */}
      <Grid item xs={12}>
        <Card sx={{ 
          height: '100%', 
          borderRadius: 2, 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CardContent sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Task Distribution
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} tasks`, 'Count']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    layout={isMobile ? 'horizontal' : 'vertical'}
                    verticalAlign={isMobile ? 'bottom' : 'middle'}
                    align={isMobile ? 'center' : 'right'}
                    wrapperStyle={{
                      paddingLeft: isMobile ? 0 : '20px',
                      paddingTop: isMobile ? '10px' : 0
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      </Grid>
    </Grid>
  );
};

export default PerformanceTab;