import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Chip,
  LinearProgress,
  Paper,
  MenuItem,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import {
  FiUpload,
  FiLink,
  FiFile,
  FiX,
  FiCheck,
  FiClock,
  FiPaperclip,
  FiExternalLink,
  FiAlertCircle,
  FiPlus
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, getDocs } from "firebase/firestore";
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

const UploadFiles = () => {
  const [activeTab, setActiveTab] = useState("file");
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // New state for project and task selection
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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

  const uploadToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    try {
      const { data, error } = await supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .upload(`documents/${fileName}`, file);
  
      if (error) throw error;
  
      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_CONFIG.bucket)
        .getPublicUrl(`documents/${fileName}`);
  
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

  // Fetch user projects and submissions
  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch projects where user is a team member
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, "dxd-magnate-projects"));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === auth.currentUser.uid);
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setSnackbar({
          open: true,
          message: "Failed to load projects",
          severity: "error"
        });
      }
    };

    // Fetch user submissions
    const fetchSubmissions = async () => {
      const q = query(collection(db, "project-submissions"), where("userId", "==", auth.currentUser.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userSubmissions = [];
        querySnapshot.forEach((doc) => {
          userSubmissions.push({ id: doc.id, ...doc.data() });
        });
        setSubmissions(userSubmissions);
      });

      return () => unsubscribe();
    };

    fetchProjects();
    fetchSubmissions();
  }, []);

  // Fetch tasks when project is selected
  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      setSelectedTask("");
      return;
    }

    const fetchTasks = async () => {
      try {
        const q = query(
          collection(db, "project-tasks"),
          where("projectId", "==", selectedProject),
          where("assignee.id", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setSnackbar({
          open: true,
          message: "Failed to load tasks",
          severity: "error"
        });
      }
    };

    fetchTasks();
  }, [selectedProject]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }

      if (!selectedProject) {
        throw new Error("Please select a project");
      }

      let submissionData = {
        title,
        description,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: serverTimestamp(),
        status: "submitted",
        type: activeTab,
        projectId: selectedProject,
        taskId: selectedTask || null
      };

      if (activeTab === "file" && file) {
        setIsUploading(true);
        
        // Check if file is media type (image, video, audio)
        const fileType = file.type.split('/')[0];
        if (['image', 'video', 'audio'].includes(fileType)) {
          // Upload to Cloudinary
          const uploadedFile = await uploadToCloudinary(file);
          submissionData = {
            ...submissionData,
            file: {
              name: file.name,
              url: uploadedFile.url,
              type: file.type,
              size: uploadedFile.bytes,
              storageType: 'cloudinary'
            }
          };
        } else {
          // Upload to Supabase
          const uploadedFile = await uploadToSupabase(file);
          submissionData = {
            ...submissionData,
            file: {
              name: uploadedFile.fileName,
              url: uploadedFile.url,
              type: uploadedFile.type,
              size: uploadedFile.size,
              storageType: 'supabase'
            }
          };
        }
      } else if (activeTab === "link" && link) {
        submissionData = {
          ...submissionData,
          link: link
        };
      } else {
        throw new Error(activeTab === "file" ? "Please select a file" : "Please enter a valid link");
      }

      // Save to Firestore
      await addDoc(collection(db, "project-submissions"), submissionData);

      setSnackbar({
        open: true,
        message: "Work submitted successfully!",
        severity: "success"
      });

      // Reset form
      setFile(null);
      setLink("");
      setDescription("");
      setTitle("");
      setSelectedProject("");
      setSelectedTask("");
      setUploadProgress(0);
    } catch (error) {
      console.error("Error submitting work:", error);
      setSnackbar({
        open: true,
        message: `Error submitting work: ${error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Submit Work
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Upload your completed work files or share links for review
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Submission Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#4f46e520', color: '#4f46e5', mr: 2 }}>
                  <FiUpload size={20} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  New Submission
                </Typography>
              </Box>

              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
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

              <form onSubmit={handleSubmit}>
                {/* Title Field */}
                <TextField
                  fullWidth
                  label="Title *"
                  variant="outlined"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                  InputProps={{
                    sx: { backgroundColor: 'white' }
                  }}
                />

                {/* Project Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Project *</InputLabel>
                  <Select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    label="Project *"
                    required
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Task Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Task (Optional)</InputLabel>
                  <Select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    label="Task (Optional)"
                    disabled={!selectedProject}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {tasks.map((task) => (
                      <MenuItem key={task.id} value={task.id}>
                        {task.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {activeTab === "file" ? (
                  <Box
                    sx={{
                      border: '2px dashed #e2e8f0',
                      borderRadius: 2,
                      p: 4,
                      textAlign: 'center',
                      mb: 3,
                      backgroundColor: file ? '#f8fafc' : 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#cbd5e1',
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    {file ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <FiFile size={24} className="text-gray-500" />
                          <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                            {file.name}
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
                          {formatFileSize(file.size)} • {file.type}
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
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    required
                    placeholder="https://example.com"
                    sx={{ mb: 3 }}
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
                  label="Description (optional)"
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  sx={{ mb: 3 }}
                  InputProps={{
                    sx: { backgroundColor: 'white' }
                  }}
                />

                {loading && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                      {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                    </Typography>
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || isUploading || (activeTab === "file" && !file) || (activeTab === "link" && !link) || !selectedProject || !title}
                  sx={{
                    backgroundColor: '#4f46e5',
                    '&:hover': {
                      backgroundColor: '#4338ca'
                    },
                    '&:disabled': {
                      backgroundColor: '#e2e8f0',
                      color: '#94a3b8'
                    }
                  }}
                >
                  {loading || isUploading ? 'Submitting...' : 'Submit Work'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Submission Guidelines */}
          <Card sx={{ mt: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Submission Guidelines
              </Typography>
              <List>
                {[
                  "Ensure files are in the required format (PDF, DOCX, XLSX, etc.)",
                  "Name files clearly with project/task identifiers",
                  "Include all necessary supporting documents",
                  "For links, ensure they are accessible to reviewers",
                  "Double-check your work before submitting"
                ].map((item, index) => (
                  <ListItem 
                    key={index} 
                    sx={{
                      py: 1,
                      '&:hover': {
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#f1f5f9', color: '#4f46e5', width: 32, height: 32 }}>
                        <FiCheck size={16} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Submission History */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Your Submissions
              </Typography>

              {submissions.length > 0 ? (
                <List sx={{ py: 0 }}>
                  {submissions
                    .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                    .map((submission) => (
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
                        <ListItem 
                          alignItems="flex-start"
                          sx={{
                            '&:hover': {
                              backgroundColor: '#f8fafc'
                            }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: submission.status === 'approved' ? '#ecfdf5' : 
                                      submission.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                              color: submission.status === 'approved' ? '#10b981' : 
                                    submission.status === 'rejected' ? '#ef4444' : '#f59e0b'
                            }}>
                              {submission.status === 'approved' ? (
                                <FiCheck size={18} />
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
                                {submission.title || (submission.type === 'file' ? submission.file?.name : 'Link Submission')}
                              </Typography>
                            }
                            secondary={
                              <>
                                {submission.description && (
                                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                    {submission.description}
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
                                    {submission.createdAt?.toDate()?.toLocaleDateString('en-US', {
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
                                {submission.feedback && (
                                  <Box sx={{ 
                                    mt: 1,
                                    p: 1,
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 1
                                  }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#4f46e5' }}>
                                      FEEDBACK:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                      {submission.feedback}
                                    </Typography>
                                  </Box>
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
                  py: 4,
                  backgroundColor: '#f8fafc',
                  borderRadius: 2
                }}>
                  <FiUpload size={48} className="text-gray-400 mx-auto mb-3" />
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    No submissions yet
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    Your submitted work will appear here
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default UploadFiles;