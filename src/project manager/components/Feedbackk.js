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
  CircularProgress,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  FormControl,
  InputLabel
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
  FiUser,
  FiRefreshCw,
  FiMoreVertical
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, updateDoc, addDoc, onSnapshot } from "firebase/firestore";
import { supabase } from "../../services/supabase";
import { format, parseISO, isBefore, isAfter, isToday } from 'date-fns';
import { FaCalendarAlt, FaExclamation, FaFileAlt, FaFolder, FaHeading, FaUser } from "react-icons/fa";

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

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'warning', icon: <FiClock /> },
  { value: 'approved', label: 'Approved', color: 'success', icon: <FiCheckCircle /> },
  { value: 'rejected', label: 'Rejected', color: 'error', icon: <FiAlertCircle /> },
  { value: 'changes_requested', label: 'Changes Requested', color: 'info', icon: <FiEdit2 /> }
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'success', icon: <FiTrendingUp /> },
  { value: 'medium', label: 'Medium', color: 'warning', icon: <FiAlertCircle /> },
  { value: 'high', label: 'High', color: 'error', icon: <FiAlertCircle /> },
  { value: 'urgent', label: 'Urgent', color: 'secondary', icon: <FiAlertCircle /> }
];

const FeedbackApprovalsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [submissionType, setSubmissionType] = useState('file');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [approvalTitle, setApprovalTitle] = useState('');
  const [approvalPriority, setApprovalPriority] = useState('medium');
  const [approvalDueDate, setApprovalDueDate] = useState('');
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rowsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);

        // Fetch projects where current user is project manager
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

        // Fetch clients associated with these projects
        const clientIds = [...new Set(projectsData.map(p => p.clientId))];
        if (clientIds.length > 0) {
          const clientsQuery = query(
            collection(db, "users"),
            where("uid", "in", clientIds)
          );
          const clientsSnapshot = await getDocs(clientsQuery);
          const clientsData = clientsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setClients(clientsData);
        }

        // Set up real-time listener for approval requests
        const approvalsQuery = query(
          collection(db, "client-tasks"),
          where("createdBy", "==", user.uid),
          where("type", "==", "approval_request")
        );
        
        const unsubscribe = onSnapshot(approvalsQuery, (snapshot) => {
          const approvalsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setApprovalRequests(approvalsData);
          setLoading(false);
          setIsRefreshing(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const approvalsQuery = query(
        collection(db, "client-tasks"),
        where("createdBy", "==", user.uid),
        where("type", "==", "approval_request")
      );
      const approvalsSnapshot = await getDocs(approvalsQuery);
      const approvalsData = approvalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApprovalRequests(approvalsData);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredRequests = approvalRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         request.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesProject = projectFilter === "all" || request.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const paginatedRequests = filteredRequests.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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
        .upload(`approval-docs/${fileName}`, file);
  
      if (error) throw error;
  
      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .getPublicUrl(`approval-docs/${fileName}`);
  
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
        setSnackbar({
          open: true,
          message: "File size exceeds 100MB limit",
          severity: "error"
        });
        return;
      }
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return format(parseISO(dateString), 'MMM dd, yyyy h:mm a');
  };

  const calculateDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  };

  const getDueDateLabel = (dueDate) => {
    const daysRemaining = calculateDaysRemaining(dueDate);
    
    if (daysRemaining === null) return '';
    if (daysRemaining < 0) return 'Overdue';
    if (daysRemaining === 0) return 'Due today';
    if (daysRemaining === 1) return '1 day left';
    return `${daysRemaining} days left`;
  };
  
  const getDueDateColor = (dueDate) => {
    const daysRemaining = calculateDaysRemaining(dueDate);
    
    if (daysRemaining === null) return 'default';
    if (daysRemaining < 0) return 'error'; // Overdue - red
    if (daysRemaining <= 1) return 'warning'; // Due today/tomorrow - orange
    if (daysRemaining <= 3) return 'info'; // 2-3 days - blue
    return 'success'; // More than 3 days - green
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return 'none';
    const today = new Date();
    const due = parseISO(dueDate);
    
    if (isBefore(due, today)) return 'overdue';
    if (isToday(due)) return 'today';
    if (isAfter(due, today)) return 'upcoming';
    return 'none';
  };

  const handleSubmitApprovalRequest = async () => {
    if (!selectedClient || !selectedProject || !approvalTitle) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "error"
      });
      return;
    }

    if ((submissionType === 'file' && !submissionFile) || 
        (submissionType === 'link' && !submissionLink)) {
      setSnackbar({
        open: true,
        message: `Please ${submissionType === 'file' ? 'select a file' : 'enter a link'}`,
        severity: "error"
      });
      return;
    }

    setSubmissionLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const client = clients.find(c => c.id === selectedClient);
      const project = projects.find(p => p.id === selectedProject);

      if (!client || !project) throw new Error("Client or project not found");

      let submissionData = {
        title: approvalTitle,
        notes: submissionNotes,
        priority: approvalPriority,
        dueDate: approvalDueDate || null,
        status: 'pending',
        type: 'approval_request',
        projectId: selectedProject,
        projectTitle: project.title,
        clientId: selectedClient,
        clientName: `${client.firstName} ${client.lastName}`,
        clientCompany: client.company,
        createdBy: user.uid,
        createdByName: user.displayName || user.email,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        assignee: {
          id: selectedClient,
          name: `${client.firstName} ${client.lastName}`,
          avatar: client.photoURL || client.profilePicture || null
        },
        taskStatus:"pending"
      };

      if (submissionType === 'file' && submissionFile) {
        const fileType = submissionFile.type.split('/')[0];
        
        if (['image', 'video', 'audio'].includes(fileType)) {
          // Upload media to Cloudinary
          const uploadedFile = await uploadToCloudinary(submissionFile);
          submissionData = {
            ...submissionData,
            submissionType: 'file',
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
            submissionType: 'file',
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
          submissionType: 'link',
          link: submissionLink
        };
      }

      // Save to Firestore
      await addDoc(collection(db, "client-tasks"), submissionData);

      // Create notification for client
      await addDoc(collection(db, "client-notifications"), {
        message: `New approval request: ${approvalTitle}`,
        userId: selectedClient,
        viewed: false,
        timestamp: new Date().toISOString(),
        projectId: selectedProject,
        projectName: project.title,
        type: "approval-request"
      });

      setSnackbar({
        open: true,
        message: "Approval request submitted successfully!",
        severity: "success"
      });

      // Reset form
      setSubmissionFile(null);
      setSubmissionLink('');
      setSubmissionNotes('');
      setApprovalTitle('');
      setSelectedClient('');
      setSelectedProject('');
      setApprovalPriority('medium');
      setApprovalDueDate('');
      setOpenDialog(false);
    } catch (error) {
      console.error("Error submitting approval request:", error);
      setSnackbar({
        open: true,
        message: `Error submitting request: ${error.message}`,
        severity: "error"
      });
    } finally {
      setSubmissionLoading(false);
    }
  };

  const renderSubmissionContent = (request) => {
    if (request.submissionType === 'file') {
      return (
        <Box className="flex items-center gap-2">
          <FiFile className="text-gray-500" />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {request.file?.name || 'File submission'}
          </Typography>
          <Button
            size="small"
            startIcon={<FiDownload size={14} />}
            href={request.file?.url}
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
            {request.link || 'Link submission'}
          </Typography>
          <Button
            size="small"
            startIcon={<FiExternalLink size={14} />}
            href={request.link}
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

  const handleRequestExpand = (requestId) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusCount = (status) => {
    return approvalRequests.filter(r => r.status === status).length;
  };

  const getPriorityIcon = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.icon : <FiAlertCircle />;
  };

  const getStatusIcon = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.icon : <FiClock />;
  };

  return (
    <Box className="space-y-6">
      {/* Header with refresh button */}
      <Box className="flex justify-between items-center mb-6">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            Feedback & Approvals
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Request approvals from clients and track their responses
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={refreshData}
            disabled={isRefreshing}
            sx={{
              backgroundColor: '#f1f5f9',
              '&:hover': {
                backgroundColor: '#e2e8f0'
              }
            }}
          >
            <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards with improved design */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            borderLeft: '4px solid #6366f1',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
            }
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
                    Total Requests
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {approvalRequests.length}
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
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
            }
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
                    {getStatusCount('approved')}
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
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
            }
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
                    Pending
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {getStatusCount('pending')}
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
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
            }
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
                    Rejected
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {getStatusCount('rejected')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions with improved design */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2, 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        mb: 3,
        background: 'linear-gradient(to right, #f9fafb, #f3f4f6)'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch color="#94a3b8" />
                  </InputAdornment>
                ),
                sx: { 
                  backgroundColor: 'white',
                  borderRadius: 1,
                  '&:hover': {
                    borderColor: '#cbd5e1'
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#cbd5e1'
                }
              }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {status.icon}
                    {status.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={6} md={2}>
            <Select
              fullWidth
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              displayEmpty
              sx={{ 
                backgroundColor: 'white',
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#cbd5e1'
                }
              }}
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
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
                }
              }}
            >
              Advanced
            </Button>
          </Grid>
          <Grid item xs={6} md={2}>
            <Button 
              variant="contained" 
              startIcon={<FiPlus size={18} />}
              fullWidth
              onClick={() => setOpenDialog(true)}
              sx={{
                backgroundColor: '#4f46e5',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: '#4338ca',
                },
                boxShadow: '0 1px 2px 0 rgba(76, 79, 226, 0.05)'
              }}
            >
              New Request
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onChange={(e, newValue) => {
          setStatusFilter(newValue);
          setPage(1);
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            backgroundColor: '#4f46e5',
            height: 3
          }
        }}
      >
        <Tab
          label={
            <Badge 
              badgeContent={approvalRequests.length} 
              color="primary"
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              All
            </Badge>
          }
          value="all"
          sx={{ minHeight: 48 }}
        />
        {statusOptions.map((status) => (
          <Tab
            key={status.value}
            label={
              <Badge 
                badgeContent={getStatusCount(status.value)} 
                color={status.color}
                sx={{ '& .MuiBadge-badge': { right: -15 } }}
              >
                {status.label}
              </Badge>
            }
            value={status.value}
            sx={{ minHeight: 48 }}
          />
        ))}
      </Tabs>

      {/* Approval Requests Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ 
            borderRadius: 2, 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <Table>
              <TableHead sx={{ 
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Request</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRequests.length > 0 ? (
                  paginatedRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow hover sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                        <TableCell>
                          <Box className="flex items-center gap-3">
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {request.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                {request.notes?.substring(0, 50)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box className="flex items-center gap-2">
                            <Avatar 
                              src={request.assignee?.avatar} 
                              sx={{ width: 32, height: 32 }}
                            >
                              {request.clientName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {request.clientName}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                {request.clientCompany}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {request.projectTitle}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.priority}
                            size="small"
                            icon={getPriorityIcon(request.priority)}
                            sx={{
                              backgroundColor: priorityOptions.find(p => p.value === request.priority)?.color + '.100',
                              color: priorityOptions.find(p => p.value === request.priority)?.color + '.800',
                              fontWeight: 'bold',
                              fontSize: '0.65rem',
                              textTransform: 'capitalize',
                              '& .MuiChip-icon': {
                                color: priorityOptions.find(p => p.value === request.priority)?.color + '.500',
                                fontSize: '0.8rem',
                                ml: '4px'
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status.replace('_', ' ')}
                            size="small"
                            icon={getStatusIcon(request.status)}
                            sx={{
                              backgroundColor: statusOptions.find(s => s.value === request.status)?.color + '.100',
                              color: statusOptions.find(s => s.value === request.status)?.color + '.800',
                              fontWeight: 'bold',
                              fontSize: '0.65rem',
                              textTransform: 'capitalize',
                              '& .MuiChip-icon': {
                                color: statusOptions.find(s => s.value === request.status)?.color + '.500',
                                fontSize: '0.8rem',
                                ml: '4px'
                              }
                            }}
                          />
                        </TableCell>
                       <TableCell>
  <Box className="flex items-center gap-1">
    <FiCalendar size={14} className="text-gray-500" />
    <Typography variant="body2">
      {request.dueDate ? formatDate(request.dueDate) : 'No due date'}
    </Typography>
    {request.dueDate && request.taskStatus !== 'completed' && (
      <Chip
        label={getDueDateLabel(request.dueDate)}
        size="small"
        sx={{
          ml: 1,
          fontSize: '0.6rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          backgroundColor: getDueDateColor(request.dueDate) + '.100',
          color: getDueDateColor(request.dueDate) + '.800',
          '& .MuiChip-label': {
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }
        }}
      />
    )}
    {request.taskStatus === 'completed' && (
      <Chip
        label="Completed"
        size="small"
        icon={<FiCheckCircle size={12} />}
        sx={{
          ml: 1,
          fontSize: '0.6rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          backgroundColor: 'success.100',
          color: 'success.800',
          '& .MuiChip-icon': {
            fontSize: '0.7rem',
            color: 'success.500'
          }
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
                                sx={{
                                  backgroundColor: '#e0e7ff',
                                  color: '#4f46e5',
                                  '&:hover': {
                                    backgroundColor: '#c7d2fe'
                                  }
                                }}
                                onClick={() => handleRequestExpand(request.id)}
                              >
                                <FiEye size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Resend Reminder">
                              <IconButton
                                size="small"
                                disabled={request.status === 'approved'}
                                sx={{
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  '&:hover': {
                                    backgroundColor: '#e2e8f0'
                                  },
                                  '&:disabled': {
                                    backgroundColor: '#f8fafc',
                                    color: '#cbd5e1'
                                  }
                                }}
                              >
                                <FiSend size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0 }}>
                          <Accordion
                            expanded={expandedRequest === request.id}
                            onChange={() => handleRequestExpand(request.id)}
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
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                Submission Details
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Submission
                                  </Typography>
                                  {renderSubmissionContent(request)}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Notes
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    {request.notes || 'No notes provided'}
                                  </Typography>
                                </Grid>
                                {request.status !== 'pending' && (
                                  <Grid item xs={12}>
                                    <Box sx={{ 
                                      backgroundColor: '#f8fafc', 
                                      p: 2, 
                                      borderRadius: 1,
                                      borderLeft: '4px solid #e2e8f0'
                                    }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Client Response
                                      </Typography>
                                      {request.clientRating && (
                                        <Box display="flex" alignItems="center" mb={1}>
                                          <Rating
                                            value={request.clientRating}
                                            readOnly
                                            precision={0.5}
                                            size="small"
                                          />
                                          <Typography variant="body2" sx={{ ml: 1, color: '#64748b' }}>
                                            ({request.clientRating.toFixed(1)})
                                          </Typography>
                                        </Box>
                                      )}
                                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        {request.clientFeedback || 'No feedback provided'}
                                      </Typography>
                                      {request.updatedAt && (
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#94a3b8' }}>
                                          Responded on {formatDateTime(request.updatedAt)}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FiMessageSquare size={48} className="text-gray-400 mb-3" />
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          No approval requests found
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                          {searchTerm
                            ? "No requests match your search criteria"
                            : "No requests match your current filters"}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<FiPlus />}
                          onClick={() => setOpenDialog(true)}
                          sx={{
                            backgroundColor: '#4f46e5',
                            '&:hover': {
                              backgroundColor: '#4338ca',
                            }
                          }}
                        >
                          Create New Request
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <Box className="flex justify-between items-center mt-4">
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
              </Typography>
              <Pagination
                count={Math.ceil(filteredRequests.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                shape="rounded"
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1
                  }
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* New Approval Request Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          borderBottom: '1px solid #e2e8f0',
          py: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>New Approval Request</span>
          <IconButton 
            onClick={() => setOpenDialog(false)}
            sx={{
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

<Grid sx={{margin:"10px"}}>
  {/* Request Title */}
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Request Title"
      variant="outlined"
      value={approvalTitle}
      onChange={(e) => setApprovalTitle(e.target.value)}
      required
      placeholder="Enter request title"
      InputProps={{
       
        sx: { 
          backgroundColor: 'white',
          borderRadius: 1,
          marginBottom:'10px'
        }
      }}
      InputLabelProps={{
        sx: { fontWeight: 'bold' }
      }}
    />
  </Grid>

  {/* Priority */}
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel required sx={{ fontWeight: 'bold' }}>Priority</InputLabel>
      <Select
        label="Priority *"
        value={approvalPriority}
        onChange={(e) => setApprovalPriority(e.target.value)}
        required
       
        sx={{ 
          mb: 2,
          backgroundColor: 'white',
          borderRadius: 1
        }}
      >
        {priorityOptions.map((priority) => (
          <MenuItem key={priority.value} value={priority.value}>
            <Box display="flex" alignItems="center" gap={1}>
              {priority.icon}
              {priority.label}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  {/* Client */}
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel required sx={{ fontWeight: 'bold' }}>Client</InputLabel>
      <Select
        label="Client *"
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
        required
        sx={{ 
          mb: 2,
          backgroundColor: 'white',
          borderRadius: 1
        }}

      >
        <MenuItem value="" disabled>Select Client</MenuItem>
        {clients.map(client => (
          <MenuItem key={client.id} value={client.id}>
            <Box className="flex items-center gap-2">
              <Avatar 
                src={client.photoURL || client.profilePicture} 
                sx={{ width: 24, height: 24 }}
              >
                {client.firstName?.charAt(0)}
              </Avatar>
              <span>{client.firstName} {client.lastName} ({client.company})</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  {/* Project */}
  <Grid item xs={12} md={6}>
    <FormControl fullWidth>
      <InputLabel required sx={{ fontWeight: 'bold' }}>Project</InputLabel>
      <Select
        label="Project *"
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        required
        sx={{ 
          mb: 2,
          backgroundColor: 'white',
          borderRadius: 1
        }}
       
      >
        <MenuItem value="" disabled>Select Project</MenuItem>
        {projects.filter(p => p.clientId === selectedClient).map(project => (
          <MenuItem key={project.id} value={project.id}>
            <Box display="flex" alignItems="center" gap={1}>
              <FaFileAlt style={{ color: '#757575', fontSize: '0.875rem' }} />
              {project.title}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>

  {/* Due Date */}
  <Grid item xs={12} md={6}>
    <TextField
      fullWidth
      label="Due Date"
      type="date"
      variant="outlined"
      value={approvalDueDate}
      onChange={(e) => setApprovalDueDate(e.target.value)}
      InputLabelProps={{ 
        shrink: true,
        sx: { fontWeight: 'bold' }
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FaCalendarAlt style={{ color: '#757575' }} />
          </InputAdornment>
        ),
        sx: { 
          backgroundColor: 'white',
          borderRadius: 1
        }
      }}
    />
  </Grid>
</Grid>

            <Tabs 
              value={submissionType} 
              onChange={(e, newValue) => setSubmissionType(newValue)}
              sx={{ mb: 2 }}
              variant="fullWidth"
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
                        borderRadius: 1,
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
                  sx: { 
                    backgroundColor: 'white',
                    borderRadius: 1
                  }
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
                sx: { 
                  backgroundColor: 'white',
                  borderRadius: 1
                }
              }}
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
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitApprovalRequest}
            variant="contained"
            disabled={submissionLoading || 
              !selectedClient || 
              !selectedProject || 
              !approvalTitle ||
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
              py: 1,
              borderRadius: 1
            }}
          >
            {submissionLoading ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FeedbackApprovalsDashboard;