import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box,
  TextField, Button, Divider, Switch, FormControlLabel,
  Avatar, Badge, IconButton, Paper, List, ListItem,
  ListItemText, ListItemSecondaryAction, Alert, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, CircularProgress, Chip
} from '@mui/material';
import {
  FiUser, FiMail, FiLock, FiBell, FiGlobe,
  FiCreditCard, FiCalendar, FiUpload, FiCheck, FiPhone,
  FiEye, FiEyeOff, FiLogOut, FiShield, FiRefreshCw,
  FiSmartphone, FiMonitor, FiTablet
} from 'react-icons/fi';
import { auth, db } from '../../../services/firebase';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

// Helper function to parse user agent
const parseUserAgent = (userAgent) => {
  if (/iPhone|iPad|iPod|Android/i.test(userAgent)) {
    return 'Mobile Device';
  } else if (/Tablet/i.test(userAgent)) {
    return 'Tablet';
  } else if (/Windows/i.test(userAgent)) {
    return 'Windows PC';
  } else if (/Macintosh/i.test(userAgent)) {
    return 'Mac';
  } else if (/Linux/i.test(userAgent)) {
    return 'Linux PC';
  }
  return 'Unknown Device';
};

// Helper function to format last active time
const formatLastActive = (timestamp) => {
  if (!timestamp) return 'Just now';
  const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

const SettingsTab = ({ profileData }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    darkMode: false,
    twoFactorAuth: false
  });

  const [formData, setFormData] = useState({
    firstName: profileData.firstName || '',
    lastName: profileData.lastName || '',
    email: profileData.email || '',
    phone: profileData.phone || '',
    company: profileData.company || '',
    timezone: 'GMT+5:30 (India Standard Time)'
  });

  // Password change state
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    return strength;
  };

  // Fetch active sessions from Firestore
  const fetchActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const user = auth.currentUser;
      if (!user) return;

      // Query sessions collection for this user
      const sessionsRef = collection(db, 'sessions');
      const q = query(
        sessionsRef,
        where('userId', '==', user.uid),
        where('active', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const sessionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isCurrent: doc.id === localStorage.getItem('currentSessionId')
      }));

      setSessions(sessionsData);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setErrorMessage('Failed to load active sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Helper function to format last active time
const formatLastActive = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  // Convert to Date object if it's a Firestore Timestamp
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};

  // Store current session on initial load
  useEffect(() => {
    const storeCurrentSession = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // Generate a unique session ID
      const sessionId = `session_${Date.now()}`;
      localStorage.setItem('currentSessionId', sessionId);

      // Store session in Firestore
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, {
        userId: user.uid,
        userAgent: navigator.userAgent,
        ip: await fetchClientIP(),
        active: true,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      // Refresh sessions list
      await fetchActiveSessions();
    };

    storeCurrentSession();
  }, []);

  // Fetch client IP
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

  // Revoke a specific session
  const revokeSession = async (sessionId) => {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, { active: false }, { merge: true });
      setSessions(sessions.filter(s => s.id !== sessionId));
      setSuccessMessage('Session revoked successfully');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error revoking session:', err);
      setErrorMessage('Failed to revoke session');
    }
  };

  // Revoke all sessions except current
  const revokeAllSessions = async () => {
    try {
      setRevokingAll(true);
      const user = auth.currentUser;
      if (!user) return;

      // Get current session ID
      const currentSessionId = localStorage.getItem('currentSessionId');

      // Update all active sessions except current to inactive
      const batch = [];
      sessions.forEach(session => {
        if (session.id !== currentSessionId) {
          const sessionRef = doc(db, 'sessions', session.id);
          batch.push(setDoc(sessionRef, { active: false }, { merge: true }));
        }
      });

      await Promise.all(batch);
      
      // Refresh sessions list
      await fetchActiveSessions();
      
      setSuccessMessage('All other sessions have been revoked');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error revoking all sessions:', err);
      setErrorMessage('Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    try {
      setChangingPassword(true);
      setPasswordError('');
      const user = auth.currentUser;
      
      // Validate inputs
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('Please fill in all password fields');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      
      if (passwordStrength < 3) {
        setPasswordError('Password is not strong enough');
        return;
      }
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      // Reset form and show success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength(0);
      setPasswordChangeOpen(false);
      
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle password input
  const handlePasswordInput = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Handle setting change
  const handleSettingChange = (name) => (event) => {
    setSettings({ ...settings, [name]: event.target.checked });
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically make an API call to update settings
    setSuccessMessage('Settings updated successfully!');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Get device icon
  const getDeviceIcon = (device) => {
    if (/iPhone|iPad|iPod|Android/i.test(device)) {
      return <FiSmartphone />;
    } else if (/Tablet/i.test(device)) {
      return <FiTablet />;
    }
    return <FiMonitor />;
  };

  return (
    <Box className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Profile Settings */}
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-bold text-gray-800 mb-4">
            Profile Settings
          </Typography>
          
        

          <form onSubmit={handleSubmit}>
  <Grid >  {/* Added spacing between grid items */}
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="First Name"
        name="firstName"
        value={formData.firstName}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        margin="normal" 
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Last Name"
        name="lastName"
        value={formData.lastName}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        margin="normal"
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        fullWidth
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        disabled
        margin="normal"
        InputProps={{
          startAdornment: <FiMail className="mr-2 text-gray-400" />
        }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Phone"
        name="phone"
        value={formData.phone}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        margin="normal"  
        InputProps={{
          startAdornment: <FiPhone className="mr-2 text-gray-400" />
        }}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Company"
        name="company"
        value={formData.company}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        margin="normal" 
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        fullWidth
        label="Timezone"
        name="timezone"
        value={formData.timezone}
        onChange={handleInputChange}
        variant="outlined"
        size="small"
        select
        margin="normal"  
        SelectProps={{ native: true }}
        InputProps={{
          startAdornment: <FiGlobe className="mr-2 text-gray-400" />
        }}
      >
        <option value="GMT+5:30 (India Standard Time)">
          GMT+5:30 (India Standard Time)
        </option>
        <option value="GMT-5:00 (Eastern Time)">
          GMT-5:00 (Eastern Time)
        </option>
        <option value="GMT+0:00 (GMT)">
          GMT+0:00 (GMT)
        </option>
      </TextField>
    </Grid>
  </Grid>

  <Box className="flex justify-end mt-6">
    <Button
      type="submit"
      variant="contained"
      className="bg-indigo-600 hover:bg-indigo-700"
      startIcon={<FiCheck />}
    >
      Save Changes
    </Button>
  </Box>
</form>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-bold text-gray-800 mb-4">
            Security Settings
          </Typography>
          
          <List className="space-y-2">
            <Paper component={ListItem} className="rounded-lg">
              <ListItemText
                primary="Two-Factor Authentication"
                secondary="Add an extra layer of security to your account"
              />
              <ListItemSecondaryAction>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={handleSettingChange('twoFactorAuth')}
                      color="primary"
                    />
                  }
                />
              </ListItemSecondaryAction>
            </Paper>

            <Paper component={ListItem} className="rounded-lg">
              <ListItemText
                primary="Change Password"
                secondary="Last changed 3 months ago"
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  size="small"
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  startIcon={<FiLock size={14} />}
                  onClick={() => setPasswordChangeOpen(true)}
                >
                  Change
                </Button>
              </ListItemSecondaryAction>
            </Paper>

            <Paper component={ListItem} className="rounded-lg">
              <ListItemText
                primary="Active Sessions"
                secondary={`${sessions.length} devices currently logged in`}
              />
              <ListItemSecondaryAction>
                <Button
                  variant="text"
                  size="small"
                  className="text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setSessionsDialogOpen(true)}
                >
                  View All
                </Button>
              </ListItemSecondaryAction>
            </Paper>
          </List>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-lg rounded-xl border border-red-200">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-bold text-red-800 mb-4">
            Danger Zone
          </Typography>
          
          <Box className="space-y-4">
            <Box className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-red-50 rounded-lg">
              <Box>
                <Typography variant="subtitle1" className="font-medium">
                  Deactivate Account
                </Typography>
                <Typography variant="body2" className="text-red-600">
                  Your account will be temporarily disabled
                </Typography>
              </Box>
              <Button
                variant="outlined"
                className="border-red-600 text-red-600 hover:bg-red-50 mt-2 md:mt-0"
              >
                Deactivate
              </Button>
            </Box>

            <Box className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-red-50 rounded-lg">
              <Box>
                <Typography variant="subtitle1" className="font-medium">
                  Delete Account
                </Typography>
                <Typography variant="body2" className="text-red-600">
                  Permanently remove your account and all data
                </Typography>
              </Box>
              <Button
                variant="outlined"
                className="border-red-600 text-red-600 hover:bg-red-50 mt-2 md:mt-0"
              >
                Delete Account
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog 
        open={passwordChangeOpen} 
        onClose={() => setPasswordChangeOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box className="space-y-4 pt-2">
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Current Password"
              name="currentPassword"
              type={showPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={handlePasswordInput}
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton 
                    onClick={() => setShowPassword(!showPassword)} 
                    size="small"
                    edge="end"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </IconButton>
                )
              }}
            />

            <TextField
              fullWidth
              label="New Password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={handlePasswordInput}
              variant="outlined"
              size="small"
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
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={handlePasswordInput}
              variant="outlined"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPasswordChangeOpen(false)}
            disabled={changingPassword}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={
              changingPassword ||
              !passwordData.currentPassword || 
              !passwordData.newPassword || 
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword ||
              passwordStrength < 3
            }
            startIcon={changingPassword ? <CircularProgress size={16} /> : null}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Active Sessions Dialog */}
      <Dialog 
        open={sessionsDialogOpen} 
        onClose={() => setSessionsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box className="flex justify-between items-center">
            <Typography variant="h6">Active Sessions</Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<FiLogOut />}
              onClick={revokeAllSessions}
              disabled={revokingAll || loadingSessions}
            >
              {revokingAll ? 'Revoking...' : 'Log Out All Devices'}
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingSessions ? (
            <Box className="flex justify-center py-4">
              <CircularProgress />
            </Box>
          ) : sessions.length === 0 ? (
            <Typography variant="body2" className="text-gray-600">
              No active sessions found.
            </Typography>
          ) : (
            <List className="space-y-3">
              {sessions.map((session) => (
                <ListItem key={session.id} className="p-0">
                  <Paper className="w-full p-3 rounded-lg border border-gray-200">
                    <Box className="flex items-start justify-between">
                      <Box className="flex items-start space-x-3">
                        <Avatar className="bg-blue-50 text-blue-600">
                          {getDeviceIcon(session.userAgent)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" className="font-bold">
                            {parseUserAgent(session.userAgent)}
                            {session.isCurrent && (
                              <Chip 
                                label="Current" 
                                size="small" 
                                className="ml-2 bg-green-100 text-green-800"
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600">
                            {formatLastActive(session.lastActive)} • IP: {session.ip}
                          </Typography>
                          <Typography variant="caption" className="text-gray-500">
                            {new Date(session.createdAt?.toDate()).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                      {!session.isCurrent && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => revokeSession(session.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsTab;