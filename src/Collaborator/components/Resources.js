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
  CircularProgress
} from "@mui/material";
import {
  FiFolder,
  FiLink,
  FiDownload,
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
  FiGrid,
  FiList,
  FiCalendar,
  FiClock,
  FiStar
} from "react-icons/fi";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled } from "@mui/material/styles";

// File type icons mapping
const FILE_ICONS = {
  'image': <FiImage size={18} className="text-blue-500" />,
  'video': <FiVideo size={18} className="text-purple-500" />,
  'audio': <FiMusic size={18} className="text-pink-500" />,
  'application': <FiArchive size={18} className="text-amber-500" />,
  'text': <FiFileText size={18} className="text-green-500" />,
  'pdf': <FiFileText size={18} className="text-red-500" />,
  'default': <FiFile size={18} className="text-gray-500" />
};

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
    borderColor: theme.palette.primary.main,
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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortOption, setSortOption] = useState('recent'); // 'recent', 'oldest', 'name'

  // Fetch projects where current user is a team member
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
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
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
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

  // Sort resources based on selected option
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortOption === 'recent') {
      return b.createdAt - a.createdAt;
    } else if (sortOption === 'oldest') {
      return a.createdAt - b.createdAt;
    } else if (sortOption === 'name') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

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

  const formatDateTime = (date) => {
    if (!date) return "";
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  const handleDownload = (resource) => {
    if (resource.type === 'file') {
      window.open(resource.fileUrl, '_blank');
    } else {
      window.open(resource.url, '_blank');
    }
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
            <FiFolder size={26} className="text-indigo-600" /> Project Resources
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            mt: 0.5
          }}>
            View and access all resources for your projects
          </Typography>
        </Box>
        
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
      </Box>

      {/* Controls Section */}
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StyledTextField
            select
            size="small"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="recent">Most Recent</MenuItem>
            <MenuItem value="oldest">Oldest</MenuItem>
            <MenuItem value="name">Name (A-Z)</MenuItem>
          </StyledTextField>

          <Box sx={{ 
            display: 'flex', 
            border: '1px solid', 
            borderColor: 'divider', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('grid')}
              sx={{ 
                borderRadius: 0,
                backgroundColor: viewMode === 'grid' ? 'action.selected' : 'transparent'
              }}
            >
              <FiGrid size={16} />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => setViewMode('list')}
              sx={{ 
                borderRadius: 0,
                backgroundColor: viewMode === 'list' ? 'action.selected' : 'transparent'
              }}
            >
              <FiList size={16} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Tabs Section */}
      <Tabs
        value={tabValue}
        onChange={(e, newValue) => setTabValue(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
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
          label={
            <Badge 
              badgeContent={resources.filter(r => r.type === 'file').length} 
              color="primary" 
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              Files
            </Badge>
          }
          icon={<FiFile size={16} />}
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
        <Tab 
          value="links" 
          label={
            <Badge 
              badgeContent={resources.filter(r => r.type === 'link').length} 
              color="primary" 
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              Links
            </Badge>
          }
          icon={<FiLink size={16} />}
          iconPosition="start"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

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
            You're not assigned to any projects yet. Once assigned, you'll see resources here.
          </Typography>
        </Card>
      ) : sortedResources.length === 0 ? (
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
        </Card>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {sortedResources.map((resource) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={resource.id}>
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
                      {resource.storageType && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Storage:
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: '500' }}>
                            {resource.storageType.charAt(0).toUpperCase() + resource.storageType.slice(1)}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FiCalendar size={14} className="text-gray-500" />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatDate(resource.createdAt)}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<FiExternalLink size={14} />}
                    sx={{ 
                      borderRadius: '6px',
                      textTransform: 'none'
                    }}
                    onClick={() => handleDownload(resource)}
                  >
                    {resource.type === 'file' ? 'Download' : 'Open'}
                  </Button>
                </Box>
              </StyledResourceCard>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card sx={{ 
          borderRadius: '12px',
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <List>
            {sortedResources.map((resource) => (
              <ListItem 
                key={resource.id}
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': {
                    borderBottom: 'none'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: resource.type === 'file' ? 'primary.light' : 'success.light',
                    color: resource.type === 'file' ? 'primary.dark' : 'success.dark',
                    width: 40,
                    height: 40
                  }}>
                    {resource.type === 'file' ? 
                      getFileIcon(resource.fileType) : 
                      <FiLink size={18} />
                    }
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                        {resource.title}
                      </Typography>
                      <ResourceTypeChip 
                        label={resource.type} 
                        size="small" 
                        type={resource.type}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        {resource.description || 'No description provided'}
                      </Typography>
                      
                      {resource.type === 'file' ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 2,
                          flexWrap: 'wrap'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiFile size={14} className="text-gray-500" />
                            <Typography variant="caption">
                              {resource.fileName}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiClock size={14} className="text-gray-500" />
                            <Typography variant="caption">
                              {formatFileSize(resource.fileSize)}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FiLink size={14} className="text-gray-500" />
                          <Typography variant="caption">
                            {resource.url}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 1
                }}>
                  <Tooltip title={resource.type === 'file' ? 'Download' : 'Open'}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDownload(resource)}
                      sx={{
                        backgroundColor: 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.selected'
                        }
                      }}
                    >
                      {resource.type === 'file' ? 
                        <FiDownload size={16} /> : 
                        <FiExternalLink size={16} />
                      }
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
        </Card>
      )}
    </Box>
  );
};

export default Resources;