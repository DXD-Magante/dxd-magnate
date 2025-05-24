import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Divider,
  Chip,
  Avatar,
  Stack,
  TextField,
  MenuItem,
  Grid,
  Paper,
  LinearProgress,
  Badge,
  IconButton,
  Tooltip,
  CardContent,
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import {
  FiFolder,
  FiLink,
  FiUpload,
  FiDownload,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiChevronDown,
  FiExternalLink,
  FiFile,
  FiImage,
  FiVideo,
  FiCode,
  FiMusic,
  FiArchive,
  FiFileText,
  FiX,
  FiCheck
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled } from "@mui/material/styles";
import { loadGapiInsideDOM } from "gapi-script";

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dsbt1j73t',
  uploadPreset: 'dxd-magnate',
  apiKey: '753871594898224'
};

// Google Drive API configuration (for non-media files)
const GOOGLE_API_KEY = "AIzaSyB8gbDwWVrFwt7jIRV-XFybwdyFGUB_8vE";
const GOOGLE_CLIENT_ID = "778430544439-37a6j5s493pmg21r4u3ndrh83hhidk7q.apps.googleusercontent.com";
const GOOGLE_FOLDER_ID = "1BG6ZvJosRWgyGTk7wUVZlgKtXUxs51CS";

// File type icons mapping
const FILE_ICONS = {
  'image': <FiImage size={18} />,
  'video': <FiVideo size={18} />,
  'audio': <FiMusic size={18} />,
  'application': <FiArchive size={18} />,
  'text': <FiFileText size={18} />,
  'pdf': <FiFileText size={18} />,
  'default': <FiFile size={18} />
};

// Media file types that should use Cloudinary
const MEDIA_TYPES = ['image', 'video', 'audio'];

// Styled components
const StyledResourceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const ResourceTypeChip = styled(Chip)(({ theme, type }) => ({
  fontWeight: '600',
  backgroundColor: 
    type === 'file' ? theme.palette.primary.light + '20' :
    type === 'link' ? theme.palette.success.light + '20' :
    theme.palette.grey[300],
  color: 
    type === 'file' ? theme.palette.primary.dark :
    type === 'link' ? theme.palette.success.dark :
    theme.palette.grey[700],
  border: `1px solid ${
    type === 'file' ? theme.palette.primary.main :
    type === 'link' ? theme.palette.success.main :
    theme.palette.grey[400]
  }`
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px',
    },
  },
}));

const Resources = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState('all');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newResource, setNewResource] = useState({ 
    type: 'link', 
    url: '', 
    title: '', 
    description: '',
    file: null,
    previewUrl: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Initialize Google API
  useEffect(() => {
    const loadGoogleAPI = async () => {
      try {
        await loadGapiInsideDOM();
        window.gapi.load('client:auth2:picker', async () => {
          await window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
          });
          setGapiLoaded(true);
        });
      } catch (error) {
        console.error('Error loading Google API:', error);
        setSnackbar({ open: true, message: 'Failed to load Google Drive integration', severity: 'error' });
      }
    };

    loadGoogleAPI();
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("clientId", "==", user.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
        setSnackbar({ open: true, message: 'Failed to load projects', severity: 'error' });
      }
    };

    fetchProjects();
  }, []);

  // Fetch resources for selected project
  useEffect(() => {
    const fetchResources = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const resourcesQuery = query(
          collection(db, "project-resources"),
          where("projectId", "==", selectedProject)
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        // Sort resources by date (newest first)
        resourcesData.sort((a, b) => b.createdAt - a.createdAt);
        setResources(resourcesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setLoading(false);
        setSnackbar({ open: true, message: 'Failed to load resources', severity: 'error' });
      }
    };

    fetchResources();
  }, [selectedProject]);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      tabValue === 'all' ||
      (tabValue === 'files' && resource.type === 'file') ||
      (tabValue === 'links' && resource.type === 'link');
    
    return matchesSearch && matchesTab;
  });

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    
    // For media files, use Cloudinary
    if (MEDIA_TYPES.includes(fileType)) {
      setNewResource(prev => ({
        ...prev,
        file,
        previewUrl: fileType === 'image' ? URL.createObjectURL(file) : null,
        type: 'file'
      }));
    } else {
      // For non-media files, use Google Drive
      handleGoogleDriveUpload();
    }
  };

  const handleAddResource = async () => {
    if (!newResource.title || (newResource.type === 'link' && !newResource.url)) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const resourceData = {
        projectId: selectedProject,
        type: newResource.type,
        title: newResource.title,
        description: newResource.description || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (newResource.type === 'link') {
        resourceData.url = newResource.url;
      } else if (newResource.type === 'file') {
        if (newResource.file) {
          // Upload media file to Cloudinary
          const uploadedFile = await uploadToCloudinary(newResource.file);
          
          resourceData.fileUrl = uploadedFile.url;
          resourceData.fileName = newResource.file.name;
          resourceData.fileType = newResource.file.type;
          resourceData.fileSize = uploadedFile.bytes;
          resourceData.storageType = 'cloudinary';
          resourceData.publicId = uploadedFile.publicId;
        } else if (newResource.fileId) {
          // This is for Google Drive files
          resourceData.fileId = newResource.fileId;
          resourceData.fileName = newResource.fileName;
          resourceData.fileType = newResource.fileType;
          resourceData.fileSize = newResource.fileSize;
          resourceData.fileUrl = newResource.fileUrl;
          resourceData.storageType = 'google-drive';
        }
      }

      await addDoc(collection(db, "project-resources"), resourceData);
      
      setOpenAddDialog(false);
      setNewResource({ 
        type: 'link', 
        url: '', 
        title: '', 
        description: '',
        file: null,
        previewUrl: null
      });
      setSnackbar({ open: true, message: 'Resource added successfully', severity: 'success' });
    } catch (error) {
      console.error("Error adding resource:", error);
      setSnackbar({ open: true, message: 'Failed to add resource', severity: 'error' });
    } finally {
      setIsUploading(false);
      if (newResource.previewUrl) {
        URL.revokeObjectURL(newResource.previewUrl);
      }
    }
  };

  const handleGoogleDriveUpload = () => {
    if (!gapiLoaded) {
      setSnackbar({ open: true, message: 'Google Drive integration not ready', severity: 'error' });
      return;
    }

    const token = window.gapi.auth.getToken().access_token;
    const uploadView = new window.google.picker.DocsUploadView()
      .setParent(GOOGLE_FOLDER_ID)
      .setIncludeFolders(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(uploadView)
      .setOAuthToken(token)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setCallback(pickerCallback)
      .build();
    
    picker.setVisible(true);
  };

  const pickerCallback = async (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Get file metadata
        const response = await window.gapi.client.drive.files.get({
          fileId: file.id,
          fields: 'name,mimeType,size,webContentLink'
        });

        const fileData = response.result;
        setNewResource(prev => ({
          ...prev,
          fileId: file.id,
          fileName: fileData.name,
          fileType: fileData.mimeType,
          fileSize: fileData.size,
          fileUrl: fileData.webContentLink,
          title: fileData.name
        }));
      } catch (error) {
        console.error("Error getting file metadata:", error);
        setSnackbar({ open: true, message: 'Failed to get file details', severity: 'error' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderFileUploadSection = () => {
    if (newResource.type !== 'file') return null;

    if (newResource.file) {
      // File selected for Cloudinary upload
      const fileType = newResource.file.type.split('/')[0];
      
      return (
        <Box sx={{ 
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: '8px',
          p: 3,
          textAlign: 'center',
          mb: 2
        }}>
          {fileType === 'image' && newResource.previewUrl ? (
            <Box sx={{ mb: 2 }}>
              <img 
                src={newResource.previewUrl} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 200,
                  borderRadius: 8 
                }} 
              />
            </Box>
          ) : (
            <FiFile size={32} style={{ marginBottom: 16, color: 'text.secondary' }} />
          )}
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            {newResource.file.name}
          </Typography>
          
          <Button
            variant="outlined"
            onClick={() => {
              setNewResource(prev => ({ ...prev, file: null, previewUrl: null }));
            }}
          >
            Change File
          </Button>
        </Box>
      );
    } else if (newResource.fileId) {
      // Google Drive file selected
      return (
        <Box sx={{ 
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: '8px',
          p: 3,
          textAlign: 'center',
          mb: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'action.hover',
            p: 1.5,
            borderRadius: '6px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {getFileIcon(newResource.fileType)}
              <Typography variant="body2">
                {newResource.fileName}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => setNewResource(prev => ({ ...prev, fileId: null, fileName: '', fileType: '' }))}
            >
              <FiX size={16} />
            </IconButton>
          </Box>
        </Box>
      );
    } else {
      // No file selected - show upload options
      return (
        <Box sx={{ 
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: '8px',
          p: 3,
          textAlign: 'center',
          mb: 2
        }}>
          <FiUpload size={32} style={{ marginBottom: 16, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Upload files (images/videos to Cloudinary, other files to Google Drive)
          </Typography>
          
          <input
            accept="image/*,video/*,audio/*"
            style={{ display: 'none' }}
            id="cloudinary-upload"
            type="file"
            onChange={handleFileChange}
          />
          
          <label htmlFor="cloudinary-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<FiUpload size={16} />}
              sx={{ mr: 2 }}
            >
              Upload Media
            </Button>
          </label>
          
          <Button
            variant="outlined"
            startIcon={<FiUpload size={16} />}
            onClick={handleGoogleDriveUpload}
            disabled={!gapiLoaded || isUploading}
          >
            Select from Drive
          </Button>
        </Box>
      );
    }
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return FILE_ICONS.default;
    
    const [type] = mimeType.split('/');
    if (FILE_ICONS[type]) return FILE_ICONS[type];
    if (mimeType === 'application/pdf') return FILE_ICONS.pdf;
    
    return FILE_ICONS.default;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  };

  const formatDate = (date) => {
    if (!date) return "No date specified";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h5" sx={{ 
            fontWeight: '700', 
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <FiFolder size={26} /> Project Resources
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            mt: 0.5
          }}>
            Manage and access all resources for your projects
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <StyledTextField
              select
              size="small"
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <FiChevronDown style={{ 
                    marginRight: 8, 
                    color: 'text.secondary' 
                  }} />
                ),
              }}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title || "Untitled Project"}
                </MenuItem>
              ))}
            </StyledTextField>
          )}
          
          <Button
            variant="contained"
            startIcon={<FiPlus size={18} />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            Add Resource
          </Button>
        </Box>
      </Box>

      {/* Search and Filter Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <StyledTextField
          size="small"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <FiSearch style={{ 
                marginRight: 8, 
                color: 'text.secondary' 
              }} />
            ),
          }}
          sx={{ width: 300 }}
        />

        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3
            }
          }}
        >
          <Tab 
            value="all" 
            label={
              <Badge badgeContent={resources.length} color="primary" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                All Resources
              </Badge>
            }
            icon={<FiFolder size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="files" 
            label="Files"
            icon={<FiFile size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="links" 
            label="Links"
            icon={<FiLink size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Main Content */}
      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : projects.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          p: 6,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px'
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiFolder size={36} color="text.secondary" />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
          }}>
            No projects found
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            You don't have any projects yet. Create your first project to manage resources.
          </Typography>
        </Card>
      ) : filteredResources.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          p: 6,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px'
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiFile size={36} color="text.secondary" />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
          }}>
            No resources found
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            {searchTerm ? 'No resources match your search criteria' : 'This project has no resources yet'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FiPlus size={16} />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            Add First Resource
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredResources.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <StyledResourceCard>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                  mb: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {resource.type === 'file' ? (
                      <Avatar sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.dark',
                        width: 40,
                        height: 40
                      }}>
                        {getFileIcon(resource.fileType)}
                      </Avatar>
                    ) : (
                      <Avatar sx={{ 
                        bgcolor: 'success.light', 
                        color: 'success.dark',
                        width: 40,
                        height: 40
                      }}>
                        <FiLink size={18} />
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                        {resource.title}
                      </Typography>
                      <ResourceTypeChip 
                        label={resource.type} 
                        size="small" 
                        type={resource.type}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download">
                      <IconButton size="small">
                        <FiDownload size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small">
                        <FiTrash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ 
                  color: 'text.secondary',
                  mb: 2,
                  flexGrow: 1
                }}>
                  {resource.description || 'No description provided'}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ mt: 1 }}>
                  {resource.type === 'file' ? (
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          File:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: '500' }}>
                          {resource.fileName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          Size:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: '500' }}>
                          {formatFileSize(resource.fileSize)}
                        </Typography>
                      </Box>
                      {resource.storageType === 'cloudinary' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Storage:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: '500' }}>
                            Cloudinary
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        URL:
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: '500' }}>
                        {resource.url?.length > 30 ? `${resource.url.substring(0, 30)}...` : resource.url}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 2,
                  pt: 1
                }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Added {formatDate(resource.createdAt)}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<FiExternalLink size={14} />}
                    sx={{ 
                      borderRadius: '6px',
                      textTransform: 'none'
                    }}
                    onClick={() => {
                      if (resource.type === 'file') {
                        window.open(resource.fileUrl, '_blank');
                      } else {
                        window.open(resource.url, '_blank');
                      }
                    }}
                  >
                    Open
                  </Button>
                </Box>
              </StyledResourceCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Resource Dialog */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => !isUploading && setOpenAddDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: '600' }}>
            Add New Resource
          </Typography>
          <IconButton 
            onClick={() => !isUploading && setOpenAddDialog(false)}
            disabled={isUploading}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: '600' }}>
              Resource Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={newResource.type === 'link' ? 'contained' : 'outlined'}
                startIcon={<FiLink size={16} />}
                onClick={() => setNewResource(prev => ({ ...prev, type: 'link' }))}
                sx={{
                  flex: 1,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: '600'
                }}
              >
                Link
              </Button>
              <Button
                variant={newResource.type === 'file' ? 'contained' : 'outlined'}
                startIcon={<FiUpload size={16} />}
                onClick={() => setNewResource(prev => ({ ...prev, type: 'file' }))}
                sx={{
                  flex: 1,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: '600'
                }}
              >
                File
              </Button>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Title"
            value={newResource.title}
            onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            value={newResource.description}
            onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />

          {newResource.type === 'link' ? (
            <TextField
              fullWidth
              label="URL"
              value={newResource.url}
              onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              sx={{ mb: 2 }}
            />
          ) : (
            renderFileUploadSection()
          )}

          {isUploading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2">
                {newResource.type === 'file' ? 'Uploading file...' : 'Saving resource...'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button
            variant="outlined"
            onClick={() => setOpenAddDialog(false)}
            disabled={isUploading}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddResource}
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <FiCheck size={16} />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            {isUploading ? 'Saving...' : 'Save Resource'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Resources;