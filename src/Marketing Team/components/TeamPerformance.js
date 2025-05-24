import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Rating,
  Button
} from '@mui/material';
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiTrendingUp,
  FiBarChart2,
  FiFilter,
  FiRefreshCw,
  FiCalendar,
  FiStar,
  FiAlertTriangle
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../../services/firebase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PerformanceDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState('overview');
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('last30days');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchCollaborations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
  
        const q = query(
          collection(db, "marketing-collaboration"),
          where("MentorId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const collaborationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure createdAt is properly handled whether it's a string or timestamp
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
        }));
  
        setCollaborations(collaborationsData);
        if (collaborationsData.length > 0) {
          setSelectedCollaboration(collaborationsData[0]);
        }
      } catch (error) {
        console.error("Error fetching collaborations:", error);
        // Show error to user
        alert("Failed to load collaborations. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchCollaborations();
  }, []);
  // Fetch team performance data
  useEffect(() => {
    if (!selectedCollaboration) return;

    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        // Fetch all tasks for this collaboration
        const tasksQuery = query(
          collection(db, "marketing-collaboration-tasks"),
          where("collaborationId", "==", selectedCollaboration.id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch all submissions for this collaboration
        const submissionsQuery = query(
          collection(db, "marketing-collaboration-submissions"),
          where("collaborationId", "==", selectedCollaboration.id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate performance metrics for each team member
        const performanceMap = {};
        
        // Initialize performance data for each team member
        selectedCollaboration.TeamMembers?.forEach(member => {
          performanceMap[member.id] = {
            id: member.id,
            name: member.name,
            role: member.role,
            totalTasks: 0,
            completedTasks: 0,
            lateTasks: 0,
            totalRating: 0,
            ratedTasks: 0,
            submissions: []
          };
        });

        // Process tasks to calculate completion metrics
        tasksData.forEach(task => {
          if (task.assignee?.id && performanceMap[task.assignee.id]) {
            performanceMap[task.assignee.id].totalTasks++;
            
            if (task.status === 'Done') {
              performanceMap[task.assignee.id].completedTasks++;
              
              // Check if task was completed late
              if (task.dueDate && task.updatedAt) {
                const dueDate = new Date(task.dueDate);
                const completedDate = new Date(task.updatedAt);
                if (completedDate > dueDate) {
                  performanceMap[task.assignee.id].lateTasks++;
                }
              }
            }
          }
        });

        // Process submissions to calculate quality metrics
        submissionsData.forEach(submission => {
          if (performanceMap[submission.userId]) {
            performanceMap[submission.userId].submissions.push(submission);
            
            if (submission.rating > 0) {
              performanceMap[submission.userId].totalRating += submission.rating;
              performanceMap[submission.userId].ratedTasks++;
            }
          }
        });

        // Calculate final performance scores
        const performanceData = Object.values(performanceMap).map(member => {
          const completionRate = member.totalTasks > 0 
            ? (member.completedTasks / member.totalTasks) * 100 
            : 0;
            
          const onTimeRate = member.completedTasks > 0
            ? ((member.completedTasks - member.lateTasks) / member.completedTasks) * 100
            : 0;
            
          const avgQualityScore = member.ratedTasks > 0
            ? (member.totalRating / member.ratedTasks) * 20 // Convert 5-star to 100-point scale
            : 0;
            
          // Calculate overall score with weights
          const overallScore = 
            (completionRate * 0.4) + 
            (onTimeRate * 0.3) + 
            (avgQualityScore * 0.3);
            
          return {
            ...member,
            completionRate,
            onTimeRate,
            avgQualityScore,
            overallScore
          };
        });

        setTeamPerformance(performanceData);
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [selectedCollaboration, timeRange]);

  const handleRefresh = () => {
    // Trigger a refresh by updating the state
    setTeamPerformance([...teamPerformance]);
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 80) return '#3B82F6'; // Blue
    if (score >= 70) return '#F59E0B'; // Yellow
    if (score >= 60) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  // Data for radar chart (individual performance breakdown)
  const getRadarData = (member) => {
    return [
      { subject: 'Completion', A: member.completionRate, fullMark: 100 },
      { subject: 'On Time', A: member.onTimeRate, fullMark: 100 },
      { subject: 'Quality', A: member.avgQualityScore, fullMark: 100 },
    ];
  };

  // Data for pie chart (team distribution by performance level)
  const getPerformanceDistributionData = () => {
    const levels = {
      'Excellent': 0,
      'Great': 0,
      'Good': 0,
      'Fair': 0,
      'Needs Improvement': 0
    };
    
    teamPerformance.forEach(member => {
      const level = getPerformanceLevel(member.overallScore);
      levels[level]++;
    });
    
    return Object.entries(levels).map(([name, value]) => ({
      name,
      value,
      color: name === 'Excellent' ? '#10B981' :
             name === 'Great' ? '#3B82F6' :
             name === 'Good' ? '#F59E0B' :
             name === 'Fair' ? '#F97316' : '#EF4444'
    }));
  };

  // Data for bar chart (top performers)
  const getTopPerformersData = () => {
    return teamPerformance
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5)
      .map(member => ({
        name: member.name,
        score: member.overallScore,
        completion: member.completionRate,
        onTime: member.onTimeRate,
        quality: member.avgQualityScore
      }));
  };

  if (loading && !selectedCollaboration) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        mb: 4,
        gap: isMobile ? 2 : 0
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: isMobile ? '1.75rem' : '2.125rem'
          }}>
            Team Performance
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track and analyze your team's performance metrics
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
  <InputLabel id="collaboration-select-label">Select Collaboration</InputLabel>
  <Select
    labelId="collaboration-select-label"
    value={selectedCollaboration?.id || ''}
    onChange={(e) => {
      const collab = collaborations.find(c => c.id === e.target.value);
      setSelectedCollaboration(collab);
    }}
    label="Select Collaboration"
    sx={{ backgroundColor: 'white' }}
  >
    {collaborations.length > 0 ? (
      collaborations.map(collab => (
        <MenuItem key={collab.id} value={collab.id}>
          {collab.title}
        </MenuItem>
      ))
    ) : (
      <MenuItem disabled value="">
        No collaborations available
      </MenuItem>
    )}
  </Select>
</FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
              <MenuItem value="last90days">Last 90 Days</MenuItem>
              <MenuItem value="alltime">All Time</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} sx={{ 
              backgroundColor: '#f1f5f9',
              '&:hover': { backgroundColor: '#e2e8f0' }
            }}>
              <FiRefreshCw size={18} color="#64748b" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons="auto"
      >
        <Tab 
          value="overview" 
          label="Overview" 
          icon={<FiBarChart2 size={18} style={{ marginBottom: 0 }} />} 
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab 
          value="individual" 
          label="Individual" 
          icon={<FiUsers size={18} style={{ marginBottom: 0 }} />} 
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab 
          value="metrics" 
          label="Detailed Metrics" 
          icon={<FiTrendingUp size={18} style={{ marginBottom: 0 }} />} 
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {/* Content */}
      {activeTab === 'overview' && (
        <Box>
          {/* Performance Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2, 
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1'
                  }}>
                    <FiUsers size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Team Members
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {teamPerformance.length}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2, 
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>
                    <FiCheckCircle size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Avg. Completion
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {teamPerformance.length > 0 
                        ? Math.round(teamPerformance.reduce((sum, member) => sum + member.completionRate, 0)) / teamPerformance.length
                        : 0}%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2, 
                    backgroundColor: '#fef3c7',
                    color: '#92400e'
                  }}>
                    <FiClock size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Avg. On Time
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {teamPerformance.length > 0 
                        ? Math.round(teamPerformance.reduce((sum, member) => sum + member.onTimeRate, 0) / teamPerformance.length)
                        : 0}%
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    mr: 2, 
                    backgroundColor: '#ede9fe',
                    color: '#5b21b6'
                  }}>
                    <FiAward size={24} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Avg. Quality
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {teamPerformance.length > 0
                        ? (teamPerformance.reduce((sum, member) => sum + member.avgQualityScore, 0) / teamPerformance.length).toFixed(1)
                        : "0.0"}/5
                    </Typography>

                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Performance Distribution */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Performance Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPerformanceDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {getPerformanceDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 3, 
                height: '100%',
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Top Performers
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={getTopPerformersData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'Score']}
                      labelFormatter={(name) => `Member: ${name}`}
                    />
                    <Legend />
                    <Bar dataKey="score" name="Overall Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Activity */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Performance Updates
            </Typography>
            
            {teamPerformance.length > 0 ? (
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 2
              }}>
                {teamPerformance
                  .sort((a, b) => new Date(b.submissions[0]?.reviewedAt || 0) - new Date(a.submissions[0]?.reviewedAt || 0))
                  .slice(0, 3)
                  .map(member => (
                    <Paper key={member.id} sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40, 
                          mr: 2,
                          bgcolor: '#e0e7ff',
                          color: '#4f46e5'
                        }}>
                          {getInitials(member.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {member.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {member.role}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {member.submissions.length > 0 && (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            Latest task: <strong>{member.submissions[0].taskTitle}</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Rating
                              value={member.submissions[0].rating || 0}
                              readOnly
                              precision={0.5}
                              size="small"
                              emptyIcon={<FiStar style={{ color: '#e2e8f0' }} />}
                            />
                            <Typography variant="caption" sx={{ ml: 1, color: '#64748b' }}>
                              {member.submissions[0].rating || 'Not rated'}
                            </Typography>
                          </Box>
                          {member.submissions[0].feedback && (
                            <Typography variant="body2" sx={{ 
                              fontStyle: 'italic',
                              color: '#64748b',
                              fontSize: '0.875rem',
                              mt: 1
                            }}>
                              "{member.submissions[0].feedback}"
                            </Typography>
                          )}
                        </>
                      )}
                    </Paper>
                  ))}
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                border: '1px dashed #e2e8f0',
                borderRadius: 2
              }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No recent performance updates available
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {activeTab === 'individual' && (
        <Box>
          {selectedMember ? (
            <Box>
              <Button 
                startIcon={<FiUsers />}
                onClick={() => setSelectedMember(null)}
                sx={{ mb: 3 }}
              >
                Back to Team View
              </Button>
              
              <Paper sx={{ 
                p: 3, 
                mb: 3,
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar sx={{ 
                    width: 64, 
                    height: 64, 
                    mr: 3,
                    bgcolor: '#e0e7ff',
                    color: '#4f46e5',
                    fontSize: '1.5rem'
                  }}>
                    {getInitials(selectedMember.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {selectedMember.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                      {selectedMember.role}
                    </Typography>
                    <Chip
                      label={getPerformanceLevel(selectedMember.overallScore)}
                      sx={{ 
                        mt: 1,
                        backgroundColor: getPerformanceColor(selectedMember.overallScore) + '20',
                        color: getPerformanceColor(selectedMember.overallScore),
                        fontWeight: 600
                      }}
                    />
                  </Box>
                </Box>
                
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                        Overall Score
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {Math.round(selectedMember.overallScore)}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedMember.overallScore} 
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          mt: 1,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getPerformanceColor(selectedMember.overallScore)
                          }
                        }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                        Task Completion
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {Math.round(selectedMember.completionRate)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedMember.completionRate} 
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          mt: 1,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#3B82F6'
                          }
                        }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                        On Time Delivery
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {Math.round(selectedMember.onTimeRate)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedMember.onTimeRate} 
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          mt: 1,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#10B981'
                          }
                        }}
                      />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                        Avg. Quality Score
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {selectedMember.avgQualityScore.toFixed(1)}/5
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedMember.avgQualityScore * 20} 
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          mt: 1,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#F59E0B'
                          }
                        }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
                
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Performance Breakdown
                </Typography>
                
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(selectedMember)}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar 
                      name="Score" 
                      dataKey="A" 
                      stroke="#4f46e5" 
                      fill="#4f46e5" 
                      fillOpacity={0.6} 
                    />
                    <RechartsTooltip 
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Paper>
              
              <Paper sx={{ 
                p: 3, 
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Recent Submissions
                </Typography>
                
                {selectedMember.submissions.length > 0 ? (
                  <Box sx={{ 
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 2
                  }}>
                    {selectedMember.submissions
                      .sort((a, b) => new Date(b.reviewedAt || b.submittedAt) - new Date(a.reviewedAt || a.submittedAt))
                      .slice(0, 6)
                      .map((submission, index) => (
                        <Paper key={index} sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          border: '1px solid #e2e8f0'
                        }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            {submission.taskTitle}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Chip
                              label={submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              size="small"
                              sx={{ 
                                mr: 1,
                                backgroundColor: submission.status === 'approved' ? '#D1FAE5' :
                                               submission.status === 'rejected' ? '#FEE2E2' : '#FEF3C7',
                                color: submission.status === 'approved' ? '#065F46' :
                                       submission.status === 'rejected' ? '#B91C1C' : '#92400E'
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {new Date(submission.reviewedAt || submission.submittedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          
                          {submission.rating > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Rating
                                value={submission.rating}
                                readOnly
                                precision={0.5}
                                size="small"
                                emptyIcon={<FiStar style={{ color: '#e2e8f0' }} />}
                              />
                              <Typography variant="caption" sx={{ ml: 1, color: '#64748b' }}>
                                {submission.rating}/5
                              </Typography>
                            </Box>
                          )}
                          
                          {submission.feedback && (
                            <Typography variant="body2" sx={{ 
                              fontStyle: 'italic',
                              color: '#64748b',
                              fontSize: '0.875rem',
                              mt: 1
                            }}>
                              "{submission.feedback}"
                            </Typography>
                          )}
                        </Paper>
                      ))}
                  </Box>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    border: '1px dashed #e2e8f0',
                    borderRadius: 2
                  }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No submissions found for this member
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          ) : (
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Team Members Performance
              </Typography>
              
              {teamPerformance.length > 0 ? (
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 2
                }}>
                  {teamPerformance
                    .sort((a, b) => b.overallScore - a.overallScore)
                    .map(member => (
                      <Paper 
                        key={member.id} 
                        onClick={() => setSelectedMember(member)}
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            borderColor: '#cbd5e1'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            bgcolor: '#e0e7ff',
                            color: '#4f46e5'
                          }}>
                            {getInitials(member.name)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {member.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {member.role}
                            </Typography>
                          </Box>
                          <Chip
                            label={Math.round(member.overallScore)}
                            size="small"
                            sx={{ 
                              backgroundColor: getPerformanceColor(member.overallScore) + '20',
                              color: getPerformanceColor(member.overallScore),
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                            Task Completion: {Math.round(member.completionRate)}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={member.completionRate} 
                            sx={{ 
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#3B82F6'
                              }
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                            On Time Delivery: {Math.round(member.onTimeRate)}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={member.onTimeRate} 
                            sx={{ 
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#10B981'
                              }
                            }}
                          />
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                            Avg. Quality: {member.avgQualityScore.toFixed(1)}/5
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={member.avgQualityScore * 20} 
                            sx={{ 
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#F59E0B'
                              }
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
                  border: '1px dashed #e2e8f0',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No performance data available for this team
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      )}

      {activeTab === 'metrics' && (
        <Box>
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Detailed Performance Metrics
            </Typography>
            
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={teamPerformance
                  .sort((a, b) => b.overallScore - a.overallScore)
                  .map(member => ({
                    name: member.name,
                    completion: member.completionRate,
                    onTime: member.onTimeRate,
                    quality: member.avgQualityScore,
                    overall: member.overallScore
                  }))
                }
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  angle={isMobile ? 45 : 0} 
                  textAnchor={isMobile ? "start" : "middle"}
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(value, name) => [`${value}%`, name === 'quality' ? 'Quality (converted from 5-star)' : name]}
                  labelFormatter={(name) => `Member: ${name}`}
                />
                <Legend />
                <Bar dataKey="completion" name="Completion Rate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onTime" name="On Time Rate" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quality" name="Quality Score" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overall" name="Overall Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          
          <Paper sx={{ 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Performance Insights
            </Typography>
            
            {teamPerformance.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ 
                    p: 3, 
                    height: '100%',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      <FiTrendingUp style={{ marginRight: 8 }} />
                      Top Performers
                    </Typography>
                    {teamPerformance
                      .sort((a, b) => b.overallScore - a.overallScore)
                      .slice(0, 3)
                      .map((member, index) => (
                        <Box key={member.id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 2,
                              bgcolor: '#e0e7ff',
                              color: '#4f46e5',
                              fontSize: '0.75rem'
                            }}>
                              {getInitials(member.name)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                              {member.name}
                            </Typography>
                            <Chip
                              label={`${Math.round(member.overallScore)}`}
                              size="small"
                              sx={{ 
                                backgroundColor: getPerformanceColor(member.overallScore) + '20',
                                color: getPerformanceColor(member.overallScore),
                                fontWeight: 600
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {member.completedTasks} tasks completed ({Math.round(member.completionRate)}%)
                          </Typography>
                        </Box>
                      ))}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ 
                    p: 3, 
                    height: '100%',
                    borderRadius: 2,
                    border: '1px solid #e2e8f0'
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      <FiAlertTriangle style={{ marginRight: 8, color: '#EF4444' }} />
                      Needs Improvement
                    </Typography>
                    {teamPerformance
                      .sort((a, b) => a.overallScore - b.overallScore)
                      .slice(0, 3)
                      .map((member, index) => (
                        <Box key={member.id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 2,
                              bgcolor: '#fee2e2',
                              color: '#b91c1c',
                              fontSize: '0.75rem'
                            }}>
                              {getInitials(member.name)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                              {member.name}
                            </Typography>
                            <Chip
                              label={`${Math.round(member.overallScore)}`}
                              size="small"
                              sx={{ 
                                backgroundColor: getPerformanceColor(member.overallScore) + '20',
                                color: getPerformanceColor(member.overallScore),
                                fontWeight: 600
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                            {member.totalTasks - member.completedTasks} incomplete tasks
                          </Typography>
                        </Box>
                      ))}
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                border: '1px dashed #e2e8f0',
                borderRadius: 2
              }}>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No performance data available for insights
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default PerformanceDashboard;