import React, { useState } from "react";
import { 
  Card, CardContent, Typography, Box, Grid, 
  TextField, Button, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress,
  CircularProgress, Snackbar, Alert, IconButton, List, ListItem
} from "@mui/material";
import { 
  FiMail, FiBell, FiBarChart2, FiDollarSign, 
  FiLock, FiShield, FiDatabase, FiUser, 
  FiPhone, FiHome, FiCheckCircle, FiXCircle,
  FiEye, FiEyeOff, FiDownload
} from "react-icons/fi";
import { auth, db } from "../../../services/firebase";
import { 
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  setDoc,
  doc
} from "firebase/firestore";

const SettingsTab = ({ userData, notificationSettings, handleNotificationChange }) => {
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Data export state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    return strength;
  };

  const handlePasswordInput = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'new') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setPasswordError('');
      
      // Validate inputs
      if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
        setPasswordError('All fields are required');
        return;
      }
      
      if (passwordData.new !== passwordData.confirm) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (passwordStrength < 3) {
        setPasswordError('Password is not strong enough');
        return;
      }
      
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.current
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.new);
      
      // Log password change
      await logPasswordChange(user);
      
      // Reset form and show success
      setPasswordData({ current: '', new: '', confirm: '' });
      setPasswordStrength(0);
      setPasswordDialogOpen(false);
      
      showSnackbar('Password changed successfully', 'success');
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const logPasswordChange = async (user) => {
    try {
      const ip = await fetchClientIP();
      const timestamp = serverTimestamp();
      
      // Log to data-export-logs
      await addDoc(collection(db, 'data-export-logs'), {
        userId: user.uid,
        userEmail: user.email,
        action: 'password_change',
        timestamp: timestamp,
        ipAddress: ip,
        userAgent: navigator.userAgent,
        status: 'completed'
      });
      
      // Log to sales-activity-logs
      await addDoc(collection(db, 'sales-activity-logs'), {
        userId: user.uid,
        userEmail: user.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        action: 'password_change',
        timestamp: timestamp,
        ipAddress: ip,
        userAgent: navigator.userAgent,
        status: 'success'
      });
      
      // Log to sales-team-activity
      await addDoc(collection(db, 'sales-team-activity'), {
        userId: user.uid,
        userEmail: user.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        action: 'security_update',
        details: 'Changed account password',
        timestamp: timestamp,
        status: 'completed'
      });
    } catch (error) {
      console.error('Error logging password change:', error);
    }
  };

  const handleRequestDataExport = async () => {
    try {
      setExportingData(true);
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const ip = await fetchClientIP();
      const timestamp = serverTimestamp();
      
      // Create data export request
      await addDoc(collection(db, 'data-export-requests'), {
        userId: user.uid,
        userEmail: user.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        format: exportFormat,
        status: 'pending',
        requestedAt: timestamp,
        ipAddress: ip,
        userAgent: navigator.userAgent
      });
      
      // Log to data-export-logs
      await addDoc(collection(db, 'data-export-logs'), {
        userId: user.uid,
        userEmail: user.email,
        action: 'data_export_request',
        format: exportFormat,
        timestamp: timestamp,
        ipAddress: ip,
        userAgent: navigator.userAgent,
        status: 'requested'
      });
      
      // Log to sales-activity-logs
      await addDoc(collection(db, 'sales-activity-logs'), {
        userId: user.uid,
        userEmail: user.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        action: 'data_export_request',
        timestamp: timestamp,
        ipAddress: ip,
        userAgent: navigator.userAgent,
        status: 'requested'
      });
      
      // Log to sales-team-activity
      await addDoc(collection(db, 'sales-team-activity'), {
        userId: user.uid,
        userEmail: user.email,
        userName: `${userData.firstName} ${userData.lastName}`,
        action: 'data_export',
        details: `Requested data export in ${exportFormat} format`,
        timestamp: timestamp,
        status: 'requested'
      });
      
      setExportDialogOpen(false);
      showSnackbar('Data export requested successfully', 'success');
    } catch (error) {
      alert(error)
      console.error('Error requesting data export:', error);
      showSnackbar('Failed to request data export', 'error');
    } finally {
      setExportingData(false);
    }
  };

  const fetchClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (err) {
      console.error('Error fetching IP:', err);
      return 'unknown';
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
    return (
      <Box className="space-y-6">
        {/* Profile Settings */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Profile Settings 
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={userData.firstName || ''}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FiUser className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={userData.lastName || ''}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  value={userData.email || ''}
                  variant="outlined"
                  disabled
                  InputProps={{
                    startAdornment: (
                      <FiMail className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={userData.phone || ''}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FiPhone className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Location"
                  fullWidth
                  value={userData.location || ''}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FiHome className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box className="flex justify-end">
                  <Button 
                    variant="contained"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Update Profile
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Notification Settings */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Notification Preferences
            </Typography>
            
            <Box className="space-y-4">
              {[
                { 
                  label: 'Email Notifications', 
                  description: 'Receive important updates via email',
                  icon: <FiMail className="text-gray-500" />,
                  key: 'email'
                },
                { 
                  label: 'Push Notifications', 
                  description: 'Get real-time alerts on your device',
                  icon: <FiBell className="text-gray-500" />,
                  key: 'push'
                },
                { 
                  label: 'Weekly Reports', 
                  description: 'Get a summary of your performance every week',
                  icon: <FiBarChart2 className="text-gray-500" />,
                  key: 'weeklyReport'
                },
                { 
                  label: 'Deal Updates', 
                  description: 'Notify me when deal status changes',
                  icon: <FiDollarSign className="text-gray-500" />,
                  key: 'dealUpdates'
                }
              ].map((item, index) => (
                <Box key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <Box className="flex items-center space-x-3">
                    <Box className="p-2 bg-gray-100 rounded-full">
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="body1" className="font-medium">
                        {item.label}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500">
                        {item.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={notificationSettings[item.key]}
                    onChange={() => handleNotificationChange(item.key)}
                    color="primary"
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-bold text-gray-800 mb-4">
            Security Settings
          </Typography>
          
          <Box className="space-y-4">
            <Box className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <Box className="flex items-center space-x-3">
                <Box className="p-2 bg-gray-100 rounded-full">
                  <FiLock className="text-gray-500" />
                </Box>
                <Box>
                  <Typography variant="body1" className="font-medium">
                    Change Password
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    Update your account password
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined"
                onClick={() => setPasswordDialogOpen(true)}
              >
                Change
              </Button>
            </Box>
            
            <Box className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <Box className="flex items-center space-x-3">
                <Box className="p-2 bg-gray-100 rounded-full">
                  <FiShield className="text-gray-500" />
                </Box>
                <Box>
                  <Typography variant="body1" className="font-medium">
                    Two-Factor Authentication
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    Add an extra layer of security to your account
                  </Typography>
                </Box>
              </Box>
              <Switch 
                color="primary" 
                checked={false}
                onChange={() => showSnackbar('2FA feature coming soon', 'info')}
              />
            </Box>
            
            <Box className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <Box className="flex items-center space-x-3">
                <Box className="p-2 bg-gray-100 rounded-full">
                  <FiDatabase className="text-gray-500" />
                </Box>
                <Box>
                  <Typography variant="body1" className="font-medium">
                    Data Export
                  </Typography>
                  <Typography variant="body2" className="text-gray-500">
                    Download all your personal data
                  </Typography>
                </Box>
              </Box>
              <Button 
                variant="outlined"
                onClick={() => setExportDialogOpen(true)}
                startIcon={<FiDownload />}
              >
                Request Data
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="font-bold">
          <Box className="flex items-center">
            <FiLock className="mr-2" />
            Change Password
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-3 mt-3">
            <TextField
              fullWidth
              label="Current Password"
              name="current"
              type={showPassword ? "text" : "password"}
              value={passwordData.current}
              onChange={handlePasswordInput}
              InputProps={{
                endAdornment: (
                  <IconButton 
                    onClick={() => setShowPassword(!showPassword)}
                    size="small"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </IconButton>
                )
              }}
            />
            
            <TextField
              fullWidth
              label="New Password"
              name="new"
              type={showPassword ? "text" : "password"}
              value={passwordData.new}
              onChange={handlePasswordInput}
            />
            
            <Box className="mb-2">
              <LinearProgress 
                variant="determinate" 
                value={passwordStrength * 25} 
                sx={{ 
                  height: 4,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 
                      passwordStrength >= 4 ? '#10B981' : 
                      passwordStrength >= 3 ? '#3B82F6' : 
                      passwordStrength >= 2 ? '#F59E0B' : '#EF4444'
                  }
                }} 
              />
              <Typography variant="caption" className={
                passwordStrength >= 4 ? 'text-green-600' : 
                passwordStrength >= 3 ? 'text-blue-600' : 
                passwordStrength >= 2 ? 'text-amber-600' : 'text-red-600'
              }>
                {passwordStrength >= 4 ? 'Strong' : 
                  passwordStrength >= 3 ? 'Good' : 
                  passwordStrength >= 2 ? 'Fair' : 'Weak'} password
              </Typography>
            </Box>
            
            <TextField
              fullWidth
              label="Confirm New Password"
              name="confirm"
              type={showPassword ? "text" : "password"}
              value={passwordData.confirm}
              onChange={handlePasswordInput}
            />
            
            {passwordError && (
              <Alert severity="error" className="mt-2">
                {passwordError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPasswordDialogOpen(false)}
            className="text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={
              changingPassword ||
              !passwordData.current || 
              !passwordData.new || 
              !passwordData.confirm ||
              passwordData.new !== passwordData.confirm ||
              passwordStrength < 3
            }
          >
            {changingPassword ? (
              <CircularProgress size={24} color="inherit" />
            ) : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Export Dialog */}
      <Dialog 
        open={exportDialogOpen} 
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="font-bold">
          <Box className="flex items-center">
            <FiDatabase className="mr-2" />
            Request Data Export
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-3">
            <Typography variant="body1">
              You can request an export of all your personal data stored in our systems.
              The exported data will include:
            </Typography>
            
            <List dense>
              <ListItem>
                <Box className="flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  <Typography variant="body2">Your profile information</Typography>
                </Box>
              </ListItem>
              <ListItem>
                <Box className="flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  <Typography variant="body2">All leads and customer interactions</Typography>
                </Box>
              </ListItem>
              <ListItem>
                <Box className="flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  <Typography variant="body2">Performance metrics and reports</Typography>
                </Box>
              </ListItem>
              <ListItem>
                <Box className="flex items-center">
                  <FiCheckCircle className="text-green-500 mr-2" />
                  <Typography variant="body2">Activity logs</Typography>
                </Box>
              </ListItem>
            </List>
            
            <Box>
              <Typography variant="body1" className="font-medium mb-2">
                Export Format
              </Typography>
              <Box className="flex space-x-4">
                <Button
                  variant={exportFormat === 'json' ? 'contained' : 'outlined'}
                  onClick={() => setExportFormat('json')}
                  className={exportFormat === 'json' ? 'bg-indigo-600' : ''}
                >
                  JSON
                </Button>
                <Button
                  variant={exportFormat === 'csv' ? 'contained' : 'outlined'}
                  onClick={() => setExportFormat('csv')}
                  className={exportFormat === 'csv' ? 'bg-indigo-600' : ''}
                >
                  CSV
                </Button>
                <Button
                  variant={exportFormat === 'pdf' ? 'contained' : 'outlined'}
                  onClick={() => setExportFormat('pdf')}
                  className={exportFormat === 'pdf' ? 'bg-indigo-600' : ''}
                >
                  PDF
                </Button>
              </Box>
            </Box>
            
            <Alert severity="info" className="mt-4">
              Your data export will be prepared and sent to your email within 24 hours.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setExportDialogOpen(false)}
            className="text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequestDataExport}
            variant="contained"
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={exportingData}
          >
            {exportingData ? (
              <CircularProgress size={24} color="inherit" />
            ) : 'Request Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
    </Box>
  );
};

export default SettingsTab;