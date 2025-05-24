import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, Button, Card, CardContent,
  Grid, Divider, TextField, Snackbar, Alert, Badge,
  IconButton, LinearProgress, Chip, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar,
  FiLock, FiUpload, FiCheck, FiX, FiCamera, FiGlobe,
  FiBriefcase, FiAward, FiClock, FiActivity
} from 'react-icons/fi';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import ChangePasswordModal from './ChangePasswordModal';

const CollaboratorProfileSettings = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const currentUser = auth.currentUser;

  // Helper function to safely format dates
  const formatDateSafe = (dateValue, fallback = 'N/A', dateFormat = 'MMM d, yyyy h:mm a') => {
    try {
      if (!dateValue) return fallback;
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? fallback : format(date, dateFormat);
    } catch (e) {
      return fallback;
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (currentUser?.uid) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            setProfileData(data);
            setTempData(data);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        showSnackbar('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result;
        setTempData(prev => ({ ...prev, photoURL: base64Image }));
        
        // Update Firestore directly
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          photoURL: base64Image
        });
        
        setProfileData(prev => ({ ...prev, photoURL: base64Image }));
        showSnackbar('Profile picture updated successfully');
        setSaving(false);
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      setSaving(false);
      showSnackbar('Error uploading profile picture', 'error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        firstName: tempData.firstName,
        lastName: tempData.lastName,
        username: tempData.username,
        department: tempData.department,
        phone: tempData.phone,
        ...(tempData.photoURL && { photoURL: tempData.photoURL })
      });
      
      setProfileData(tempData);
      setIsEditing(false);
      showSnackbar('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showSnackbar('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setTempData(profileData);
    setIsEditing(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-64">
        <LinearProgress className="w-full max-w-md" />
      </Box>
    );
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    offline: 'bg-gray-100 text-gray-800',
    busy: 'bg-yellow-100 text-yellow-800',
    away: 'bg-blue-100 text-blue-800'
  };

  return (
    <Box className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <Box className="mb-8">
        <Typography variant="h4" className="font-bold text-gray-800 mb-2">
          Profile Settings
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Manage your professional profile and personal information
        </Typography>
      </Box>

      {/* Profile Card */}
      <Card className="shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <CardContent className="p-6">
          <Grid container spacing={4}>
            {/* Left Column - Avatar & Basic Info */}
            <Grid item xs={12} md={4}>
              <Box className="flex flex-col items-center">
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton 
                      component="label"
                      className="bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                      size="small"
                    >
                      <FiCamera size={14} />
                      <input 
                        type="file" 
                        hidden 
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={saving}
                      />
                    </IconButton>
                  }
                >
                  <Avatar
                    src={tempData.photoURL || `https://ui-avatars.com/api/?name=${tempData.firstName}+${tempData.lastName}&background=4f46e5&color=fff`}
                    sx={{ 
                      width: 140, 
                      height: 140,
                      border: '3px solid #e2e8f0'
                    }}
                    className="shadow-lg"
                  />
                </Badge>

                <Box className="text-center mt-4">
                  <Typography variant="h5" className="font-bold text-gray-800">
                    {tempData.firstName} {tempData.lastName}
                  </Typography>
                  <Typography variant="body2" className="text-indigo-600 font-medium">
                    @{tempData.username}
                  </Typography>
                  
                  <Chip
                    label={tempData.profileStatus || 'active'}
                    size="small"
                    className={`mt-2 capitalize ${statusColors[tempData.profileStatus?.toLowerCase() || 'active']}`}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Divider className="w-full my-4" />

                {/* Stats */}
                <Box className="w-full space-y-4">
                  <Box className="flex justify-between">
                    <Typography variant="body2" className="text-gray-500">
                      <FiClock className="inline mr-2" />
                      Last Active
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {formatDateSafe(tempData.lastActive, 'Recently')}
                    </Typography>
                  </Box>
                  
                  <Box className="flex justify-between">
                    <Typography variant="body2" className="text-gray-500">
                      <FiActivity className="inline mr-2" />
                      Member Since
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {formatDateSafe(tempData.createdAt || tempData.memberSince, 'N/A', 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                  
                  <Box className="flex justify-between">
                    <Typography variant="body2" className="text-gray-500">
                      <FiAward className="inline mr-2" />
                      Role
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {tempData.role || 'Collaborator'}
                    </Typography>
                  </Box>
                </Box>

                <Divider className="w-full my-4" />

                {/* Contact Info */}
                <Box className="w-full space-y-3">
                  <Typography variant="subtitle2" className="font-bold text-gray-700">
                    Contact Information
                  </Typography>
                  
                  <Box className="flex items-center text-gray-600">
                    <FiMail className="mr-2 text-gray-400" />
                    <Typography variant="body2" className="truncate">
                      {tempData.email}
                    </Typography>
                  </Box>
                  
                  <Box className="flex items-center text-gray-600">
                    <FiPhone className="mr-2 text-gray-400" />
                    <Typography variant="body2">
                      {tempData.phone || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Form */}
            <Grid item xs={12} md={8}>
              <Box className="space-y-6">
                {/* Edit Button */}
                <Box className="flex justify-end">
                  {!isEditing ? (
                    <Button
                      variant="outlined"
                      startIcon={<FiEdit2 />}
                      onClick={() => setIsEditing(true)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box className="flex space-x-2">
                      <Button
                        variant="outlined"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        startIcon={<FiX />}
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        startIcon={<FiCheck />}
                        onClick={handleSaveProfile}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Personal Information */}
                <Box className="bg-gray-50 p-4 rounded-lg">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Personal Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        name="firstName"
                        value={tempData.firstName || ''}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <FiUser className="mr-2 text-gray-400" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        name="lastName"
                        value={tempData.lastName || ''}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <FiUser className="mr-2 text-gray-400" />
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={3} className="mt-2">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={tempData.username || ''}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <FiUser className="mr-2 text-gray-400" />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small" disabled={!isEditing}>
                        <InputLabel>Department</InputLabel>
                        <Select
                          label="Department"
                          name="department"
                          value={tempData.department || ''}
                          onChange={handleInputChange}
                          startAdornment={<FiBriefcase className="mr-2 text-gray-400" />}
                        >
                          <MenuItem value="Development">Development</MenuItem>
                          <MenuItem value="Design">Design</MenuItem>
                          <MenuItem value="Marketing">Marketing</MenuItem>
                          <MenuItem value="Sales">Sales</MenuItem>
                          <MenuItem value="Support">Support</MenuItem>
                          <MenuItem value="Operations">Operations</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>

                {/* Contact Information */}
                <Box className="bg-gray-50 p-4 rounded-lg">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Contact Information
                  </Typography>

                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={tempData.email || ''}
                    variant="outlined"
                    size="small"
                    disabled
                    className="mb-3"
                    InputProps={{
                      startAdornment: <FiMail className="mr-2 text-gray-400" />
                    }}
                    sx={{
                        marginBottom:'10px'
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={tempData.phone || ''}
                    onChange={handleInputChange}
                    variant="outlined"
                    size="small"
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                    InputProps={{
                      startAdornment: <FiPhone className="mr-2 text-gray-400" />
                    }}
                  />
                </Box>

                {/* Security Section */}
                <Box className="bg-gray-50 p-4 rounded-lg">
                  <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                    Security
                  </Typography>

                  <Box className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <Box>
                      <Typography variant="subtitle2" className="font-medium">
                        Password
                      </Typography>
                      <Typography variant="caption" className="text-gray-500">
                        Last changed {formatDateSafe(tempData.passwordChangedAt, 'Recently', 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<FiLock />}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      onClick={() => setChangePasswordOpen(true)}
                    >
                      Change Password
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

      <ChangePasswordModal 
  open={changePasswordOpen} 
  onClose={() => setChangePasswordOpen(false)} 
/>
    </Box>
  );
};

export default CollaboratorProfileSettings;