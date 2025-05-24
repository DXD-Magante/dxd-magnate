import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box,
  List, ListItem, Paper, Button, Chip, LinearProgress,
  Avatar, IconButton, Tooltip, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, DialogContentText
} from '@mui/material';
import {
  FiCheck, FiX, FiCheckCircle, FiClock, FiAlertCircle,
  FiExternalLink, FiMessageSquare, FiThumbsUp, FiThumbsDown,
  FiChevronDown, FiChevronRight, FiRefreshCw, FiCalendar
} from 'react-icons/fi';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../services/firebase';
import { styled } from '@mui/material/styles';

const statusColors = {
  pending: { bg: '#fef3c7', text: '#d97706', icon: <FiClock color="#d97706" /> },
  completed: { bg: '#ecfdf5', text: '#10b981', icon: <FiCheckCircle color="#10b981" /> },
  in_progress: { bg: '#e0e7ff', text: '#4f46e5', icon: <FiRefreshCw color="#4f46e5" /> },
  overdue: { bg: '#fee2e2', text: '#ef4444', icon: <FiAlertCircle color="#ef4444" /> },
  approved: { bg: '#ecfdf5', text: '#10b981', icon: <FiCheck color="#10b981" /> },
  rejected: { bg: '#fee2e2', text: '#ef4444', icon: <FiX color="#ef4444" /> }
};

const priorityColors = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981"
};

const TaskCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)'
  }
}));

const TasksTab = ({ formatDate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentActionTask, setCurrentActionTask] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "client-tasks"),
          where("clientId", "==", user.uid),
          where("status", "in", ["pending", "in_progress", "overdue"])
        );
        
        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const toggleTaskExpand = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleTaskAction = async (taskId, action, feedback = "") => {
    try {
      const taskRef = doc(db, "client-tasks", taskId);
      await updateDoc(taskRef, {
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date().toISOString(),
        clientFeedback: feedback || (action === 'approve' ? 'Approved' : 'Rejected')
      });

      // Update UI
      setTasks(tasks.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: action === 'approve' ? 'approved' : 'rejected',
          clientFeedback: feedback 
        } : task
      ));

      setActionDialogOpen(false);
      setFeedbackText('');
    } catch (error) {
      console.error(`Error ${action} task:`, error);
    }
  };

  const getTaskProgress = (task) => {
    if (task.status === 'completed' || task.status === 'approved') return 100;
    if (task.status === 'in_progress') return 50;
    if (task.status === 'rejected') return 0;
    return 10;
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
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Client Tasks
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Review and manage your pending tasks
          </Typography>
        </Box>
        <Box className="flex items-center gap-3">
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={() => window.location.reload()}
            sx={{
              borderColor: '#e2e8f0',
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1'
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : tasks.length > 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className="shadow-lg rounded-xl border border-gray-200">
              <CardContent className="p-6">
                <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                  Pending Approval
                </Typography>
                
                <List className="space-y-3">
                  {tasks.filter(t => t.type === 'approval').map((task) => (
                    <ListItem key={task.id} className="p-0">
                      <TaskCard className="w-full">
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
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: '#1e293b'
                                }}
                              >
                                {task.title}
                              </Typography>
                              
                              <Box className="flex flex-wrap items-center gap-2 mt-1">
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
                                
                                <Box className="flex items-center gap-1">
                                  <FiCalendar size={14} color="#94a3b8" />
                                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    Due {formatDate(task.dueDate || task.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            
                           </Box>
                        </Box>
                        
                        {expandedTask === task.id && (
                          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ color: '#334155', mb: 2 }}>
                              {task.description || "No description provided"}
                            </Typography>
                            
                            {task.link && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<FiExternalLink size={14} />}
                                href={task.link.startsWith('http') ? task.link : `https://${task.link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  borderColor: '#e2e8f0',
                                  color: '#4f46e5',
                                  '&:hover': {
                                    borderColor: '#cbd5e1',
                                    backgroundColor: '#f8fafc',
                                  }
                                }}
                              >
                                View Submission
                              </Button>
                            )}
                          </Box>
                        )}
                      </TaskCard>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card className="shadow-lg rounded-xl border border-gray-200">
              <CardContent className="p-6">
                <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                  Other Tasks
                </Typography>
                
                <List className="space-y-3">
                  {tasks.filter(t => t.type !== 'approval').map((task) => (
                    <ListItem key={task.id} className="p-0">
                      <TaskCard className="w-full">
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
                              <Typography 
                                variant="subtitle1" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: '#1e293b'
                                }}
                              >
                                {task.title}
                              </Typography>
                              
                              <Box className="flex flex-wrap items-center gap-2 mt-1">
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
                                
                                <Box className="flex items-center gap-1">
                                  <FiCalendar size={14} color="#94a3b8" />
                                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    Due {formatDate(task.dueDate || task.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            
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
                          </Box>
                        </Box>
                        
                        {expandedTask === task.id && (
                          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ color: '#334155', mb: 2 }}>
                              {task.description || "No description provided"}
                            </Typography>
                            
                            <Button
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
                          </Box>
                        )}
                      </TaskCard>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          backgroundColor: '#f8fafc'
        }}>
          <FiCheckCircle size={48} color="#94a3b8" className="mx-auto mb-4" />
          <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
            No pending tasks
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            You're all caught up! Check back later for new tasks.
          </Typography>
        </Paper>
      )}

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
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder={
              actionType === 'approve' 
                ? 'Optional feedback...' 
                : 'Reason for rejection...'
            }
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setActionDialogOpen(false)}
            sx={{ color: '#64748b' }}
          >
            Cancel
          </Button>
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
            sx={{
              backgroundColor: actionType === 'approve' ? '#10b981' : '#ef4444',
              '&:hover': {
                backgroundColor: actionType === 'approve' ? '#059669' : '#dc2626'
              }
            }}
          >
            {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksTab;