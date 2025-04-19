// MyTasks.js
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
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextareaAutosize
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiExternalLink,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiMoreVertical,
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiUser,
  FiDownload,
  FiChevronDown,
  FiChevronRight,
  FiArchive,
  FiFlag,
  FiCalendar
} from "react-icons/fi";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc,
  addDoc,
  serverTimestam,
  getDoc ,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled } from '@mui/material/styles';

const statusColors = {
  pending: { bg: "#fef3c7", text: "#d97706", icon: <FiClock color="#d97706" /> },
  completed: { bg: "#ecfdf5", text: "#10b981", icon: <FiCheck color="#10b981" /> },
  in_progress: { bg: "#e0e7ff", text: "#4f46e5", icon: <FiRefreshCw color="#4f46e5" /> },
  overdue: { bg: "#fee2e2", text: "#ef4444", icon: <FiAlertCircle color="#ef4444" /> },
  approved: { bg: "#ecfdf5", text: "#10b981", icon: <FiCheck color="#10b981" /> },
  rejected: { bg: "#fee2e2", text: "#ef4444", icon: <FiX color="#ef4444" /> }
};

const priorityColors = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981"
};

const TaskCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)'
  }
}));

const ExpandableSection = styled(Box)(({ theme }) => ({
  backgroundColor: '#f8fafc',
  borderRadius: 8,
  overflow: 'hidden',
  transition: 'all 0.3s ease'
}));

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentCommentTask, setCurrentCommentTask] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentActionTask, setCurrentActionTask] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [submissionData, setSubmissionData] = useState(null);
const [submissionLoading, setSubmissionLoading] = useState(false);
const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);


const fetchSubmissionDetails = async (submissionId) => {
  try {
    setSubmissionLoading(true);
    const submissionRef = doc(db, "project-submissions", submissionId);
    const submissionSnap = await getDoc(submissionRef);
    
    if (submissionSnap.exists()) {
      setSubmissionData({
        id: submissionSnap.id,
        ...submissionSnap.data()
      });
    } else {
      setSubmissionData(null);
      alert("Submission not found");
    }
  } catch (error) {
    console.error("Error fetching submission:", error);
    alert(`Error: ${error.message}`);
  } finally {
    setSubmissionLoading(false);
  }
};

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "client-tasks"),
          where("assignee.id", "==", user.uid),
        );
        
        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        alert(error)
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (task.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleTaskAction = async (taskId, action, feedback = "") => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      // Get the task data
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error("Task not found");

      // Update client-tasks collection
      const taskRef = doc(db, "client-tasks", taskId);
      await updateDoc(taskRef, {
        status: action === 'complete' ? 'completed' : 
               action === 'start' ? 'in_progress' : 
               action === 'pause' ? 'pending' : 
               'completed',
        updatedAt: new Date().toISOString(),
        ...(feedback && { clientComment: feedback })
      });

      // Update client-feedback collection if it's an approval task
      if (task.type === "approval" && task.feedbackId) {
        const feedbackRef = doc(db, "client-feedback", task.feedbackId);
        await updateDoc(feedbackRef, {
          status: action === 'approve' ? 'approved' : 'rejected',
          respondedAt: new Date().toISOString(),
          response: feedback || (action === 'approve' ? 'Approved by client' : 'Rejected by client'),
          clientId: user.uid,
          clientName: user.displayName || user.email
        });
      }

      // Update project-submissions collection if submissionId exists
      if (task.submissionId) {
        const submissionRef = doc(db, "project-submissions", task.submissionId);
        await updateDoc(submissionRef, {
          status: action === 'approve' ? 'approved' : 
                 action === 'reject' ? 'rejected' : 
                 task.status,
          lastUpdated: new Date().toISOString(),
          
          ...(feedback && { clientFeedback: feedback })
        });
      }

      // Add comment if provided
      if (feedback) {
        await addDoc(collection(db, "task-comments"), {
          taskId,
          userId: user.uid,
          userName: user.displayName || user.email,
          comment: feedback,
          createdAt: serverTimestamp(),
          actionType: action
        });
      }

      // Refresh tasks
      const q = query(
        collection(db, "client-tasks"),
        where("assignee.id", "==", user.uid),
      );
      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);

      alert(`Task ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action} task:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setCommentDialogOpen(false);
      setActionDialogOpen(false);
      setCommentText("");
      setFeedbackText("");
    }
  };

  const toggleTaskExpand = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "No due date";
    
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
      
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getTaskProgress = (task) => {
    if (task.status === 'completed' || task.status === 'approved') return 100;
    if (task.status === 'in_progress') return 50;
    if (task.status === 'rejected') return 0;
    return 10;
  };

  const openCommentDialog = (taskId) => {
    setCurrentCommentTask(taskId);
    setCommentDialogOpen(true);
  };

  const openActionDialog = (taskId, type) => {
    setCurrentActionTask(taskId);
    setActionType(type);
    setActionDialogOpen(true);
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            My Tasks 
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Manage your assigned tasks and track progress
          </Typography>
        </Box>
        <Box className="flex items-center gap-3">
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca',
              }
            }}
          >
            New Task
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5'
            }
          }}
        >
          <Tab 
            label="All Tasks" 
            sx={{
              fontWeight: 'medium',
              color: activeTab === 0 ? '#4f46e5' : '#64748b'
            }}
          />
          <Tab 
            label={
              <Badge 
                badgeContent={tasks.filter(t => t.status === 'pending').length} 
                color="primary"
                invisible={tasks.filter(t => t.status === 'pending').length === 0}
              >
                Pending
              </Badge>
            }
            sx={{
              fontWeight: 'medium',
              color: activeTab === 1 ? '#4f46e5' : '#64748b'
            }}
          />
          <Tab 
            label="In Progress" 
            sx={{
              fontWeight: 'medium',
              color: activeTab === 2 ? '#4f46e5' : '#64748b'
            }}
          />
          <Tab 
            label="Completed" 
            sx={{
              fontWeight: 'medium',
              color: activeTab === 3 ? '#4f46e5' : '#64748b'
            }}
          />
          <Tab 
            label="Approvals" 
            sx={{
              fontWeight: 'medium',
              color: activeTab === 4 ? '#4f46e5' : '#64748b'
            }}
          />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search tasks..."
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
          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="approval">Approval</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="feedback">Feedback</MenuItem>
            </Select>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredTasks.length > 0 ? (
        <Box className="space-y-3">
          {filteredTasks.map((task) => (
            <Box key={task.id}>
              <TaskCard>
                <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <Box className="flex items-start gap-4 w-full">
                    <Box className="flex items-center">
                      <IconButton onClick={() => toggleTaskExpand(task.id)}>
                        {expandedTask === task.id ? (
                          <FiChevronDown size={20} color="#64748b" />
                        ) : (
                          <FiChevronRight size={20} color="#64748b" />
                        )}
                      </IconButton>
                    </Box>
                    
                    <Box className="flex-grow">
                      <Box className="flex items-center gap-2 mb-1">
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold',
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            color: task.status === 'completed' ? '#94a3b8' : '#1e293b'
                          }}
                        >
                          {task.title}
                        </Typography>
                        {task.priority && (
                          <Chip
                            label={task.priority}
                            size="small"
                            sx={{
                              backgroundColor: priorityColors[task.priority] + '20',
                              color: priorityColors[task.priority],
                              fontWeight: 'bold',
                              textTransform: 'capitalize',
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Box>
                      
                      <Box className="flex flex-wrap items-center gap-2">
                        <Chip
                          label={task.status || 'pending'}
                          size="small"
                          icon={statusColors[task.status]?.icon}
                          sx={{
                            backgroundColor: statusColors[task.status]?.bg,
                            color: statusColors[task.status]?.text,
                            fontWeight: 'medium',
                            textTransform: 'capitalize'
                          }}
                        />
                        
                        <Chip
                          label={task.type || 'general'}
                          size="small"
                          sx={{
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            fontWeight: 'medium',
                            textTransform: 'capitalize'
                          }}
                        />
                        
                        <Box className="flex items-center gap-1">
                          <FiCalendar size={14} color="#94a3b8" />
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {formatDate(task.dueDate || task.createdAt)}
                          </Typography>
                        </Box>
                        
                        {task.projectId && (
                          <Chip
                            label={`Project: ${task.projectId.substring(0, 5)}...`}
                            size="small"
                            sx={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 'medium'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box className="flex items-center gap-2">
                      <Box sx={{ minWidth: 120 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={getTaskProgress(task)} 
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: statusColors[task.status]?.text || '#64748b'
                            }
                          }} 
                        />
                        <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center', display: 'block' }}>
                          {getTaskProgress(task)}% complete
                        </Typography>
                      </Box>
                      
                      <Box className="flex items-center gap-1">
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: '#e0e7ff',
                            color: '#4f46e5',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {task.assignee?.avatar || 'U'}
                        </Avatar>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </TaskCard>
              
              {expandedTask === task.id && (
                <ExpandableSection sx={{ p: 3, mb: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                        DESCRIPTION
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#334155', mb: 3 }}>
                        {task.description || "No description provided"}
                      </Typography>
                      
                      {task.type === 'approval' && task.submissionId && (
  <>
    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
      SUBMISSION DETAILS
    </Typography>
    <Box sx={{ 
      backgroundColor: 'white', 
      p: 2, 
      borderRadius: 1,
      border: '1px solid #e2e8f0'
    }}>
      {submissionLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : submissionData ? (
        <>
          <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
            {submissionData.title || task.title}
          </Typography>
          {submissionData.link && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FiExternalLink size={14} />}
              sx={{
                borderColor: '#e2e8f0',
                color: '#4f46e5',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
                }
              }}
              href={submissionData.link.startsWith('http') ? submissionData.link : `https://${submissionData.link}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Submission
            </Button>
          )}
        </>
      ) : (
        fetchSubmissionDetails(task.submissionId)
      )}
    </Box>
  </>
)}
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2 }}>
                        ACTIONS
                      </Typography>

                     
                      
                      <Box className="space-y-2">
  {task.type === 'approval' ? (
    // Only show approve/reject buttons if submission isn't already approved/rejected
    submissionData?.status !== 'approved' && submissionData?.status !== 'rejected' ? (
      <>
        <Button
          fullWidth
          variant="contained"
          startIcon={<FiCheck size={16} />}
          onClick={() => openActionDialog(task.id, 'approve')}
          sx={{
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            '&:hover': {
              backgroundColor: '#d1fae5',
            }
          }}
        >
          Approve
        </Button>
        <Button
          fullWidth
          variant="contained"
          startIcon={<FiX size={16} />}
          onClick={() => openActionDialog(task.id, 'reject')}
          sx={{
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            '&:hover': {
              backgroundColor: '#fecaca',
            }
          }}
        >
          Reject
        </Button>
      </>
    ) : (
      <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 1 }}>
        This submission has already been {submissionData?.status}
      </Typography>
    )
  ) : (
    <>
      {task.status !== 'completed' && (
        <Button
          fullWidth
          variant="contained"
          startIcon={<FiCheck size={16} />}
          onClick={() => handleTaskAction(task.id, 'complete')}
          sx={{
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            '&:hover': {
              backgroundColor: '#d1fae5',
            }
          }}
        >
          Mark Complete
        </Button>
      )}
      {task.status === 'pending' && (
        <Button
          fullWidth
          variant="contained"
          startIcon={<FiRefreshCw size={16} />}
          onClick={() => handleTaskAction(task.id, 'start')}
          sx={{
            backgroundColor: '#e0e7ff',
            color: '#4f46e5',
            '&:hover': {
              backgroundColor: '#c7d2fe',
            }
          }}
        >
          Start Task
        </Button>
      )}
    </>
  )}
                        
                        
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<FiFlag size={16} />}
                          onClick={() => {
                            // Implement flag issue functionality
                            alert(`Flagging issue with task: ${task.id}`);
                          }}
                          sx={{
                            borderColor: '#fee2e2',
                            color: '#ef4444',
                            '&:hover': {
                              borderColor: '#fecaca',
                              backgroundColor: '#fef2f2',
                            }
                          }}
                        >
                          Flag Issue
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </ExpandableSection>
              )}
            </Box>
          ))}
        </Box>
      ) : (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          backgroundColor: '#f8fafc'
        }}>
          <FiAlertCircle size={48} color="#94a3b8" className="mx-auto mb-4" />
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
            No tasks found
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? "Try adjusting your search or filter criteria" 
              : "You don't have any tasks assigned yet"}
          </Typography>
        </Paper>
      )}

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextareaAutosize
            minRows={4}
            placeholder="Enter your comment here..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              resize: 'vertical',
              marginTop: '16px'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              if (commentText.trim()) {
                handleTaskAction(currentCommentTask, 'comment', commentText);
              }
            }}
            variant="contained"
            disabled={!commentText.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog (Approve/Reject) */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Task' : 'Reject Task'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {actionType === 'approve' 
              ? 'Please confirm approval of this task. You can add optional feedback below:'
              : 'Please provide a reason for rejecting this task:'}
          </DialogContentText>
          <TextareaAutosize
            minRows={4}
            placeholder={
              actionType === 'approve' 
                ? 'Optional feedback...' 
                : 'Reason for rejection...'
            }
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              resize: 'vertical'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              handleTaskAction(
                currentActionTask, 
                actionType, 
                feedbackText || (actionType === 'approve' ? 'Approved' : 'Rejected')
              );
            }}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={actionType === 'reject' && !feedbackText.trim()}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTasks;