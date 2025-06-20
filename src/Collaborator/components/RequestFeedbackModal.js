import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Paper,
  Box,
  IconButton,
  Badge,
  Snackbar,
  Alert,
  Grid,
  useTheme
} from "@mui/material";
import {
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiExternalLink,
  FiDownload,
  FiSend,
  FiFile,
  FiLink,
  FiUser,
  FiMessageSquare,
  FiFileText,
  FiBriefcase,
  FiChevronRight
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  doc,
  getDoc 
} from "firebase/firestore";
import emailjs from "@emailjs/browser";

const RequestFeedbackModal = ({ open, onClose }) => {
  const theme = useTheme();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [projectDetails, setProjectDetails] = useState(null);
  const [managerDetails, setManagerDetails] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    emailjs.init("yCz1x3bWkjQXBkJTA");
  }, []);

  useEffect(() => {
    if (!open) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        // Fetch all submissions by the current user
        const submissionsQuery = query(
          collection(db, "project-submissions"),
          where("userId", "==", user.uid)
        );
        
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setSubmissions(submissionsData);
        
        // If there are submissions, try to fetch project and manager details for the first one
        if (submissionsData.length > 0) {
          await fetchProjectAndManagerDetails(submissionsData[0].projectId);
          setSelectedSubmission(submissionsData[0]);
        }
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
  }, [open]);

  const fetchProjectAndManagerDetails = async (projectId) => {
    try {
      // Fetch project details
      const projectDoc = await getDoc(doc(db, "dxd-magnate-projects", projectId));
      if (!projectDoc.exists()) {
        throw new Error("Project not found");
      }
      
      const projectData = projectDoc.data();
      setProjectDetails({
        ...projectData,
        id: projectDoc.id
      });

      // Fetch manager details if project has a manager
      if (projectData.projectManagerId) {
        const managerDoc = await getDoc(doc(db, "users", projectData.projectManagerId));
        if (managerDoc.exists()) {
          setManagerDetails(managerDoc.data());
        } else {
          setManagerDetails(null);
        }
      } else {
        setManagerDetails(null);
      }
    } catch (error) {
      console.error("Error fetching project/manager details:", error);
      setSnackbar({
        open: true,
        message: "Failed to load project details",
        severity: "error"
      });
    }
  };

  const handleSubmissionSelect = async (submission) => {
    setSelectedSubmission(submission);
    await fetchProjectAndManagerDetails(submission.projectId);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <FiCheckCircle className="text-green-500" />;
      case 'rejected': return <FiAlertCircle className="text-red-500" />;
      case 'revision_requested': return <FiClock className="text-amber-500" />;
      default: return <FiClock className="text-blue-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return "success";
      case 'rejected': return "error";
      case 'revision_requested': return "warning";
      default: return "info";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleRequestFeedback = async () => {
    if (!selectedSubmission || !projectDetails) return;

    setRequesting(true);
    try {
      // 1. Create notification in project-manager-notifications
      await addDoc(collection(db, "project-manager-notifications"), {
        actionType: "feedback_request",
        message: `Feedback requested for submission on project: ${projectDetails.title}`,
        priority: "High",
        projectId: projectDetails.id,
        projectName: projectDetails.title,
        timestamp: new Date(),
        type: "Feedback",
        userId: projectDetails.projectManagerId,
        viewed: false,
        submissionId: selectedSubmission.id,
        submissionTitle: selectedSubmission.taskTitle
      });

      // 2. Send email to project manager if manager exists
      if (managerDetails) {
        const templateParams = {
          to_email: managerDetails.email,
          to_name: `${managerDetails.firstName} ${managerDetails.lastName}`,
          from_name: `${auth.currentUser.displayName || "A collaborator"}`,
          project_name: projectDetails.title,
          task_name: selectedSubmission.taskTitle,
          submission_date: formatDate(selectedSubmission.submittedAt),
          feedback_link: `${window.location.origin}/projects/${projectDetails.id}/tasks`
        };

        await emailjs.send(
          'service_t3r4nqe',
          'template_i8v9cwi',
          templateParams
        );
      }

      setSnackbar({
        open: true,
        message: "Feedback request sent successfully!",
        severity: "success"
      });
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error requesting feedback:", error);
      setSnackbar({
        open: true,
        message: "Failed to send feedback request",
        severity: "error"
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const renderSubmissionContent = (submission) => {
    if (submission.type === 'file') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiFile className="text-gray-500" />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {submission.file?.name || 'File submission'}
          </Typography>
          <Button
            size="small"
            startIcon={<FiDownload size={14} />}
            href={submission.file?.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              ml: 1,
              fontSize: '0.65rem',
              textTransform: 'none',
              color: theme.palette.primary.main
            }}
          >
            Download
          </Button>
        </Box>
      );
    } else {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiLink className="text-gray-500" />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {submission.link || 'Link submission'}
          </Typography>
          <Button
            size="small"
            startIcon={<FiExternalLink size={14} />}
            href={submission.link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              ml: 1,
              fontSize: '0.65rem',
              textTransform: 'none',
              color: theme.palette.primary.main
            }}
          >
            Open
          </Button>
        </Box>
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[10]
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        py: 2,
        px: 3,
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FiMessageSquare size={24} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Request Feedback
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <FiX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '400px'
          }}>
            <CircularProgress />
          </Box>
        ) : submissions.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiFile size={48} className="text-gray-400 mb-4" />
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              No Submissions Found
            </Typography>
            <Typography variant="body2" sx={{ 
              color: theme.palette.text.secondary, 
              maxWidth: '400px',
              mb: 3
            }}>
              You haven't made any submissions yet. Submit your work first to request feedback.
            </Typography>
            <Button 
              variant="contained"
              onClick={onClose}
              sx={{
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              Close
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', height: '500px' }}>
            {/* Submission List */}
            <Box sx={{ 
              width: '300px',
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.default,
              overflowY: 'auto'
            }}>
              <Typography variant="subtitle2" sx={{ 
                p: 2,
                fontWeight: 'bold',
                color: theme.palette.text.secondary,
                borderBottom: `1px solid ${theme.palette.divider}`
              }}>
                Your Submissions ({submissions.length})
              </Typography>
              <List sx={{ p: 0 }}>
                {submissions.map((submission) => (
                  <ListItem 
                    key={submission.id}
                    button
                    selected={selectedSubmission?.id === submission.id}
                    onClick={() => handleSubmissionSelect(submission)}
                    sx={{
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      },
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                        '&:hover': {
                          backgroundColor: theme.palette.action.selected
                        }
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: theme.palette.background.paper,
                        color: theme.palette.primary.main,
                        width: 36,
                        height: 36
                      }}>
                        {getStatusIcon(submission.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {submission.taskTitle}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {formatDate(submission.submittedAt)}
                        </Typography>
                      }
                    />
                    <FiChevronRight className="text-gray-400" />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Submission Details */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              p: 3,
              backgroundColor: theme.palette.background.paper
            }}>
              {selectedSubmission ? (
                <>
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {selectedSubmission.taskTitle}
                    </Typography>
                    <Chip
                      label={selectedSubmission.status.replace('_', ' ')}
                      color={getStatusColor(selectedSubmission.status)}
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 'bold',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>

                  <Paper sx={{ 
                    p: 3,
                    mb: 3,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1]
                  }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.text.secondary,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <FiFileText size={16} />
                      Submission Details
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Submitted On
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(selectedSubmission.submittedAt)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Project
                        </Typography>
                        <Typography variant="body2">
                          {selectedSubmission.projectTitle}
                        </Typography>
                      </Grid>
                    </Grid>

                    {selectedSubmission.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          Your Notes
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {selectedSubmission.notes}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Submission Content
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {renderSubmissionContent(selectedSubmission)}
                      </Box>
                    </Box>
                  </Paper>

                  {projectDetails && (
                    <Paper sx={{ 
                      p: 3,
                      mb: 3,
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: theme.shadows[1]
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.text.secondary,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <FiBriefcase size={16} />
                        Project Information
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Project Title
                          </Typography>
                          <Typography variant="body2">
                            {projectDetails.title}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Project Type
                          </Typography>
                          <Typography variant="body2">
                            {projectDetails.type}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Status
                          </Typography>
                          <Typography variant="body2">
                            {projectDetails.status}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            Client
                          </Typography>
                          <Typography variant="body2">
                            {projectDetails.clientName || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}

                  {managerDetails ? (
                    <Paper sx={{ 
                      p: 3,
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: theme.shadows[1]
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.text.secondary,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <FiUser size={16} />
                        Project Manager
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 56, 
                            height: 56,
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            fontSize: '1.25rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {managerDetails.firstName?.charAt(0)}{managerDetails.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {managerDetails.firstName} {managerDetails.lastName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {managerDetails.role || 'Project Manager'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {managerDetails.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ) : (
                    <Paper sx={{ 
                      p: 3,
                      borderRadius: '12px',
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: theme.shadows[1]
                    }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.text.secondary,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <FiUser size={16} />
                        Project Manager
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        No project manager assigned to this project
                      </Typography>
                    </Paper>
                  )}
                </>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <FiMessageSquare size={48} className="text-gray-400 mb-4" />
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Select a Submission
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary, 
                    maxWidth: '400px'
                  }}>
                    Choose a submission from the list to request feedback from the project manager.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {submissions.length > 0 && (
        <DialogActions sx={{ 
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          justifyContent: 'space-between',
          backgroundColor: theme.palette.background.default,
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px'
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              '&:hover': {
                borderColor: theme.palette.primary.light,
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequestFeedback}
            variant="contained"
            disabled={!selectedSubmission || requesting}
            startIcon={requesting ? <CircularProgress size={20} /> : <FiSend size={20} />}
            sx={{
              borderRadius: '8px',
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              },
              '&:disabled': {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled
              }
            }}
          >
            {requesting ? 'Sending Request...' : 'Request Feedback'}
          </Button>
        </DialogActions>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default RequestFeedbackModal;