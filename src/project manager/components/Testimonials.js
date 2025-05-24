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
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Rating,
  Tabs,
  Tab,
  Badge,
  Select,
  MenuItem
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
  FiMessageSquare,
  FiUser,
  FiMail,
  FiExternalLink,
  FiSend,
  FiClock,
  FiCheck,
  FiX
} from "react-icons/fi";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled } from '@mui/material/styles';

const statusColors = {
  published: { bg: "#ecfdf5", text: "#10b981" },
  draft: { bg: "#fef3c7", text: "#d97706" },
  archived: { bg: "#e0e7ff", text: "#4f46e5" },
  pending: { bg: "#fef3c7", text: "#d97706", icon: <FiClock color="#d97706" /> },
  completed: { bg: "#ecfdf5", text: "#10b981", icon: <FiCheck color="#10b981" /> },
  declined: { bg: "#fee2e2", text: "#ef4444", icon: <FiX color="#ef4444" /> }
};

const TestimonialCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  transition: 'all 0.2s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)'
  }
}));

const TestimonialsDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [testimonials, setTestimonials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    clientName: "",
    clientTitle: "",
    company: "",
    rating: 5,
    content: "",
    status: "published",
    featured: false,
    projectId: ""
  });
  const [requestForm, setRequestForm] = useState({
    clientId: "",
    clientName: "",
    projectId: "",
    message: "",
    status: "pending"
  });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        setLoadingRequests(true);

        // Fetch testimonials
        const testimonialsQuery = query(
          collection(db, "testimonials"),
          where("projectManagerId", "==", user.uid)
        );
        const testimonialsSnapshot = await getDocs(testimonialsQuery);
        const testimonialsData = testimonialsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTestimonials(testimonialsData);

        // Fetch testimonial requests
        const requestsQuery = query(
          collection(db, "testimonial-requests"),
          where("projectManagerId", "==", user.uid),
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRequests(requestsData);

        // Fetch projects
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

        // Fetch clients
        const clientsQuery = query(
          collection(db, "users"),
          where("role", "==", "Client")
        );
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsData = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(clientsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        setLoadingRequests(false);
      }
    };

    fetchData();
  }, []);

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = testimonial.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (testimonial.company || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || testimonial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        request.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (projects.find(p => p.id === request.projectId)?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (testimonial = null) => {
    if (testimonial) {
      setCurrentTestimonial(testimonial);
      setFormData({
        clientName: testimonial.clientName,
        clientTitle: testimonial.clientTitle || "",
        company: testimonial.company || "",
        rating: testimonial.rating || 5,
        content: testimonial.content,
        status: testimonial.status || "published",
        featured: testimonial.featured || false,
        projectId: testimonial.projectId || ""
      });
    } else {
      setCurrentTestimonial(null);
      setFormData({
        clientName: "",
        clientTitle: "",
        company: "",
        rating: 5,
        content: "",
        status: "published",
        featured: false,
        projectId: ""
      });
    }
    setOpenDialog(true);
  };

  const handleOpenRequestDialog = (project = null, client = null) => {
    if (project && client) {
      setRequestForm({
        clientId: client.id,
        clientName: client.displayName || client.email,
        projectId: project.id,
        message: `I would greatly appreciate your feedback on our recent project "${project.title}". Please share your experience working with us.`,
        status: "pending"
      });
    } else {
      setRequestForm({
        clientId: "",
        clientName: "",
        projectId: "",
        message: "",
        status: "pending"
      });
    }
    setOpenRequestDialog(true);
  };

  const handleSubmitTestimonial = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const testimonialData = {
        ...formData,
        projectManagerId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (currentTestimonial) {
        await updateDoc(doc(db, "testimonials", currentTestimonial.id), testimonialData);
      } else {
        await addDoc(collection(db, "testimonials"), testimonialData);
      }

      setOpenDialog(false);
      // Refresh testimonials
      const q = query(
        collection(db, "testimonials"),
        where("projectManagerId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const testimonialsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTestimonials(testimonialsData);
    } catch (error) {
      console.error("Error saving testimonial:", error);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const requestData = {
        ...requestForm,
        projectManagerId: user.uid,
        projectTitle: projects.find(p => p.id === requestForm.projectId)?.title || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, "testimonial-requests"), requestData);

      // TODO: Send notification/email to client

      setOpenRequestDialog(false);
      // Refresh requests
      const q = query(
        collection(db, "testimonial-requests"),
        where("projectManagerId", "==", user.uid),
      );
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
    } catch (error) {
      console.error("Error saving testimonial request:", error);
    }
  };

  const handleDelete = async (id, type = 'testimonial') => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await deleteDoc(doc(db, type === 'testimonial' ? "testimonials" : "testimonial-requests", id));
        if (type === 'testimonial') {
          setTestimonials(testimonials.filter(t => t.id !== id));
        } else {
          setRequests(requests.filter(r => r.id !== id));
        }
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
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
            Client Testimonials
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {activeTab === 0 ? "Manage and showcase client feedback" : "Track and request client testimonials"}
          </Typography>
        </Box>
        {activeTab === 0 ? (
          <Button
            variant="contained"
            startIcon={<FiPlus size={18} />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca',
              }
            }}
          >
            Add Testimonial
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<FiSend size={18} />}
            onClick={() => handleOpenRequestDialog()}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca',
              }
            }}
          >
            Request Testimonial
          </Button>
        )}
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
            label="Testimonials" 
            icon={<FiMessageSquare size={18} />}
            sx={{
              fontWeight: 'medium',
              color: activeTab === 0 ? '#4f46e5' : '#64748b'
            }}
          />
          <Tab 
            label={
              <Badge 
                badgeContent={requests.filter(r => r.status === 'pending').length} 
                color="primary"
                invisible={requests.filter(r => r.status === 'pending').length === 0}
              >
                Requests
              </Badge>
            } 
            icon={<FiMail size={18} />}
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
              placeholder={activeTab === 0 ? "Search testimonials..." : "Search requests..."}
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
              {activeTab === 0 ? (
                <>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="declined">Declined</MenuItem>
                </>
              )}
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
      {activeTab === 0 ? (
        loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredTestimonials.length > 0 ? (
          <Grid container spacing={3}>
            {filteredTestimonials.map((testimonial) => (
              <Grid item xs={12} md={6} lg={4} key={testimonial.id}>
                <TestimonialCard>
                  <Box className="flex-grow">
                    <Box className="flex items-center justify-between mb-4">
                      <Box className="flex items-center gap-3">
                        <Avatar sx={{ 
                          width: 48, 
                          height: 48,
                          bgcolor: '#e0e7ff',
                          color: '#4f46e5'
                        }}>
                          <FiUser size={24} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {testimonial.clientName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {testimonial.clientTitle}{testimonial.company ? `, ${testimonial.company}` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={testimonial.status}
                        size="small"
                        sx={{
                          backgroundColor: statusColors[testimonial.status]?.bg,
                          color: statusColors[testimonial.status]?.text,
                          fontWeight: 'medium',
                          textTransform: 'capitalize'
                        }}
                      />
                    </Box>
                    
                    <Rating
                      value={testimonial.rating || 5}
                      readOnly
                      precision={0.5}
                      icon={<FiStar style={{ fill: '#f59e0b' }} size={20} />}
                      emptyIcon={<FiStar size={20} />}
                      sx={{ color: '#f59e0b', mb: 2 }}
                    />
                    
                    <Typography variant="body1" sx={{ 
                      color: '#334155', 
                      mb: 2,
                      fontStyle: 'italic',
                      position: 'relative',
                      '&:before, &:after': {
                        content: '"\\201C"',
                        fontSize: '2rem',
                        color: '#cbd5e1',
                        position: 'absolute',
                      },
                      '&:before': {
                        top: -10,
                        left: -15,
                      },
                      '&:after': {
                        content: '"\\201D"',
                        bottom: -25,
                        right: -15,
                      }
                    }}>
                      {testimonial.content}
                    </Typography>
                    
                    {testimonial.projectId && (
                      <Box className="flex items-center gap-1 mb-3">
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Project:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                          {projects.find(p => p.id === testimonial.projectId)?.title || 'Unknown Project'}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      {formatDate(testimonial.createdAt)}
                    </Typography>
                    <Box className="flex gap-2">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(testimonial)}
                          sx={{
                            color: '#64748b',
                            '&:hover': {
                              backgroundColor: '#e2e8f0'
                            }
                          }}
                        >
                          <FiEdit2 size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(testimonial.id)}
                          sx={{
                            color: '#ef4444',
                            '&:hover': {
                              backgroundColor: '#fee2e2'
                            }
                          }}
                        >
                          <FiTrash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </TestimonialCard>
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
            <FiMessageSquare size={48} color="#94a3b8" className="mx-auto mb-4" />
            <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
              No testimonials found
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filter criteria" 
                : "You haven't collected any testimonials yet"}
            </Typography>
            <Button
              variant="contained"
              startIcon={<FiPlus size={18} />}
              onClick={() => handleOpenDialog()}
              sx={{
                mt: 3,
                backgroundColor: '#4f46e5',
                '&:hover': {
                  backgroundColor: '#4338ca',
                }
              }}
            >
              Add Your First Testimonial
            </Button>
          </Paper>
        )
      ) : (
        loadingRequests ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredRequests.length > 0 ? (
          <Grid container spacing={3}>
            {filteredRequests.map((request) => (
              <Grid item xs={12} key={request.id}>
                <TestimonialCard>
                  <Box className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <Box className="flex items-start gap-4">
                      <Avatar sx={{ 
                        width: 48, 
                        height: 48,
                        bgcolor: statusColors[request.status]?.bg,
                        color: statusColors[request.status]?.text,
                        mt: 1
                      }}>
                        {statusColors[request.status]?.icon || <FiMail size={20} />}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          Request to {request.clientName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 1.5 }}>
                          {request.message.substring(0, 120)}{request.message.length > 120 ? "..." : ""}
                        </Typography>
                        <Box className="flex flex-wrap gap-2">
                          <Chip
                            label={request.status}
                            size="small"
                            icon={statusColors[request.status]?.icon}
                            sx={{
                              backgroundColor: statusColors[request.status]?.bg,
                              color: statusColors[request.status]?.text,
                              fontWeight: 'medium',
                              textTransform: 'capitalize'
                            }}
                          />
                          <Chip
                            label={request.projectTitle || "No Project"}
                            size="small"
                            sx={{
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              fontWeight: 'medium'
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                            {formatDate(request.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<FiSend size={16} />}
                            onClick={() => {
                              // TODO: Implement resend functionality
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
                              // TODO: Implement cancel functionality
                            }}
                            sx={{
                              backgroundColor: '#fee2e2',
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: '#fecaca',
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {request.status === 'completed' && (
                        <Button
                          variant="contained"
                          startIcon={<FiCheck size={16} />}
                          sx={{
                            backgroundColor: '#ecfdf5',
                            color: '#10b981',
                            '&:hover': {
                              backgroundColor: '#d1fae5',
                            }
                          }}
                        >
                          Testimonial Received
                        </Button>
                      )}
                    </Box>
                  </Box>
                </TestimonialCard>
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
            <FiMail size={48} color="#94a3b8" className="mx-auto mb-4" />
            <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
              No testimonial requests
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your search or filter criteria" 
                : "You haven't sent any testimonial requests yet"}
            </Typography>
            <Button
              variant="contained"
              startIcon={<FiSend size={18} />}
              onClick={() => handleOpenRequestDialog()}
              sx={{
                mt: 3,
                backgroundColor: '#4f46e5',
                '&:hover': {
                  backgroundColor: '#4338ca',
                }
              }}
            >
              Request Your First Testimonial
            </Button>
          </Paper>
        )
      )}

      {/* Testimonial Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
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
          <FiMessageSquare color="#4f46e5" size={24} />
          {currentTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Box component="form" onSubmit={handleSubmitTestimonial} className="space-y-4">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Name"
                  variant="outlined"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Title"
                  variant="outlined"
                  value={formData.clientTitle}
                  onChange={(e) => setFormData({...formData, clientTitle: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  variant="outlined"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Select
                  fullWidth
                  label="Project"
                  variant="outlined"
                  value={formData.projectId}
                  onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                >
                  <MenuItem value="">No Project</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#64748b' }}>
                    Rating
                  </Typography>
                  <Rating
                    value={formData.rating}
                    onChange={(e, newValue) => setFormData({...formData, rating: newValue})}
                    precision={0.5}
                    icon={<FiStar style={{ fill: '#f59e0b' }} size={24} />}
                    emptyIcon={<FiStar size={24} />}
                    sx={{ color: '#f59e0b' }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Testimonial Content"
                  variant="outlined"
                  multiline
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Select
                  fullWidth
                  label="Status"
                  variant="outlined"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box className="flex items-center">
                  <Typography variant="body2" sx={{ mr: 2, color: '#64748b' }}>
                    Featured Testimonial
                  </Typography>
                  <Chip
                    label={formData.featured ? "Yes" : "No"}
                    color={formData.featured ? "primary" : "default"}
                    onClick={() => setFormData({...formData, featured: !formData.featured})}
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
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
            variant="contained"
            onClick={handleSubmitTestimonial}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca'
              }
            }}
          >
            {currentTestimonial ? 'Update Testimonial' : 'Save Testimonial'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Testimonial Dialog */}
      <Dialog
        open={openRequestDialog}
        onClose={() => setOpenRequestDialog(false)}
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
          <FiSend color="#4f46e5" size={24} />
          Request Testimonial
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Box component="form" onSubmit={handleSubmitRequest} className="space-y-4">
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Select
                  fullWidth
                  label="Select Client"
                  variant="outlined"
                  value={requestForm.clientId}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value);
                    setRequestForm({
                      ...requestForm,
                      clientId: e.target.value,
                      clientName: client?.displayName || client?.email || ""
                    });
                  }}
                  required
                >
                  <MenuItem value="">Select a client</MenuItem>
                  {clients.map(client => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.displayName || client.email}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} md={6}>
                <Select
                  fullWidth
                  label="Select Project"
                  variant="outlined"
                  value={requestForm.projectId}
                  onChange={(e) => setRequestForm({...requestForm, projectId: e.target.value})}
                  required
                >
                  <MenuItem value="">Select a project</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Request Message"
                  variant="outlined"
                  multiline
                  rows={4}
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={() => setOpenRequestDialog(false)}
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
            onClick={handleSubmitRequest}
            disabled={!requestForm.clientId || !requestForm.projectId || !requestForm.message}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca'
              }
            }}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestimonialsDashboard;