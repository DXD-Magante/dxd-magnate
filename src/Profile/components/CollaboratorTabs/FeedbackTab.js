import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  Paper,
  Avatar,
  Chip,
  Button,
  Divider,
  Rating,
  LinearProgress,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  IconButton,
  Badge,
  Grid,
  Stack,
  Select,
  MenuItem
} from '@mui/material';
import {
  FiMessageSquare,
  FiUser,
  FiThumbsUp,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiExternalLink,
  FiFile,
  FiLink,
  FiDownload,
  FiFilter,
  FiChevronDown
} from 'react-icons/fi';
import { collection, query, where, getDocs, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';
const FeedbackTab = ({ formatDate }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    averageRating: 0,
    totalFeedback: 0,
    positiveFeedback: 0,
    improvementFeedback: 0
  });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
  
        setLoading(true);
  
        // Base query for user's submissions
        const q = query(
          collection(db, "project-submissions"),
          where("userId", "==", user.uid)
        );
  
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const feedbackData = snapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            // Filter in memory
            .filter(submission => 
              submission.feedback && 
              ["approved", "revision_requested", "rejected"].includes(submission.status)
            );
  
          // Rest of your calculation logic...
          const approvedFeedback = feedbackData.filter(f => f.status === 'approved');
          const totalFeedback = feedbackData.length;
          const averageRating = totalFeedback > 0 ? 
            feedbackData.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback : 0;
          const positiveFeedback = approvedFeedback.length;
          const improvementFeedback = feedbackData.filter(f => f.status === 'revision_requested').length;
  
          setFeedbacks(feedbackData);
          setStats({
            averageRating,
            totalFeedback,
            positiveFeedback,
            improvementFeedback
          });
          setLoading(false);
        });
  
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching feedback:", error);
        setLoading(false);
      }
    };
  
    fetchFeedback();
  }, []);

  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (filter === 'all') return true;
    if (filter === 'positive') return feedback.status === 'approved';
    if (filter === 'improvement') return feedback.status === 'revision_requested';
    return true;
  });

  const handleAcknowledge = async (feedbackId) => {
    // Implement acknowledgment logic if needed
    console.log("Acknowledged feedback:", feedbackId);
  };

  const getStatusColor = (status) => {
    return status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800';
  };

  const getStatusIcon = (status) => {
    return status === 'approved' ? 
      <FiCheckCircle className="text-green-500" /> : 
      <FiClock className="text-amber-500" />;
  };

  const downloadFile = (file) => {
    if (file?.url) {
      window.open(file.url, '_blank');
    }
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="mb-6">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Performance Feedback
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Review feedback and ratings from your task submissions
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #6366f1',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: '#e0e7ff', 
                  color: '#4f46e5',
                  width: 40,
                  height: 40
                }}>
                  <FiStar size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.averageRating.toFixed(1)}/5
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #10b981',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: '#d1fae5', 
                  color: '#10b981',
                  width: 40,
                  height: 40
                }}>
                  <FiCheckCircle size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Positive Feedback
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.positiveFeedback}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #f59e0b',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: '#fef3c7', 
                  color: '#f59e0b',
                  width: 40,
                  height: 40
                }}>
                  <FiClock size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Improvement Areas
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.improvementFeedback}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #8b5cf6',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: '#ede9fe', 
                  color: '#8b5cf6',
                  width: 40,
                  height: 40
                }}>
                  <FiMessageSquare size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Feedback
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stats.totalFeedback}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
        <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs 
            value={filter}
            onChange={(e, newValue) => setFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#4f46e5'
              }
            }}
          >
            <Tab 
              label="All Feedback" 
              value="all" 
              sx={{
                minHeight: 48,
                color: filter === 'all' ? '#4f46e5' : '#64748b',
                fontWeight: filter === 'all' ? 600 : 400
              }}
            />
            <Tab 
              label="Positive" 
              value="positive" 
              sx={{
                minHeight: 48,
                color: filter === 'positive' ? '#10b981' : '#64748b',
                fontWeight: filter === 'positive' ? 600 : 400
              }}
            />
            <Tab 
              label="Improvement" 
              value="improvement" 
              sx={{
                minHeight: 48,
                color: filter === 'improvement' ? '#f59e0b' : '#64748b',
                fontWeight: filter === 'improvement' ? 600 : 400
              }}
            />
          </Tabs>

          <Select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            size="small"
            sx={{
              backgroundColor: 'white',
              minWidth: 120,
              '& .MuiSelect-icon': {
                color: '#64748b'
              }
            }}
            IconComponent={FiChevronDown}
          >
            <MenuItem value="all">All Tasks</MenuItem>
            <MenuItem value="recent">Recent</MenuItem>
            <MenuItem value="highest">Highest Rated</MenuItem>
            <MenuItem value="lowest">Lowest Rated</MenuItem>
          </Select>
        </Box>
      </Paper>

      {/* Feedback List */}
      {loading ? (
        <Box className="flex justify-center items-center py-12">
          <CircularProgress size={48} />
        </Box>
      ) : filteredFeedbacks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <FiMessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
            No feedback available
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {filter === 'all' 
              ? "You haven't received any feedback yet." 
              : filter === 'positive' 
                ? "No positive feedback found." 
                : "No improvement feedback found."}
          </Typography>
        </Paper>
      ) : (
        <List className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <ListItem key={feedback.id} className="p-0">
              <Paper className="w-full p-4 rounded-xl hover:shadow-sm transition-shadow duration-200">
                <Box className="flex flex-col md:flex-row gap-4">
                  {/* Left Side - Reviewer Info */}
                  <Box className="flex items-start gap-3 min-w-[200px]">
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Tooltip title={feedback.status === 'approved' ? 'Approved' : 'Revision Requested'}>
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24,
                              backgroundColor: feedback.status === 'approved' ? '#10b981' : '#f59e0b',
                              color: 'white',
                              border: '2px solid white'
                            }}
                          >
                            {getStatusIcon(feedback.status)}
                          </Avatar>
                        </Tooltip>
                      }
                    >
                      <Avatar
                        src={feedback.reviewedByPhotoURL}
                        sx={{ width: 56, height: 56 }}
                        alt={feedback.reviewedByName}
                      >
                        {feedback.reviewedByName?.charAt(0) || 'R'}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {feedback.reviewedByName || 'Reviewer'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {feedback.reviewedByRole || 'Project Manager'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8' }}>
                        {formatDate(feedback.reviewedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                  {/* Right Side - Feedback Content */}
                  <Box className="flex-1">
                    <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {feedback.taskTitle || 'Task Submission'}
                      </Typography>
                      <Box className="flex items-center gap-2">
                        <Rating
                          value={feedback.rating || 0}
                          precision={0.5}
                          readOnly
                          size="small"
                          icon={<FiStar size={20} style={{ color: '#f59e0b' }} />}
                          emptyIcon={<FiStar size={20} style={{ color: '#e2e8f0' }} />}
                        />
                        <Chip
                          label={feedback.status === 'approved' ? 'Approved' : 'Revision Requested'}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(feedback.status).split(' ')[0],
                            color: getStatusColor(feedback.status).split(' ')[1],
                            fontWeight: 'bold',
                            fontSize: '0.65rem'
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Feedback Text */}
                    <Paper className="p-3 mb-3 bg-gray-50 rounded-lg border border-gray-100">
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {feedback.feedback || 'No detailed feedback provided.'}
                      </Typography>
                    </Paper>

                    {/* Submission Details */}
                    <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <Box className="flex items-center gap-2">
                        {feedback.type === 'file' ? (
                          <>
                            <FiFile className="text-gray-500" />
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              {feedback.file?.name || 'File submission'}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<FiDownload size={14} />}
                              onClick={() => downloadFile(feedback.file)}
                              sx={{
                                ml: 1,
                                fontSize: '0.65rem',
                                textTransform: 'none',
                                color: '#4f46e5'
                              }}
                            >
                              Download
                            </Button>
                          </>
                        ) : (
                          <>
                            <FiLink className="text-gray-500" />
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              {feedback.link || 'Link submission'}
                            </Typography>
                            <Button
                              size="small"
                              startIcon={<FiExternalLink size={14} />}
                              href={feedback.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                ml: 1,
                                fontSize: '0.65rem',
                                textTransform: 'none',
                                color: '#4f46e5'
                              }}
                            >
                              Open
                            </Button>
                          </>
                        )}
                      </Box>

                      <Box className="flex gap-2">
                        <Button
                          variant="text"
                          size="small"
                          className="text-indigo-600 hover:bg-indigo-50"
                          startIcon={<FiMessageSquare size={14} />}
                        >
                          Reply
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          className="text-green-600 hover:bg-green-50"
                          startIcon={<FiThumbsUp size={14} />}
                          onClick={() => handleAcknowledge(feedback.id)}
                        >
                          Acknowledge
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FeedbackTab;