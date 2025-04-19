import React from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  Tooltip,
  IconButton,
  Badge,
  Button
} from "@mui/material";
import {
  FiActivity,
  FiDownload,
  FiLayers,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiHelpCircle,
  FiUsers
} from "react-icons/fi";
import { FaRegDotCircle, FaRegClock } from "react-icons/fa";

const ProjectHealth = ({ projects }) => {
  // Sample data - replace with your actual project data
  const projectHealthData = [
    {
      id: 1,
      title: "Website Redesign",
      healthScore: 85,
      status: "On track",
      budget: { used: 65, remaining: 35 },
      timeline: { completed: 70, remaining: 30 },
      risks: 2,
      issues: 3,
      team: { total: 8, available: 6 }
    },
    {
      id: 2,
      title: "Mobile App Development",
      healthScore: 65,
      status: "Needs attention",
      budget: { used: 80, remaining: 20 },
      timeline: { completed: 50, remaining: 50 },
      risks: 5,
      issues: 7,
      team: { total: 5, available: 3 }
    },
    {
      id: 3,
      title: "Marketing Campaign",
      healthScore: 92,
      status: "Excellent",
      budget: { used: 45, remaining: 55 },
      timeline: { completed: 85, remaining: 15 },
      risks: 1,
      issues: 0,
      team: { total: 4, available: 4 }
    }
  ];

  const getHealthColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const getHealthIcon = (score) => {
    if (score >= 80) return <FiCheckCircle className="text-green-500" />;
    if (score >= 60) return <FiAlertCircle className="text-amber-500" />;
    return <FiAlertCircle className="text-red-500" />;
  };

  const getTrendIcon = (value, threshold = 0) => {
    if (value > threshold) return <FiTrendingUp className="text-green-500" />;
    if (value < threshold) return <FiTrendingDown className="text-red-500" />;
    return <FiActivity className="text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Project Health Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Overview of project health metrics and key performance indicators
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outlined" 
            startIcon={<FiDownload size={18} />}
            sx={{
              backgroundColor: 'white',
              color: '#4f46e5',
              border: '1px solid #e2e8f0',
              '&:hover': {
                backgroundColor: '#f8fafc',
              }
            }}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <div className="flex justify-between items-start">
              <div>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  Total Projects
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {projects.length}
                </Typography>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <FiLayers size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <FiTrendingUp className="mr-1" />
              <span>2 new this month</span>
            </div>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <div className="flex justify-between items-start">
              <div>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  Average Health Score
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  78
                </Typography>
              </div>
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <FiActivity size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <FiTrendingUp className="mr-1" />
              <span>5% from last month</span>
            </div>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <div className="flex justify-between items-start">
              <div>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  Active Risks
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  14
                </Typography>
              </div>
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <FiAlertCircle size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-amber-600">
              <FiTrendingDown className="mr-1" />
              <span>3 new this week</span>
            </div>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <div className="flex justify-between items-start">
              <div>
                <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                  On Track Projects
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {projects.filter(p => p.status === 'In progress').length}
                </Typography>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <FiCheckCircle size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <FiTrendingUp className="mr-1" />
              <span>10% improvement</span>
            </div>
          </Paper>
        </Grid>
      </Grid>

      {/* Health Overview */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Project Health Overview
        </Typography>
        
        <Grid container spacing={3}>
          {projectHealthData.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${
                  getHealthColor(project.healthScore) === 'success' ? '#10b981' :
                  getHealthColor(project.healthScore) === 'warning' ? '#f59e0b' : '#ef4444'
                }`,
                height: '100%'
              }}>
                <div className="flex justify-between items-start mb-4">
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {project.title}
                  </Typography>
                  <Tooltip title={`Health score: ${project.healthScore}`}>
                    <Chip
                      icon={getHealthIcon(project.healthScore)}
                      label={`${project.healthScore}`}
                      size="small"
                      sx={{
                        backgroundColor: `${
                          getHealthColor(project.healthScore) === 'success' ? '#ecfdf5' :
                          getHealthColor(project.healthScore) === 'warning' ? '#fffbeb' : '#fef2f2'
                        }`,
                        color: `${
                          getHealthColor(project.healthScore) === 'success' ? '#059669' :
                          getHealthColor(project.healthScore) === 'warning' ? '#d97706' : '#dc2626'
                        }`,
                        fontWeight: 'bold'
                      }}
                    />
                  </Tooltip>
                </div>

                {/* Status */}
                <div className="flex items-center mb-3">
                  <span className="text-sm text-gray-500 mr-2">Status:</span>
                  <Chip
                    label={project.status}
                    size="small"
                    sx={{
                      backgroundColor: project.status === 'Excellent' ? '#ecfdf5' :
                                      project.status === 'On track' ? '#eff6ff' : '#fffbeb',
                      color: project.status === 'Excellent' ? '#059669' :
                            project.status === 'On track' ? '#1d4ed8' : '#b45309',
                      fontWeight: 'medium'
                    }}
                  />
                </div>

                {/* Budget */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <FiDollarSign className="text-gray-500 mr-1" size={14} />
                      <span className="text-sm text-gray-500">Budget</span>
                    </div>
                    <span className="text-sm font-medium">
                      {project.budget.used}% used ({project.budget.remaining}% remaining)
                    </span>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={project.budget.used} 
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: project.budget.used > 75 ? '#ef4444' : 
                                         project.budget.used > 50 ? '#f59e0b' : '#10b981',
                        borderRadius: 3
                      }
                    }}
                  />
                </div>

                {/* Timeline */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <FiClock className="text-gray-500 mr-1" size={14} />
                      <span className="text-sm text-gray-500">Timeline</span>
                    </div>
                    <span className="text-sm font-medium">
                      {project.timeline.completed}% completed
                    </span>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={project.timeline.completed} 
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: project.timeline.completed < 50 ? '#ef4444' : 
                                         project.timeline.completed < 75 ? '#f59e0b' : '#10b981',
                        borderRadius: 3
                      }
                    }}
                  />
                </div>

                {/* Risks & Issues */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center">
                    <FiAlertCircle className="text-red-500 mr-2" size={16} />
                    <div>
                      <span className="text-sm text-gray-500">Risks</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{project.risks}</span>
                        {getTrendIcon(project.risks, 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FiHelpCircle className="text-amber-500 mr-2" size={16} />
                    <div>
                      <span className="text-sm text-gray-500">Issues</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{project.issues}</span>
                        {getTrendIcon(project.issues, 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team */}
                <div className="flex items-center">
                  <FiUsers className="text-gray-500 mr-2" size={16} />
                  <div>
                    <span className="text-sm text-gray-500">Team</span>
                    <div className="flex items-center">
                      <span className="font-medium">
                        {project.team.available}/{project.team.total} available
                      </span>
                    </div>
                  </div>
                </div>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Detailed Metrics */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Detailed Health Metrics
        </Typography>
        
        <Grid container spacing={3}>
          {/* Budget Health */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <div className="flex items-center mb-3">
                <FiDollarSign className="text-blue-500 mr-2" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Budget Health
                </Typography>
              </div>
              <div className="space-y-4">
                {projectHealthData.map(project => (
                  <div key={`budget-${project.id}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{project.title}</span>
                      <span className="text-sm">
                        ${Math.round(project.budget.used / 100 * 100000).toLocaleString()} / $100,000
                      </span>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.budget.used} 
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: project.budget.used > 75 ? '#ef4444' : 
                                         project.budget.used > 50 ? '#f59e0b' : '#10b981',
                          borderRadius: 4
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </Paper>
          </Grid>
          
          {/* Timeline Health */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <div className="flex items-center mb-3">
                <FiClock className="text-purple-500 mr-2" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Timeline Health
                </Typography>
              </div>
              <div className="space-y-4">
                {projectHealthData.map(project => (
                  <div key={`timeline-${project.id}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{project.title}</span>
                      <span className="text-sm">
                        {project.timeline.completed}% completed
                      </span>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.timeline.completed} 
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: project.timeline.completed < 50 ? '#ef4444' : 
                                         project.timeline.completed < 75 ? '#f59e0b' : '#10b981',
                          borderRadius: 4
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </Paper>
          </Grid>
          
          {/* Risk Assessment */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <div className="flex items-center mb-3">
                <FiAlertCircle className="text-red-500 mr-2" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Risk Assessment
                </Typography>
              </div>
              <div className="space-y-3">
                {projectHealthData.map(project => (
                  <div key={`risk-${project.id}`} className="flex items-center">
                    <div className="w-32">
                      <span className="text-sm font-medium">{project.title}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 mx-0.5 rounded-full ${
                              i < project.risks ? 'bg-red-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-2">
                          {project.risks} active risks
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Paper>
          </Grid>
          
          {/* Team Health */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <div className="flex items-center mb-3">
                <FiUsers className="text-green-500 mr-2" size={20} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Team Health
                </Typography>
              </div>
              <div className="space-y-3">
                {projectHealthData.map(project => (
                  <div key={`team-${project.id}`} className="flex items-center">
                    <div className="w-32">
                      <span className="text-sm font-medium">{project.title}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${(project.team.available / project.team.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {project.team.available}/{project.team.total} available
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default ProjectHealth;