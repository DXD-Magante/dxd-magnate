import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Select,
  MenuItem
} from "@mui/material";
import {
  FiLayers,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
  FiRefreshCw,
  FiChevronDown
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { styled } from '@mui/material/styles';

const StatCard = styled(Paper)(({ theme }) => ({
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

const ProjectStatsOverview = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setStats] = useState({
    budget: 0,
    spent: 0,
    tasks: { total: 0, completed: 0, overdue: 0 },
    milestones: { total: 0, completed: 0, upcoming: 0 },
    team: { total: 0, departments: {} }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    if (!selectedProject) return;

    const fetchProjectStats = async () => {
      setRefreshing(true);
      try {
        // Fetch tasks for the selected project
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("projectId", "==", selectedProject.id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate task stats
        const today = new Date();
        const taskStats = {
          total: tasksData.length,
          completed: tasksData.filter(task => task.status === "Done").length,
          overdue: tasksData.filter(task => {
            if (!task.dueDate || task.status === "Done") return false;
            return new Date(task.dueDate) < today;
          }).length
        };

        // Calculate milestone stats (placeholder - adjust based on your data structure)
        const milestoneStats = {
          total: 5, // Example - replace with actual data
          completed: 2,
          upcoming: 1
        };

        // Calculate team stats
        const teamStats = {
          total: selectedProject.teamMembers?.length || 0,
          departments: selectedProject.teamMembers?.reduce((acc, member) => {
            acc[member.department] = (acc[member.department] || 0) + 1;
            return acc;
          }, {}) || {}
        };

        // Budget calculations (placeholder - adjust based on your data structure)
        const budgetStats = {
          budget: parseInt(selectedProject.budget) || 0,
          spent: Math.round(parseInt(selectedProject.budget) * 0.65) || 0 // Example - replace with actual data
        };

        setStats({
          budget: budgetStats.budget,
          spent: budgetStats.spent,
          tasks: taskStats,
          milestones: milestoneStats,
          team: teamStats
        });

      } catch (error) {
        console.error("Error fetching project stats:", error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchProjectStats();
  }, [selectedProject]);

  const handleRefresh = () => {
    if (!selectedProject) return;
    setRefreshing(true);
    setStats({
      budget: 0,
      spent: 0,
      tasks: { total: 0, completed: 0, overdue: 0 },
      milestones: { total: 0, completed: 0, upcoming: 0 },
      team: { total: 0, departments: {} }
    });
  };

  const getBudgetPercentage = () => {
    return stats.budget > 0 ? Math.round((stats.spent / stats.budget) * 100) : 0;
  };

  const getTaskCompletionPercentage = () => {
    return stats.tasks.total > 0 ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0;
  };

  const getMilestoneCompletionPercentage = () => {
    return stats.milestones.total > 0 ? Math.round((stats.milestones.completed / stats.milestones.total) * 100) : 0;
  };

  const getProgressColor = (value) => {
    if (value >= 80) return '#10B981'; // green
    if (value >= 50) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  return (
    <Box className="space-y-6">
      {/* Header with Project Selector */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Project Statistics Overview
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Comprehensive metrics and insights for your project
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !selectedProject ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            No projects available to display statistics
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3}>
            {/* Budget Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Budget Utilization
                  </Typography>
                  <Box className="p-2 rounded-lg bg-purple-100 text-purple-600">
                    <FiDollarSign size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ${stats.spent.toLocaleString()}
                  <Typography component="span" variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                    / ${stats.budget.toLocaleString()}
                  </Typography>
                </Typography>
                <Box className="flex items-center justify-between mb-1">
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {getBudgetPercentage()}% utilized
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    ${(stats.budget - stats.spent).toLocaleString()} remaining
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getBudgetPercentage()}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: getProgressColor(getBudgetPercentage())
                    }
                  }}
                />
              </StatCard>
            </Grid>

            {/* Tasks Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Task Completion
                  </Typography>
                  <Box className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <FiCheckCircle size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.tasks.completed}
                  <Typography component="span" variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                    / {stats.tasks.total} tasks
                  </Typography>
                </Typography>
                <Box className="flex items-center justify-between mb-1">
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {getTaskCompletionPercentage()}% completed
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 'bold' }}>
                    {stats.tasks.overdue} overdue
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getTaskCompletionPercentage()}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: getProgressColor(getTaskCompletionPercentage())
                    }
                  }}
                />
              </StatCard>
            </Grid>

            {/* Milestones Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Milestones
                  </Typography>
                  <Box className="p-2 rounded-lg bg-green-100 text-green-600">
                    <FiCalendar size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.milestones.completed}
                  <Typography component="span" variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                    / {stats.milestones.total} milestones
                  </Typography>
                </Typography>
                <Box className="flex items-center justify-between mb-1">
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {getMilestoneCompletionPercentage()}% completed
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 'bold' }}>
                    {stats.milestones.upcoming} upcoming
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getMilestoneCompletionPercentage()}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: getProgressColor(getMilestoneCompletionPercentage())
                    }
                  }}
                />
              </StatCard>
            </Grid>

            {/* Team Card */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Team Composition
                  </Typography>
                  <Box className="p-2 rounded-lg bg-amber-100 text-amber-600">
                    <FiLayers size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.team.total}
                  <Typography component="span" variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                    team members
                  </Typography>
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {Object.entries(stats.team.departments).map(([dept, count]) => (
                    <Box key={dept} sx={{ mb: 1 }}>
                      <Box className="flex items-center justify-between mb-1">
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {dept}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {count} members
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / stats.team.total) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#E5E7EB',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: '#4F46E5'
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </StatCard>
            </Grid>
          </Grid>

          {/* Detailed Stats Section */}
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Project Health Summary
            </Typography>
            
            <Grid container spacing={3}>
              {/* Timeline Progress */}
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Project Timeline
                  </Typography>
                  <Box className="flex items-center justify-between mb-1">
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {selectedProject.startDate ? 
                        new Date(selectedProject.startDate).toLocaleDateString() : 'No start date'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {selectedProject.duration || 'No duration specified'}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={45} // Placeholder - replace with actual timeline progress
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#E5E7EB',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        backgroundColor: '#3B82F6'
                      }
                    }}
                  />
                  <Box className="flex items-center justify-between mt-2">
                    <Chip
                      icon={<FiClock size={14} />}
                      label="On track"
                      size="small"
                      sx={{
                        backgroundColor: '#EFF6FF',
                        color: '#3B82F6',
                        '& .MuiChip-icon': {
                          color: '#3B82F6'
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Estimated completion: {selectedProject.duration || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Risk Assessment */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Risk Assessment
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box className="flex items-center justify-between mb-1">
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Budget Risk
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#F59E0B' }}>
                      Medium
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={65}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#FEF3C7',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#F59E0B'
                      }
                    }}
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box className="flex items-center justify-between mb-1">
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Timeline Risk
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                      Low
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={25}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#D1FAE5',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#10B981'
                      }
                    }}
                  />
                </Box>
                <Box>
                  <Box className="flex items-center justify-between mb-1">
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Resource Risk
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#EF4444' }}>
                      High
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#FEE2E2',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#EF4444'
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ProjectStatsOverview;