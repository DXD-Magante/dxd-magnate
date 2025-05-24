import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Rating,
  Badge,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  FiCheckCircle,
  FiX,
  FiClock,
  FiExternalLink,
  FiSearch,
  FiFilter,
  FiDownload,
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiRefreshCw,
  FiUsers,
  FiFile,
  FiLink
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const statusColors = {
  submitted: '#fef3c7',
  approved: '#d1fae5',
  rejected: '#fee2e2'
};

const statusIcons = {
  submitted: <FiClock color="#d97706" />,
  approved: <FiCheckCircle color="#10b981" />,
  rejected: <FiX color="#ef4444" />
};

const statusTextColors = {
  submitted: '#d97706',
  approved: '#10b981',
  rejected: '#ef4444'
};

const SubmissionReview = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(3);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState('all');

  // Fetch collaborations where current user is mentor
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
        alert(error)
        console.error("Error fetching collaborations:", error);
        setSnackbar({
          open: true,
          message: "Failed to load collaborations",
          severity: "error"
        });
      }
    };

    fetchCollaborations();
  }, []);

  // Fetch submissions for selected collaboration
  useEffect(() => {
    if (!selectedCollaboration) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "marketing-collaboration-submissions"),
          where("collaborationId", "==", selectedCollaboration.id)
        );
        
        const querySnapshot = await getDocs(q);
        const submissionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        setSnackbar({
          open: true,
          message: "Failed to load submissions",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedCollaboration]);

  // Filter submissions based on search and filters
  useEffect(() => {
    let filtered = submissions;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.taskTitle.toLowerCase().includes(term) || 
        sub.userName.toLowerCase().includes(term) ||
        (sub.notes && sub.notes.toLowerCase().includes(term)))
    }
    
    // Apply tab filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(sub => sub.status === 'submitted');
    } else if (activeTab === 'reviewed') {
      filtered = filtered.filter(sub => sub.status === 'approved' || sub.status === 'rejected');
    }
    
    setFilteredSubmissions(filtered);
  }, [submissions, statusFilter, searchTerm, activeTab]);

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    setActionLoading(true);
    
    try {
      // Update submission status
      await updateDoc(doc(db, "marketing-collaboration-submissions", selectedSubmission.id), {
        status: 'approved',
        feedback: feedback,
        rating: rating,
        reviewedAt: new Date().toISOString()
      });
      
      // Update task status to "Done"
      await updateDoc(doc(db, "marketing-collaboration-tasks", selectedSubmission.taskId), {
        status: 'Done',
        updatedAt: new Date().toISOString()
      });
      
      setSnackbar({
        open: true,
        message: "Submission approved successfully!",
        severity: "success"
      });
      
      // Refresh submissions
      const updatedSubmissions = submissions.map(sub => 
        sub.id === selectedSubmission.id ? 
        { ...sub, status: 'approved', feedback, rating } : sub
      );
      setSubmissions(updatedSubmissions);
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Error approving submission:", error);
      setSnackbar({
        open: true,
        message: "Failed to approve submission",
        severity: "error"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    setActionLoading(true);
    
    try {
      // Update submission status
      await updateDoc(doc(db, "marketing-collaboration-submissions", selectedSubmission.id), {
        status: 'rejected',
        feedback: feedback,
        rating: 0,
        reviewedAt: new Date().toISOString()
      });
      
      // Update task status back to "To Do"
      await updateDoc(doc(db, "marketing-collaboration-tasks", selectedSubmission.taskId), {
        status: 'To Do',
        updatedAt: new Date().toISOString()
      });
      
      setSnackbar({
        open: true,
        message: "Submission rejected successfully!",
        severity: "success"
      });
      
      // Refresh submissions
      const updatedSubmissions = submissions.map(sub => 
        sub.id === selectedSubmission.id ? 
        { ...sub, status: 'rejected', feedback, rating: 0 } : sub
      );
      setSubmissions(updatedSubmissions);
      
      setOpenDialog(false);
    } catch (error) {
      console.error("Error rejecting submission:", error);
      setSnackbar({
        open: true,
        message: "Failed to reject submission",
        severity: "error"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleOpenReviewDialog = (submission) => {
    setSelectedSubmission(submission);
    setFeedback(submission.feedback || '');
    setRating(submission.rating || 3);
    setOpenDialog(true);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.map(part => part[0]).join('').toUpperCase();
  };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          mb: 1,
          background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: isMobile ? '1.75rem' : '2.125rem'
        }}>
          Submission Review
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Review and approve submissions from your team members
        </Typography>
      </Box>

      {/* Collaboration Selector */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.08)'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              justifyContent: { xs: 'flex-start', md: 'flex-end' }
            }}>
              <TextField
                variant="outlined"
                placeholder="Search submissions..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <FiSearch color="#94a3b8" style={{ marginRight: 8 }} />
                  ),
                  sx: { backgroundColor: 'white' }
                }}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                  sx={{ backgroundColor: 'white' }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="submitted">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats and Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
        >
          <Tab 
            value="all" 
            label={`All (${submissions.length})`}
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="pending" 
            label={
              <Badge 
                badgeContent={submissions.filter(s => s.status === 'submitted').length} 
                color="warning"
                sx={{ '& .MuiBadge-badge': { right: -15 } }}
              >
                Pending
              </Badge>
            }
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="reviewed" 
            label={`Reviewed (${submissions.filter(s => s.status === 'approved' || s.status === 'rejected').length})`}
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      ) : filteredSubmissions.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px dashed #e2e8f0'
        }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '50%'
          }}>
            <FiFile size={36} color="#94a3b8" />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            No Submissions Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            {searchTerm || statusFilter !== 'all' 
              ? "Try adjusting your search or filters" 
              : "No submissions have been made yet for this collaboration"}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSubmissions.map((submission) => (
            <Grid item xs={12} sm={6} lg={4} key={submission.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 2,
                    backgroundColor: statusColors[submission.status] || '#f8fafc',
                    p: 1,
                    borderRadius: 1
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: statusTextColors[submission.status] || '#64748b',
                      mr: 2
                    }}>
                      {statusIcons[submission.status]}
                      <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {formatDate(submission.submittedAt)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {submission.taskTitle}
                  </Typography>
                  
                  {submission.notes && (
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      {submission.notes}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32, 
                      fontSize: '0.75rem',
                      bgcolor: '#e0e7ff',
                      color: '#4f46e5',
                      mr: 1
                    }}>
                      {getInitials(submission.userName)}
                    </Avatar>
                    <Typography variant="body2">
                      {submission.userName}
                    </Typography>
                  </Box>
                  
                  {submission.type === 'file' ? (
                    <Button
                      component="a"
                      href={submission.file?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<FiDownload size={14} />}
                      sx={{
                        mb: 2,
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          borderColor: '#cbd5e1'
                        }
                      }}
                    >
                      Download File
                    </Button>
                  ) : (
                    <Button
                      component="a"
                      href={submission.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<FiExternalLink size={14} />}
                      sx={{
                        mb: 2,
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          borderColor: '#cbd5e1'
                        }
                      }}
                    >
                      View Link
                    </Button>
                  )}
                  
                  {submission.status === 'approved' && submission.rating > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating
                        value={submission.rating}
                        readOnly
                        precision={0.5}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {submission.rating}/5
                      </Typography>
                    </Box>
                  )}
                  
                  {submission.feedback && (
                    <Paper sx={{ 
                      p: 2, 
                      mb: 2,
                      backgroundColor: '#f8fafc',
                      borderLeft: '3px solid #e2e8f0'
                    }}>
                      <Typography variant="caption" sx={{ 
                        display: 'block',
                        color: '#64748b',
                        fontWeight: 500,
                        mb: 0.5
                      }}>
                        Your Feedback:
                      </Typography>
                      <Typography variant="body2">
                        {submission.feedback}
                      </Typography>
                    </Paper>
                  )}
                </CardContent>
                
                <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
                  {submission.status === 'submitted' ? (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<FiMessageSquare size={16} />}
                      onClick={() => handleOpenReviewDialog(submission)}
                      sx={{
                        backgroundColor: '#4f46e5',
                        '&:hover': { backgroundColor: '#4338ca' }
                      }}
                    >
                      Review Submission
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<FiRefreshCw size={16} />}
                        onClick={() => handleOpenReviewDialog(submission)}
                        sx={{
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: '#f8fafc',
                            borderColor: '#cbd5e1'
                          }
                        }}
                      >
                        Update Review
                      </Button>
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Review Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          borderBottom: '1px solid #e2e8f0',
          py: 2.5
        }}>
          Review Submission: {selectedSubmission?.taskTitle}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Submitted by: {selectedSubmission?.userName}
            </Typography>
            
            {selectedSubmission?.notes && (
              <Paper sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                <Typography variant="body2">
                  <strong>Submitter Notes:</strong> {selectedSubmission.notes}
                </Typography>
              </Paper>
            )}
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Rate this submission (1-5 stars):
              </Typography>
              <Rating
                value={rating}
                onChange={(e, newValue) => setRating(newValue)}
                precision={0.5}
                sx={{ mb: 2 }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Feedback"
              variant="outlined"
              multiline
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback to help improve the work..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid #e2e8f0'
        }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ 
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9'
              }
            }}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<FiThumbsDown size={16} />}
            onClick={handleReject}
            disabled={actionLoading}
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
              '&:disabled': {
                backgroundColor: '#e2e8f0',
                color: '#94a3b8'
              }
            }}
          >
            Reject
          </Button>
          <Button 
            variant="contained"
            startIcon={<FiThumbsUp size={16} />}
            onClick={handleApprove}
            disabled={actionLoading}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' },
              '&:disabled': {
                backgroundColor: '#e2e8f0',
                color: '#94a3b8'
              }
            }}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubmissionReview;