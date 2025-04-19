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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  TextareaAutosize,
  Badge,
  LinearProgress
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiExternalLink,
  FiFileText,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiMoreVertical,
  FiMessageSquare,
  FiSend,
  FiThumbsUp,
  FiThumbsDown,
  FiUser,
  FiMail,
  FiDownload
} from "react-icons/fi";
import { collection, query, where, getDocs, orderBy, addDoc, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled } from '@mui/material/styles';

const statusColors = {
  pending: { bg: "#fef3c7", text: "#d97706", icon: <FiClock color="#d97706" /> },
  approved: { bg: "#ecfdf5", text: "#10b981", icon: <FiCheck color="#10b981" /> },
  rejected: { bg: "#fee2e2", text: "#ef4444", icon: <FiX color="#ef4444" /> },
  changes_requested: { bg: "#e0e7ff", text: "#4f46e5", icon: <FiRefreshCw color="#4f46e5" /> }
};

const SubmissionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  borderLeft: '4px solid',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)'
  }
}));

const FeedbackApprovalsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [actionType, setActionType] = useState(null);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

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
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedProject) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, "project-submissions"),
          where("projectId", "==", selectedProject.id),
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
  }, [selectedProject]);

  useEffect(() => {
    const fetchApprovalRequests = async () => {
      if (!selectedProject) return;

      try {
        setLoadingApprovals(true);
        const q = query(
          collection(db, "client-feedback"),
          where("projectId", "==", selectedProject.id),
          where("type", "==", "approval"),
        );
        const querySnapshot = await getDocs(q);
        const requestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setApprovalRequests(requestsData);
      } catch (error) {
        console.error("Error fetching approval requests:", error);
      } finally {
        setLoadingApprovals(false);
      }
    };

    if (activeTab === 1) {
      fetchApprovalRequests();
    }
  }, [selectedProject, activeTab]);

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (submission.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApprovalRequests = approvalRequests.filter(request => {
    return request.status === "pending";
  });
  const handleSendFeedback = async () => {
    if (!selectedSubmission || !feedbackText) return;
    const senderName = `${userData.firstName} ${userData.lastName}`;
  
    try {
      setSending(true);
      
      // Add to client-feedback collection
      const feedbackRef = await addDoc(collection(db, "client-feedback"), {
        submissionId: selectedSubmission.id,
        projectId: selectedSubmission.projectId,
        taskId: selectedSubmission.taskId,
        message: feedbackText,
        status: "pending",
        requestedBy: auth.currentUser.uid,
        requestedAt: new Date().toISOString(),
        type: actionType === 'feedback' ? 'feedback' : 'approval',
        clientId: selectedProject.clientId,
        clientName: selectedProject.clientName
      });
  
      // Add notification to client-notifications collection
      await addDoc(collection(db, "client-notifications"), {
        userId: selectedProject.clientId,
        type: actionType === 'feedback' ? 'feedback' : 'approval',
        timestamp: new Date().toISOString(),
        message: actionType === 'feedback' 
          ? `New feedback request for: ${selectedSubmission.title}`
          : `Approval requested for: ${selectedSubmission.title}`,
        read: false,
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
        submissionId: selectedSubmission.id,
        submissionTitle: selectedSubmission.title,
        feedbackId: feedbackRef.id,
        senderId: auth.currentUser.uid,
        senderName: senderName || "Project Manager"
      });
  
      // Update submission status if needed
      if (actionType === 'approval') {
        await updateDoc(doc(db, "project-submissions", selectedSubmission.id), {
          status: "pending_approval",
          lastUpdated: new Date().toISOString()
        });
  
        // Create a new task document for each approval request
        await addDoc(collection(db, "client-tasks"), {
          assignee: {
            id: selectedProject.clientId,
            name: selectedProject.clientName,
            avatar: selectedProject.clientName.split(' ').map(n => n[0]).join('')
          },
          clientId: selectedProject.clientId,
          clientName: selectedProject.clientName,
          title: selectedSubmission.title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: "approval",
          submissionId: selectedSubmission.id,
          feedbackId: feedbackRef.id,
          status: "pending",
          projectId: selectedSubmission.projectId
        });
      }
  
      setOpenDialog(false);
      setFeedbackText("");
      setActionType(null);
    } catch (error) {
      console.error("Error sending feedback:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleRequestApproval = (submission) => {
    setSelectedSubmission(submission);
    setActionType('approval');
    setFeedbackText(`Please review and approve: ${submission.title}`);
    setOpenDialog(true);
  };

  const handleSendFeedbackRequest = (submission) => {
    setSelectedSubmission(submission);
    setActionType('feedback');
    setFeedbackText("");
    setOpenDialog(true);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    // Handle both Firestore Timestamp and ISO string
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
      
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Feedback & Approvals
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Manage client feedback and approval requests
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
            >
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5'
            }
          }}
        >
          <Tab 
            label="Submissions" 
            icon={<FiFileText size={18} />}
            sx={{
              fontWeight: 'medium',
              color: activeTab === 0 ? '#4f46e5' : '#64748b'
            }}
          />
          <Tab 
            label={
              <Badge 
                badgeContent={filteredApprovalRequests.length} 
                color="primary"
                invisible={filteredApprovalRequests.length === 0}
              >
                Pending Approvals
              </Badge>
            } 
            icon={<FiCheck size={18} />}
            sx={{
              fontWeight: 'medium',
              color: activeTab === 1 ? '#4f46e5' : '#64748b'
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
              placeholder={activeTab === 0 ? "Search submissions..." : "Search approval requests..."}
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
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="changes_requested">Changes Requested</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={3}>
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

      {/* Content */}
      {loading && activeTab === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : loadingApprovals && activeTab === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : activeTab === 0 ? (
        filteredSubmissions.length > 0 ? (
          <Grid container spacing={3}>
            {filteredSubmissions.map((submission) => (
              <Grid item xs={12} key={submission.id}>
                <SubmissionCard 
                  sx={{ 
                    borderLeftColor: statusColors[submission.status]?.text || '#64748b'
                  }}
                >
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
                            label={submission.status || 'submitted'}
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
                      <Button
                        variant="contained"
                        startIcon={<FiMessageSquare size={16} />}
                        onClick={() => handleSendFeedbackRequest(submission)}
                        sx={{
                          backgroundColor: '#e0e7ff',
                          color: '#4f46e5',
                          '&:hover': {
                            backgroundColor: '#c7d2fe',
                          }
                        }}
                      >
                        Feedback
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<FiCheck size={16} />}
                        onClick={() => handleRequestApproval(submission)}
                        sx={{
                          backgroundColor: '#4f46e5',
                          '&:hover': {
                            backgroundColor: '#4338ca',
                          }
                        }}
                      >
                        Request Approval
                      </Button>
                    </Box>
                  </Box>
                </SubmissionCard>
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
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filter criteria" 
                : "No submissions have been made yet for this project"}
            </Typography>
          </Paper>
        )
      ) : filteredApprovalRequests.length > 0 ? (
        <Grid container spacing={3}>
          {filteredApprovalRequests.map((request) => (
            <Grid item xs={12} key={request.id}>
              <SubmissionCard 
                sx={{ 
                  borderLeftColor: statusColors[request.status]?.text || '#64748b'
                }}
              >
                <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <Box className="flex items-start gap-4">
                    <Avatar sx={{
                      bgcolor: statusColors[request.status]?.bg,
                      color: statusColors[request.status]?.text,
                      mt: 1
                    }}>
                      <FiCheck size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Approval Request: {request.message.substring(0, 50)}{request.message.length > 50 ? "..." : ""}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                        {request.feedback}
                      </Typography>
                      <Box className="flex flex-wrap gap-2">
                        <Chip
                          label={request.status || 'pending'}
                          size="small"
                          icon={statusColors[request.status]?.icon}
                          sx={{
                            backgroundColor: statusColors[request.status]?.bg,
                            color: statusColors[request.status]?.text,
                            fontWeight: 'medium',
                            textTransform: 'capitalize'
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                          Requested: {formatDate(request.requestedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-2">
                    <Button
                      variant="outlined"
                      startIcon={<FiMail size={16} />}
                      onClick={() => {
                        // TODO: Implement resend notification
                      }}
                      sx={{
                        borderColor: '#e2e8f0',
                        color: '#4f46e5',
                        '&:hover': {
                          borderColor: '#cbd5e1',
                          backgroundColor: '#f8fafc',
                        }
                      }}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<FiX size={16} />}
                      onClick={() => {
                        // TODO: Implement cancel approval request
                      }}
                      sx={{
                        backgroundColor: '#fee2e2',
                        color: '#ef4444',
                        '&:hover': {
                          backgroundColor: '#fecaca',
                        }
                      }}
                    >
                      Cancel Request
                    </Button>
                  </Box>
                </Box>
              </SubmissionCard>
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
            No Pending Approvals
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            {searchTerm || statusFilter !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "No pending approval requests for this project"}
          </Typography>
        </Paper>
      )}

      {/* Feedback/Approval Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setActionType(null);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 'bold',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          {actionType === 'approval' ? (
            <>
              <FiCheck color="#4f46e5" size={24} />
              Request Client Approval
            </>
          ) : (
            <>
              <FiMessageSquare color="#4f46e5" size={24} />
              Send Feedback Request
            </>
          )}
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Box className="space-y-4">
            {selectedSubmission && (
              <>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Submission Title
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {selectedSubmission.title}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Client
                  </Typography>
                  <Box className="flex items-center gap-2">
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: '#e0e7ff',
                      color: '#4f46e5'
                    }}>
                      <FiUser size={16} />
                    </Avatar>
                    <Typography variant="body1">
                      {selectedProject?.clientName || "Unknown Client"}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
            
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                {actionType === 'approval' ? 'Approval Request Message' : 'Feedback Request'}
              </Typography>
              <TextareaAutosize
                minRows={4}
                placeholder={
                  actionType === 'approval' 
                    ? "Add any specific notes for the client about this approval request..." 
                    : "Enter your feedback request for the client..."
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
                  resize: 'vertical',
                  '&:focus': {
                    outline: 'none',
                    borderColor: '#4F46E5',
                    boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={() => {
              setOpenDialog(false);
              setActionType(null);
            }}
            sx={{
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!feedbackText || sending}
            onClick={handleSendFeedback}
            startIcon={sending ? <CircularProgress size={16} /> : <FiSend size={16} />}
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
            {sending ? 'Sending...' : actionType === 'approval' ? 'Request Approval' : 'Send Feedback'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedbackApprovalsDashboard;