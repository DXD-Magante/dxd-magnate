import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Snackbar,
  Alert,
  TextareaAutosize
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiMessageSquare,
  FiCreditCard,
  FiActivity,
  FiEye,
  FiUsers,
  FiClock,
  FiUpload,
  FiImage,
  FiLink
} from "react-icons/fi";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaHashtag } from "react-icons/fa";
import { styled } from '@mui/material/styles';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const StyledTextarea = styled(TextareaAutosize)(({ theme }) => ({
  width: '100%',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '12px',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  '&:focus': {
    outline: 'none',
    borderColor: '#4f46e5',
    boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
  }
}));

const statusColors = {
  "scheduled": "primary",
  "published": "success",
  "failed": "error",
  "draft": "warning"
};

const platformIcons = {
  "facebook": <FaFacebook color="#1877F2" />,
  "twitter": <FaTwitter color="#1DA1F2" />,
  "linkedin": <FaLinkedin color="#0A66C2" />,
  "instagram": <FaInstagram color="#E4405F" />,
  "youtube": <FaYoutube color="#FF0000" />
};

const SchedulePosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [marketingTeam, setMarketingTeam] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    platforms: [],
    scheduledDate: "",
    scheduledTime: "",
    assignedTo: "",
    status: "scheduled",
    media: "",
    links: "",
    hashtags: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch scheduled posts
        const postsQuery = query(collection(db, "scheduled-posts"));
        const postsSnapshot = await getDocs(postsQuery);
        
        // Fetch marketing team
        const teamQuery = query(collection(db, "users"), where("role", "==", "marketing"));
        const teamSnapshot = await getDocs(teamQuery);
        
        const postsData = [];
        const teamData = [];

        postsSnapshot.forEach(doc => {
          postsData.push({ id: doc.id, ...doc.data() });
        });

        teamSnapshot.forEach(doc => {
          teamData.push({ id: doc.id, ...doc.data() });
        });

        setPosts(postsData);
        setMarketingTeam(teamData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbarMessage("Failed to load data");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      platforms: typeof value === 'string' ? value.split(',') : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Combine date and time
      const date = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date or time");
      }

      const postData = {
        ...formData,
        scheduledDateTime: date,
        createdAt: serverTimestamp(),
        createdBy: "admin", // Replace with actual user ID
      };

      // Add to Firestore
      await addDoc(collection(db, "scheduled-posts"), postData);
      
      setSnackbarMessage("Post scheduled successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setOpenDialog(false);
      setFormData({
        title: "",
        description: "",
        platforms: [],
        scheduledDate: "",
        scheduledTime: "",
        assignedTo: "",
        status: "scheduled",
        media: "",
        links: "",
        hashtags: ""
      });
      
      // Refresh posts
      const postsQuery = query(collection(db, "scheduled-posts"));
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = [];
      postsSnapshot.forEach(doc => {
        postsData.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postsData);
    } catch (error) {
      console.error("Error scheduling post:", error);
      setSnackbarMessage("Failed to schedule post");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || post.status === selectedStatus;
    const matchesPlatform = selectedPlatform === "All" || 
      post.platforms?.includes(selectedPlatform);
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Schedule Posts
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={() => setOpenDialog(true)}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Schedule New Post
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <TextField
          size="small"
          placeholder="Search posts..."
          InputProps={{
            startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
          }}
          sx={{
            width: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Platform</InputLabel>
            <Select
              value={selectedPlatform}
              label="Platform"
              onChange={(e) => setSelectedPlatform(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="All">All Platforms</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
              <MenuItem value="twitter">Twitter</MenuItem>
              <MenuItem value="linkedin">LinkedIn</MenuItem>
              <MenuItem value="instagram">Instagram</MenuItem>
              <MenuItem value="youtube">YouTube</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Posts Table */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: '1px solid #e2e8f0', px: 3 }}
        >
          <Tab label="All Posts" icon={<FiMessageSquare size={16} />} iconPosition="start" />
          <Tab label="Scheduled" icon={<FiClock size={16} />} iconPosition="start" />
          <Tab label="Published" icon={<FiCheckCircle size={16} />} iconPosition="start" />
        </Tabs>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <StyledTableCell>Post Title</StyledTableCell>
                <StyledTableCell>Description</StyledTableCell>
                <StyledTableCell>Platforms</StyledTableCell>
                <StyledTableCell>Scheduled For</StyledTableCell>
                <StyledTableCell>Assigned To</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>Loading posts...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <TableRow key={post.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{post.title || 'Untitled Post'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {post.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {post.platforms?.map(platform => (
                          <Tooltip key={platform} title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {platformIcons[platform]}
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {post.scheduledDateTime ? formatDate(post.scheduledDateTime.toDate()) : 'Not scheduled'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {post.assignedTo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ width: 28, height: 28, mr: 1, fontSize: '0.75rem' }}
                            src={marketingTeam.find(m => m.id === post.assignedTo)?.photoURL}
                          >
                            {marketingTeam.find(m => m.id === post.assignedTo)?.firstName?.charAt(0) || 'M'}
                            {marketingTeam.find(m => m.id === post.assignedTo)?.lastName?.charAt(0) || 'T'}
                          </Avatar>
                          <Typography variant="body2">
                            {marketingTeam.find(m => m.id === post.assignedTo)?.firstName || 'Marketing'}
                            {marketingTeam.find(m => m.id === post.assignedTo)?.lastName || 'Team'}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={post.status} 
                        size="small"
                        color={statusColors[post.status]}
                        sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            sx={{ 
                              color: '#64748b',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <FiEdit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            sx={{ 
                              color: '#ef4444',
                              '&:hover': { backgroundColor: '#fee2e2' }
                            }}
                          >
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <FiMessageSquare style={{ color: '#94a3b8', fontSize: 48 }} />
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 'medium', mt: 2 }}>
                        No posts found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                        Try adjusting your search or filters
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Schedule Post Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          py: 2,
          px: 3
        }}>
          <Box sx={{ 
            width: 8, 
            height: 40, 
            backgroundColor: '#4f46e5', 
            borderRadius: 1, 
            mr: 2 
          }} />
          <Typography variant="h6" fontWeight="bold">
            Schedule New Post
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    label="Post Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    sx={{ mb: 2 }}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel shrink>Description</InputLabel>
                  <StyledTextarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    minRows={4}
                    placeholder="Write your post content here..."
                    required
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Platforms</InputLabel>
                  <Select
                    multiple
                    name="platforms"
                    value={formData.platforms}
                    onChange={handlePlatformChange}
                    required
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={value.charAt(0).toUpperCase() + value.slice(1)}
                            icon={platformIcons[value]}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="facebook">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaFacebook color="#1877F2" />
                        Facebook
                      </Box>
                    </MenuItem>
                    <MenuItem value="twitter">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaTwitter color="#1DA1F2" />
                        Twitter
                      </Box>
                    </MenuItem>
                    <MenuItem value="linkedin">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaLinkedin color="#0A66C2" />
                        LinkedIn
                      </Box>
                    </MenuItem>
                    <MenuItem value="instagram">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaInstagram color="#E4405F" />
                        Instagram
                      </Box>
                    </MenuItem>
                    <MenuItem value="youtube">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FaYoutube color="#FF0000" />
                        YouTube
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Assign to Marketing Team</InputLabel>
                  <Select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    required
                    renderValue={(selected) => {
                      const member = marketingTeam.find(m => m.id === selected);
                      return member ? `${member.firstName} ${member.lastName}` : 'Select a team member';
                    }}
                  >
                    {marketingTeam.map(member => (
                      <MenuItem key={member.id} value={member.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ width: 24, height: 24 }}
                            src={member.photoURL}
                          >
                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                          </Avatar>
                          {member.firstName} {member.lastName}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Schedule Date"
                    type="date"
                    name="scheduledDate"
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: new Date().toISOString().split('T')[0]
                    }}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Schedule Time"
                    type="time"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <TextField
                    label="Media URL (Optional)"
                    name="media"
                    value={formData.media}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <FiImage style={{ marginRight: 8, color: '#64748b' }} />,
                    }}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Links (Optional)"
                    name="links"
                    value={formData.links}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <FiLink style={{ marginRight: 8, color: '#64748b' }} />,
                    }}
                  />
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Hashtags (Optional)"
                    name="hashtags"
                    value={formData.hashtags}
                    onChange={handleInputChange}
                    InputProps={{
                      startAdornment: <FaHashtag style={{ marginRight: 8, color: '#64748b' }} />,
                    }}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ 
              color: '#64748b',
              '&:hover': { backgroundColor: 'transparent' }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            variant="contained"
            onClick={handleSubmit}
            sx={{ 
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            Schedule Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchedulePosts;