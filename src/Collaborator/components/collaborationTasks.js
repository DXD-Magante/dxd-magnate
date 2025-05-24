import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  Tooltip,
  Badge,
  InputAdornment,
  FormControl,
  InputLabel,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  Stack,
  CardHeader,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Snackbar,
  Alert
} from "@mui/material";
import {
  FiPlus,
  FiFilter,
  FiSearch,
  FiMoreVertical,
  FiChevronDown,
  FiCalendar,
  FiTag,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiArchive,
  FiTrash2,
  FiEdit2,
  FiExternalLink,
  FiBarChart2,
  FiUsers,
  FiTrendingUp,
  FiUpload,
  FiLink,
  FiFile,
  FiX,
  FiPaperclip,
  FiSend
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { supabase } from "../../services/supabase";

// Supabase configuration
const SUPABASE_CONFIG = {
  bucket: 'dxdmagnatedocs',
  url: 'https://bpwolooauknqwgcefpra.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwd29sb29hdWtucXdnY2VmcHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxOTQ2MTQsImV4cCI6MjA2Mjc3MDYxNH0.UpUUZsOUyqmIrD97_2H5tf9xWr0TdLvFEw_ZtZ7fDm8'
};

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dsbt1j73t',
  uploadPreset: 'dxd-magnate',
  apiKey: '753871594898224'
};

const statusColors = {
  'Backlog': '#e2e8f0',
  'To Do': '#bfdbfe',
  'In Progress': '#fed7aa',
  'Review': '#ddd6fe',
  'Done': '#bbf7d0',
  'Blocked': '#fecaca'
};

const priorityColors = {
  'Low': '#bbf7d0',
  'Medium': '#fed7aa',
  'High': '#fecaca',
  'Critical': '#ddd6fe'
};

const CollaborationTasks = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    assignee: { id: null, name: 'Unassigned', avatar: 'UA' },
    dueDate: '',
    labels: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Task submission states
  const [selectedTaskForSubmission, setSelectedTaskForSubmission] = useState(null);
  const [openSubmissionDialog, setOpenSubmissionDialog] = useState(false);
  const [submissionType, setSubmissionType] = useState('file');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionSnackbar, setSubmissionSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);

  // Fetch marketing collaborations where current user is a member
  useEffect(() => {
    const fetchCollaborations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "marketing-collaboration"),
        );
        
        const querySnapshot = await getDocs(q);
        const collaborationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setCollaborations(collaborationsData);
      } catch (error) {
        console.error("Error fetching collaborations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborations();
  }, []);

  // Fetch tasks for selected collaboration
  useEffect(() => {
    if (!selectedCollaboration) {
      setTasks([]);
      setStats(null);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "marketing-collaboration-tasks"),
        where("collaborationId", "==", selectedCollaboration.id),
        where("assignee.id", "==", auth.currentUser.uid) 
      ),
      (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTasks(tasksData);
        calculateStats(tasksData);
      },
      (error) => {
        console.error("Error fetching tasks:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedCollaboration]);

  // Fetch submissions for selected task
  useEffect(() => {
    if (!selectedTaskForSubmission) {
      setSubmissions([]);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "marketing-collaboration-submissions"),
        where("taskId", "==", selectedTaskForSubmission.id)
      ),
      (snapshot) => {
        const submissionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSubmissions(submissionsData);
      },
      (error) => {
        console.error("Error fetching submissions:", error);
      }
    );

    return () => unsubscribe();
  }, [selectedTaskForSubmission]);

  // Filter tasks based on search and filters
  useEffect(() => {
    if (tasks.length === 0) {
      setFilteredTasks([]);
      return;
    }

    const filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });

    setFilteredTasks(filtered);
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

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

  // Handle task status update
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, "marketing-collaboration-tasks", taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Add new task
  const handleAddTask = async () => {
    if (!selectedCollaboration) return;
  
    try {
      const taskData = {
        ...newTask,
        collaborationId: selectedCollaboration.id,
        collaborationTitle: selectedCollaboration.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: newTask.assignee.id ? newTask.assignee : { name: 'Unassigned', avatar: 'UA' },
        labels: newTask.labels || []
      };
  
      await addDoc(collection(db, "marketing-collaboration-tasks"), taskData);
      
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        assignee: { id: null, name: 'Unassigned', avatar: 'UA' },
        dueDate: '',
        labels: []
      });
      setOpenTaskDialog(false);
    } catch (error) {
      console.error("Error adding task:", error);
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
        .upload(`collaboration-docs/${fileName}`, file);
  
      if (error) throw error;
  
      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .getPublicUrl(`collaboration-docs/${fileName}`);
  
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
        collaborationId: selectedCollaboration.id,
        collaborationTitle: selectedCollaboration.title,
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
      await addDoc(collection(db, "marketing-collaboration-submissions"), submissionData);

      // Update task status to "Review"
      await updateDoc(doc(db, "marketing-collaboration-tasks", selectedTaskForSubmission.id), {
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

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  };

  const handleCloseSubmissionSnackbar = () => {
    setSubmissionSnackbar({ ...submissionSnackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
      </Box>
    );
  }

  if (collaborations.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Paper sx={{ 
          p: 4, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px dashed rgba(99, 102, 241, 0.3)',
          backgroundColor: 'rgba(99, 102, 241, 0.03)'
        }}>
          <Box sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '50%'
          }}>
            <FiUsers size={36} color="#6366f1" />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            No Marketing Collaborations
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            You're not currently part of any marketing collaborations. Join one to start collaborating!
          </Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#6366f1',
              '&:hover': { backgroundColor: '#4f46e5' },
              px: 4,
              py: 1.5,
              borderRadius: 2
            }}
          >
            Explore Collaborations
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header and Filters */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: 4,
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 1,
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Collaboration Tasks
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {selectedCollaboration?.title || 'Select a collaboration to view tasks'}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          width: { xs: '100%', md: 'auto' },
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
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
              <MenuItem value="">
                <em>Select a collaboration</em>
              </MenuItem>
              {collaborations.map(collab => (
                <MenuItem key={collab.id} value={collab.id}>
                  {collab.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => setOpenTaskDialog(true)}
            disabled={!selectedCollaboration}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              whiteSpace: 'nowrap',
              '&:disabled': {
                backgroundColor: '#e2e8f0',
                color: '#94a3b8'
              }
            }}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {selectedCollaboration ? (
        <>
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
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
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
                  size="small"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Select
                  fullWidth
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{ backgroundColor: 'white' }}
                  size="small"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="Backlog">Backlog</MenuItem>
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Review">Review</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={6} md={3}>
                <Select
                  fullWidth
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  displayEmpty
                  sx={{ backgroundColor: 'white' }}
                  size="small"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Paper>

          {/* Task List */}
          {filteredTasks.length > 0 ? (
            <Box>
              {filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    borderLeft: `4px solid ${statusColors[task.status] || '#e2e8f0'}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            size="small"
                            sx={{
                              minWidth: 120,
                              backgroundColor: statusColors[task.status] || '#f8fafc',
                              borderRadius: 1,
                              '& .MuiOutlinedInput-notchedOutline': {
                                border: 'none'
                              }
                            }}
                          >
                            <MenuItem value="Backlog">Backlog</MenuItem>
                            <MenuItem value="To Do">To Do</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Review">Review</MenuItem>
                            <MenuItem value="Done">Done</MenuItem>
                          </Select>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {task.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              {task.description.substring(0, 100)}{task.description.length > 100 ? '...' : ''}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={task.priority}
                              size="small"
                              sx={{
                                backgroundColor: priorityColors[task.priority],
                                color: '#1e293b',
                                fontWeight: 500
                              }}
                            />
                            {task.labels?.map((label, idx) => (
                              <Chip
                                key={idx}
                                label={label}
                                size="small"
                                sx={{
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b'
                                }}
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip title={task.assignee.name}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  fontSize: '0.75rem',
                                  bgcolor: '#e0e7ff',
                                  color: '#4f46e5'
                                }}
                              >
                                {task.assignee.avatar}
                              </Avatar>
                            </Tooltip>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              color: isOverdue(task.dueDate, task.status) ? '#ef4444' : '#64748b',
                              fontWeight: isOverdue(task.dueDate, task.status) ? 500 : 'normal'
                            }}>
                              <FiCalendar size={16} style={{ marginRight: 4 }} />
                              {formatDate(task.dueDate)}
                              {isOverdue(task.dueDate, task.status) && (
                                <Chip 
                                  label="Overdue" 
                                  size="small" 
                                  sx={{ 
                                    ml: 1,
                                    backgroundColor: '#fee2e2',
                                    color: '#dc2626',
                                    fontSize: '0.65rem',
                                    height: 20
                                  }} 
                                />
                              )}
                            </Box>
                            <Box>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setSelectedTaskForSubmission(task);
                                  setShowSubmissions(!showSubmissions);
                                }}
                                sx={{ 
                                  mr: 1,
                                  textTransform: 'none',
                                  borderColor: '#e2e8f0',
                                  color: '#64748b',
                                  '&:hover': {
                                    backgroundColor: '#f8fafc',
                                    borderColor: '#cbd5e1'
                                  }
                                }}
                              >
                                {showSubmissions && selectedTaskForSubmission?.id === task.id ? 'Hide Submissions' : 'View Submissions'}
                              </Button>
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
                                Submit Task
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Submissions section */}
                    {selectedTaskForSubmission?.id === task.id && showSubmissions && (
                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                          Submissions for this task:
                        </Typography>
                        
                        {submissions.length > 0 ? (
                          <List sx={{ py: 0 }}>
                            {submissions.map((submission) => (
                              <Paper 
                                key={submission.id} 
                                elevation={0}
                                sx={{ 
                                  mb: 2, 
                                  borderRadius: 2,
                                  border: '1px solid #e2e8f0',
                                  '&:hover': {
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                  }
                                }}
                              >
                                <ListItem alignItems="flex-start">
                                  <ListItemAvatar>
                                    <Avatar sx={{ 
                                      bgcolor: submission.status === 'approved' ? '#ecfdf5' : 
                                              submission.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                      color: submission.status === 'approved' ? '#10b981' : 
                                            submission.status === 'rejected' ? '#ef4444' : '#f59e0b',
                                      width: 36,
                                      height: 36
                                    }}>
                                      {submission.status === 'approved' ? (
                                        <FiCheckCircle size={18} />
                                      ) : submission.status === 'rejected' ? (
                                        <FiX size={18} />
                                      ) : (
                                        <FiClock size={18} />
                                      )}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {submission.type === 'file' ? submission.file?.name : 'Link Submission'}
                                      </Typography>
                                    }
                                    secondary={
                                      <>
                                        {submission.notes && (
                                          <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                            {submission.notes}
                                          </Typography>
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Chip
                                            label={submission.status}
                                            size="small"
                                            sx={{
                                              backgroundColor: 
                                                submission.status === 'approved' ? '#ecfdf5' :
                                                submission.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                              color: 
                                                submission.status === 'approved' ? '#10b981' :
                                                submission.status === 'rejected' ? '#ef4444' : '#d97706',
                                              fontWeight: 'bold',
                                              fontSize: '0.65rem'
                                            }}
                                          />
                                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                            {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </Typography>
                                        </Box>
                                        {submission.type === 'file' ? (
                                          <Button
                                            component="a"
                                            href={submission.file?.url}
                                            target="_blank"
                                            size="small"
                                            startIcon={<FiExternalLink size={14} />}
                                            sx={{
                                              mt: 1,
                                              color: '#4f46e5',
                                              '&:hover': {
                                                backgroundColor: '#eef2ff'
                                              }
                                            }}
                                          >
                                            View File
                                          </Button>
                                        ) : (
                                          <Button
                                            component="a"
                                            href={submission.link}
                                            target="_blank"
                                            size="small"
                                            startIcon={<FiExternalLink size={14} />}
                                            sx={{
                                              mt: 1,
                                              color: '#4f46e5',
                                              '&:hover': {
                                                backgroundColor: '#eef2ff'
                                              }
                                            }}
                                          >
                                            Open Link
                                          </Button>
                                        )}
                                      </>
                                    }
                                  />
                                </ListItem>
                              </Paper>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 3,
                            backgroundColor: '#f8fafc',
                            borderRadius: 2
                          }}>
                            <FiUpload size={32} className="text-gray-400 mx-auto mb-2" />
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              No submissions yet for this task
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
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
                <FiArchive size={36} color="#94a3b8" />
              </Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                No Tasks Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? "Try adjusting your search or filters" 
                  : "No tasks have been created yet for this collaboration"}
              </Typography>
              <Button
                variant="contained"
                startIcon={<FiPlus />}
                onClick={() => setOpenTaskDialog(true)}
                sx={{
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' }
                }}
              >
                Create Task
              </Button>
            </Paper>
          )}
        </>
      ) : (
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
            <FiUsers size={36} color="#94a3b8" />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Select a Collaboration
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Please select a collaboration from the dropdown to view and manage tasks
          </Typography>
        </Paper>
      )}

      {/* Add Task Dialog */}
      <Dialog 
        open={openTaskDialog} 
        onClose={() => setOpenTaskDialog(false)} 
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
          Add New Task
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Task Title"
              variant="outlined"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              rows={4}
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={newTask.status}
                    onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                  >
                    <MenuItem value="Backlog">Backlog</MenuItem>
                    <MenuItem value="To Do">To Do</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Review">Review</MenuItem>
                    <MenuItem value="Done">Done</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    label="Priority"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    label="Assignee"
                    value={newTask.assignee?.id || ''}
                    onChange={(e) => {
                      const selectedMember = selectedCollaboration?.TeamMembers?.find(member => member.id === e.target.value);
                      if (selectedMember) {
                        setNewTask({
                          ...newTask, 
                          assignee: {
                            id: selectedMember.id,
                            name: selectedMember.name,
                            avatar: selectedMember.name.split(' ').map(n => n[0]).join('')
                          }
                        });
                      } else {
                        setNewTask({
                          ...newTask,
                          assignee: { id: null, name: 'Unassigned', avatar: 'UA' }
                        });
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {selectedCollaboration?.TeamMembers?.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.name} ({member.role || 'Member'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: '#64748b' }}>
                Labels
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['Content', 'SEO', 'Social', 'Ads', 'Graphics', 'Video', 'Campaign'].map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    clickable
                    onClick={() => {
                      setNewTask(prev => ({
                        ...prev,
                        labels: prev.labels.includes(label) 
                          ? prev.labels.filter(l => l !== label)
                          : [...prev.labels, label]
                      }));
                    }}
                    sx={{
                      backgroundColor: newTask.labels.includes(label) ? '#e0e7ff' : '#f1f5f9',
                      color: newTask.labels.includes(label) ? '#4f46e5' : '#64748b',
                      '&:hover': {
                        backgroundColor: newTask.labels.includes(label) ? '#c7d2fe' : '#e2e8f0'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid #e2e8f0'
        }}>
          <Button 
            onClick={() => setOpenTaskDialog(false)}
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
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTask.title}
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
            Add Task
          </Button>
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
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
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

export default CollaborationTasks;