import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  LinearProgress,
  CircularProgress,
  Badge,
  Rating
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiUsers,
  FiStar,
  FiMessageSquare,
  FiBarChart2,
  FiPieChart,
  FiActivity
} from "react-icons/fi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled } from '@mui/material/styles';
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  Text
} from 'recharts';

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

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const PerformanceMetrics = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [testimonials, setTestimonials] = useState([]);

  // Fetch projects where current user is project manager
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);

        // Fetch projects
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Fetch tasks for all projects
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("projectId", "in", projectsData.map(p => p.id))
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(tasksData);

        // Fetch testimonials
        const testimonialsQuery = query(
          collection(db, "testimonials"),
          where("projectManagerId", "==", user.uid)
        );
        const testimonialsSnapshot = await getDocs(testimonialsQuery);
        const testimonialsData = testimonialsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTestimonials(testimonialsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tasks based on selected project and time range
  const filteredTasks = tasks.filter(task => {
    const matchesProject = selectedProject === 'all' || task.projectId === selectedProject;
    
    if (timeRange === 'all') return matchesProject;
    
    const taskDate = new Date(task.dueDate);
    const now = new Date();
    
    if (timeRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return matchesProject && taskDate >= startOfMonth;
    }
    
    return matchesProject;
  });

  // Calculate project completion rate
  const completionRate = () => {
    if (filteredTasks.length === 0) return 0;
    const completedTasks = filteredTasks.filter(task => task.status === 'Done').length;
    return Math.round((completedTasks / filteredTasks.length) * 100);
  };

  // Calculate project status distribution
  const projectStatusData = () => {
    const statusCounts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    }));
  };

  // Calculate on-time delivery rate
  const onTimeDeliveryRate = () => {
    const completedTasks = filteredTasks.filter(task => task.status === 'Done');
    if (completedTasks.length === 0) return 0;
    
    const onTimeTasks = completedTasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const completedDate = new Date(task.updatedAt || task.createdAt);
      return completedDate <= dueDate;
    });
    
    return Math.round((onTimeTasks.length / completedTasks.length) * 100);
  };

  // Calculate team performance
  const teamPerformanceData = () => {
    const members = {};
    
    // Get all unique team members from projects
    projects.forEach(project => {
      if (project.teamMembers) {
        project.teamMembers.forEach(member => {
          if (!members[member.id]) {
            members[member.id] = {
              ...member,
              totalTasks: 0,
              completedTasks: 0,
              overdueTasks: 0
            };
          }
        });
      }
    });
    
    // Calculate task metrics for each member
    filteredTasks.forEach(task => {
      if (task.assignee && task.assignee.id && members[task.assignee.id]) {
        members[task.assignee.id].totalTasks++;
        
        if (task.status === 'Done') {
          members[task.assignee.id].completedTasks++;
          
          // Check if task was completed on time
          const dueDate = new Date(task.dueDate);
          const completedDate = new Date(task.updatedAt || task.createdAt);
          if (completedDate > dueDate) {
            members[task.assignee.id].overdueTasks++;
          }
        } else if (task.dueDate && new Date(task.dueDate) < new Date()) {
          members[task.assignee.id].overdueTasks++;
        }
      }
    });
    
    return Object.values(members).map(member => ({
      name: member.name,
      efficiency: member.totalTasks > 0 ? Math.round((member.completedTasks / member.totalTasks) * 100) : 0,
      overdueRate: member.totalTasks > 0 ? Math.round((member.overdueTasks / member.totalTasks) * 100) : 0,
      role: member.projectRole || member.role
    }));
  };

  // Get client ratings data
  const clientRatingsData = () => {
    return testimonials.map(testimonial => ({
      project: projects.find(p => p.id === testimonial.projectId)?.title || 'Unknown Project',
      rating: testimonial.rating || 5,
      content: testimonial.content,
      client: testimonial.clientName
    }));
  };

  // Get projects at risk (due within 7 days)
  const projectsAtRisk = projects.filter(project => {
    if (project.status !== 'In progress') return false;
    if (!project.endDate) return false;
    
    const endDate = new Date(project.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays <= 7;
  });

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Performance Metrics
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Comprehensive analytics and insights for project performance
          </Typography>
        </Box>
        
        <Box className="flex items-center gap-3">
          <Button 
            variant="outlined" 
            startIcon={<FiDownload size={18} />}
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
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search metrics..."
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
          <Grid item xs={6} md={4}>
            <Select
              fullWidth
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
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
          <Grid item xs={6} md={4}>
            <Select
              fullWidth
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Key Metrics */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StyledPaper>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Project Completion Rate
                  </Typography>
                  <Box className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <FiActivity size={20} />
                  </Box>
                </Box>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'completed', value: completionRate() },
                          { name: 'remaining', value: 100 - completionRate() }
                        ]}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={0}
                        dataKey="value"
                      >
                        <Cell fill="#4f46e5" />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                      <Text 
                        x="50%" 
                        y="50%" 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        style={{ fontSize: '24px', fontWeight: 'bold' }}
                      >
                        {completionRate()}%
                      </Text>
                      <ChartTooltip 
                        formatter={(value) => [`${value}%`, 'Completion Rate']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1 }}>
                  {filteredTasks.filter(task => task.status === 'Done').length} of {filteredTasks.length} tasks completed
                </Typography>
              </StyledPaper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StyledPaper>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    On-Time Delivery Rate
                  </Typography>
                  <Box className="p-2 rounded-lg bg-green-100 text-green-600">
                    <FiClock size={20} />
                  </Box>
                </Box>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'on-time', value: onTimeDeliveryRate() },
                          { name: 'late', value: 100 - onTimeDeliveryRate() }
                        ]}
                        cx="50%"
                        cy="50%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={0}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                      <Text 
                        x="50%" 
                        y="50%" 
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        style={{ fontSize: '24px', fontWeight: 'bold' }}
                      >
                        {onTimeDeliveryRate()}%
                      </Text>
                      <ChartTooltip 
                        formatter={(value) => [`${value}%`, 'On-Time Rate']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1 }}>
                  Based on completed tasks only
                </Typography>
              </StyledPaper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <StyledPaper>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Projects At Risk
                  </Typography>
                  <Box className="p-2 rounded-lg bg-amber-100 text-amber-600">
                    <FiAlertTriangle size={20} />
                  </Box>
                </Box>
                <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="h2" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
                    {projectsAtRisk.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center' }}>
                    Projects due within 7 days
                  </Typography>
                  {projectsAtRisk.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      {projectsAtRisk.slice(0, 3).map(project => (
                        <Box key={project.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            backgroundColor: '#f59e0b',
                            mr: 1
                          }} />
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {project.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Due {new Date(project.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      ))}
                      {projectsAtRisk.length > 3 && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textAlign: 'center' }}>
                          +{projectsAtRisk.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </StyledPaper>
            </Grid>
          </Grid>

          {/* Project Status Distribution */}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Project Status Distribution
                </Typography>
                {projects.length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {projectStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          formatter={(value, name, props) => [
                            value, 
                            `${name}: ${Math.round((value / projects.length) * 100)}%`
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No project data available
                    </Typography>
                  </Box>
                )}
              </StyledPaper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Team Performance
                </Typography>
                {teamPerformanceData().length > 0 ? (
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teamPerformanceData()}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={100}
                          tickFormatter={(value) => value.split(' ')[0]} // Show only first name
                        />
                        <ChartTooltip 
                          formatter={(value, name, props) => {
                            if (name === 'Efficiency') {
                              return [`${value}%`, 'Task Completion Rate'];
                            } else {
                              return [`${value}%`, 'Overdue Rate'];
                            }
                          }}
                        />
                        <Legend 
                          formatter={(value) => {
                            if (value === 'efficiency') return 'Completion Rate';
                            if (value === 'overdueRate') return 'Overdue Rate';
                            return value;
                          }}
                        />
                        <Bar dataKey="efficiency" name="Completion Rate" fill="#4f46e5" />
                        <Bar dataKey="overdueRate" name="Overdue Rate" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No team performance data available
                    </Typography>
                  </Box>
                )}
              </StyledPaper>
            </Grid>
          </Grid>

          {/* Client Feedback */}
          {testimonials.length > 0 && (
            <StyledPaper sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
                Client Feedback & Ratings
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={clientRatingsData()}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="project" />
                        <YAxis domain={[0, 5]} />
                        <ChartTooltip 
                          formatter={(value, name, props) => {
                            if (name === 'Rating') {
                              return [value, `${props.payload.client}'s Rating`];
                            }
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="rating" name="Rating" fill="#f59e0b">
                          {clientRatingsData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#f59e0b" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Box sx={{ height: 300, overflowY: 'auto', p: 2 }}>
                    {clientRatingsData().map((testimonial, index) => (
                      <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {testimonial.project}
                          </Typography>
                          <Rating
                            value={testimonial.rating}
                            readOnly
                            precision={0.5}
                            icon={<FiStar style={{ fill: '#f59e0b' }} size={16} />}
                            emptyIcon={<FiStar size={16} />}
                            sx={{ color: '#f59e0b' }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', mb: 1 }}>
                          "{testimonial.content.substring(0, 150)}{testimonial.content.length > 150 ? '...' : ''}"
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                          — {testimonial.client}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </StyledPaper>
          )}
        </>
      )}
    </Box>
  );
};

export default PerformanceMetrics;