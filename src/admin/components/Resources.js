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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme
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
  FiCheck,
  FiGlobe,
  FiClock
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, getDoc, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db, auth, storage } from "../../services/firebase";
import { styled } from "@mui/material/styles";
import { formatDistanceToNow } from 'date-fns';

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

// Styled components
const ResourceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
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

const Resources = () => {
  const theme = useTheme();
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
    description: '' 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
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
      }

      await addDoc(collection(db, "project-resources"), resourceData);
      setOpenAddDialog(false);
      setNewResource({ type: 'link', url: '', title: '', description: '' });
      setSnackbar({ open: true, message: 'Resource added successfully', severity: 'success' });
    } catch (error) {
      console.error("Error adding resource:", error);
      setSnackbar({ open: true, message: 'Failed to add resource', severity: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      await deleteDoc(doc(db, "project-resources", resourceId));
      setResources(resources.filter(r => r.id !== resourceId));
      setDeleteConfirm(null);
      setSnackbar({ open: true, message: 'Resource deleted successfully', severity: 'success' });
    } catch (error) {
      console.error("Error deleting resource:", error);
      setSnackbar({ open: true, message: 'Failed to delete resource', severity: 'error' });
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
            gap: 1.5,
            color: theme.palette.text.primary
          }}>
            <FiFolder size={26} /> Project Resources
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            mt: 0.5
          }}>
            Central hub for all project assets and references
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <TextField
              select
              size="small"
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
              sx={{ 
                minWidth: 250,
                backgroundColor: theme.palette.background.paper,
                borderRadius: '8px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
              InputProps={{
                startAdornment: (
                  <FiChevronDown style={{ 
                    marginRight: 8, 
                    color: theme.palette.text.secondary 
                  }} />
                ),
              }}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title || "Untitled Project"}
                </MenuItem>
              ))}
            </TextField>
          )}
          
          <Button
            variant="contained"
            startIcon={<FiPlus size={18} />}
            onClick={() => setOpenAddDialog(true)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600',
              px: 3,
              py: 1
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
        <TextField
          size="small"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <FiSearch style={{ 
                marginRight: 8, 
                color: theme.palette.text.secondary 
              }} />
            ),
            sx: {
              borderRadius: '8px',
              backgroundColor: theme.palette.background.paper,
              width: 300
            }
          }}
        />

        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
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
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.action.hover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiFolder size={36} color={theme.palette.text.secondary} />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
            color: theme.palette.text.primary
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
          borderRadius: '12px',
          backgroundColor: theme.palette.background.paper
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.action.hover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiFile size={36} color={theme.palette.text.secondary} />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
            color: theme.palette.text.primary
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
              <ResourceCard>
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
                        width: 48,
                        height: 48
                      }}>
                        {getFileIcon(resource.fileType)}
                      </Avatar>
                    ) : (
                      <Avatar sx={{ 
                        bgcolor: 'success.light', 
                        color: 'success.dark',
                        width: 48,
                        height: 48
                      }}>
                        <FiLink size={20} />
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: '600', color: theme.palette.text.primary }}>
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
                      <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
                        <FiDownload size={16} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        sx={{ color: theme.palette.error.main }}
                        onClick={() => setDeleteConfirm(resource.id)}
                      >
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

                <Divider sx={{ my: 2 }} />

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
                      <FiGlobe size={14} color={theme.palette.text.secondary} />
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
                  mt: 3,
                  pt: 1
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiClock size={14} color={theme.palette.text.secondary} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Added {formatDistanceToNow(resource.createdAt, { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<FiExternalLink size={14} />}
                    sx={{ 
                      borderRadius: '6px',
                      textTransform: 'none',
                      px: 2,
                      py: 0.5
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
              </ResourceCard>
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
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2,
          color: theme.palette.text.primary
        }}>
          <Typography variant="h6" sx={{ fontWeight: '600' }}>
            Add New Resource
          </Typography>
          <IconButton 
            onClick={() => !isUploading && setOpenAddDialog(false)}
            disabled={isUploading}
            sx={{ color: theme.palette.text.secondary }}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: '600', color: theme.palette.text.primary }}>
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
                  fontWeight: '600',
                  py: 1.5
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
                  fontWeight: '600',
                  py: 1.5
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
            <Box sx={{ 
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: '8px',
              p: 3,
              textAlign: 'center',
              mb: 2
            }}>
              <FiUpload size={32} style={{ marginBottom: 16, color: theme.palette.text.secondary }} />
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Drag and drop files here or click to browse
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FiUpload size={16} />}
                component="label"
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: '600'
                }}
              >
                Select File
                <input type="file" hidden />
              </Button>
            </Box>
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
              fontWeight: '600',
              px: 3
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
              fontWeight: '600',
              px: 3
            }}
          >
            {isUploading ? 'Saving...' : 'Save Resource'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            backgroundColor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: theme.palette.text.primary }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Are you sure you want to delete this resource? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteConfirm(null)}
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
            color="error"
            onClick={() => handleDeleteResource(deleteConfirm)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
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
          sx={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: theme.shadows[3]
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Resources;