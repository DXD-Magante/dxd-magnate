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
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  CircularProgress
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUpload,
  FiLink,
  FiFile,
  FiX,
  FiPaperclip,
  FiSend,
  FiExternalLink,
  FiBarChart2,
  FiUsers,
  FiTrendingUp,
  FiChevronRight,
  FiStar,
  FiMessageSquare,
  FiLayers,
  FiUser
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, onSnapshot } from "firebase/firestore";
import { supabase } from "../../services/supabase";

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dsbt1j73t',
  uploadPreset: 'dxd-magnate',
  apiKey: '753871594898224'
};

// Supabase configuration
const SUPABASE_CONFIG = {
  bucket: 'dxdmagnatedocs',
  url: 'https://bpwolooauknqwgcefpra.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd29sb29hdWtucXdnY2VmcHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxOTQ2MTQsImV4cCI6MjA2Mjc3MDYxNH0.UpUUZsOUyqmIrD97_2H5tf9xWr0TdLvFEw_ZtZ7fDm8'
};

const statusColors = {
  'Backlog': 'bg-gray-100 text-gray-800',
  'To Do': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-amber-100 text-amber-800',
  'Review': 'bg-purple-100 text-purple-800',
  'Done': 'bg-green-100 text-green-800',
  'Blocked': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'Low': 'bg-green-100 text-green-800',
  'Medium': 'bg-amber-100 text-amber-800',
  'High': 'bg-red-100 text-red-800',
  'Critical': 'bg-purple-100 text-purple-800'
};

const submissionStatusColors = {
  'submitted': 'bg-blue-100 text-blue-800',
  'approved': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'revision_requested': 'bg-amber-100 text-amber-800'
};

const AllTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState(null);
  const [openSubmissionDialog, setOpenSubmissionDialog] = useState(false);
  const [submissionType, setSubmissionType] = useState('file');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionSnackbar, setSubmissionSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [taskSubmissions, setTaskSubmissions] = useState({});
  const [submissionsLoading, setSubmissionsLoading] = useState({});
  const rowsPerPage = 8;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch projects where current user is assigned
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs
        .filter(doc => {
          const teamMembers = doc.data().teamMembers || [];
          return teamMembers.some(member => member.id === user.uid);
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Fetch tasks assigned to current user
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", user.uid)
        );
        const querySnapshot = await getDocs(tasksQuery);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTasks(tasksData);
        calculateStats(tasksData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Calculate statistics
  const calculateStats = (tasks) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done'
    ).length;

    setStats({
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      inProgressTasks,
      overdueTasks
    });
  };

  // Fetch submissions for a specific task
  const fetchTaskSubmissions = async (taskId) => {
    try {
      setSubmissionsLoading(prev => ({ ...prev, [taskId]: true }));
      
      const q = query(
        collection(db, "project-submissions"),
        where("taskId", "==", taskId)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const submissionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTaskSubmissions(prev => ({
          ...prev,
          [taskId]: submissionsData
        }));
        setSubmissionsLoading(prev => ({ ...prev, [taskId]: false }));
      });

      return unsubscribe;
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setSubmissionsLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleTaskExpand = (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      if (!taskSubmissions[taskId]) {
        fetchTaskSubmissions(taskId);
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || task.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  const paginatedTasks = filteredTasks.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, "project-tasks", taskId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done': return <FiCheckCircle className="text-green-500" />;
      case 'Blocked': return <FiAlertCircle className="text-red-500" />;
      case 'In Progress': return <FiClock className="text-amber-500" />;
      default: return <FiClock className="text-blue-500" />;
    }
  };

  // Upload to Cloudinary for media files
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id,
        type: data.resource_type,
        format: data.format,
        bytes: data.bytes
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  // Upload to Supabase for document files
  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .upload(`project-docs/${fileName}`, file);
  
      if (error) throw error;
  
      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .getPublicUrl(`project-docs/${fileName}`);
  
      return {
        url: publicUrl,
        fileName: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
  };

  // Handle task submission
  const handleTaskSubmission = async () => {
    if (!selectedTaskForSubmission) return;
    setSubmissionLoading(true);

    try {
      let submissionData = {
        taskId: selectedTaskForSubmission.id,
        taskTitle: selectedTaskForSubmission.title,
        projectId: selectedTaskForSubmission.projectId,
        projectTitle: selectedTaskForSubmission.projectTitle,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        notes: submissionNotes,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      if (submissionType === 'file' && submissionFile) {
        const fileType = submissionFile.type.split('/')[0];
        
        if (['image', 'video', 'audio'].includes(fileType)) {
          // Upload media to Cloudinary
          const uploadedFile = await uploadToCloudinary(submissionFile);
          submissionData = {
            ...submissionData,
            type: 'file',
            file: {
              name: submissionFile.name,
              url: uploadedFile.url,
              type: submissionFile.type,
              size: uploadedFile.bytes,
              storageType: 'cloudinary'
            }
          };
        } else {
          // Upload document to Supabase
          const uploadedFile = await uploadToSupabase(submissionFile);
          submissionData = {
            ...submissionData,
            type: 'file',
            file: {
              name: uploadedFile.fileName,
              url: uploadedFile.url,
              type: uploadedFile.type,
              size: uploadedFile.size,
              storageType: 'supabase'
            }
          };
        }
      } else if (submissionType === 'link' && submissionLink) {
        submissionData = {
          ...submissionData,
          type: 'link',
          link: submissionLink
        };
      } else {
        throw new Error(submissionType === 'file' ? "Please select a file" : "Please enter a valid link");
      }

      // Save to Firestore
      await addDoc(collection(db, "project-submissions"), submissionData);

      // Update task status to "Review"
      await updateDoc(doc(db, "project-tasks", selectedTaskForSubmission.id), {
        status: 'Review',
        updatedAt: new Date().toISOString()
      });

      setSubmissionSnackbar({
        open: true,
        message: "Task submitted successfully!",
        severity: "success"
      });

      // Reset form
      setSubmissionFile(null);
      setSubmissionLink('');
      setSubmissionNotes('');
      setOpenSubmissionDialog(false);
    } catch (error) {
      console.error("Error submitting task:", error);
      setSubmissionSnackbar({
        open: true,
        message: `Error submitting task: ${error.message}`,
        severity: "error"
      });
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setSubmissionFile(selectedFile);
    }
  };

  const removeFile = () => {
    setSubmissionFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  };

  const handleCloseSubmissionSnackbar = () => {
    setSubmissionSnackbar({ ...submissionSnackbar, open: false });
  };

  const renderSubmissionContent = (submission) => {
    if (submission.type === 'file') {
      return (
        <Box className="flex items-center gap-2">
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
              color: '#4f46e5'
            }}
          >
            Download
          </Button>
        </Box>
      );
    } else {
      return (
        <Box className="flex items-center gap-2">
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
              color: '#4f46e5'
            }}
          >
            Open
          </Button>
        </Box>
      );
    }
  };

  const renderSubmissionsAccordion = (taskId) => {
    const taskSubs = taskSubmissions[taskId] || [];
    const isLoading = submissionsLoading[taskId];

    return (
      <Accordion
        expanded={expandedTaskId === taskId}
        onChange={() => handleTaskExpand(taskId)}
        sx={{
          backgroundColor: '#f8fafc',
          boxShadow: 'none',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary
          expandIcon={<FiChevronRight />}
          sx={{
            minHeight: '48px !important',
            '& .MuiAccordionSummary-content': {
              margin: '12px 0'
            }
          }}
        >
          <Box className="flex items-center gap-2">
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Submissions ({taskSubs.length})
            </Typography>
            {isLoading && <CircularProgress size={16} />}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 2 }}>
          {isLoading ? (
            <Box className="flex justify-center py-4">
              <CircularProgress size={24} />
            </Box>
          ) : taskSubs.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center', py: 2 }}>
              No submissions yet
            </Typography>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {taskSubs.map((submission) => (
                <ListItem 
                  key={submission.id}
                  sx={{
                    borderBottom: '1px solid #e2e8f0',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ 
                      bgcolor: submissionStatusColors[submission.status]?.split(' ')[0] || '#f1f5f9',
                      color: submissionStatusColors[submission.status]?.split(' ')[1] || '#64748b',
                      width: 32,
                      height: 32
                    }}>
                      {submission.status === 'approved' ? (
                        <FiCheckCircle size={16} />
                      ) : submission.status === 'rejected' ? (
                        <FiX size={16} />
                      ) : submission.status === 'revision_requested' ? (
                        <FiClock size={16} />
                      ) : (
                        <FiSend size={16} />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box className="flex items-center justify-between">
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {formatDateTime(submission.submittedAt)}
                        </Typography>
                        <Chip
                          label={submission.status ? submission.status.replace('_', ' ') : 'submitted'}
                          size="small"
                          sx={{
                            backgroundColor: submissionStatusColors[submission.status]?.split(' ')[0] || '#f1f5f9',
                            color: submissionStatusColors[submission.status]?.split(' ')[1] || '#64748b',
                            fontWeight: 'bold',
                            fontSize: '0.65rem',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {renderSubmissionContent(submission)}
                        
                        {submission.notes && (
                          <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
                            {submission.notes}
                          </Typography>
                        )}
                        
                        {submission.reviewedAt && (
                          <Box sx={{ mt: 1, backgroundColor: '#f8fafc', p: 1.5, borderRadius: 1 }}>
                            <Box className="flex items-center gap-2 mb-1">
                              <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#334155' }}>
                                Reviewer Feedback
                              </Typography>
                              {submission.rating && (
                                <Rating
                                  value={submission.rating}
                                  readOnly
                                  precision={0.5}
                                  size="small"
                                  icon={<FiStar size={16} style={{ color: '#f59e0b' }} />}
                                  emptyIcon={<FiStar size={16} style={{ color: '#e2e8f0' }} />}
                                />
                              )}
                            </Box>
                            
                            {submission.feedback && (
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {submission.feedback}
                              </Typography>
                            )}
                            
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94a3b8' }}>
                              Reviewed by {submission.reviewedByName} on {formatDateTime(submission.reviewedAt)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="mb-6">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          All Tasks
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          View and manage all tasks assigned to you across projects
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
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
                    <FiBarChart2 size={20} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Tasks
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stats.totalTasks}
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
                      Completed
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stats.completedTasks} ({stats.completionRate}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.completionRate} 
                    sx={{ 
                      mt: 1,
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#10b981'
                      }
                    }} 
                  />
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
                    <FiTrendingUp size={20} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      In Progress
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stats.inProgressTasks}
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
                      Overdue
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {stats.overdueTasks}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Backlog">Backlog</MenuItem>
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Review">Review</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
              <MenuItem value="Blocked">Blocked</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
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
          <Grid item xs={6} md={2}>
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

      {/* Tasks Table */}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTasks.length > 0 ? (
                  paginatedTasks.map((task) => (
                    <React.Fragment key={task.id}>
                      <TableRow hover>
                        <TableCell>
                          <Box className="flex items-center gap-3">
                            <Tooltip title={task.status}>
                              <span>{getStatusIcon(task.status)}</span>
                            </Tooltip>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {task.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                {task.description.substring(0, 50)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {task.projectTitle}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                            {task.clientName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.priority}
                            size="small"
                            sx={{
                              backgroundColor: priorityColors[task.priority].split(' ')[0],
                              color: priorityColors[task.priority].split(' ')[1],
                              fontWeight: 'bold',
                              fontSize: '0.65rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            size="small"
                            sx={{
                              backgroundColor: statusColors[task.status].split(' ')[0],
                              color: statusColors[task.status].split(' ')[1],
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              '& .MuiSelect-icon': {
                                color: statusColors[task.status].split(' ')[1]
                              },
                              '&:before': { borderBottom: 'none' },
                              '&:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                            }}
                            IconComponent={FiChevronDown}
                          >
                            <MenuItem value="Backlog">Backlog</MenuItem>
                            <MenuItem value="To Do">To Do</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Review">Review</MenuItem>
                            <MenuItem value="Done">Done</MenuItem>
                            <MenuItem value="Blocked">Blocked</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Box className="flex items-center gap-1">
                            <FiCalendar size={14} className="text-gray-500" />
                            <Typography variant="body2">
                              {new Date(task.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                            {isOverdue(task.dueDate, task.status) && (
                              <Chip
                                label="Overdue"
                                size="small"
                                sx={{
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  fontSize: '0.65rem',
                                  ml: 1
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box className="flex gap-2">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setOpenTaskDialog(true);
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
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                setSelectedTaskForSubmission(task);
                                setOpenSubmissionDialog(true);
                              }}
                              disabled={task.status === 'Done'}
                              sx={{ 
                                textTransform: 'none',
                                backgroundColor: '#4f46e5',
                                '&:hover': { backgroundColor: '#4338ca' },
                                '&:disabled': {
                                  backgroundColor: '#e2e8f0',
                                  color: '#94a3b8'
                                }
                              }}
                            >
                              Submit
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          {renderSubmissionsAccordion(task.id)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#64748b' }}>
                        No tasks found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredTasks.length > 0 && (
            <Box className="flex justify-center mt-4">
              <Pagination
                count={Math.ceil(filteredTasks.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                shape="rounded"
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Task Details Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Task Details</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Box className="space-y-4 mt-3">
              <Box className="flex justify-between items-start">
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedTask.title}
                </Typography>
                <Chip
                  label={selectedTask.status}
                  size="small"
                  sx={{
                    backgroundColor: statusColors[selectedTask.status].split(' ')[0],
                    color: statusColors[selectedTask.status].split(' ')[1],
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {selectedTask.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Project
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.projectTitle}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Client
                  </Typography>
                  <Typography variant="body2">
                    {selectedTask.clientName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Priority
                  </Typography>
                  <Chip
                    label={selectedTask.priority}
                    size="small"
                    sx={{
                      backgroundColor: priorityColors[selectedTask.priority].split(' ')[0],
                      color: priorityColors[selectedTask.priority].split(' ')[1],
                      fontWeight: 'bold'
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Due Date
                  </Typography>
                  <Box className="flex items-center gap-1">
                    <FiCalendar size={16} className="text-gray-500" />
                    <Typography variant="body2">
                      {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                    {isOverdue(selectedTask.dueDate, selectedTask.status) && (
                      <Chip
                        label="Overdue"
                        size="small"
                        sx={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          fontSize: '0.65rem',
                          ml: 1
                        }}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Labels
                  </Typography>
                  <Box className="flex flex-wrap gap-1">
                    {selectedTask.labels?.map((label, index) => (
                      <Chip
                        key={index}
                        label={label}
                        size="small"
                        sx={{
                          backgroundColor: '#f1f5f9',
                          color: '#64748b',
                          fontSize: '0.65rem'
                        }}
                      />
                    ))}
                    {(!selectedTask.labels || selectedTask.labels.length === 0) && (
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        No labels
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                {/* Submissions Section in Task Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Submissions ({taskSubmissions[selectedTask.id]?.length || 0})
                  </Typography>
                  {!taskSubmissions[selectedTask.id] ? (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => fetchTaskSubmissions(selectedTask.id)}
                      startIcon={<FiEye size={16} />}
                      sx={{ color: '#4f46e5' }}
                    >
                      View Submissions
                    </Button>
                  ) : taskSubmissions[selectedTask.id].length === 0 ? (
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      No submissions yet
                    </Typography>
                  ) : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: 300, overflow: 'auto' }}>
                      {taskSubmissions[selectedTask.id].map((submission) => (
                        <ListItem 
                          key={submission.id}
                          sx={{
                            borderBottom: '1px solid #e2e8f0',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: submissionStatusColors[submission.status]?.split(' ')[0] || '#f1f5f9',
                              color: submissionStatusColors[submission.status]?.split(' ')[1] || '#64748b',
                              width: 32,
                              height: 32
                            }}>
                              {submission.status === 'approved' ? (
                                <FiCheckCircle size={16} />
                              ) : submission.status === 'rejected' ? (
                                <FiX size={16} />
                              ) : submission.status === 'revision_requested' ? (
                                <FiClock size={16} />
                              ) : (
                                <FiSend size={16} />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box className="flex items-center justify-between">
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {formatDateTime(submission.submittedAt)}
                                </Typography>
                                <Chip
                                  label={submission.status ? submission.status.replace('_', ' ') : 'submitted'}
                                  size="small"
                                  sx={{
                                    backgroundColor: submissionStatusColors[submission.status]?.split(' ')[0] || '#f1f5f9',
                                    color: submissionStatusColors[submission.status]?.split(' ')[1] || '#64748b',
                                    fontWeight: 'bold',
                                    fontSize: '0.65rem',
                                    textTransform: 'capitalize'
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                {renderSubmissionContent(submission)}
                                
                                {submission.notes && (
                                  <Typography variant="body2" sx={{ mt: 1, color: '#64748b' }}>
                                    {submission.notes}
                                  </Typography>
                                )}
                                
                                {submission.reviewedAt && (
                                  <Box sx={{ mt: 1, backgroundColor: '#f8fafc', p: 1.5, borderRadius: 1 }}>
                                    <Box className="flex items-center gap-2 mb-1">
                                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#334155' }}>
                                        Reviewer Feedback
                                      </Typography>
                                      {submission.rating && (
                                        <Rating
                                          value={submission.rating}
                                          readOnly
                                          precision={0.5}
                                          size="small"
                                          icon={<FiStar size={16} style={{ color: '#f59e0b' }} />}
                                          emptyIcon={<FiStar size={16} style={{ color: '#e2e8f0' }} />}
                                        />
                                      )}
                                    </Box>
                                    
                                    {submission.feedback && (
                                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        {submission.feedback}
                                      </Typography>
                                    )}
                                    
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94a3b8' }}>
                                      Reviewed by {submission.reviewedByName} on {formatDateTime(submission.reviewedAt)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<FiUpload />}
                    onClick={() => {
                      setSelectedTaskForSubmission(selectedTask);
                      setOpenSubmissionDialog(true);
                    }}
                    disabled={selectedTask.status === 'Done'}
                    fullWidth
                    sx={{ 
                      mt: 2,
                      '&:disabled': {
                        borderColor: '#e2e8f0',
                        color: '#94a3b8'
                      }
                    }}
                  >
                    Submit Task
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Submit Task Dialog */}
      <Dialog 
        open={openSubmissionDialog} 
        onClose={() => setOpenSubmissionDialog(false)} 
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
          Submit Task: {selectedTaskForSubmission?.title}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Tabs 
              value={submissionType} 
              onChange={(e, newValue) => setSubmissionType(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab 
                value="file" 
                label="Upload File" 
                icon={<FiFile size={18} />} 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                value="link" 
                label="Share Link" 
                icon={<FiLink size={18} />} 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
            </Tabs>

            {submissionType === 'file' ? (
              <Box
                sx={{
                  border: '2px dashed #e2e8f0',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  mb: 2,
                  backgroundColor: submissionFile ? '#f8fafc' : 'transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    backgroundColor: '#f8fafc'
                  }
                }}
              >
                {submissionFile ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <FiFile size={24} className="text-gray-500" />
                      <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                        {submissionFile.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={removeFile}
                        sx={{ ml: 1, color: '#ef4444' }}
                      >
                        <FiX size={16} />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                      {formatFileSize(submissionFile.size)} • {submissionFile.type}
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <FiUpload size={32} className="text-gray-400 mx-auto mb-2" />
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                      Drag and drop files here
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                      or
                    </Typography>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<FiPaperclip />}
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
                      Select File
                      <input
                        type="file"
                        hidden
                        onChange={handleFileChange}
                      />
                    </Button>
                    <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block' }}>
                      Max file size: 100MB
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <TextField
                fullWidth
                label="Paste your link here"
                variant="outlined"
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                required
                placeholder="https://example.com"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <FiLink size={20} className="text-gray-400 mr-2" />
                  ),
                  sx: { backgroundColor: 'white' }
                }}
              />
            )}

            <TextField
              fullWidth
              label="Notes (optional)"
              variant="outlined"
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { backgroundColor: 'white' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid #e2e8f0'
        }}>
          <Button 
            onClick={() => setOpenSubmissionDialog(false)}
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
            onClick={handleTaskSubmission}
            variant="contained"
            disabled={submissionLoading || 
              (submissionType === 'file' && !submissionFile) || 
              (submissionType === 'link' && !submissionLink)}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              '&:disabled': {
                backgroundColor: '#e2e8f0',
                color: '#94a3b8'
              },
              px: 3,
              py: 1
            }}
          >
            {submissionLoading ? 'Submitting...' : 'Submit Task'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={submissionSnackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSubmissionSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSubmissionSnackbar} severity={submissionSnackbar.severity} sx={{ width: '100%' }}>
          {submissionSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AllTasks;