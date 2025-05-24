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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  MenuItem,
  Badge,
  Snackbar,
  Alert
} from "@mui/material";
import {
  FiHelpCircle,
  FiSend,
  FiPaperclip,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiChevronDown,
  FiPlus
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from "firebase/firestore";
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

const SubmitQueries = () => {
  const [queryText, setQueryText] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
  const [attachments, setAttachments] = useState([]);
  const [activeTab, setActiveTab] = useState("new");
  const [searchTerm, setSearchTerm] = useState("");
  const [queries, setQueries] = useState({ new: [], resolved: [] });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Fetch user queries from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, "queries"), where("userId", "==", auth.currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userQueries = { new: [], resolved: [] };
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "resolved") {
          userQueries.resolved.push({ id: doc.id, ...data });
        } else {
          userQueries.new.push({ id: doc.id, ...data });
        }
      });
      setQueries(userQueries);
    });

    return () => unsubscribe();
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
        throw new Error('Failed to upload file to Cloudinary');
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
        .from(SUPABASE_CONFIG.bucket)  // Use the configured bucket name
        .upload(`query-attachments/${fileName}`, file);
  
      if (error) throw error;
  
      const { data: { publicUrl } } = supabase.storage
        .from(SUPABASE_CONFIG.bucket)  // Use the configured bucket name
        .getPublicUrl(`query-attachments/${fileName}`);
  
      return {
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
  };
  const handleSubmitQuery = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }

      // Upload attachments to appropriate services
      let attachmentLinks = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          let uploadedFile;
          const fileType = file.type.split('/')[0];
          
          if (['image', 'video', 'audio'].includes(fileType)) {
            // Upload media files to Cloudinary
            uploadedFile = await uploadToCloudinary(file);
            attachmentLinks.push({
              name: file.name,
              url: uploadedFile.url,
              type: file.type,
              size: uploadedFile.bytes,
              storageType: 'cloudinary'
            });
          } else {
            // Upload documents to Supabase
            uploadedFile = await uploadToSupabase(file);
            attachmentLinks.push({
              name: uploadedFile.name,
              url: uploadedFile.url,
              type: uploadedFile.type,
              size: uploadedFile.size,
              storageType: 'supabase'
            });
          }
        }
      }

      // Save query to Firestore
      const docRef = await addDoc(collection(db, "queries"), {
        subject,
        queryText,
        priority,
        attachments: attachmentLinks,
        status: "pending",
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSnackbar({
        open: true,
        message: "Query submitted successfully!",
        severity: "success"
      });

      // Reset form
      setSubject("");
      setQueryText("");
      setPriority("medium");
      setAttachments([]);
    } catch (error) {
      console.error("Error submitting query:", error);
      setSnackbar({
        open: true,
        message: `Error submitting query: ${error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Submit Queries
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Get help from our support team or browse previously resolved queries
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

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

      <Grid container spacing={3}>
        {/* Left Column - New Query Form */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#4f46e520', color: '#4f46e5', mr: 2 }}>
                  <FiHelpCircle size={20} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Submit New Query
                </Typography>
              </Box>

              <form onSubmit={handleSubmitQuery}>
                <TextField
                  fullWidth
                  label="Subject"
                  variant="outlined"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { backgroundColor: 'white' }
                  }}
                />

                <TextField
                  fullWidth
                  label="Describe your query in detail"
                  variant="outlined"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  required
                  multiline
                  rows={6}
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { backgroundColor: 'white' }
                  }}
                />

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField
                      select
                      fullWidth
                      label="Priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      InputProps={{
                        sx: { backgroundColor: 'white' }
                      }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="critical">Critical</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      component="label"
                      variant="outlined"
                      fullWidth
                      startIcon={<FiPaperclip />}
                      sx={{
                        height: '56px',
                        borderColor: '#e2e8f0',
                        color: '#64748b',
                        backgroundColor: 'white',
                        '&:hover': {
                          borderColor: '#cbd5e1',
                          backgroundColor: '#f8fafc',
                        }
                      }}
                    >
                      Attach Files
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={handleFileUpload}
                      />
                    </Button>
                  </Grid>
                </Grid>

                {attachments.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                      Attachments:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {attachments.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => {
                            setAttachments(attachments.filter((_, i) => i !== index));
                          }}
                          sx={{
                            backgroundColor: '#f1f5f9',
                            color: '#64748b'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<FiSend />}
                  disabled={loading}
                  sx={{
                    backgroundColor: '#4f46e5',
                    '&:hover': {
                      backgroundColor: '#4338ca'
                    }
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Query'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Helpful Resources
              </Typography>
              <List>
                {[
                  "How to request project access",
                  "Design system documentation",
                  "Internal tools user guide",
                  "Meeting scheduling best practices"
                ].map((resource, index) => (
                  <ListItem 
                    key={index} 
                    button
                    sx={{
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#f1f5f9', color: '#4f46e5', width: 32, height: 32 }}>
                        <FiHelpCircle size={16} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={resource} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Query History */}
        <Grid item xs={12} md={6}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  My Queries
                </Typography>
                <TextField
                  size="small"
                  placeholder="Search queries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FiSearch className="text-gray-400" />
                      </InputAdornment>
                    ),
                    sx: {
                      backgroundColor: '#f8fafc',
                      borderRadius: 1,
                      width: 200
                    }
                  }}
                />
              </Box>

              {/* Tabs */}
              <Box sx={{ display: 'flex', mb: 3 }}>
                <Button
                  variant={activeTab === "new" ? "contained" : "text"}
                  onClick={() => setActiveTab("new")}
                  sx={{
                    mr: 1,
                    backgroundColor: activeTab === "new" ? '#4f46e5' : 'transparent',
                    color: activeTab === "new" ? 'white' : '#64748b',
                    '&:hover': {
                      backgroundColor: activeTab === "new" ? '#4338ca' : '#f1f5f9'
                    }
                  }}
                >
                  <Badge badgeContent={queries.new.length} color="error" sx={{ mr: 1 }}>
                    Pending
                  </Badge>
                </Button>
                <Button
                  variant={activeTab === "resolved" ? "contained" : "text"}
                  onClick={() => setActiveTab("resolved")}
                  sx={{
                    backgroundColor: activeTab === "resolved" ? '#10b981' : 'transparent',
                    color: activeTab === "resolved" ? 'white' : '#64748b',
                    '&:hover': {
                      backgroundColor: activeTab === "resolved" ? '#059669' : '#f1f5f9'
                    }
                  }}
                >
                  Resolved
                </Button>
              </Box>

              {/* Query List */}
              {queries[activeTab].length > 0 ? (
                <List sx={{ py: 0 }}>
                  {queries[activeTab]
                    .filter(query => 
                      query.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      query.queryText.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((query) => (
                      <Paper 
                        key={query.id} 
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
                              bgcolor: query.status === 'resolved' ? '#ecfdf5' : '#fef3c7',
                              color: query.status === 'resolved' ? '#10b981' : '#f59e0b'
                            }}>
                              {query.status === 'resolved' ? (
                                <FiCheckCircle size={18} />
                              ) : (
                                <FiClock size={18} />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {query.subject}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                                  {query.queryText}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={query.priority}
                                    size="small"
                                    sx={{
                                      backgroundColor: 
                                        query.priority === 'high' ? '#fee2e2' :
                                        query.priority === 'medium' ? '#fef3c7' : '#ecfdf5',
                                      color: 
                                        query.priority === 'high' ? '#dc2626' :
                                        query.priority === 'medium' ? '#d97706' : '#059669',
                                      fontWeight: 'bold',
                                      fontSize: '0.65rem'
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    {query.createdAt?.toDate()?.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </Typography>
                                </Box>
                                {query.attachments?.length > 0 && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'medium', color: '#64748b' }}>
                                      Attachments:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                      {query.attachments.map((file, index) => (
                                        <Chip
                                          key={index}
                                          label={file.name}
                                          component="a"
                                          href={file.url}
                                          target="_blank"
                                          clickable
                                          size="small"
                                          sx={{
                                            backgroundColor: '#f1f5f9',
                                            color: '#4f46e5',
                                            '&:hover': {
                                              backgroundColor: '#e2e8f0'
                                            }
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                                {query.status === 'resolved' && query.resolution && (
                                  <Box sx={{ 
                                    mt: 1,
                                    p: 1,
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 1
                                  }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                                      RESOLUTION:
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                                      {query.resolution}
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
                  <FiHelpCircle size={48} className="text-gray-400 mx-auto mb-3" />
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    No {activeTab === "new" ? "pending" : "resolved"} queries found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubmitQueries;