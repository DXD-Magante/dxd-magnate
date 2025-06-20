import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip
} from "@mui/material";
import {
  FiX,
  FiUpload,
  FiLink,
  FiFile,
  FiPaperclip,
  FiSend,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiChevronDown,
  FiUsers,
  FiCalendar
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, setDoc, } from "firebase/firestore";
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

const SubmitWorkModal = ({ open, onClose }) => {
  const [projects, setProjects] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCollaboration, setSelectedCollaboration] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionType, setSubmissionType] = useState('file');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [loading, setLoading] = useState({
    projects: true,
    tasks: false,
    submitting: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch projects and collaborations where user is a member
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch user department
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userDepartment = userDoc.data()?.department || '';

        // Fetch projects
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

        // If user is in marketing, fetch collaborations
        if (userDepartment === "Marketing") {
          const collabQuery = query(collection(db, "marketing-collaboration"));
          const collabSnapshot = await getDocs(collabQuery);
          const collabData = collabSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCollaborations(collabData);
        }
      } catch (error) {
        alert(error)
        console.error("Error fetching data:", error);
        setSnackbar({
          open: true,
          message: "Error fetching projects and collaborations",
          severity: "error"
        });
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Fetch tasks based on selected project or collaboration
  useEffect(() => {
    if (!selectedProject && !selectedCollaboration) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(prev => ({ ...prev, tasks: true }));
        const user = auth.currentUser;
        if (!user) return;

        let tasksQuery;
        if (selectedProject) {
          tasksQuery = query(
            collection(db, "project-tasks"),
            where("projectId", "==", selectedProject),
            where("assignee.id", "==", user.uid)
          );
        } else {
          tasksQuery = query(
            collection(db, "marketing-collaboration-tasks"),
            where("collaborationId", "==", selectedCollaboration),
            where("assignee.id", "==", user.uid)
          );
        }

        const querySnapshot = await getDocs(tasksQuery);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setSnackbar({
          open: true,
          message: "Error fetching tasks",
          severity: "error"
        });
      } finally {
        setLoading(prev => ({ ...prev, tasks: false }));
      }
    };

    fetchTasks();
  }, [selectedProject, selectedCollaboration]);

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        .upload(`submissions/${fileName}`, file);
  
      if (error) throw error;
  
      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .getPublicUrl(`submissions/${fileName}`);
  
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

  const handleSubmit = async () => {
    if (!selectedTask) {
      setSnackbar({
        open: true,
        message: "Please select a task to submit",
        severity: "error"
      });
      return;
    }

    if ((submissionType === 'file' && !submissionFile) || 
        (submissionType === 'link' && !submissionLink)) {
      setSnackbar({
        open: true,
        message: submissionType === 'file' ? "Please select a file" : "Please enter a link",
        severity: "error"
      });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, submitting: true }));
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      let submissionData = {
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        userId: user.uid,
        userName: user.displayName || user.email,
        notes: submissionNotes,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      // Add project or collaboration specific fields
      if (selectedProject) {
        submissionData = {
          ...submissionData,
          projectId: selectedTask.projectId,
          projectTitle: selectedTask.projectTitle,
          collection: "project-submissions"
        };
      } else {
        submissionData = {
          ...submissionData,
          collaborationId: selectedTask.collaborationId,
          collaborationTitle: selectedTask.collaborationTitle,
          collection: "marketing-collaboration-submissions"
        };
      }

      // Handle file or link submission
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
      }

      // Save to Firestore
      await addDoc(collection(db, submissionData.collection), submissionData);

      // Update task status to "Review"
      const taskCollection = selectedProject ? "project-tasks" : "marketing-collaboration-tasks";
      await updateDoc(doc(db, taskCollection, selectedTask.id), {
        status: 'Review',
        updatedAt: new Date().toISOString()
      });

      setSnackbar({
        open: true,
        message: "Work submitted successfully!",
        severity: "success"
      });

      // Reset form
      setSubmissionFile(null);
      setSubmissionLink('');
      setSubmissionNotes('');
      setSelectedTask(null);
      onClose();
    } catch (error) {
      console.error("Error submitting work:", error);
      setSnackbar({
        open: true,
        message: `Error submitting work: ${error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            minHeight: '60vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          py: 2.5,
          pr: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Submit Your Work
          </Typography>
          <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
            <FiX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Project/Collaboration Selection */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedCollaboration('');
                  }}
                  label="Select Project"
                  disabled={loading.projects}
                  sx={{ backgroundColor: 'white' }}
                  IconComponent={FiChevronDown}
                >
                  <MenuItem value="">
                    <em>Select a project</em>
                  </MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {collaborations.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Or Select Collaboration</InputLabel>
                  <Select
                    value={selectedCollaboration}
                    onChange={(e) => {
                      setSelectedCollaboration(e.target.value);
                      setSelectedProject('');
                    }}
                    label="Or Select Collaboration"
                    disabled={loading.projects}
                    sx={{ backgroundColor: 'white' }}
                    IconComponent={FiChevronDown}
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
              )}
            </Box>

            {/* Task Selection */}
            {loading.tasks ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {selectedProject || selectedCollaboration ? (
                  <Box>
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
                      sx={{ mb: 2 }}
                    />

                    {filteredTasks.length > 0 ? (
                      <List sx={{ 
                        maxHeight: 300, 
                        overflow: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2
                      }}>
                        {filteredTasks.map(task => (
                          <ListItem
                            key={task.id}
                            sx={{
                              borderBottom: '1px solid #e2e8f0',
                              backgroundColor: selectedTask?.id === task.id ? '#f8fafc' : 'white',
                              '&:last-child': { borderBottom: 'none' },
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: '#f8fafc'
                              }
                            }}
                            onClick={() => setSelectedTask(task)}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: statusColors[task.status] || '#f1f5f9',
                                color: '#1e293b',
                                width: 36,
                                height: 36
                              }}>
                                {task.status[0]}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {task.title}
                                </Typography>
                              }
                              secondary={
                                <>
                                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    {task.description.substring(0, 80)}...
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Chip
                                      label={task.priority}
                                      size="small"
                                      sx={{
                                        backgroundColor: priorityColors[task.priority],
                                        color: '#1e293b',
                                        fontWeight: 500,
                                        fontSize: '0.65rem'
                                      }}
                                    />
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      color: isOverdue(task.dueDate, task.status) ? '#ef4444' : '#64748b',
                                      fontSize: '0.75rem'
                                    }}>
                                      <FiCalendar size={12} style={{ marginRight: 4 }} />
                                      {formatDate(task.dueDate)}
                                      {isOverdue(task.dueDate, task.status) && (
                                        <span style={{ marginLeft: 4 }}>(Overdue)</span>
                                      )}
                                    </Box>
                                  </Box>
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Paper sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        backgroundColor: '#f8fafc',
                        borderRadius: 2
                      }}>
                        <FiFile size={32} className="text-gray-400 mx-auto mb-3" />
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                          No tasks found
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {searchTerm 
                            ? "No tasks match your search criteria" 
                            : "You don't have any tasks assigned in this project/collaboration"}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                ) : (
                  <Paper sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: 2
                  }}>
                    <FiUsers size={32} className="text-gray-400 mx-auto mb-3" />
                    <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                      Select a project or collaboration
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Choose a project or collaboration to view and submit tasks
                    </Typography>
                  </Paper>
                )}
              </>
            )}

            {/* Submission Form (shown when task is selected) */}
            {selectedTask && (
              <Box sx={{ 
                mt: 2,
                pt: 2,
                borderTop: '1px solid #e2e8f0'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Submit Work for: <span style={{ color: '#4f46e5' }}>{selectedTask.title}</span>
                </Typography>

                <Tabs 
                  value={submissionType} 
                  onChange={(e, newValue) => setSubmissionType(newValue)}
                  sx={{ mb: 3 }}
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
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3,
          borderTop: '1px solid #e2e8f0'
        }}>
          <Button 
            onClick={onClose}
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
            onClick={handleSubmit}
            variant="contained"
            disabled={loading.submitting || !selectedTask || 
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
            startIcon={loading.submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading.submitting ? 'Submitting...' : 'Submit Work'}
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
    </>
  );
};

export default SubmitWorkModal;