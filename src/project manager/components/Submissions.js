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
  Badge,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  CircularProgress,
  Tabs,
  Tab,
  TextareaAutosize
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiMoreVertical,
  FiMessageSquare,
  FiPaperclip,
  FiEdit,
  FiSend,
  FiThumbsUp,
  FiThumbsDown
} from "react-icons/fi";
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "../../services/firebase";

const statusColors = {
  submitted: { bg: "#fef3c7", text: "#d97706", icon: <FiClock color="#d97706" /> },
  approved: { bg: "#ecfdf5", text: "#10b981", icon: <FiCheck color="#10b981" /> },
  rejected: { bg: "#fee2e2", text: "#ef4444", icon: <FiX color="#ef4444" /> },
  revision: { bg: "#e0e7ff", text: "#4f46e5", icon: <FiRefreshCw color="#4f46e5" /> }
};

const formatDate = (timestamp) => {
  if (!timestamp?.seconds) return "Unknown date";
  
  const date = new Date(timestamp.seconds * 1000);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
};

const formatLongDate = (timestamp) => {
  if (!timestamp?.seconds) return "Unknown date";
  
  const date = new Date(timestamp.seconds * 1000);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
};

const SubmissionsDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [projects, setProjects] = useState({});
  const [tasks, setTasks] = useState({});
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [reviewAction, setReviewAction] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "project-submissions"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const submissionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(submission => {
    const title = submission.title || "";
    const description = submission.description || "";
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    const matchesType = typeFilter === "all" || submission.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (submission) => {
    setSelectedSubmission(submission);
    setFeedbackText(submission.feedback || "");
    setReviewAction(null);
    setActiveTab(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDownloadAll = () => {
    console.log("Download all submissions");
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedSubmission) return;
    
    try {
      setUpdating(true);
      await updateDoc(doc(db, "project-submissions", selectedSubmission.id), {
        status: newStatus,
        feedback: feedbackText,
        reviewedAt: new Date().toISOString()
      });

      // Update local state
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id ? {
          ...sub,
          status: newStatus,
          feedback: feedbackText,
          reviewedAt: new Date().toISOString()
        } : sub
      ));

      setOpenDialog(false);
    } catch (error) {
      console.error("Error updating submission status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFeedbackChange = (event) => {
    setFeedbackText(event.target.value);
  };

  const handleQuickAction = (action) => {
    setReviewAction(action);
    if (action === 'approve') {
      setFeedbackText("Approved - looks great!");
    } else if (action === 'reject') {
      setFeedbackText("Please revise and resubmit.");
    }
    setActiveTab(1); // Switch to feedback tab
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Submissions
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Review and manage all project submissions
          </Typography>
        </Box>
        <Box className="flex items-center gap-3">
          <Button
            variant="contained"
            startIcon={<FiDownload size={18} />}
            onClick={handleDownloadAll}
            sx={{
              backgroundColor: 'white',
              color: '#4f46e5',
              border: '1px solid #e2e8f0',
              '&:hover': {
                backgroundColor: '#f8fafc',
              }
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search submissions..."
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
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="revision">Revision</MenuItem>
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
              <MenuItem value="file">File</MenuItem>
              <MenuItem value="link">Link</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FiFilter size={18} />}
              fullWidth
              sx={{
                borderColor: '#e2e8f0',
                color: '#64748b',
                backgroundColor: 'white',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              Advanced
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Submissions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredSubmissions.length > 0 ? (
        <Grid container spacing={3} sx={{width:'100%', padding:'10px'}}>
          {filteredSubmissions.map((submission) => (
            <Grid item xs={12} key={submission.id}>
              <Paper sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${statusColors[submission.status]?.text || '#64748b'}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transform: 'translateY(-2px)'
                }
              }}>
                <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <Box className="flex items-start gap-4">
                    <Avatar sx={{
                      bgcolor: statusColors[submission.status]?.bg,
                      color: statusColors[submission.status]?.text,
                      mt: 1
                    }}>
                      {submission.type === 'file' ? (
                        <FiFileText size={20} />
                      ) : (
                        <FiExternalLink size={20} />
                      )}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {submission.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                        {submission.description || "No description provided"}
                      </Typography>
                      <Box className="flex flex-wrap gap-2">
                        <Chip
                          label={submission.status}
                          size="small"
                          icon={statusColors[submission.status]?.icon}
                          sx={{
                            backgroundColor: statusColors[submission.status]?.bg,
                            color: statusColors[submission.status]?.text,
                            fontWeight: 'medium',
                            textTransform: 'capitalize'
                          }}
                        />
                        <Chip
                          label={submission.type}
                          size="small"
                          sx={{
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            fontWeight: 'medium',
                            textTransform: 'capitalize'
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                          {formatDate(submission.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-2">
                    {submission.type === 'file' ? (
                      <Button
                        variant="outlined"
                        startIcon={<FiDownload size={16} />}
                        href={submission.file?.url}
                        target="_blank"
                        sx={{
                          borderColor: '#e2e8f0',
                          color: '#4f46e5',
                          '&:hover': {
                            borderColor: '#cbd5e1',
                            backgroundColor: '#f8fafc',
                          }
                        }}
                      >
                        Download
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<FiExternalLink size={16} />}
                        href={submission.link}
                        target="_blank"
                        sx={{
                          borderColor: '#e2e8f0',
                          color: '#4f46e5',
                          '&:hover': {
                            borderColor: '#cbd5e1',
                            backgroundColor: '#f8fafc',
                          }
                        }}
                      >
                        Visit Link
                      </Button>
                    )}
                    <Tooltip title="View Details">
                      <IconButton
                        onClick={() => handleViewDetails(submission)}
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: '#f1f5f9'
                          }
                        }}
                      >
                        <FiMoreVertical size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
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
            No submissions found
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "No submissions have been made yet"}
          </Typography>
        </Paper>
      )}

      {/* Submission Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        {selectedSubmission && (
          <>
            <DialogTitle sx={{ 
              fontWeight: 'bold',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Avatar sx={{
                bgcolor: statusColors[selectedSubmission.status]?.bg,
                color: statusColors[selectedSubmission.status]?.text
              }}>
                {selectedSubmission.type === 'file' ? (
                  <FiFileText size={20} />
                ) : (
                  <FiExternalLink size={20} />
                )}
              </Avatar>
              {selectedSubmission.title}
            </DialogTitle>
            
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{
                borderBottom: '1px solid #e2e8f0',
                px: 3
              }}
            >
              <Tab label="Details" icon={<FiFileText size={18} />} />
              <Tab label="Review" icon={<FiEdit size={18} />} />
            </Tabs>
            
            <DialogContent sx={{ py: 3 }}>
              {activeTab === 0 ? (
                <Box className="space-y-4">
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      Status
                    </Typography>
                    <Chip
                      label={selectedSubmission.status}
                      icon={statusColors[selectedSubmission.status]?.icon}
                      sx={{
                        backgroundColor: statusColors[selectedSubmission.status]?.bg,
                        color: statusColors[selectedSubmission.status]?.text,
                        fontWeight: 'medium',
                        textTransform: 'capitalize'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      Submitted On
                    </Typography>
                    <Typography variant="body1">
                      {formatLongDate(selectedSubmission.createdAt)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedSubmission.description || "No description provided"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      {selectedSubmission.type === 'file' ? 'File Details' : 'Link'}
                    </Typography>
                    {selectedSubmission.type === 'file' ? (
                      <Box className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FiPaperclip size={24} color="#64748b" />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {selectedSubmission.file?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            {selectedSubmission.file?.type} • {Math.round(selectedSubmission.file?.size / 1024)} KB
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          startIcon={<FiDownload size={16} />}
                          href={selectedSubmission.file?.url}
                          target="_blank"
                          sx={{
                            ml: 'auto',
                            borderColor: '#e2e8f0',
                            color: '#4f46e5',
                            '&:hover': {
                              borderColor: '#cbd5e1',
                              backgroundColor: '#f8fafc',
                            }
                          }}
                        >
                          Download
                        </Button>
                      </Box>
                    ) : (
                      <Box className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FiExternalLink size={24} color="#64748b" />
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {selectedSubmission.link}
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<FiExternalLink size={16} />}
                          href={selectedSubmission.link}
                          target="_blank"
                          sx={{
                            ml: 'auto',
                            borderColor: '#e2e8f0',
                            color: '#4f46e5',
                            '&:hover': {
                              borderColor: '#cbd5e1',
                              backgroundColor: '#f8fafc',
                            }
                          }}
                        >
                          Visit Link
                        </Button>
                      </Box>
                    )}
                  </Box>

                  {selectedSubmission.feedback && (
                    <Box sx={{ 
                      mt: 2,
                      p: 2,
                      backgroundColor: '#f8fafc',
                      borderRadius: 1
                    }}>
                      <Typography variant="subtitle2" sx={{ color: '#4f46e5', mb: 1 }}>
                        FEEDBACK FROM REVIEWER
                      </Typography>
                      <Typography variant="body1">
                        {selectedSubmission.feedback}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box className="space-y-4">
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Review Submission
                  </Typography>
                  
                  <Box className="flex gap-3">
                    <Button
                      variant={reviewAction === 'approve' ? 'contained' : 'outlined'}
                      startIcon={<FiThumbsUp size={18} />}
                      onClick={() => handleQuickAction('approve')}
                      sx={{
                        backgroundColor: reviewAction === 'approve' ? '#ECFDF5' : 'transparent',
                        color: reviewAction === 'approve' ? '#10B981' : '#64748B',
                        borderColor: reviewAction === 'approve' ? '#10B981' : '#E5E7EB',
                        '&:hover': {
                          backgroundColor: '#ECFDF5',
                          borderColor: '#10B981'
                        }
                      }}
                    >
                      Approve
                    </Button>
                    
                    <Button
                      variant={reviewAction === 'reject' ? 'contained' : 'outlined'}
                      startIcon={<FiThumbsDown size={18} />}
                      onClick={() => handleQuickAction('reject')}
                      sx={{
                        backgroundColor: reviewAction === 'reject' ? '#FEE2E2' : 'transparent',
                        color: reviewAction === 'reject' ? '#EF4444' : '#64748B',
                        borderColor: reviewAction === 'reject' ? '#EF4444' : '#E5E7EB',
                        '&:hover': {
                          backgroundColor: '#FEE2E2',
                          borderColor: '#EF4444'
                        }
                      }}
                    >
                      Request Changes
                    </Button>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      Feedback
                    </Typography>
                    <TextareaAutosize
                      minRows={4}
                      placeholder="Provide detailed feedback..."
                      value={feedbackText}
                      onChange={handleFeedbackChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        '&:focus': {
                          outline: 'none',
                          borderColor: '#4F46E5',
                          boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                        }
                      }}
                    />
                  </Box>
                  
                  {selectedSubmission.status === 'revision' && (
                    <Box sx={{ 
                      mt: 2,
                      p: 2,
                      backgroundColor: '#FEF3C7',
                      borderRadius: 1
                    }}>
                      <Typography variant="subtitle2" sx={{ color: '#B45309', mb: 1 }}>
                        PREVIOUS FEEDBACK
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#92400E' }}>
                        {selectedSubmission.feedback}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
              {activeTab === 0 ? (
                <>
                  <Button
                    onClick={handleCloseDialog}
                    sx={{
                      color: '#64748b',
                      '&:hover': {
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveTab(1)}
                    sx={{
                      backgroundColor: '#4f46e5',
                      '&:hover': {
                        backgroundColor: '#4338ca'
                      }
                    }}
                  >
                    {selectedSubmission.status === 'submitted' ? 'Review Submission' : 
                     selectedSubmission.status === 'revision' ? 'Update Review' : 'View Details'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setActiveTab(0)}
                    sx={{
                      color: '#64748b',
                      '&:hover': {
                        backgroundColor: '#f1f5f9'
                      }
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCloseDialog}
                    sx={{
                      borderColor: '#E5E7EB',
                      color: '#64748B',
                      '&:hover': {
                        backgroundColor: '#F9FAFB'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!feedbackText || !reviewAction || updating}
                    onClick={() => handleStatusUpdate(
                      reviewAction === 'approve' ? 'approved' : 'revision'
                    )}
                    startIcon={updating ? <CircularProgress size={16} /> : <FiSend size={16} />}
                    sx={{
                      backgroundColor: '#4f46e5',
                      '&:hover': {
                        backgroundColor: '#4338ca'
                      },
                      '&:disabled': {
                        backgroundColor: '#E5E7EB',
                        color: '#9CA3AF'
                      }
                    }}
                  >
                    {updating ? 'Processing...' : 'Submit Review'}
                  </Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SubmissionsDashboard;