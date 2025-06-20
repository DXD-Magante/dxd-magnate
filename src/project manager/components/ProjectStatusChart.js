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
import { FaTasks, FaChartLine, FaRegCalendarCheck } from "react-icons/fa";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { styled } from '@mui/material/styles';
import RiskAssessmentSection from "./RiskAssessment";

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

const ProgressRing = ({ progress, size = 120, strokeWidth = 10 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const strokeColor = progress >= 80 ? '#10B981' : progress >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-500 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={strokeColor}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: strokeColor }}>
          {progress}%
        </span>
      </div>
    </div>
  );
};

const ProjectProgressCard = ({ completedTasks, totalTasks, milestonesCompleted, totalMilestones }) => {
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const milestoneProgress = totalMilestones > 0 ? Math.round((milestonesCompleted / totalMilestones) * 100) : 0;
  
  const getStatusText = (progress) => {
    if (progress >= 80) return 'Excellent progress';
    if (progress >= 60) return 'Good progress';
    if (progress >= 40) return 'Moderate progress';
    if (progress > 0) return 'Slow progress';
    return 'No progress yet';
  };

  const getStatusColor = (progress) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-amber-600';
    if (progress >= 40) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <StatCard>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Project Progress
          </Typography>
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <FaChartLine size={20} />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center">
            <ProgressRing progress={taskProgress} size={140} strokeWidth={12} />
            <div className="mt-4 text-center">
              <Typography variant="subtitle2" className="text-gray-600">
                Task Completion
              </Typography>
              <Typography variant="body2" className={getStatusColor(taskProgress)}>
                {completedTasks} of {totalTasks} tasks
              </Typography>
              <Typography variant="caption" className={`${getStatusColor(taskProgress)} italic`}>
                {getStatusText(taskProgress)}
              </Typography>
            </div>
          </div>
          
          <div className="hidden md:block h-full border-l border-gray-200"></div>
          
          <div className="flex flex-col items-center">
            <ProgressRing progress={milestoneProgress} size={140} strokeWidth={12} />
            <div className="mt-4 text-center">
              <Typography variant="subtitle2" className="text-gray-600">
                Milestone Completion
              </Typography>
              <Typography variant="body2" className={getStatusColor(milestoneProgress)}>
                {milestonesCompleted} of {totalMilestones} milestones
              </Typography>
              <Typography variant="caption" className={`${getStatusColor(milestoneProgress)} italic`}>
                {getStatusText(milestoneProgress)}
              </Typography>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="caption" className="text-gray-600">
              Overall Progress
            </Typography>
            <Typography variant="caption" className="font-medium">
              {Math.round((taskProgress + milestoneProgress) / 2)}%
            </Typography>
          </div>
          <LinearProgress
            variant="determinate"
            value={Math.round((taskProgress + milestoneProgress) / 2)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: taskProgress >= 80 ? '#10B981' : 
                                taskProgress >= 50 ? '#F59E0B' : '#EF4444'
              }
            }}
          />
        </div>
      </div>
    </StatCard>
  );
};

const TaskStatsCard = ({ completed, total, overdue }) => {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const overduePercentage = total > 0 ? Math.round((overdue / total) * 100) : 0;
  
  return (
    <StatCard>
      <div className="flex items-center justify-between mb-4">
        <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
          Task Completion
        </Typography>
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          <FaTasks size={20} />
        </div>
      </div>
      
      <div className="flex items-end mb-3">
        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
          {completed}
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', ml: 1, mb: 0.5 }}>
          / {total} tasks
        </Typography>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Completion Rate
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {progress}%
          </Typography>
        </div>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#E5E7EB',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: progress >= 80 ? '#10B981' : 
                              progress >= 50 ? '#F59E0B' : '#EF4444'
            }
          }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-500 mr-1" size={14} />
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Overdue
          </Typography>
        </div>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#EF4444' }}>
          {overdue} ({overduePercentage}%)
        </Typography>
      </div>
    </StatCard>
  );
};

const MilestoneStatsCard = ({ completed, total, upcoming }) => {
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <StatCard>
      <div className="flex items-center justify-between mb-4">
        <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
          Milestones
        </Typography>
        <div className="p-2 rounded-lg bg-green-100 text-green-600">
          <FaRegCalendarCheck size={20} />
        </div>
      </div>
      
      <div className="flex items-end mb-3">
        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
          {completed}
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', ml: 1, mb: 0.5 }}>
          / {total} milestones
        </Typography>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Completion Rate
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {progress}%
          </Typography>
        </div>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#E5E7EB',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: progress >= 80 ? '#10B981' : 
                              progress >= 50 ? '#F59E0B' : '#EF4444'
            }
          }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <FiClock className="text-amber-500 mr-1" size={14} />
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Upcoming
          </Typography>
        </div>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#F59E0B' }}>
          {upcoming}
        </Typography>
      </div>
    </StatCard>
  );
};

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
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
          }).length
        };

        // Calculate milestone stats (placeholder - adjust based on your data structure)
        const milestoneStats = {
          total: selectedProject.milestones?.length || 0,
          completed: selectedProject.milestones?.filter(m => m.status === "Completed").length || 0,
          upcoming: selectedProject.milestones?.filter(m => {
            if (!m.dueDate || m.status === "Completed") return false;
            const dueDate = new Date(m.dueDate);
            return dueDate > today;
          }).length || 0
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
            <Grid item xs={12} md={6} lg={4}>
              <ProjectProgressCard 
                completedTasks={stats.tasks.completed}
                totalTasks={stats.tasks.total}
                milestonesCompleted={stats.milestones.completed}
                totalMilestones={stats.milestones.total}
              />
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <TaskStatsCard 
                completed={stats.tasks.completed}
                total={stats.tasks.total}
                overdue={stats.tasks.overdue}
              />
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <MilestoneStatsCard 
                completed={stats.milestones.completed}
                total={stats.milestones.total}
                upcoming={stats.milestones.upcoming}
              />
            </Grid>
          </Grid>

          {/* Detailed Stats Section */}
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Project Timeline Overview
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
                    value={Math.round((stats.tasks.completed / stats.tasks.total) * 100) || 0}
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
                      label={
                        stats.tasks.completed === stats.tasks.total ? 'Completed' : 
                        stats.tasks.completed / stats.tasks.total > 0.7 ? 'Ahead of schedule' :
                        stats.tasks.completed / stats.tasks.total > 0.4 ? 'On track' : 'Behind schedule'
                      }
                      size="small"
                      sx={{
                        backgroundColor: 
                          stats.tasks.completed === stats.tasks.total ? '#D1FAE5' : 
                          stats.tasks.completed / stats.tasks.total > 0.7 ? '#D1FAE5' :
                          stats.tasks.completed / stats.tasks.total > 0.4 ? '#DBEAFE' : '#FEE2E2',
                        color: 
                          stats.tasks.completed === stats.tasks.total ? '#065F46' : 
                          stats.tasks.completed / stats.tasks.total > 0.7 ? '#065F46' :
                          stats.tasks.completed / stats.tasks.total > 0.4 ? '#1E40AF' : '#991B1B',
                        '& .MuiChip-icon': {
                          color: 
                            stats.tasks.completed === stats.tasks.total ? '#10B981' : 
                            stats.tasks.completed / stats.tasks.total > 0.7 ? '#10B981' :
                            stats.tasks.completed / stats.tasks.total > 0.4 ? '#3B82F6' : '#EF4444'
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {stats.tasks.completed} tasks completed
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Team Composition */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Team Composition
                </Typography>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(stats.team.departments).map(([dept, count]) => (
                    <div key={dept} className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                        <Typography variant="body2" sx={{ color: '#4F46E5', fontWeight: 'bold' }}>
                          {count}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {dept}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {Math.round((count / stats.team.total) * 100)}% of team
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              </Grid>

              <Grid item xs={12} md={6}>
                <RiskAssessmentSection projectId={selectedProject?.id} />
              </Grid>
            </Grid>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ProjectStatsOverview;