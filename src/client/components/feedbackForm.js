import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Rating,
  Avatar,
  Divider,
  IconButton,
  LinearProgress,
  Alert,
  Chip
} from "@mui/material";
import {
  FiX,
  FiUpload,
  FiImage,
  FiVideo,
  FiFile,
  FiCheck,
  FiStar
} from "react-icons/fi";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

const CLOUDINARY_CONFIG = {
  cloudName: 'dsbt1j73t',
  uploadPreset: 'dxd-magnate',
  apiKey: '753871594898224'
};

const FeedbackForm = ({ 
  open, 
  onClose, 
  project, 
  projectManager,
  existingFeedback = {} 
}) => {
  const [projectRating, setProjectRating] = useState(0);
  const [projectFeedback, setProjectFeedback] = useState("");
  const [managerRating, setManagerRating] = useState(0);
  const [managerFeedback, setManagerFeedback] = useState("");
  const [projectMedia, setProjectMedia] = useState([]);
  const [managerMedia, setManagerMedia] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (open) {
      setProjectRating(existingFeedback.projectRating || 0);
      setProjectFeedback(existingFeedback.projectFeedback || "");
      setManagerRating(existingFeedback.managerRating || 0);
      setManagerFeedback(existingFeedback.managerFeedback || "");
      setProjectMedia(existingFeedback.projectMedia || []);
      setManagerMedia(existingFeedback.managerMedia || []);
      setActiveStep(0);
      setError("");
    }
  }, [open, existingFeedback]);

  const handleFileUpload = async (file, type) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);

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
        format: data.format
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const handleProjectMediaChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + projectMedia.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => handleFileUpload(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      setProjectMedia(prev => [
        ...prev,
        ...uploadedFiles.map(file => ({
          url: file.url,
          type: file.type,
          publicId: file.publicId
        }))
      ]);
    } catch (err) {
      setError("Failed to upload some files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleManagerMediaChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + managerMedia.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => handleFileUpload(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      setManagerMedia(prev => [
        ...prev,
        ...uploadedFiles.map(file => ({
          url: file.url,
          type: file.type,
          publicId: file.publicId
        }))
      ]);
    } catch (err) {
      setError("Failed to upload some files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeProjectMedia = (index) => {
    setProjectMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeManagerMedia = (index) => {
    setManagerMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (projectRating === 0 || managerRating === 0) {
      setError("Please provide ratings for both project and manager");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // Save project feedback
      const projectFeedbackRef = await addDoc(collection(db, "project-feedback"), {
        projectId: project.id,
        projectTitle: project.title,
        clientId: project.clientId,
        clientName: project.clientName,
        rating: projectRating,
        feedback: projectFeedback,
        media: projectMedia,
        submittedAt: new Date(),
      });

      // Save manager rating
      await addDoc(collection(db, "projectManagerRatings"), {
        projectId: project.id,
        projectTitle: project.title,
        managerId: project.projectManagerId,
        managerName: project.projectManager,
        clientId: project.clientId,
        clientName: project.clientName,
        rating: managerRating,
        feedback: managerFeedback,
        media: managerMedia,
        submittedAt: new Date(),
      });

      // Update project to mark feedback as submitted
      await updateDoc(doc(db, "dxd-magnate-projects", project.id), {
        feedbackSubmitted: true
      });

      onClose(true);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && projectRating === 0) {
      setError("Please rate the project before proceeding");
      return;
    }
    setError("");
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setActiveStep(prev => prev - 1);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <FiImage size={16} />;
      case 'video': return <FiVideo size={16} />;
      default: return <FiFile size={16} />;
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: '600' }}>
          {activeStep === 0 ? 'Project Feedback' : 'Manager Feedback'}
        </Typography>
        <IconButton onClick={() => onClose(false)} disabled={isUploading}>
          <FiX />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {activeStep === 0 ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: '600' }}>
                Rate the Project: {project.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating
                  value={projectRating}
                  onChange={(e, newValue) => setProjectRating(newValue)}
                  precision={0.5}
                  size="large"
                  emptyIcon={<FiStar style={{ opacity: 0.55 }} fontSize="inherit" />}
                />
                <Typography variant="body2" color="text.secondary">
                  {projectRating > 0 ? `${projectRating} star${projectRating !== 1 ? 's' : ''}` : "Not rated"}
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Your feedback about the project (optional)"
              value={projectFeedback}
              onChange={(e) => setProjectFeedback(e.target.value)}
              multiline
              rows={4}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: '600' }}>
                Add Media (optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload images or videos related to your project experience
              </Typography>
              
              <input
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="project-media-upload"
                type="file"
                onChange={handleProjectMediaChange}
                multiple
                disabled={projectMedia.length >= 5 || isUploading}
              />
              
              <label htmlFor="project-media-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FiUpload size={16} />}
                  disabled={projectMedia.length >= 5 || isUploading}
                  sx={{ mb: 2 }}
                >
                  Upload Media
                </Button>
              </label>
              
              {projectMedia.length > 0 && (
                <Box sx={{ 
                  border: '1px dashed', 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  p: 2 
                }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    Uploaded files ({projectMedia.length}/5):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {projectMedia.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.type === 'image' ? `Image ${index + 1}` : `Video ${index + 1}`}
                        onDelete={() => removeProjectMedia(index)}
                        deleteIcon={<FiX size={14} />}
                        variant="outlined"
                        icon={getFileIcon(file.type)}
                        sx={{ 
                          borderRadius: 1,
                          '& .MuiChip-icon': { ml: 0.5 }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: '600' }}>
                Rate the Project Manager
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1
              }}>
                <Avatar sx={{ width: 48, height: 48 }}>
                  {projectManager?.charAt(0) || 'PM'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2">
                    {projectManager || "Project Manager"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Managed this project
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Rating
                  value={managerRating}
                  onChange={(e, newValue) => setManagerRating(newValue)}
                  precision={0.5}
                  size="large"
                  emptyIcon={<FiStar style={{ opacity: 0.55 }} fontSize="inherit" />}
                />
                <Typography variant="body2" color="text.secondary">
                  {managerRating > 0 ? `${managerRating} star${managerRating !== 1 ? 's' : ''}` : "Not rated"}
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Your feedback about the manager (optional)"
              value={managerFeedback}
              onChange={(e) => setManagerFeedback(e.target.value)}
              multiline
              rows={4}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: '600' }}>
                Add Media (optional)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload images or videos related to your experience with the manager
              </Typography>
              
              <input
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="manager-media-upload"
                type="file"
                onChange={handleManagerMediaChange}
                multiple
                disabled={managerMedia.length >= 5 || isUploading}
              />
              
              <label htmlFor="manager-media-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FiUpload size={16} />}
                  disabled={managerMedia.length >= 5 || isUploading}
                  sx={{ mb: 2 }}
                >
                  Upload Media
                </Button>
              </label>
              
              {managerMedia.length > 0 && (
                <Box sx={{ 
                  border: '1px dashed', 
                  borderColor: 'divider', 
                  borderRadius: 1, 
                  p: 2 
                }}>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                    Uploaded files ({managerMedia.length}/5):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {managerMedia.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.type === 'image' ? `Image ${index + 1}` : `Video ${index + 1}`}
                        onDelete={() => removeManagerMedia(index)}
                        deleteIcon={<FiX size={14} />}
                        variant="outlined"
                        icon={getFileIcon(file.type)}
                        sx={{ 
                          borderRadius: 1,
                          '& .MuiChip-icon': { ml: 0.5 }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
        
        {isUploading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
              {activeStep === 0 ? 'Uploading project feedback...' : 'Uploading manager feedback...'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 3,
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        justifyContent: activeStep === 0 ? 'flex-end' : 'space-between'
      }}>
        {activeStep === 1 && (
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={isUploading}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            Back
          </Button>
        )}
        
        {activeStep === 0 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isUploading || projectRating === 0}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isUploading || managerRating === 0}
            startIcon={isUploading ? null : <FiCheck size={16} />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            {isUploading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackForm;