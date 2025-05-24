import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Snackbar,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Badge,
  Tabs,
  Tab,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction
} from "@mui/material";
import {
  FiPlus,
  FiX,
  FiUpload,
  FiLink,
  FiFile,
  FiImage,
  FiVideo,
  FiFileText,
  FiCode,
  FiChevronDown,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiSearch,
  FiBook,
  FiClock,
  FiUsers,
  FiLock,
  FiAward,
  FiLayers,
  FiEye
} from "react-icons/fi";
import { styled } from "@mui/material/styles";
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { supabase } from "../../services/supabase";
import { loadGapiInsideDOM } from "gapi-script";

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

// Departments and levels
const DEPARTMENTS = [
  "Marketing",
  "Sales",
  "Design",
  "Development",
  "Operations",
  "HR",
  "Finance"
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const STATUSES = ["Draft", "Published", "Archived"];
const ROLES = ["Intern", "Collaborator", "Sales", "PM", "Marketing"];

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
  }
}));

const StyledTag = styled(Chip)(({ theme }) => ({
  marginRight: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.dark,
  fontWeight: 500
}));

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModule, setExpandedModule] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
const [editingCourse, setEditingCourse] = useState(null);
const [isDeleting, setIsDeleting] = useState(false);
const [editingMaterialIndex, setEditingMaterialIndex] = useState(null);
const [currentModuleIndex, setCurrentModuleIndex] = useState(null);

  // New course form state
  const [newCourse, setNewCourse] = useState({
    title: '',
    department: '',
    level: '',
    tags: [],
    status: 'Draft',
    description: '',
    learningOutcomes: [''],
    modules: [],
    estimatedDuration: '',
    completionDeadline: '',
    visibleTo: [],
    autoAssign: false,
    trackCompletion: true,
    allowCertificate: false,
    allowFeedback: false
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentLearningOutcome, setCurrentLearningOutcome] = useState('');
  const [currentModule, setCurrentModule] = useState({
    title: '',
    materials: [],
    assessment: ''
  });
  const [currentMaterial, setCurrentMaterial] = useState({
    type: 'link',
    url: '',
    file: null,
    previewUrl: null
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, "courses"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const coursesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }));
          setCourses(coursesData);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        alert(error)
        console.error("Error fetching courses:", error);
        setLoading(false);
        setSnackbar({ open: true, message: 'Failed to load courses', severity: 'error' });
      }
    };
  
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = 
      tabValue === 'all' ||
      (tabValue === 'draft' && course.status === 'Draft') ||
      (tabValue === 'published' && course.status === 'Published') ||
      (tabValue === 'archived' && course.status === 'Archived');
    
    return matchesSearch && matchesTab;
  });

  const handleAddTag = (isEditing = false) => {
    if (currentTag) {
      if (isEditing) {
        setEditingCourse(prev => ({
          ...prev,
          tags: [...(prev.tags || []), currentTag]
        }));
      } else {
        setNewCourse(prev => ({
          ...prev,
          tags: [...prev.tags, currentTag]
        }));
      }
      setCurrentTag('');
    }
  };

 
const handleRemoveTag = (tagToRemove, isEditing = false) => {
  if (isEditing) {
    setEditingCourse(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  } else {
    setNewCourse(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }
};

const handleEditCourse = (course) => {
  // Deep clone the course to avoid reference issues
  const courseClone = JSON.parse(JSON.stringify(course));
  
  // Initialize editing states
  setCurrentModule({
    title: '',
    materials: [],
    assessment: ''
  });
  setCurrentMaterial({
    type: 'link',
    url: '',
    file: null,
    previewUrl: null
  });
  setCurrentTag('');
  setCurrentLearningOutcome('');
  setExpandedModule(null);
  setEditingMaterialIndex(null);
  setCurrentModuleIndex(null);
  
  // Set the editing course
  setEditingCourse(courseClone);
  setOpenEditDialog(true);
};

  
const handleUpdateCourse = async () => {
  if (!editingCourse.title || !editingCourse.department || !editingCourse.description || editingCourse.modules.length === 0) {
    setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
    return;
  }

  try {
    setIsUploading(true);
    
    // Upload any new media files in modules
    const modulesWithUploadedFiles = await Promise.all(
      editingCourse.modules.map(async module => {
        const materialsWithUrls = await Promise.all(
          module.materials.map(async material => {
            if (material.type === 'file' && material.file) {
              const uploadedFile = await uploadToCloudinary(material.file);
              return {
                ...material,
                url: uploadedFile.url,
                fileName: material.file.name,
                fileType: material.file.type,
                fileSize: uploadedFile.bytes,
                publicId: uploadedFile.publicId
              };
            }
            return material;
          })
        );
        return {
          ...module,
          materials: materialsWithUrls
        };
      })
    );

    const courseData = {
      title: editingCourse.title,
      department: editingCourse.department,
      level: editingCourse.level,
      tags: editingCourse.tags || [],
      status: editingCourse.status || 'Draft',
      description: editingCourse.description,
      learningOutcomes: editingCourse.learningOutcomes || [],
      modules: modulesWithUploadedFiles,
      estimatedDuration: editingCourse.estimatedDuration,
      completionDeadline: editingCourse.completionDeadline,
      visibleTo: editingCourse.visibleTo || [],
      autoAssign: editingCourse.autoAssign || false,
      trackCompletion: editingCourse.trackCompletion !== false, // default true
      allowCertificate: editingCourse.allowCertificate || false,
      allowFeedback: editingCourse.allowFeedback || false,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "courses", editingCourse.id), courseData);
    
    // Update local state
    setCourses(prev => prev.map(c => c.id === editingCourse.id ? {...courseData, id: editingCourse.id} : c));
    
    setOpenEditDialog(false);
    setSnackbar({ open: true, message: 'Course updated successfully', severity: 'success' });
  } catch (error) {
    console.error("Error updating course:", error);
    setSnackbar({ open: true, message: 'Failed to update course', severity: 'error' });
  } finally {
    setIsUploading(false);
  }
};

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
  
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "courses", editingCourse.id));
      
      // Update local state
      setCourses(prev => prev.filter(c => c.id !== editingCourse.id));
      
      setOpenEditDialog(false);
      setSnackbar({ open: true, message: 'Course deleted successfully', severity: 'success' });
    } catch (error) {
      console.error("Error deleting course:", error);
      setSnackbar({ open: true, message: 'Failed to delete course', severity: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddLearningOutcome = (isEditing = false) => {
    if (currentLearningOutcome) {
      if (isEditing) {
        setEditingCourse(prev => ({
          ...prev,
          learningOutcomes: [...(prev.learningOutcomes || []), currentLearningOutcome]
        }));
      } else {
        setNewCourse(prev => ({
          ...prev,
          learningOutcomes: [...prev.learningOutcomes, currentLearningOutcome]
        }));
      }
      setCurrentLearningOutcome('');
    }
  };
  
  const handleRemoveLearningOutcome = (index, isEditing = false) => {
    if (isEditing) {
      setEditingCourse(prev => ({
        ...prev,
        learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
      }));
    } else {
      setNewCourse(prev => ({
        ...prev,
        learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddModule = (isEditing = false) => {
    if (currentModule.title) {
      if (isEditing) {
        setEditingCourse(prev => ({
          ...prev,
          modules: [...(prev.modules || []), currentModule]
        }));
      } else {
        setNewCourse(prev => ({
          ...prev,
          modules: [...prev.modules, currentModule]
        }));
      }
      setCurrentModule({
        title: '',
        materials: [],
        assessment: ''
      });
    }
  };

  const handleRemoveModule = (index, isEditing = false) => {
    if (isEditing) {
      setEditingCourse(prev => ({
        ...prev,
        modules: prev.modules.filter((_, i) => i !== index)
      }));
    } else {
      setNewCourse(prev => ({
        ...prev,
        modules: prev.modules.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddMaterial = (isEditing = false, moduleIndex = null) => {
    if ((currentMaterial.type === 'link' && !currentMaterial.url) || 
        (currentMaterial.type === 'file' && !currentMaterial.file && !currentMaterial.url)) {
      return;
    }
  
    if (isEditing) {
      if (moduleIndex === null) return;
      
      setEditingCourse(prev => {
        const updatedModules = [...prev.modules];
        
        if (editingMaterialIndex !== null) {
          // Editing existing material
          updatedModules[moduleIndex].materials[editingMaterialIndex] = currentMaterial;
        } else {
          // Adding new material
          updatedModules[moduleIndex].materials = [
            ...updatedModules[moduleIndex].materials,
            currentMaterial
          ];
        }
        
        return {
          ...prev,
          modules: updatedModules
        };
      });
    } else {
      // Adding to new module (not yet added to course)
      setCurrentModule(prev => ({
        ...prev,
        materials: [...prev.materials, currentMaterial]
      }));
    }
  
    // Reset material state
    setCurrentMaterial({
      type: 'link',
      url: '',
      file: null,
      previewUrl: null
    });
    setEditingMaterialIndex(null);
  };
// Modified handleRemoveMaterial function
const handleRemoveMaterial = (matIndex, moduleIndex, isEditing = false) => {
  if (isEditing) {
    setEditingCourse(prev => {
      const updatedModules = [...prev.modules];
      updatedModules[moduleIndex].materials = updatedModules[moduleIndex].materials.filter(
        (_, i) => i !== matIndex
      );
      return {
        ...prev,
        modules: updatedModules
      };
    });
  } else {
    setCurrentModule(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== matIndex)
    }));
  }
};

const handleEditMaterial = (material, matIndex, moduleIndex) => {
  setCurrentMaterial({
    type: material.type,
    url: material.url || '',
    file: material.file || null,
    previewUrl: material.previewUrl || null,
    fileName: material.fileName || '',
    fileType: material.fileType || '',
    fileSize: material.fileSize || 0
  });
  setEditingMaterialIndex(matIndex);
  setCurrentModuleIndex(moduleIndex); // Make sure this is set
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
        alert(error)
      console.error('Error uploading to Supabase:', error);
      throw error;
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    const fileType = file.type.split('/')[0];
    
    if (['image', 'video', 'audio'].includes(fileType)) {
      setCurrentMaterial(prev => ({
        ...prev,
        file,
        previewUrl: fileType === 'image' ? URL.createObjectURL(file) : null,
        type: 'file'
      }));
    } else {
      handleDocumentUpload(file);
    }
  };

  const handleDocumentUpload = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const uploadedFile = await uploadToSupabase(file);
      
      setCurrentMaterial(prev => ({
        ...prev,
        file: null,
        url: uploadedFile.url,
        fileName: uploadedFile.fileName,
        fileType: uploadedFile.type,
        fileSize: uploadedFile.size,
        type: 'file'
      }));
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to upload document', severity: 'error' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.department || !newCourse.description || newCourse.modules.length === 0) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload any media files in modules
      const modulesWithUploadedFiles = await Promise.all(
        newCourse.modules.map(async module => {
          const materialsWithUrls = await Promise.all(
            module.materials.map(async material => {
              if (material.type === 'file' && material.file) {
                const uploadedFile = await uploadToCloudinary(material.file);
                return {
                  ...material,
                  url: uploadedFile.url,
                  fileName: material.file.name,
                  fileType: material.file.type,
                  fileSize: uploadedFile.bytes,
                  publicId: uploadedFile.publicId
                };
              }
              return material;
            })
          );
          return {
            ...module,
            materials: materialsWithUrls
          };
        })
      );

      const courseData = {
        ...newCourse,
        modules: modulesWithUploadedFiles,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      };

      await addDoc(collection(db, "courses"), courseData);
      
      setOpenAddDialog(false);
      setNewCourse({
        title: '',
        department: '',
        level: '',
        tags: [],
        status: 'Draft',
        description: '',
        learningOutcomes: [''],
        modules: [],
        estimatedDuration: '',
        completionDeadline: '',
        visibleTo: [],
        autoAssign: false,
        trackCompletion: true,
        allowCertificate: false,
        allowFeedback: false
      });
      setSnackbar({ open: true, message: 'Course added successfully', severity: 'success' });
    } catch (error) {
      console.error("Error adding course:", error);
      setSnackbar({ open: true, message: 'Failed to add course', severity: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleModuleExpand = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  const handleViewCourse = (course) => {
    setActiveCourse(course);
  };

  const handleCloseViewDialog = () => {
    setActiveCourse(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            <FiBook size={26} /> Course Management
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            mt: 0.5
          }}>
            Create and manage training courses for interns and collaborators
          </Typography>
        </Box>
        
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
          Add Course
        </Button>
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
          placeholder="Search courses..."
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
              <Badge badgeContent={courses.length} color="primary" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                All Courses
              </Badge>
            }
            icon={<FiBook size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="draft" 
            label="Draft"
            icon={<FiFileText size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="published" 
            label="Published"
            icon={<FiCheck size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="archived" 
            label="Archived"
            icon={<FiLock size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Main Content */}
      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : filteredCourses.length === 0 ? (
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
            <FiBook size={36} color="text.secondary" />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
          }}>
            No courses found
          </Typography>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary',
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            {searchTerm ? 'No courses match your search criteria' : 'You have not created any courses yet'}
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
            Create First Course
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2,
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.dark',
                        width: 40,
                        height: 40
                      }}>
                        <FiBook size={18} />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                          {course.title}
                        </Typography>
                        <Chip 
                          label={course.status} 
                          size="small" 
                          color={
                            course.status === 'Published' ? 'success' :
                            course.status === 'Draft' ? 'warning' : 'default'
                          }
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
  <Tooltip title="Edit">
    <IconButton 
      size="small"
      onClick={() => handleEditCourse(course)}
    >
      <FiEdit2 size={16} />
    </IconButton>
  </Tooltip>
  <Tooltip title="View">
    <IconButton 
      size="small"
      onClick={() => handleViewCourse(course)}
    >
      <FiEye size={16} />
    </IconButton>
  </Tooltip>
</Box>
                  </Box>

                  <Typography variant="body2" sx={{ 
                    color: 'text.secondary',
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {course.description || 'No description provided'}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    {course.tags?.slice(0, 3).map((tag, index) => (
                      <StyledTag key={index} label={tag} size="small" />
                    ))}
                    {course.tags?.length > 3 && (
                      <Chip label={`+${course.tags.length - 3}`} size="small" />
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FiClock size={14} color="text.secondary" />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {course.estimatedDuration || 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FiUsers size={14} color="text.secondary" />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {course.visibleTo?.join(', ') || 'Not assigned'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Course Dialog */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => !isUploading && setOpenAddDialog(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
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
            Create New Course
          </Typography>
          <IconButton 
            onClick={() => !isUploading && setOpenAddDialog(false)}
            disabled={isUploading}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {/* Basic Course Info */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: '600', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiFileText size={18} /> Basic Course Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Course Title *"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Department *</InputLabel>
                  <Select
                    value={newCourse.department}
                    label="Department *"
                    onChange={(e) => setNewCourse(prev => ({ ...prev, department: e.target.value }))}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={newCourse.level}
                    label="Level"
                    onChange={(e) => setNewCourse(prev => ({ ...prev, level: e.target.value }))}
                  >
                    {LEVELS.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newCourse.status}
                    label="Status"
                    onChange={(e) => setNewCourse(prev => ({ ...prev, status: e.target.value }))}
                  >
                    {STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tags / Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tags (press Enter)"
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddTag}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {newCourse.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Description & Learning Goals */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: '600', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiBook size={18} /> Description & Learning Goals
            </Typography>
            
            <TextField
              fullWidth
              label="Course Description *"
              value={newCourse.description}
              onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={4}
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Learning Outcomes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={currentLearningOutcome}
                  onChange={(e) => setCurrentLearningOutcome(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLearningOutcome()}
                  placeholder="Add learning outcome (press Enter)"
                />
                <Button
                  variant="outlined"
                  onClick={handleAddLearningOutcome}
                >
                  Add
                </Button>
              </Box>
              <List dense sx={{ 
                backgroundColor: 'action.hover',
                borderRadius: 1,
                p: 1
              }}>
                {newCourse.learningOutcomes.map((outcome, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText primary={`• ${outcome}`} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveLearningOutcome(index)}
                      >
                        <FiX size={14} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Modules or Sections */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: '600', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiLayers size={18} /> Modules or Sections *
            </Typography>
            
            {newCourse.modules.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {newCourse.modules.map((module, index) => (
                  <Accordion 
                    key={index} 
                    expanded={expandedModule === index}
                    onChange={() => handleModuleExpand(index)}
                    sx={{ 
                      mb: 1,
                      borderRadius: '8px !important',
                      overflow: 'hidden'
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<FiChevronDown />}
                      sx={{ 
                        backgroundColor: 'action.hover',
                        '&.Mui-expanded': {
                          backgroundColor: 'action.selected'
                        }
                      }}
                    >
                      <Typography sx={{ fontWeight: '600' }}>
                        Module {index + 1}: {module.title}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Materials
                        </Typography>
                        {module.materials.map((material, matIndex) => (
                          <Paper 
                            key={matIndex} 
                            sx={{ 
                              p: 1.5, 
                              mb: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {material.type === 'link' ? (
                                <FiLink size={18} color="text.secondary" />
                              ) : (
                                <FiFile size={18} color="text.secondary" />
                              )}
                              <Typography variant="body2">
                                {material.type === 'link' ? material.url : material.fileName}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMaterial(matIndex)}
                            >
                              <FiTrash2 size={16} />
                            </IconButton>
                          </Paper>
                        ))}
                      </Box>
                      
                      {module.assessment && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Assessment
                          </Typography>
                          <Paper sx={{ p: 1.5 }}>
                            <Typography variant="body2">
                              {module.assessment}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                      
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<FiTrash2 size={16} />}
                        onClick={() => handleRemoveModule(index)}
                        sx={{ mt: 1 }}
                      >
                        Remove Module
                      </Button>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Add New Module
              </Typography>
              
              <TextField
                fullWidth
                label="Module Title"
                value={currentModule.title}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, title: e.target.value }))}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Add Materials
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Button
                    variant={currentMaterial.type === 'link' ? 'contained' : 'outlined'}
                    startIcon={<FiLink size={16} />}
                    onClick={() => setCurrentMaterial(prev => ({ ...prev, type: 'link' }))}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: '600'
                    }}
                  >
                    Link
                  </Button>
                  <Button
                    variant={currentMaterial.type === 'file' ? 'contained' : 'outlined'}
                    startIcon={<FiUpload size={16} />}
                    onClick={() => setCurrentMaterial(prev => ({ ...prev, type: 'file' }))}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: '600'
                    }}
                  >
                    File
                  </Button>
                </Box>
                
                {currentMaterial.type === 'link' ? (
                  <TextField
                    fullWidth
                    label="URL"
                    value={currentMaterial.url}
                    onChange={(e) => setCurrentMaterial(prev => ({ ...prev, url: e.target.value }))}
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
                    {currentMaterial.file ? (
                      <>
                        {currentMaterial.previewUrl ? (
                          <Box sx={{ mb: 2 }}>
                            <img 
                              src={currentMaterial.previewUrl} 
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
                          {currentMaterial.file.name}
                        </Typography>
                        
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setCurrentMaterial(prev => ({ ...prev, file: null, previewUrl: null }));
                          }}
                        >
                          Change File
                        </Button>
                      </>
                    ) : (
                      <>
                        <FiUpload size={32} style={{ marginBottom: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                          Upload files (images/videos to Cloudinary, documents to Supabase)
                        </Typography>
                        
                        <input
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          style={{ display: 'none' }}
                          id="material-upload"
                          type="file"
                          onChange={handleFileChange}
                        />
                        
                        <label htmlFor="material-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<FiUpload size={16} />}
                          >
                            Select File
                          </Button>
                        </label>
                      </>
                    )}
                  </Box>
                )}
                
                <Button
                  variant="outlined"
                  onClick={handleAddMaterial}
                  disabled={
                    (currentMaterial.type === 'link' && !currentMaterial.url) ||
                    (currentMaterial.type === 'file' && !currentMaterial.file && !currentMaterial.url)
                  }
                  sx={{ mb: 3 }}
                >
                  Add Material
                </Button>
              </Box>
              
              <TextField
                fullWidth
                label="Assessment (Optional)"
                value={currentModule.assessment}
                onChange={(e) => setCurrentModule(prev => ({ ...prev, assessment: e.target.value }))}
                placeholder="Link to quiz or assessment criteria"
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="contained"
                onClick={handleAddModule}
                disabled={!currentModule.title || currentModule.materials.length === 0}
                sx={{ mb: 2 }}
              >
                Add Module
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Duration & Deadlines */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: '600', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiClock size={18} /> Duration & Deadlines
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration"
                  value={newCourse.estimatedDuration}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                  placeholder="e.g., 2 hours, 1 week"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Completion Deadline"
                  type="date"
                  value={newCourse.completionDeadline}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, completionDeadline: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Access & Assignment */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: '600', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiUsers size={18} /> Access & Assignment
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Visible To</InputLabel>
              <Select
                multiple
                value={newCourse.visibleTo}
                label="Visible To"
                onChange={(e) => setNewCourse(prev => ({ ...prev, visibleTo: e.target.value }))}
                renderValue={(selected) => selected.join(', ')}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={newCourse.autoAssign}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, autoAssign: e.target.checked }))}
                />
              }
              label="Auto-Assign to New Interns"
              sx={{ mb: 2 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Tracking Options */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ 
              fontWeight: '600', 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <FiAward size={18} /> Tracking Options
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={newCourse.trackCompletion}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, trackCompletion: e.target.checked }))}
                />
              }
              label="Track Completion"
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={newCourse.allowCertificate}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, allowCertificate: e.target.checked }))}
                />
              }
              label="Allow Certificate on Completion"
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={newCourse.allowFeedback}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, allowFeedback: e.target.checked }))}
                />
              }
              label="Allow Comments/Feedback"
              sx={{ mb: 1 }}
            />
          </Box>
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
            onClick={handleAddCourse}
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <FiCheck size={16} />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            {isUploading ? 'Saving...' : 'Create Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Course Dialog */}
      {activeCourse && (
        <Dialog 
          open={Boolean(activeCourse)} 
          onClose={handleCloseViewDialog}
          fullWidth
          maxWidth="md"
          scroll="paper"
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
              {activeCourse.title}
            </Typography>
            <IconButton onClick={handleCloseViewDialog}>
              <FiX />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ py: 3 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: '600', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <FiFileText size={18} /> Course Details
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Department:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.department || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Level:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.level || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Status:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.status || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Estimated Duration:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.estimatedDuration || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {activeCourse.tags?.map((tag, index) => (
                    <StyledTag key={index} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                  Description:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {activeCourse.description || 'No description provided'}
                </Typography>
              </Box>
              
              {activeCourse.learningOutcomes?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                    Learning Outcomes:
                  </Typography>
                  <List dense>
                    {activeCourse.learningOutcomes.map((outcome, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText primary={`• ${outcome}`} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Modules */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: '600', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <FiLayers size={18} /> Modules
              </Typography>
              
              {activeCourse.modules?.map((module, index) => (
                <Accordion 
                  key={index} 
                  sx={{ 
                    mb: 2,
                    borderRadius: '8px !important',
                    overflow: 'hidden'
                  }}
                >
                  <AccordionSummary
                    expandIcon={<FiChevronDown />}
                    sx={{ 
                      backgroundColor: 'action.hover',
                      '&.Mui-expanded': {
                        backgroundColor: 'action.selected'
                      }
                    }}
                  >
                    <Typography sx={{ fontWeight: '600' }}>
                      Module {index + 1}: {module.title}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {module.materials?.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Materials
                        </Typography>
                        <List dense>
                          {module.materials.map((material, matIndex) => (
                            <ListItem 
                              key={matIndex}
                              button
                              onClick={() => window.open(material.url, '_blank')}
                              sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                '&:hover': {
                                  backgroundColor: 'action.hover'
                                }
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ 
                                  bgcolor: 'primary.light', 
                                  color: 'primary.dark',
                                  width: 32,
                                  height: 32
                                }}>
                                  {material.type === 'link' ? (
                                    <FiLink size={16} />
                                  ) : (
                                    <FiFile size={16} />
                                  )}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={material.type === 'link' ? material.url : material.fileName}
                                secondary={material.type === 'file' ? `${material.fileType} • ${formatFileSize(material.fileSize)}` : null}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    
                    {module.assessment && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Assessment
                        </Typography>
                        <Paper sx={{ p: 1.5 }}>
                          <Typography variant="body2">
                            {module.assessment}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Access & Tracking */}
            <Box>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: '600', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <FiUsers size={18} /> Access & Tracking
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Visible To:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.visibleTo?.join(', ') || 'Not assigned'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Auto-Assign to New Interns:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.autoAssign ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Track Completion:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.trackCompletion ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: '500' }}>
                    Allow Certificate:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeCourse.allowCertificate ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Button
              variant="contained"
              onClick={handleCloseViewDialog}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '600'
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

{/* Edit Course Dialog */}
<Dialog 
  open={openEditDialog} 
  onClose={() => !isUploading && setOpenEditDialog(false)}
  fullWidth
  maxWidth="md"
  scroll="paper"
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
      Edit Course: {editingCourse?.title}
    </Typography>
    <IconButton 
      onClick={() => !isUploading && setOpenEditDialog(false)}
      disabled={isUploading}
    >
      <FiX />
    </IconButton>
  </DialogTitle>
  <DialogContent dividers sx={{ py: 3 }}>
    {/* Basic Course Info */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: '600', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiFileText size={18} /> Basic Course Information
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Course Title *"
            value={editingCourse?.title || ''}
            onChange={(e) => setEditingCourse(prev => ({ ...prev, title: e.target.value }))}
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Department *</InputLabel>
            <Select
              value={editingCourse?.department || ''}
              label="Department *"
              onChange={(e) => setEditingCourse(prev => ({ ...prev, department: e.target.value }))}
            >
              {DEPARTMENTS.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={editingCourse?.level || ''}
              label="Level"
              onChange={(e) => setEditingCourse(prev => ({ ...prev, level: e.target.value }))}
            >
              {LEVELS.map((level) => (
                <MenuItem key={level} value={level}>{level}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={editingCourse?.status || 'Draft'}
              label="Status"
              onChange={(e) => setEditingCourse(prev => ({ ...prev, status: e.target.value }))}
            >
              {STATUSES.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Tags / Keywords
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag(true)}
                placeholder="Add tags (press Enter)"
              />
              <Button
                variant="outlined"
                onClick={() => handleAddTag(true)}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {editingCourse?.tags?.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag, true)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* Description & Learning Goals */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: '600', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiBook size={18} /> Description & Learning Goals
      </Typography>
      
      <TextField
        fullWidth
        label="Course Description *"
        value={editingCourse?.description || ''}
        onChange={(e) => setEditingCourse(prev => ({ ...prev, description: e.target.value }))}
        multiline
        rows={4}
        sx={{ mb: 3 }}
      />
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Learning Outcomes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={currentLearningOutcome}
            onChange={(e) => setCurrentLearningOutcome(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLearningOutcome(true)}
            placeholder="Add learning outcome (press Enter)"
          />
          <Button
            variant="outlined"
            onClick={() => handleAddLearningOutcome(true)}
          >
            Add
          </Button>
        </Box>
        <List dense sx={{ 
          backgroundColor: 'action.hover',
          borderRadius: 1,
          p: 1
        }}>
          {editingCourse?.learningOutcomes?.map((outcome, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemText primary={`• ${outcome}`} />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleRemoveLearningOutcome(index, true)}
                >
                  <FiX size={14} />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* Modules or Sections */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: '600', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiLayers size={18} /> Modules or Sections *
      </Typography>
      
      {editingCourse?.modules?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {editingCourse.modules.map((module, index) => (
            <Accordion 
              key={index} 
              expanded={expandedModule === index}
              onChange={() => handleModuleExpand(index)}
              sx={{ 
                mb: 1,
                borderRadius: '8px !important',
                overflow: 'hidden'
              }}
            >
              <AccordionSummary
                expandIcon={<FiChevronDown />}
                sx={{ 
                  backgroundColor: 'action.hover',
                  '&.Mui-expanded': {
                    backgroundColor: 'action.selected'
                  }
                }}
              >
                <Typography sx={{ fontWeight: '600' }}>
                  Module {index + 1}: {module.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
              <Box sx={{ mb: 3 }}>
  {/* Existing Materials List */}
  <Typography variant="subtitle2" sx={{ mb: 1 }}>
    Materials
  </Typography>
  
  {module.materials.map((material, matIndex) => (
    <Paper 
      key={matIndex} 
      sx={{ 
        p: 1.5, 
        mb: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: editingMaterialIndex === matIndex ? 'action.selected' : 'background.paper'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {material.type === 'link' ? (
          <FiLink size={18} color="text.secondary" />
        ) : (
          <FiFile size={18} color="text.secondary" />
        )}
        <Typography variant="body2">
          {material.type === 'link' ? material.url : material.fileName}
        </Typography>
      </Box>
      <Box>
        <IconButton
          size="small"
          onClick={() => handleEditMaterial(material, matIndex, index)}
        >
          <FiEdit2 size={16} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleRemoveMaterial(matIndex, index, true)}
        >
          <FiTrash2 size={16} />
        </IconButton>
      </Box>
    </Paper>
  ))}

  {/* Add Material Form */}
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      {editingMaterialIndex !== null ? 'Edit Material' : 'Add New Material'}
    </Typography>
    
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      <Button
        variant={currentMaterial.type === 'link' ? 'contained' : 'outlined'}
        startIcon={<FiLink size={16} />}
        onClick={() => setCurrentMaterial(prev => ({ ...prev, type: 'link' }))}
      >
        Link
      </Button>
      <Button
        variant={currentMaterial.type === 'file' ? 'contained' : 'outlined'}
        startIcon={<FiUpload size={16} />}
        onClick={() => setCurrentMaterial(prev => ({ ...prev, type: 'file' }))}
      >
        File
      </Button>
    </Box>

    {currentMaterial.type === 'link' ? (
      <TextField
        fullWidth
        label="URL"
        value={currentMaterial.url}
        onChange={(e) => setCurrentMaterial(prev => ({ ...prev, url: e.target.value }))}
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
        {currentMaterial.file ? (
          <>
            {currentMaterial.previewUrl ? (
              <Box sx={{ mb: 2 }}>
                <img 
                  src={currentMaterial.previewUrl} 
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
              {currentMaterial.file.name}
            </Typography>
            
            <Button
              variant="outlined"
              onClick={() => {
                setCurrentMaterial(prev => ({ ...prev, file: null, previewUrl: null }));
              }}
            >
              Change File
            </Button>
          </>
        ) : (
          <>
            <FiUpload size={32} style={{ marginBottom: 16, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Upload files (images/videos to Cloudinary, documents to Supabase)
            </Typography>
            
            <input
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              style={{ display: 'none' }}
              id={`material-upload-${index}`}
              type="file"
              onChange={handleFileChange}
            />
            
            <label htmlFor={`material-upload-${index}`}>
              <Button
                variant="outlined"
                component="span"
                startIcon={<FiUpload size={16} />}
              >
                Select File
              </Button>
            </label>
          </>
        )}
      </Box>
    )}
    
    <Box sx={{ display: 'flex', gap: 2 }}>
    <Button
  variant="contained"
  onClick={() => handleAddMaterial(true, index)}
  disabled={
    (currentMaterial.type === 'link' && !currentMaterial.url) ||
    (currentMaterial.type === 'file' && !currentMaterial.file && !currentMaterial.url)
  }
>
  {editingMaterialIndex !== null ? 'Update Material' : 'Add Material'}
</Button>
      
      {editingMaterialIndex !== null && (
        <Button
          variant="outlined"
          onClick={() => {
            setCurrentMaterial({
              type: 'link',
              url: '',
              file: null,
              previewUrl: null
            });
            setEditingMaterialIndex(null);
          }}
        >
          Cancel
        </Button>
      )}
    </Box>
  </Box>
</Box>
                
                {module.assessment && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Assessment
                    </Typography>
                    <Paper sx={{ p: 1.5 }}>
                      <Typography variant="body2">
                        {module.assessment}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<FiTrash2 size={16} />}
                  onClick={() => handleRemoveModule(index, true)}
                  sx={{ mt: 1 }}
                >
                  Remove Module
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Add New Module
        </Typography>
        
        <TextField
          fullWidth
          label="Module Title"
          value={currentModule.title}
          onChange={(e) => setCurrentModule(prev => ({ ...prev, title: e.target.value }))}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Add Materials
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant={currentMaterial.type === 'link' ? 'contained' : 'outlined'}
              startIcon={<FiLink size={16} />}
              onClick={() => setCurrentMaterial(prev => ({ ...prev, type: 'link' }))}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '600'
              }}
            >
              Link
            </Button>
            <Button
              variant={currentMaterial.type === 'file' ? 'contained' : 'outlined'}
              startIcon={<FiUpload size={16} />}
              onClick={() => setCurrentMaterial(prev => ({ ...prev, type: 'file' }))}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '600'
              }}
            >
              File
            </Button>
          </Box>
          
          {currentMaterial.type === 'link' ? (
            <TextField
              fullWidth
              label="URL"
              value={currentMaterial.url}
              onChange={(e) => setCurrentMaterial(prev => ({ ...prev, url: e.target.value }))}
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
              {currentMaterial.file ? (
                <>
                  {currentMaterial.previewUrl ? (
                    <Box sx={{ mb: 2 }}>
                      <img 
                        src={currentMaterial.previewUrl} 
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
                    {currentMaterial.file.name}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setCurrentMaterial(prev => ({ ...prev, file: null, previewUrl: null }));
                    }}
                  >
                    Change File
                  </Button>
                </>
              ) : (
                <>
                  <FiUpload size={32} style={{ marginBottom: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Upload files (images/videos to Cloudinary, documents to Supabase)
                  </Typography>
                  
                  <input
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    style={{ display: 'none' }}
                    id="material-upload-edit"
                    type="file"
                    onChange={handleFileChange}
                  />
                  
                  <label htmlFor="material-upload-edit">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<FiUpload size={16} />}
                    >
                      Select File
                    </Button>
                  </label>
                </>
              )}
            </Box>
          )}
          
          <Button
            variant="outlined"
            onClick={() => handleAddMaterial(true)}
            disabled={
              (currentMaterial.type === 'link' && !currentMaterial.url) ||
              (currentMaterial.type === 'file' && !currentMaterial.file && !currentMaterial.url)
            }
            sx={{ mb: 3 }}
          >
            Add Material
          </Button>
        </Box>
        
        <TextField
          fullWidth
          label="Assessment (Optional)"
          value={currentModule.assessment}
          onChange={(e) => setCurrentModule(prev => ({ ...prev, assessment: e.target.value }))}
          placeholder="Link to quiz or assessment criteria"
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={() => handleAddModule(true)}
          disabled={!currentModule.title || currentModule.materials.length === 0}
          sx={{ mb: 2 }}
        >
          Add Module
        </Button>
      </Box>
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* Duration & Deadlines */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: '600', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiClock size={18} /> Duration & Deadlines
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Estimated Duration"
            value={editingCourse?.estimatedDuration || ''}
            onChange={(e) => setEditingCourse(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            placeholder="e.g., 2 hours, 1 week"
            sx={{ mb: 2 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Completion Deadline"
            type="date"
            value={editingCourse?.completionDeadline || ''}
            onChange={(e) => setEditingCourse(prev => ({ ...prev, completionDeadline: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        </Grid>
      </Grid>
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* Access & Assignment */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: '600', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiUsers size={18} /> Access & Assignment
      </Typography>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Visible To</InputLabel>
        <Select
          multiple
          value={editingCourse?.visibleTo || []}
          label="Visible To"
          onChange={(e) => setEditingCourse(prev => ({ ...prev, visibleTo: e.target.value }))}
          renderValue={(selected) => selected.join(', ')}
        >
          {ROLES.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControlLabel
        control={
          <Switch
            checked={editingCourse?.autoAssign || false}
            onChange={(e) => setEditingCourse(prev => ({ ...prev, autoAssign: e.target.checked }))}
          />
        }
        label="Auto-Assign to New Interns"
        sx={{ mb: 2 }}
      />
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* Tracking Options */}
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: '600', 
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiAward size={18} /> Tracking Options
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={editingCourse?.trackCompletion || false}
            onChange={(e) => setEditingCourse(prev => ({ ...prev, trackCompletion: e.target.checked }))}
          />
        }
        label="Track Completion"
        sx={{ mb: 1 }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={editingCourse?.allowCertificate || false}
            onChange={(e) => setEditingCourse(prev => ({ ...prev, allowCertificate: e.target.checked }))}
          />
        }
        label="Allow Certificate on Completion"
        sx={{ mb: 1 }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={editingCourse?.allowFeedback || false}
            onChange={(e) => setEditingCourse(prev => ({ ...prev, allowFeedback: e.target.checked }))}
          />
        }
        label="Allow Comments/Feedback"
        sx={{ mb: 1 }}
      />
    </Box>
  </DialogContent>
  <DialogActions sx={{ 
    px: 3,
    py: 2,
    borderTop: '1px solid',
    borderColor: 'divider'
  }}>
    <Button
      variant="outlined"
      color="error"
      onClick={handleDeleteCourse}
      disabled={isUploading || isDeleting}
      startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <FiTrash2 size={16} />}
    >
      {isDeleting ? 'Deleting...' : 'Delete Course'}
    </Button>
    <Box sx={{ flexGrow: 1 }} />
    <Button
      variant="outlined"
      onClick={() => setOpenEditDialog(false)}
      disabled={isUploading}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleUpdateCourse}
      disabled={isUploading}
      startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <FiCheck size={16} />}
    >
      {isUploading ? 'Updating...' : 'Update Course'}
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

export default CourseManagement;