import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip as MuiTooltip,
  Paper,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Stack,
  Button
} from "@mui/material";
import {
  FiBarChart2,
  FiTrendingUp,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiLayers,
  FiAward,
  FiFilter,
  FiRefreshCw
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ProgressTracking = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [collaborations, setCollaborations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [collabTasks, setCollabTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDepartment, setUserDepartment] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserDepartment(userDoc.data().department);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get all projects where current user is a team member
        const allProjectsSnapshot = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = allProjectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === user.uid);
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        setProjects(projectsData);
        
        // If user is in marketing department, fetch collaborations
        if (userDepartment === "Marketing") {
          const collabQuery = query(
            collection(db, "marketing-collaboration"),
          );
          const collabSnapshot = await getDocs(collabQuery);
          const collabData = collabSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCollaborations(collabData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userDepartment]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedProject) {
        setTasks([]);
        return;
      }

      try {
        const user = auth.currentUser;
        if (!user) return;

        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("projectId", "==", selectedProject),
          where("assignee.id", "==", user.uid)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  useEffect(() => {
    const fetchCollabTasks = async () => {
      if (!selectedCollaboration) {
        setCollabTasks([]);
        return;
      }

      try {
        const user = auth.currentUser;
        if (!user) return;

        const tasksQuery = query(
          collection(db, "marketing-collaboration-tasks"),
          where("collaborationId", "==", selectedCollaboration),
          where("assignee.id", "==", user.uid)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isCollaboration: true
        }));

        setCollabTasks(tasksData);
      } catch (error) {
        console.error("Error fetching collaboration tasks:", error);
      }
    };

    fetchCollabTasks();
  }, [selectedCollaboration]);

  const getStatusDistribution = (tasks) => {
    const statusCounts = {
      'Backlog': 0,
      'To Do': 0,
      'In Progress': 0,
      'Review': 0,
      'Done': 0,
      'Blocked': 0
    };

    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / tasks.length) * 100) || 0
    }));
  };

  const getPriorityDistribution = (tasks) => {
    const priorityCounts = {
      'Low': 0,
      'Medium': 0,
      'High': 0,
      'Critical': 0
    };

    tasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });

    return Object.entries(priorityCounts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / tasks.length) * 100) || 0
    }));
  };

  const getCompletionRate = (tasks) => {
    const completed = tasks.filter(task => task.status === 'Done').length;
    return tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  };

  const getTimelinessRate = (tasks) => {
    const onTimeTasks = tasks.filter(task => {
      if (task.status !== 'Done' || !task.dueDate) return false;
      const completionDate = task.updatedAt || task.createdAt;
      return new Date(completionDate) <= new Date(task.dueDate);
    }).length;
    
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    return completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 0;
  };

  const getRecentActivity = (tasks) => {
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  };

  const getTimeSpentData = (tasks) => {
    // This would ideally come from time tracking data in your database
    // For now, we'll simulate some data
    return [
      { name: 'Planning', value: 12 },
      { name: 'Development', value: 19 },
      { name: 'Review', value: 8 },
      { name: 'Testing', value: 15 },
      { name: 'Deployment', value: 6 },
    ];
  };

  const getProgressOverTime = (tasks) => {
    // Group tasks by week/month and calculate completion rates
    // This is a simplified version - you'd want to implement proper date grouping
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    
    return [
      { name: 'Week 1', completed: 2, total: 8 },
      { name: 'Week 2', completed: 5, total: 10 },
      { name: 'Week 3', completed: 8, total: 12 },
      { name: 'Week 4', completed: 12, total: 15 },
    ];
  };

  const renderProjectSelect = () => (
    <FormControl fullWidth size="small" sx={{ mb: 3 }}>
      <InputLabel>Select Project</InputLabel>
      <Select
        value={selectedProject || ''}
        onChange={(e) => setSelectedProject(e.target.value)}
        label="Select Project"
      >
        <MenuItem value="">
          <em>All Projects</em>
        </MenuItem>
        {projects.map(project => (
          <MenuItem key={project.id} value={project.id}>
            {project.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderCollaborationSelect = () => (
    userDepartment === "Marketing" && (
      <FormControl fullWidth size="small" sx={{ mb: 3 }}>
        <InputLabel>Select Collaboration</InputLabel>
        <Select
          value={selectedCollaboration || ''}
          onChange={(e) => setSelectedCollaboration(e.target.value)}
          label="Select Collaboration"
        >
          <MenuItem value="">
            <em>All Collaborations</em>
          </MenuItem>
          {collaborations.map(collab => (
            <MenuItem key={collab.id} value={collab.id}>
              {collab.title}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  );

  const renderStatsCards = () => {
    const currentTasks = activeTab === 0 ? tasks : collabTasks;
    const totalTasks = currentTasks.length;
    const completedTasks = currentTasks.filter(task => task.status === 'Done').length;
    const completionRate = getCompletionRate(currentTasks);
    const timelinessRate = getTimelinessRate(currentTasks);

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #6366f1' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}>
                  <FiLayers size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Tasks
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {totalTasks}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #10b981' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#d1fae5', color: '#10b981' }}>
                  <FiCheckCircle size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {completedTasks} ({completionRate}%)
                  </Typography>
                </Box>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={completionRate} 
                sx={{ 
                  mt: 2,
                  height: 6, 
                  borderRadius: 3,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#10b981'
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #f59e0b' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#fef3c7', color: '#f59e0b' }}>
                  <FiClock size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Timeliness
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {timelinessRate}%
                  </Typography>
                </Box>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={timelinessRate} 
                sx={{ 
                  mt: 2,
                  height: 6, 
                  borderRadius: 3,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#f59e0b'
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #8b5cf6' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#ede9fe', color: '#8b5cf6' }}>
                  <FiAward size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Performance
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {Math.round((completionRate * 0.7 + timelinessRate * 0.3))}%
                  </Typography>
                </Box>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={Math.round((completionRate * 0.7 + timelinessRate * 0.3))} 
                sx={{ 
                  mt: 2,
                  height: 6, 
                  borderRadius: 3,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#8b5cf6'
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderStatusDistribution = () => {
    const currentTasks = activeTab === 0 ? tasks : collabTasks;
    const statusData = getStatusDistribution(currentTasks);

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Task Status Distribution
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} tasks`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {statusData.map((status, index) => (
                  <Box key={status.name} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {status.name}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {status.value} ({status.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={status.percentage} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: COLORS[index % COLORS.length]
                        }
                      }} 
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderPriorityDistribution = () => {
    const currentTasks = activeTab === 0 ? tasks : collabTasks;
    const priorityData = getPriorityDistribution(currentTasks);

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Task Priority Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
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
              <Tooltip formatter={(value, name, props) => [`${value} tasks`, name]} />
              <Legend />
              <Bar dataKey="value" name="Tasks">
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderProgressOverTime = () => {
    const progressData = getProgressOverTime(activeTab === 0 ? tasks : collabTasks);

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Progress Over Time
            </Typography>
            <Select
              size="small"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
            </Select>
          </Box>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={progressData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="completed" stackId="1" stroke="#4f46e5" fill="#c7d2fe" name="Completed" />
              <Area type="monotone" dataKey="total" stackId="2" stroke="#94a3b8" fill="#e2e8f0" name="Total" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderRecentActivity = () => {
    const currentTasks = activeTab === 0 ? tasks : collabTasks;
    const recentTasks = getRecentActivity(currentTasks);

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Recent Activity
          </Typography>
          {recentTasks.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentTasks.map(task => (
                <Paper key={task.id} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: task.status === 'Done' ? '#d1fae5' : 
                              task.status === 'In Progress' ? '#fef3c7' : 
                              task.status === 'Review' ? '#ede9fe' : '#e2e8f0',
                      color: task.status === 'Done' ? '#10b981' : 
                            task.status === 'In Progress' ? '#f59e0b' : 
                            task.status === 'Review' ? '#8b5cf6' : '#64748b'
                    }}>
                      {task.status === 'Done' ? <FiCheckCircle size={18} /> :
                       task.status === 'In Progress' ? <FiClock size={18} /> :
                       task.status === 'Review' ? <FiUsers size={18} /> : <FiLayers size={18} />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        {task.status} • {new Date(task.updatedAt || task.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip 
                      label={task.priority} 
                      size="small" 
                      sx={{ 
                        backgroundColor: task.priority === 'High' ? '#fee2e2' : 
                                        task.priority === 'Medium' ? '#fef3c7' : '#d1fae5',
                        color: task.priority === 'High' ? '#dc2626' : 
                              task.priority === 'Medium' ? '#d97706' : '#059669',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              backgroundColor: '#f8fafc',
              borderRadius: 2
            }}>
              <FiClock size={32} className="text-gray-400 mx-auto mb-2" />
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No recent activity found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          mb: 1,
          background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Progress Tracking
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Analyze your task completion rates, status distribution, and performance metrics
        </Typography>
      </Box>

      {userDepartment === "Marketing" && (
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Project Tasks" icon={<FiLayers size={18} />} iconPosition="start" />
          <Tab label="Collaboration Tasks" icon={<FiUsers size={18} />} iconPosition="start" />
        </Tabs>
      )}

      {activeTab === 0 ? renderProjectSelect() : renderCollaborationSelect()}

      {renderStatsCards()}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {renderStatusDistribution()}
          {renderProgressOverTime()}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderPriorityDistribution()}
          {renderRecentActivity()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProgressTracking;