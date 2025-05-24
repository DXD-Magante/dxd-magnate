import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Badge,
  IconButton,
  LinearProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
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
  FiCheck,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiGrid,
  FiList
} from 'react-icons/fi';
import { collection, getDocs, query, where, doc, getDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../../services/firebase';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dsbt1j73t',
  uploadPreset: 'dxd-magnate',
  apiKey: '753871594898224'
};

// File type icons mapping
const FILE_ICONS = {
  'image': <FiImage size={16} />,
  'video': <FiVideo size={16} />,
  'audio': <FiMusic size={16} />,
  'application': <FiArchive size={16} />,
  'text': <FiFileText size={16} />,
  'pdf': <FiFileText size={16} />,
  'default': <FiFile size={16} />
};

// Media file types that should use Cloudinary
const MEDIA_TYPES = ['image', 'video', 'audio'];

// Styled components
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const ResourcesTab = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newResource, setNewResource] = useState({ 
    type: 'link', 
    url: '', 
    title: '', 
    description: '',
    file: null,
    previewUrl: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);

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

  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortedResources = [...resources].sort((a, b) => {
    if (orderBy === 'title') {
      return order === 'asc' 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title);
    } else if (orderBy === 'createdAt') {
      return order === 'asc' 
        ? a.createdAt - b.createdAt 
        : b.createdAt - a.createdAt;
    }
    return 0;
  });

  const filteredResources = sortedResources.filter(resource => {
    return (
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.type === 'file' && resource.fileName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const paginatedResources = filteredResources.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
    
    if (MEDIA_TYPES.includes(fileType)) {
      setNewResource(prev => ({
        ...prev,
        file,
        previewUrl: fileType === 'image' ? URL.createObjectURL(file) : null,
        type: 'file'
      }));
    } else {
      setSnackbar({ open: true, message: 'Please upload only image, video, or audio files', severity: 'error' });
    }
  };

  const handleAddResource = async () => {
    if (!newResource.title || (newResource.type === 'link' && !newResource.url)) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setIsUploading(true);

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
      } else if (newResource.type === 'file' && newResource.file) {
        const uploadedFile = await uploadToCloudinary(newResource.file);
        
        resourceData.fileUrl = uploadedFile.url;
        resourceData.fileName = newResource.file.name;
        resourceData.fileType = newResource.file.type;
        resourceData.fileSize = uploadedFile.bytes;
        resourceData.storageType = 'cloudinary';
        resourceData.publicId = uploadedFile.publicId;
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

  const handleDeleteResource = async () => {
    try {
      await deleteDoc(doc(db, "project-resources", resourceToDelete.id));
      setResources(resources.filter(r => r.id !== resourceToDelete.id));
      setSnackbar({ open: true, message: 'Resource deleted successfully', severity: 'success' });
    } catch (error) {
      console.error("Error deleting resource:", error);
      setSnackbar({ open: true, message: 'Failed to delete resource', severity: 'error' });
    } finally {
      setDeleteConfirmOpen(false);
      setResourceToDelete(null);
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
    if (!date) return "N/A";
    return format(new Date(date), 'MMM dd, yyyy');
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderFileUploadSection = () => {
    if (newResource.type !== 'file') return null;

    if (newResource.file) {
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
    } else {
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
            Upload images, videos, or audio files (max 20MB)
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
              Select File
            </Button>
          </label>
        </Box>
      );
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
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
            <FormControl size="small" sx={{ minWidth: 250 }}>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="Select Project"
                startAdornment={
                  <InputAdornment position="start">
                    <FiFolder style={{ marginRight: 8, color: 'text.secondary' }} />
                  </InputAdornment>
                }
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.title || "Untitled Project"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="List view">
              <IconButton
                onClick={() => setViewMode('list')}
                color={viewMode === 'list' ? 'primary' : 'default'}
              >
                <FiList />
              </IconButton>
            </Tooltip>
            <Tooltip title="Grid view">
              <IconButton
                onClick={() => setViewMode('grid')}
                color={viewMode === 'grid' ? 'primary' : 'default'}
              >
                <FiGrid />
              </IconButton>
            </Tooltip>
          </Box>
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
        <TextField
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {filteredResources.length} resources
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FiFilter size={16} />}
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Filters
          </Button>
        </Box>
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
      ) : viewMode === 'list' ? (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'title'}
                      direction={orderBy === 'title' ? order : 'asc'}
                      onClick={() => handleSortRequest('title')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'createdAt'}
                      direction={orderBy === 'createdAt' ? order : 'desc'}
                      onClick={() => handleSortRequest('createdAt')}
                    >
                      Date Added
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedResources.map((resource) => (
                  <StyledTableRow key={resource.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {resource.type === 'file' ? (
                          <Avatar sx={{ 
                            bgcolor: 'primary.light', 
                            color: 'primary.dark',
                            width: 32,
                            height: 32
                          }}>
                            {getFileIcon(resource.fileType)}
                          </Avatar>
                        ) : (
                          <Avatar sx={{ 
                            bgcolor: 'success.light', 
                            color: 'success.dark',
                            width: 32,
                            height: 32
                          }}>
                            <FiLink size={16} />
                          </Avatar>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: '500' }}>
                          {resource.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={resource.type} 
                        size="small" 
                        sx={{ 
                          backgroundColor: resource.type === 'file' ? 'primary.light' : 'success.light',
                          color: resource.type === 'file' ? 'primary.dark' : 'success.dark',
                          fontWeight: '500'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {resource.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(resource.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {resource.type === 'file' && (
                        <Typography variant="body2">
                          {formatFileSize(resource.fileSize)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Download">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              if (resource.type === 'file') {
                                window.open(resource.fileUrl, '_blank');
                              } else {
                                window.open(resource.url, '_blank');
                              }
                            }}
                          >
                            <FiDownload size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setResourceToDelete(resource);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredResources.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 2 }}
          />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {paginatedResources.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                      <Chip 
                        label={resource.type} 
                        size="small" 
                        sx={{ 
                          backgroundColor: resource.type === 'file' ? 'primary.light' : 'success.light',
                          color: resource.type === 'file' ? 'primary.dark' : 'success.dark',
                          fontWeight: '500'
                        }}
                      />
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
                      </Stack>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          URL:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: '500' }}>
                          {resource.url?.length > 20 ? `${resource.url.substring(0, 20)}...` : resource.url}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Added {formatDate(resource.createdAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Download">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          if (resource.type === 'file') {
                            window.open(resource.fileUrl, '_blank');
                          } else {
                            window.open(resource.url, '_blank');
                          }
                        }}
                      >
                        <FiDownload size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small"
                        onClick={() => {
                          setResourceToDelete(resource);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <FiTrash2 size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: '600' }}>
          Delete Resource
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{resourceToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ textTransform: 'none', fontWeight: '500' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteResource}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none', fontWeight: '500' }}
          >
            Delete
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

export default ResourcesTab;