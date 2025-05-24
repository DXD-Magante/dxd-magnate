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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import {
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiUsers,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiTrendingUp,
  FiBarChart2,
  FiX,
  FiStar,
  FiClock
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Communication = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('team');
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [performanceData, setPerformanceData] = useState([]);
  const [taskData, setTaskData] = useState([]);

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
          ...doc.data()
        }));

        setCollaborations(collaborationsData);
        if (collaborationsData.length > 0) {
          setSelectedCollaboration(collaborationsData[0]);
        }
      } catch (error) {
        console.error("Error fetching collaborations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborations();
  }, []);

  useEffect(() => {
    if (!selectedCollaboration) return;

    // Set team members from selected collaboration
    setTeamMembers(selectedCollaboration.TeamMembers || []);

    // Fetch performance data for this collaboration
    const fetchPerformanceData = async () => {
      try {
        const tasksQuery = query(
          collection(db, "marketing-collaboration-tasks"),
          where("collaborationId", "==", selectedCollaboration.id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTaskData(tasksData);

        const submissionsQuery = query(
          collection(db, "marketing-collaboration-submissions"),
          where("collaborationId", "==", selectedCollaboration.id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate performance metrics
        const performanceMap = {};
        
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

        tasksData.forEach(task => {
          if (task.assignee?.id && performanceMap[task.assignee.id]) {
            performanceMap[task.assignee.id].totalTasks++;
            
            if (task.status === 'Done') {
              performanceMap[task.assignee.id].completedTasks++;
              
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

        submissionsData.forEach(submission => {
          if (performanceMap[submission.userId]) {
            performanceMap[submission.userId].submissions.push(submission);
            
            if (submission.rating > 0) {
              performanceMap[submission.userId].totalRating += submission.rating;
              performanceMap[submission.userId].ratedTasks++;
            }
          }
        });

        const performanceData = Object.values(performanceMap).map(member => {
          const completionRate = member.totalTasks > 0 
            ? (member.completedTasks / member.totalTasks) * 100 
            : 0;
            
          const onTimeRate = member.completedTasks > 0
            ? ((member.completedTasks - member.lateTasks) / member.completedTasks) * 100
            : 0;
            
          const avgQualityScore = member.ratedTasks > 0
            ? (member.totalRating / member.ratedTasks) * 20
            : 0;
            
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

        setPerformanceData(performanceData);
      } catch (error) {
        console.error("Error fetching performance data:", error);
      }
    };

    fetchPerformanceData();
  }, [selectedCollaboration]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    if (score >= 70) return '#F59E0B';
    if (score >= 60) return '#F97316';
    return '#EF4444';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getRadarData = (member) => {
    return [
      { subject: 'Completion', A: member.completionRate, fullMark: 100 },
      { subject: 'On Time', A: member.onTimeRate, fullMark: 100 },
      { subject: 'Quality', A: member.avgQualityScore, fullMark: 100 },
    ];
  };

  const handleMemberClick = (member) => {
    const memberWithPerformance = performanceData.find(m => m.id === member.id) || member;
    setSelectedMember(memberWithPerformance);
    setOpenMemberDialog(true);
  };

  if (loading) {
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
            Team Communication
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Connect and collaborate with your team members
          </Typography>
        </Box>
        
        {collaborations.length > 0 && (
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
              {collaborations.map(collab => (
                <MenuItem key={collab.id} value={collab.id}>
                  {collab.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
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
          value="team" 
          label="Team Members" 
          icon={<FiUsers size={18} style={{ marginBottom: 0 }} />} 
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab 
          value="recent" 
          label="Recent Activity" 
          icon={<FiClock size={18} style={{ marginBottom: 0 }} />} 
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {/* Content */}
      {activeTab === 'team' && (
        <Box>
          {teamMembers.length > 0 ? (
            <Grid container spacing={3}>
              {teamMembers.map((member) => {
                const memberPerformance = performanceData.find(m => m.id === member.id);
                const memberTasks = taskData.filter(task => task.assignee?.id === member.id);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={member.id}>
                    <Paper sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar 
                          sx={{ 
                            width: 64, 
                            height: 64, 
                            mr: 3,
                            bgcolor: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '1.5rem'
                          }}
                        >
                          {getInitials(member.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {member.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {member.role}
                          </Typography>
                          {memberPerformance && (
                            <Chip
                              label={getPerformanceLevel(memberPerformance.overallScore)}
                              size="small"
                              sx={{ 
                                mt: 1,
                                backgroundColor: getPerformanceColor(memberPerformance.overallScore) + '20',
                                color: getPerformanceColor(memberPerformance.overallScore),
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Task Summary
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Assigned: {memberTasks.length}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Completed: {memberTasks.filter(t => t.status === 'Done').length}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={memberTasks.length > 0 ? 
                            (memberTasks.filter(t => t.status === 'Done').length / memberTasks.length) * 100 : 0} 
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
                      
                      <Box sx={{ mt: 'auto' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Contact Options
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                          <Tooltip title="Send Email">
                            <IconButton 
                              sx={{ 
                                backgroundColor: '#f1f5f9',
                                '&:hover': { backgroundColor: '#e2e8f0' }
                              }}
                            >
                              <FiMail size={20} color="#64748b" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Call">
                            <IconButton 
                              sx={{ 
                                backgroundColor: '#f1f5f9',
                                '&:hover': { backgroundColor: '#e2e8f0' }
                              }}
                            >
                              <FiPhone size={20} color="#64748b" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Chat">
                            <IconButton 
                                onClick={() => {
                                    navigate('/chats', { 
                                      state: { 
                                        contactId: member.id,
                                        contact: {
                                          id: member.id,
                                          name: member.name,
                                          role: member.role || 'Team Member'
                                        }
                                      }
                                    });
                                  }}
                              sx={{ 
                                backgroundColor: '#f1f5f9',
                                '&:hover': { backgroundColor: '#e2e8f0' }
                              }}
                            >
                              <FiMessageSquare size={20} color="#64748b" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Profile">
                            <IconButton 
                              onClick={() => handleMemberClick(member)}
                              sx={{ 
                                backgroundColor: '#f1f5f9',
                                '&:hover': { backgroundColor: '#e2e8f0' }
                              }}
                            >
                              <FiUser size={20} color="#64748b" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper sx={{ 
              textAlign: 'center', 
              py: 4,
              border: '1px dashed #e2e8f0',
              borderRadius: 2
            }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {selectedCollaboration 
                  ? "No team members in this collaboration" 
                  : "Please select a collaboration to view team members"}
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {activeTab === 'recent' && (
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Recent Communications
          </Typography>
          
          {performanceData.length > 0 ? (
            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
              {performanceData
                .flatMap(member => 
                  member.submissions
                    .map(submission => ({ member, submission }))
                )
                .sort((a, b) => 
                  new Date(b.submission.reviewedAt || b.submission.submittedAt) - 
                  new Date(a.submission.reviewedAt || a.submission.submittedAt)
                )
                .slice(0, 10)
                .map(({ member, submission }, index) => (
                  <ListItem 
                    key={index} 
                    sx={{ 
                      borderBottom: '1px solid #e2e8f0',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: '#e0e7ff',
                          color: '#4f46e5'
                        }}
                      >
                        {getInitials(member.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {member.name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span" display="block">
                            {submission.taskTitle}
                          </Typography>
                          {submission.feedback && (
                            <Typography variant="body2" sx={{ 
                              fontStyle: 'italic',
                              color: '#64748b',
                              fontSize: '0.875rem',
                              mt: 0.5
                            }}>
                              "{submission.feedback}"
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', mr: 2 }}>
                              {new Date(submission.reviewedAt || submission.submittedAt).toLocaleDateString()}
                            </Typography>
                            {submission.rating > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <FiStar size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {submission.rating}/5
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                ))}
            </List>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              border: '1px dashed #e2e8f0',
              borderRadius: 2
            }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No recent communication activity
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Member Detail Dialog */}
      <Dialog
        open={openMemberDialog}
        onClose={() => setOpenMemberDialog(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2,
            height: isMobile ? '100%' : '80%',
            maxHeight: 'none'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Team Member Details
          <Button 
            onClick={() => setOpenMemberDialog(false)}
            sx={{ 
              minWidth: 0,
              p: 0.5,
              color: 'inherit'
            }}
          >
            <FiX size={20} />
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2, overflow: 'hidden' }}>
          {selectedMember && (
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', mb: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: isMobile ? 3 : 0,
                  mr: isMobile ? 0 : 3 
                }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mr: 3,
                      bgcolor: '#e0e7ff',
                      color: '#4f46e5',
                      fontSize: '2rem'
                    }}
                  >
                    {getInitials(selectedMember.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {selectedMember.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
                      {selectedMember.role}
                    </Typography>
                    {selectedMember.overallScore && (
                      <Chip
                        label={`${getPerformanceLevel(selectedMember.overallScore)} (${Math.round(selectedMember.overallScore)})`}
                        size="medium"
                        sx={{ 
                          backgroundColor: getPerformanceColor(selectedMember.overallScore) + '20',
                          color: getPerformanceColor(selectedMember.overallScore),
                          fontWeight: 600
                        }}
                      />
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  flex: 1,
                  mt: isMobile ? 2 : 0
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                      Tasks
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {taskData.filter(t => t.assignee?.id === selectedMember.id).length}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                      Completed
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {taskData.filter(t => t.assignee?.id === selectedMember.id && t.status === 'Done').length}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                      Avg. Rating
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {selectedMember.ratedTasks > 0 
                        ? (selectedMember.totalRating / selectedMember.ratedTasks).toFixed(1) 
                        : '0.0'}/5
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Tabs 
                value="overview" 
                sx={{ mb: 3 }}
                variant={isMobile ? 'scrollable' : 'standard'}
                scrollButtons="auto"
              >
                <Tab 
                  value="overview" 
                  label="Overview" 
                  icon={<FiUser size={18} style={{ marginBottom: 0 }} />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  value="tasks" 
                  label="Tasks" 
                  icon={<FiCheckCircle size={18} style={{ marginBottom: 0 }} />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  value="performance" 
                  label="Performance" 
                  icon={<FiTrendingUp size={18} style={{ marginBottom: 0 }} />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
              </Tabs>
              
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Performance Overview
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      height: '100%'
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
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
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      height: '100%'
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                        Task Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Completed', value: selectedMember.completedTasks, color: '#10B981' },
                              { name: 'In Progress', value: selectedMember.totalTasks - selectedMember.completedTasks, color: '#F59E0B' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell key="completed" fill="#10B981" />
                            <Cell key="in-progress" fill="#F59E0B" />
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
                
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
                      .slice(0, 3)
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
                            <Typography variant="caption" sx={{ color: '#64748b', mr: 2 }}>
                              {new Date(submission.reviewedAt || submission.submittedAt).toLocaleDateString()}
                            </Typography>
                            {submission.rating > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <FiStar size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {submission.rating}/5
                                </Typography>
                              </Box>
                            )}
                          </Box>
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
                      No recent submissions
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: '1px solid rgba(0,0,0,0.08)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FiMail />}
              sx={{
                borderColor: '#e2e8f0',
                color: '#1e293b',
                '&:hover': { borderColor: '#cbd5e1' }
              }}
            >
              Send Email
            </Button>
            <Button
              variant="outlined"
              startIcon={<FiPhone />}
              sx={{
                borderColor: '#e2e8f0',
                color: '#1e293b',
                '&:hover': { borderColor: '#cbd5e1' }
              }}
            >
              Call
            </Button>
            <Button
              variant="contained"
              startIcon={<FiMessageSquare />}
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
    
              onClick={() => {
                navigate('/chats', { 
                  state: { 
                    contactId: selectedMember.id,
                    contact: {
                      id: selectedMember.id,
                      name: selectedMember.name,
                      role: selectedMember.role || 'Team Member'
                    }
                  }
                });
              }}
            >
              Start Chat
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Communication;