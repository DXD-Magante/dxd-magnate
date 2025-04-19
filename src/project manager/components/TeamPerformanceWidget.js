import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Avatar,
  Select,
  MenuItem,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Grid
} from "@mui/material";
import {
  FiAward,
  FiUser,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiFilter,
  FiRefreshCw,
  FiChevronDown
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { styled } from '@mui/material/styles';

const PerformanceCard = styled(Paper)(({ theme }) => ({
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

const MemberCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 10,
  marginBottom: theme.spacing(2),
  '&:last-child': {
    marginBottom: 0
  }
}));

const TeamPerformanceCard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0
  });
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

    const fetchPerformanceData = async () => {
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

        // Calculate stats
        const totalTasks = tasksData.length;
        const completedTasks = tasksData.filter(task => task.status === "Done").length;
        const today = new Date();
        const overdueTasks = tasksData.filter(task => {
          if (!task.dueDate || task.status === "Done") return false;
          return new Date(task.dueDate) < today;
        }).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setStats({
          totalTasks,
          completedTasks,
          overdueTasks,
          completionRate
        });

        // Calculate performance for each team member
        if (selectedProject.teamMembers && selectedProject.teamMembers.length > 0) {
          const memberPerformance = selectedProject.teamMembers.map(member => {
            const memberTasks = tasksData.filter(task => 
              task.assignee && task.assignee.id === member.id
            );
            const memberCompleted = memberTasks.filter(task => task.status === "Done").length;
            const memberOverdue = memberTasks.filter(task => {
              if (!task.dueDate || task.status === "Done") return false;
              return new Date(task.dueDate) < today;
            }).length;
            
            return {
              ...member,
              totalTasks: memberTasks.length,
              completedTasks: memberCompleted,
              overdueTasks: memberOverdue,
              completionRate: memberTasks.length > 0 ? Math.round((memberCompleted / memberTasks.length) * 100) : 0,
              efficiency: memberTasks.length > 0 ? 
                Math.round((memberCompleted / (memberTasks.length + memberOverdue)) * 100) : 0
            };
          });

          setTeamMembers(memberPerformance);
        }
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setRefreshing(false);
      }
    };

    fetchPerformanceData();
  }, [selectedProject]);

  const handleRefresh = () => {
    if (!selectedProject) return;
    setRefreshing(true);
    setTeamMembers([]);
    setStats({
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      completionRate: 0
    });
  };

  const getEfficiencyColor = (value) => {
    if (value >= 80) return '#10B981'; // green
    if (value >= 50) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const getCompletionColor = (value) => {
    if (value >= 90) return '#10B981'; // green
    if (value >= 70) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  return (
    <Box className="space-y-6">
      {/* Header with Project Selector */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Team Performance Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track individual contributions and overall team productivity
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
            No projects available to display performance data
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Performance Summary Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <PerformanceCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Total Tasks
                  </Typography>
                  <Box className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <FiUser size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.totalTasks}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Across all team members
                </Typography>
              </PerformanceCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <PerformanceCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Completed
                  </Typography>
                  <Box className="p-2 rounded-lg bg-green-100 text-green-600">
                    <FiCheckCircle size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.completedTasks}
                </Typography>
                <Box className="flex items-center">
                  <Typography variant="caption" sx={{ color: '#64748b', mr: 1 }}>
                    {stats.completionRate}% completion
                  </Typography>
                </Box>
              </PerformanceCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <PerformanceCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Overdue
                  </Typography>
                  <Box className="p-2 rounded-lg bg-amber-100 text-amber-600">
                    <FiAlertTriangle size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stats.overdueTasks}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {stats.totalTasks > 0 ? 
                    `${Math.round((stats.overdueTasks / stats.totalTasks) * 100)}% of tasks` : 
                    'No tasks overdue'}
                </Typography>
              </PerformanceCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <PerformanceCard>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                    Avg. Efficiency
                  </Typography>
                  <Box className="p-2 rounded-lg bg-purple-100 text-purple-600">
                    <FiTrendingUp size={20} />
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {teamMembers.length > 0 ? 
                    Math.round(teamMembers.reduce((sum, member) => sum + member.efficiency, 0)) / teamMembers.length : 
                    0}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Team average
                </Typography>
              </PerformanceCard>
            </Grid>
          </Grid>

          {/* Team Member Performance List */}
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box className="flex items-center justify-between mb-4">
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Individual Performance Metrics
              </Typography>
              <Chip 
                label={`${teamMembers.length} team members`} 
                size="small" 
                sx={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}
              />
            </Box>

            {refreshing ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : teamMembers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  No team members or tasks found for performance analysis
                </Typography>
              </Box>
            ) : (
              <Box>
                {teamMembers.map((member, index) => (
                  <Box key={member.id}>
                    <MemberCard>
                      <Box className="flex items-start justify-between">
                        <Box className="flex items-start space-x-3">
                          <Avatar 
                            alt={member.name} 
                            sx={{ 
                              width: 48, 
                              height: 48,
                              bgcolor: '#E0E7FF',
                              color: '#4F46E5',
                              fontWeight: 'bold'
                            }}
                          >
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {member.name}
                            </Typography>
                            <Box className="flex flex-wrap gap-1 mt-1">
                              <Chip
                                label={member.projectRole || member.role}
                                size="small"
                                sx={{
                                  backgroundColor: '#E0E7FF',
                                  color: '#4F46E5',
                                  fontSize: '0.65rem'
                                }}
                              />
                              <Chip
                                label={member.department}
                                size="small"
                                sx={{
                                  backgroundColor: '#E0F2FE',
                                  color: '#0369A1',
                                  fontSize: '0.65rem'
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box className="flex items-center">
                          <Box className="text-right mr-4">
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {member.completionRate}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Completion
                            </Typography>
                          </Box>
                          <Box className="flex items-center text-green-600">
                            <FiAward className="mr-1" />
                            <span className="text-sm font-medium">{member.efficiency}%</span>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 2 }}>
                        <Box className="flex items-center justify-between mb-1">
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Task Efficiency
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: getEfficiencyColor(member.efficiency)
                            }}
                          >
                            {member.efficiency}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={member.efficiency}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#E5E7EB',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: getEfficiencyColor(member.efficiency)
                            }
                          }}
                        />
                      </Box>
                      
                      <Grid container spacing={1} sx={{ mt: 2 }}>
                        <Grid item xs={4}>
                          <Box className="text-center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {member.totalTasks}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Total
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box className="text-center">
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: getCompletionColor(member.completionRate)
                              }}
                            >
                              {member.completedTasks}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Done
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box className="text-center">
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: member.overdueTasks > 0 ? '#EF4444' : 'inherit'
                              }}
                            >
                              {member.overdueTasks}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              Overdue
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </MemberCard>
                    {index < teamMembers.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default TeamPerformanceCard;