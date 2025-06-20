import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Pagination,
  Divider,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Stack,
  Rating,
  Snackbar,
  Alert
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiCheck,
  FiX,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiExternalLink,
  FiFile,
  FiLink,
  FiStar,
  FiMessageSquare,
  FiUser,
  FiLayers
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot } from "firebase/firestore";

const statusColors = {
  'submitted': 'bg-blue-100 text-blue-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'revision_requested': 'bg-amber-100 text-amber-800'
};

const getStatusColor = (status) => {
  const defaultColor = 'bg-gray-100 text-gray-800';
  if (!status) return defaultColor;
  return statusColors[status] || defaultColor;
};

const SubmissionsDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewRating, setReviewRating] = useState(3);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const rowsPerPage = 8;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectIds = projectsSnapshot.docs.map(doc => doc.id);

        if (projectIds.length === 0) {
          setSubmissions([]);
          setLoading(false);
          return;
        }

        const submissionsQuery = query(
          collection(db, "project-submissions"),
          where("projectId", "in", projectIds)
        );
        
        const unsubscribe = onSnapshot(submissionsQuery, (snapshot) => {
          const submissionsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setSubmissions(submissionsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching submissions:", error);
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const filteredSubmissions = submissions.filter(submission => {
    const searchLower = searchTerm.toLowerCase();
    const taskTitle = submission.taskTitle || '';
    const userName = submission.userName || '';
    const notes = submission.notes || '';
    
    const matchesSearch = 
      taskTitle.toLowerCase().includes(searchLower) || 
      userName.toLowerCase().includes(searchLower) ||
      notes.toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === "all" || (submission.status || 'submitted') === statusFilter;
    const matchesProject = projectFilter === "all" || submission.projectId === projectFilter;
    const matchesType = typeFilter === "all" || submission.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesProject && matchesType;
  });

  const paginatedSubmissions = filteredSubmissions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleReviewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewRating(3);
    setReviewFeedback("");
    setOpenReviewDialog(true);
  };

  const handleApproveReject = async (status) => {
    try {
      if (!selectedSubmission) return;

      await updateDoc(doc(db, "project-submissions", selectedSubmission.id), {
        status,
        rating: reviewRating,
        feedback: reviewFeedback,
        reviewedAt: new Date().toISOString(),
        reviewedBy: auth.currentUser.uid,
        reviewedByName: auth.currentUser.displayName || auth.currentUser.email
      });

      if (status === 'approved') {
        await updateDoc(doc(db, "project-tasks", selectedSubmission.taskId), {
          status: 'Done',
          updatedAt: new Date().toISOString()
        });
      }

      if (status === 'revision_requested') {
        await updateDoc(doc(db, "project-tasks", selectedSubmission.taskId), {
          status: 'In Progress',
          updatedAt: new Date().toISOString()
        });
      }

      setSnackbar({
        open: true,
        message: `Submission ${status} successfully!`,
        severity: "success"
      });

      setOpenReviewDialog(false);
    } catch (error) {
      console.error("Error updating submission:", error);
      setSnackbar({
        open: true,
        message: `Error updating submission: ${error.message}`,
        severity: "error"
      });
    }
  };

  const getUserAvatar = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.photoURL || null;
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.displayName || user?.email || userId;
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || projectId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="mb-6">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Task Submissions
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Review and manage all task submissions from your team members
        </Typography>
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
          <Grid item xs={6} sm={4} md={2}>
            <Select
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="revision_requested">Revision Requested</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Select
              fullWidth
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="file">File</MenuItem>
              <MenuItem value="link">Link</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Select
              fullWidth
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
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
              More
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
                  <FiFile size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Submissions
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {submissions.length}
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
                    Approved
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {submissions.filter(s => s.status === 'approved').length}
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
                    Pending Review
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {submissions.filter(s => s.status === 'submitted').length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #ef4444',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ 
                  bgcolor: '#fee2e2', 
                  color: '#ef4444',
                  width: 40,
                  height: 40
                }}>
                  <FiAlertCircle size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Revisions Needed
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {submissions.filter(s => s.status === 'revision_requested' || s.status === 'rejected').length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submissions Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Submitted By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Submitted At</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSubmissions.length > 0 ? (
                  paginatedSubmissions.map((submission) => {
                    const statusColor = getStatusColor(submission.status);
                    const [bgColor, textColor] = statusColor.split(' ');
                    
                    return (
                      <TableRow key={submission.id} hover>
                        <TableCell>
                          <Box className="flex items-center gap-3">
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {submission.taskTitle || 'Untitled Task'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                {(submission.notes || 'No notes provided').substring(0, 50)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {getProjectName(submission.projectId)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box className="flex items-center gap-2">
                            <Avatar 
                              src={getUserAvatar(submission.userId)} 
                              sx={{ width: 32, height: 32 }}
                            >
                              {(submission.userName || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">
                              {getUserName(submission.userId)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={submission.type === 'file' ? 'File' : 'Link'}
                            size="small"
                            sx={{
                              backgroundColor: submission.type === 'file' ? '#e0f2fe' : '#ecfdf5',
                              color: submission.type === 'file' ? '#0369a1' : '#059669',
                              fontWeight: 'bold',
                              fontSize: '0.65rem'
                            }}
                            icon={submission.type === 'file' ? <FiFile size={12} /> : <FiLink size={12} />}
                          />
                        </TableCell>
                        <TableCell>
                          <Box className="flex items-center gap-1">
                            <FiCalendar size={14} className="text-gray-500" />
                            <Typography variant="body2">
                              {formatDate(submission.submittedAt)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={(submission.status || 'submitted').charAt(0).toUpperCase() + (submission.status || 'submitted').slice(1).replace('_', ' ')}
                            size="small"
                            sx={{
                              backgroundColor: bgColor,
                              color: textColor,
                              fontWeight: 'bold',
                              fontSize: '0.65rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box className="flex gap-2">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setOpenReviewDialog(true);
                                }}
                                sx={{
                                  backgroundColor: '#e0e7ff',
                                  color: '#4f46e5',
                                  '&:hover': {
                                    backgroundColor: '#c7d2fe'
                                  }
                                }}
                              >
                                <FiEye size={16} />
                              </IconButton>
                            </Tooltip>
                            {(submission.status === 'submitted' || !submission.status) && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleReviewSubmission(submission)}
                                sx={{ 
                                  textTransform: 'none',
                                  backgroundColor: '#4f46e5',
                                  '&:hover': { backgroundColor: '#4338ca' }
                                }}
                              >
                                Review
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#64748b' }}>
                        No submissions found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredSubmissions.length > 0 && (
            <Box className="flex justify-center mt-4">
              <Pagination
                count={Math.ceil(filteredSubmissions.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                shape="rounded"
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Review Submission Dialog */}
      <Dialog 
        open={openReviewDialog} 
        onClose={() => setOpenReviewDialog(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }
        }}
      >
        {selectedSubmission && (
          <>
            <DialogTitle sx={{ 
              fontWeight: 600,
              borderBottom: '1px solid #e2e8f0',
              py: 2.5
            }}>
              Review Submission: {selectedSubmission.taskTitle || 'Untitled Task'}
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Submission Details
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                          Project
                        </Typography>
                        <Box className="flex items-center gap-2">
                          <FiLayers className="text-gray-500" />
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {getProjectName(selectedSubmission.projectId)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                          Submitted By
                        </Typography>
                        <Box className="flex items-center gap-2">
                          <Avatar 
                            src={getUserAvatar(selectedSubmission.userId)} 
                            sx={{ width: 24, height: 24 }}
                          >
                            {(selectedSubmission.userName || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {getUserName(selectedSubmission.userId)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                          Submitted At
                        </Typography>
                        <Box className="flex items-center gap-2">
                          <FiCalendar className="text-gray-500" />
                          <Typography variant="body1">
                            {formatDate(selectedSubmission.submittedAt)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                          Current Status
                        </Typography>
                        <Chip
                          label={(selectedSubmission.status || 'submitted').charAt(0).toUpperCase() + (selectedSubmission.status || 'submitted').slice(1).replace('_', ' ')}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(selectedSubmission.status).split(' ')[0],
                            color: getStatusColor(selectedSubmission.status).split(' ')[1],
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>

                      <Box>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                          Notes
                        </Typography>
                        <Paper sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 1 }}>
                          <Typography variant="body2">
                            {selectedSubmission.notes || 'No notes provided'}
                          </Typography>
                        </Paper>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Submission Content
                      </Typography>

                      {selectedSubmission.type === 'file' ? (
                        <Box sx={{ 
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          mb: 2
                        }}>
                          <FiFile size={32} className="text-gray-400 mx-auto mb-2" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {selectedSubmission.file?.name || 'No file name'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                            {selectedSubmission.file?.type || 'Unknown type'} • {selectedSubmission.file?.size ? Math.round(selectedSubmission.file.size / 1024) + ' KB' : 'Unknown size'}
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<FiDownload />}
                            href={selectedSubmission.file?.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            fullWidth
                            sx={{
                              borderColor: '#e2e8f0',
                              color: '#64748b',
                              '&:hover': {
                                borderColor: '#cbd5e1'
                              }
                            }}
                          >
                            Download File
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          border: '1px solid #e2e8f0',
                          borderRadius: 2,
                          p: 3,
                          textAlign: 'center',
                          mb: 2
                        }}>
                          <FiLink size={32} className="text-gray-400 mx-auto mb-2" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                            External Link
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2, wordBreak: 'break-all' }}>
                            {selectedSubmission.link || 'No link provided'}
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<FiExternalLink />}
                            href={selectedSubmission.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            fullWidth
                            sx={{
                              borderColor: '#e2e8f0',
                              color: '#64748b',
                              '&:hover': {
                                borderColor: '#cbd5e1'
                              }
                            }}
                          >
                            Open Link
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Review Details
                      </Typography>

                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Rating
                        </Typography>
                        <Rating
                          name="submission-rating"
                          value={reviewRating}
                          onChange={(event, newValue) => {
                            setReviewRating(newValue);
                          }}
                          precision={0.5}
                          icon={<FiStar size={24} style={{ color: '#f59e0b' }} />}
                          emptyIcon={<FiStar size={24} style={{ color: '#e2e8f0' }} />}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                          Feedback (optional)
                        </Typography>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={reviewFeedback}
                          onChange={(e) => setReviewFeedback(e.target.value)}
                          multiline
                          rows={3}
                          placeholder="Provide constructive feedback..."
                          InputProps={{
                            sx: { backgroundColor: 'white' }
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3,
              borderTop: '1px solid #e2e8f0',
              justifyContent: 'space-between'
            }}>
              <Button 
                onClick={() => setOpenReviewDialog(false)}
                sx={{ 
                  color: '#64748b',
                  '&:hover': {
                    backgroundColor: '#f1f5f9'
                  }
                }}
              >
                Cancel
              </Button>
              <Box className="flex gap-2">
                <Button 
                  onClick={() => handleApproveReject('rejected')}
                  variant="outlined"
                  startIcon={<FiX />}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: '#fee2e2',
                      borderColor: '#dc2626'
                    }
                  }}
                >
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApproveReject('revision_requested')}
                  variant="outlined"
                  startIcon={<FiClock />}
                  sx={{
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    '&:hover': {
                      backgroundColor: '#fef3c7',
                      borderColor: '#d97706'
                    }
                  }}
                >
                  Request Revision
                </Button>
                <Button 
                  onClick={() => handleApproveReject('approved')}
                  variant="contained"
                  startIcon={<FiCheck />}
                  sx={{
                    backgroundColor: '#10b981',
                    '&:hover': { backgroundColor: '#059669' }
                  }}
                >
                  Approve
                </Button>
              </Box>
            </DialogActions>
          </>
        )}
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

export default SubmissionsDashboard;