// SettingsProfile.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, Button, Card, CardContent,
  Grid, Divider, TextField, Snackbar, Alert, Badge,
  IconButton, LinearProgress
} from '@mui/material';
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar,
  FiLock, FiUpload, FiCheck, FiX, FiCamera
} from 'react-icons/fi';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { FaBuilding } from 'react-icons/fa';


const SettingsProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const currentUser = auth.currentUser;

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
        setSnackbar({
          open: true,
          message: 'Failed to load profile data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

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
        setSnackbar({
          open: true,
          message: 'Profile picture updated',
          severity: 'success'
        });
        setSaving(false);
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      setSaving(false);
      setSnackbar({
        open: true,
        message: 'Error uploading profile picture',
        severity: 'error'
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        firstName: tempData.firstName,
        lastName: tempData.lastName,
        company: tempData.company,
        phone: tempData.phone,
        ...(tempData.photoURL && { photoURL: tempData.photoURL })
      });
      
      setProfileData(tempData);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
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

  return (
    <Box className="max-w-5xl mx-auto">
      {/* Header */}
      <Box className="mb-8">
        <Typography variant="h4" className="font-bold text-gray-800 mb-2">
          Profile Settings
        </Typography>
        <Typography variant="body1" className="text-gray-600">
          Manage your personal information and account details
        </Typography>
      </Box>

      {/* Profile Card */}
      <Card className="shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <CardContent className="p-6">
          <Grid container spacing={4}>
            {/* Left Column - Avatar */}
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
                      />
                    </IconButton>
                  }
                >
                  <Avatar
                    src={tempData.photoURL || `https://ui-avatars.com/api/?name=${tempData.firstName}+${tempData.lastName}&background=4f46e5&color=fff`}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      border: '2px solid #e2e8f0'
                    }}
                    className="shadow-md"
                  />
                </Badge>

                <Typography variant="h6" className="font-bold text-gray-800 mt-4">
                  {tempData.firstName} {tempData.lastName}
                </Typography>
                <Typography variant="body2" className="text-gray-500">
                  {tempData.company || 'No company specified'}
                </Typography>

                <Divider className="w-full my-4" />

                <Box className="w-full space-y-2">
                  <Box className="flex items-center text-gray-600">
                    <FiMail className="mr-2 text-gray-400" />
                    <Typography variant="body2">{tempData.email}</Typography>
                  </Box>
                  <Box className="flex items-center text-gray-600">
                    <FiPhone className="mr-2 text-gray-400" />
                    <Typography variant="body2">
                      {tempData.phone || 'No phone number'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right Column - Form */}
            <Grid item xs={12} md={8}>
              <Box className="space-y-4">
                <Typography variant="h6" className="font-bold text-gray-800">
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
                      InputProps={{
                        startAdornment: <FiUser className="mr-2 text-gray-400" />
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={tempData.company || ''}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    startAdornment: <FaBuilding className="mr-2 text-gray-400" />
                  }}
                />

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={tempData.email || ''}
                  variant="outlined"
                  size="small"
                  disabled
                  InputProps={{
                    startAdornment: <FiMail className="mr-2 text-gray-400" />
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
                  placeholder="+1 (555) 123-4567"
                  InputProps={{
                    startAdornment: <FiPhone className="mr-2 text-gray-400" />
                  }}
                />

                <Divider className="my-4" />

                <Typography variant="h6" className="font-bold text-gray-800">
                  Security
                </Typography>

                <Box className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Box>
                    <Typography variant="subtitle2" className="font-medium">
                      Password
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      Last changed 3 months ago
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<FiLock />}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    onClick={() => navigate('/settings/change-password')}
                  >
                    Change Password
                  </Button>
                </Box>

                <Box className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outlined"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    startIcon={<FiX />}
                    onClick={() => setTempData(profileData)}
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
    </Box>
  );
};

export default SettingsProfile;