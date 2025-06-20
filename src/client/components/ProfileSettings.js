import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  Divider,
  Chip,
  Switch,
  FormControlLabel,
  Paper,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent, 
  DialogTitle,
  DialogContentText,

} from "@mui/material";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiGlobe,
  FiCalendar,
  FiCheckCircle,
  FiX,
  FiEdit2,
  FiSave,
  FiUpload,
  FiEye,
  FiEyeOff,
  FiShield,
  FiBell,
  FiCreditCard, 
  FiCamera,
  FiTrash2
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from "firebase/auth";

const CLOUDINARY_CONFIG = {
  cloudName: 'dsbt1j73t',
  uploadPreset: 'dxd-magnate',
  apiKey: '753871594898224'
};
const ProfileSettings = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);
          setTempData(data);
          setPreviewUrl(data.profilePicture || user.photoURL);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setSnackbar({ open: true, message: "Failed to load profile data", severity: "error" });
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.match('image.*')) {
      setSnackbar({ open: true, message: "Please select an image file", severity: "error" });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: "File size should be less than 5MB", severity: "error" });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  const handleAvatarUpdate = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const user = auth.currentUser;
      if (!user) return;

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(selectedFile);

      // Update Firebase Auth profile
      await updateProfile(user, {
        photoURL: imageUrl
      });

      // Update Firestore user document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        profilePicture: imageUrl
      });

      // Update local state
      setUserData(prev => ({ ...prev, profilePicture: imageUrl }));
      setTempData(prev => ({ ...prev, profilePicture: imageUrl }));
      setPreviewUrl(imageUrl);

      setSnackbar({ open: true, message: "Profile picture updated successfully", severity: "success" });
      setOpenAvatarDialog(false);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setSnackbar({ open: true, message: "Failed to update profile picture", severity: "error" });
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Update Firebase Auth profile
      await updateProfile(user, {
        photoURL: ""
      });

      // Update Firestore user document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        profilePicture: ""
      });

      // Update local state
      setUserData(prev => ({ ...prev, profilePicture: "" }));
      setTempData(prev => ({ ...prev, profilePicture: "" }));
      setPreviewUrl(null);

      setSnackbar({ open: true, message: "Profile picture removed", severity: "success" });
      setOpenAvatarDialog(false);
    } catch (error) {
      console.error("Error removing profile picture:", error);
      setSnackbar({ open: true, message: "Failed to remove profile picture", severity: "error" });
    }
  };

  const handleSaveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, tempData);
      
      setUserData(tempData);
      setEditMode(false);
      setSnackbar({ open: true, message: "Profile updated successfully", severity: "success" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({ open: true, message: "Failed to update profile", severity: "error" });
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const user = auth.currentUser;
      
      if (passwordData.new !== passwordData.confirm) {
        setSnackbar({ open: true, message: "New passwords don't match", severity: "error" });
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.current
      );
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.new);
      
      setPasswordData({ current: "", new: "", confirm: "" });
      setSnackbar({ open: true, message: "Password updated successfully", severity: "success" });
    } catch (error) {
      console.error("Error updating password:", error);
      setSnackbar({ open: true, message: error.message || "Failed to update password", severity: "error" });
    }
  };

  const handleNotificationToggle = async (setting) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        notificationSettings: {
          ...userData.notificationSettings,
          [setting]: !userData.notificationSettings?.[setting]
        }
      });
      
      setUserData(prev => ({
        ...prev,
        notificationSettings: {
          ...prev.notificationSettings,
          [setting]: !prev.notificationSettings?.[setting]
        }
      }));
    } catch (error) {
      console.error("Error updating notification settings:", error);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  if (!userData) {
    return (
      <Box className="flex items-center justify-center h-64">
        <Typography>No user data found</Typography>
      </Box>
    );
  }

  return (
    <Box className="p-6 max-w-4xl mx-auto">
      {/* Header Section */}
      <Box className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <Box className="flex items-center space-x-4 mb-4 md:mb-0">
        <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box className={`w-3 h-3 rounded-full border-2 border-white ${
                userData?.profileStatus === "online" ? "bg-green-500" : "bg-gray-400"
              }`}></Box>
            }
          >
            <Box className="relative group">
              <Avatar
                alt={`${userData?.firstName} ${userData?.lastName}`}
                src={previewUrl}
                sx={{ width: 80, height: 80 }}
                className="shadow-lg ring-2 ring-white cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setOpenAvatarDialog(true)}
              />
              <Box className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setOpenAvatarDialog(true)}>
                <FiCamera className="text-white text-xl" />
              </Box>
            </Box>
          </Badge>
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              {userData.firstName} {userData.lastName}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-600">
              {userData.role || "Sales Executive"} • {userData.company || "DXD Magnate"}
            </Typography>
            <Box className="flex space-x-2 mt-2">
              <Chip
                label={userData.status === "active" ? "Active" : "Inactive"}
                color={userData.status === "active" ? "success" : "error"}
                size="small"
                icon={userData.status === "active" ? <FiCheckCircle size={14} /> : <FiX size={14} />}
                className="text-xs"
              />
              <Chip
                label={`Last active: ${new Date(userData.lastActive?.toDate()).toLocaleString()}`}
                color="info"
                size="small"
                className="text-xs"
              />
            </Box>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={editMode ? <FiSave /> : <FiEdit2 />}
          onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {editMode ? "Save Changes" : "Edit Profile"}
        </Button>
      </Box>

      {/* Tabs Navigation */}
      <Box className="mb-6">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="profile tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5',
              height: 3
            }
          }}
        >
          <Tab 
            label="Profile" 
            icon={<FiUser className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
          <Tab 
            label="Security" 
            icon={<FiLock className="mr-1" />} 
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
         
        
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 0 && (
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Box >
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Personal Information
              </Typography>
              
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={tempData.firstName || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                className="mb-4"
                disabled={!editMode}
                sx={{marginBottom:'10px'}}
              />
              
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={tempData.lastName || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                className="mb-4"
                disabled={!editMode}
                sx={{marginBottom:'10px'}}
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={tempData.email || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                className="mb-4"
                sx={{marginBottom:'10px'}}
                disabled
              />
              
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={tempData.phone || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                className="mb-4"
                sx={{marginBottom:'10px'}}
                disabled={!editMode}
              />
            </Box>
            
            <Box>
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Company Information
              </Typography>
              
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={tempData.company || "DXD Magnate"}
                onChange={handleInputChange}
                variant="outlined"
                sx={{marginBottom:'10px'}}
                size="small"
                className="mb-4"
                disabled
              />
              
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={tempData.username || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                className="mb-4"
                sx={{marginBottom:'10px'}}
                disabled={!editMode}
              />
              
              <TextField
                fullWidth
                label="Role"
                name="role"
                value={tempData.role || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{marginBottom:'10px'}}
                className="mb-4"
                disabled
              />
              
              <TextField
                fullWidth
                label="Account Created"
                name="createdAt"
                value={new Date(tempData.createdAt).toLocaleDateString()}
                variant="outlined"
                size="small"
                className="mb-4"
                sx={{marginBottom:'10px'}}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiCalendar className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box className="max-w-lg mx-auto">
            <Typography variant="h6" className="font-bold text-gray-800 mb-6">
              Change Password
            </Typography>
            
            <TextField
              fullWidth
              label="Current Password"
              name="current"
              type={showPassword.current ? "text" : "password"}
              value={passwordData.current}
              onChange={handlePasswordChange}
              sx={{marginBottom:'10px'}}
              variant="outlined"
              size="small"
              className="mb-4"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility("current")}
                      edge="end"
                    >
                      {showPassword.current ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="New Password"
              name="new"
              type={showPassword.new ? "text" : "password"}
              value={passwordData.new}
              onChange={handlePasswordChange}
              variant="outlined"
              size="small"
              className="mb-4"
              sx={{marginBottom:'10px'}}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility("new")}
                      edge="end"
                    >
                      {showPassword.new ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirm"
              type={showPassword.confirm ? "text" : "password"}
              value={passwordData.confirm}
              onChange={handlePasswordChange}
              variant="outlined"
              sx={{marginBottom:'10px'}}
              size="small"
              className="mb-6"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility("confirm")}
                      edge="end"
                    >
                      {showPassword.confirm ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="contained"
              startIcon={<FiLock />}
              onClick={handlePasswordUpdate}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
            >
              Update Password
            </Button>
            
            <Divider className="my-6" />
            
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Security Settings
            </Typography>
            
            <Box className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FiShield className="text-blue-600 mr-2" />
                  <Typography variant="body2" className="font-medium">
                    Two-Factor Authentication
                  </Typography>
                </div>
                <Switch color="primary" />
              </div>
              <Typography variant="caption" className="text-gray-600">
                Add an extra layer of security to your account
              </Typography>
            </Box>
          </Box>
        )}

      
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={openAvatarDialog} onClose={() => !isUploading && setOpenAvatarDialog(false)}>
        <DialogTitle className="flex justify-between items-center border-b border-gray-200 pb-3">
          <Typography variant="h6" className="font-bold">
            Update Profile Picture
          </Typography>
          <IconButton 
            onClick={() => !isUploading && setOpenAvatarDialog(false)}
            disabled={isUploading}
          >
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pt-4">
          <Box className="flex flex-col items-center">
            <Box className="relative mb-6">
              <Avatar
                src={previewUrl}
                sx={{ width: 120, height: 120 }}
                className="ring-2 ring-indigo-100 shadow-md"
              />
              {isUploading && (
                <CircularProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  size={124}
                  thickness={2}
                  className="absolute -top-2 -left-2 text-indigo-500"
                />
              )}
            </Box>

            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            <Box className="flex gap-3 mb-4">
              <label htmlFor="avatar-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FiUpload />}
                  disabled={isUploading}
                  className="border-indigo-500 text-indigo-600 hover:border-indigo-600"
                >
                  Upload New
                </Button>
              </label>
              
              {previewUrl && (
                <Button
                  variant="outlined"
                  startIcon={<FiTrash2 />}
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="border-red-500 text-red-600 hover:border-red-600"
                >
                  Remove
                </Button>
              )}
            </Box>
            
            <Typography variant="caption" className="text-gray-500 text-center">
              Recommended size: 500x500px, Max file size: 5MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 p-4">
          <Button
            onClick={() => !isUploading && setOpenAvatarDialog(false)}
            disabled={isUploading}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAvatarUpdate}
            disabled={!selectedFile || isUploading}
            variant="contained"
            className="bg-indigo-600 hover:bg-indigo-700"
            startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isUploading ? 'Uploading...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfileSettings;