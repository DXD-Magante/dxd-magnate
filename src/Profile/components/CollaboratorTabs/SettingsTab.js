import React, { useState } from 'react';
import {
  Card, CardContent, Typography, Box,
  List, ListItem, ListItemText, Divider,
  Switch, TextField, Button, Alert, Grid
} from '@mui/material';
import { FiLock, FiBell, FiMail, FiUser } from 'react-icons/fi';

const SettingsTab = ({ profileData }) => {
  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    feedback: true,
    mentions: true,
    weeklyDigest: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleNotificationChange = (event) => {
    setNotifications({
      ...notifications,
      [event.target.name]: event.target.checked
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    
    // In a real app, you would call Firebase auth to update password
    console.log("Password update would happen here");
    setPasswordSuccess(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Notification Preferences
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText
                  primary="Task Updates"
                  secondary="Get notified about task assignments and updates"
                />
                <Switch
                  checked={notifications.taskUpdates}
                  onChange={handleNotificationChange}
                  name="taskUpdates"
                  color="primary"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Feedback & Reviews"
                  secondary="Receive notifications when you get new feedback"
                />
                <Switch
                  checked={notifications.feedback}
                  onChange={handleNotificationChange}
                  name="feedback"
                  color="primary"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Mentions"
                  secondary="Notify me when I'm mentioned in comments"
                />
                <Switch
                  checked={notifications.mentions}
                  onChange={handleNotificationChange}
                  name="mentions"
                  color="primary"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Weekly Digest"
                  secondary="Receive a weekly summary of your progress"
                />
                <Switch
                  checked={notifications.weeklyDigest}
                  onChange={handleNotificationChange}
                  name="weeklyDigest"
                  color="primary"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Change Password
            </Typography>
            
            {passwordSuccess && (
              <Alert severity="success" className="mb-4">
                Password updated successfully!
              </Alert>
            )}
            
            {passwordError && (
              <Alert severity="error" className="mb-4">
                {passwordError}
              </Alert>
            )}
            
            <form onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <FiLock className="mr-2 text-gray-400" />
                }}
              />
              
              <TextField
                fullWidth
                label="New Password"
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <FiLock className="mr-2 text-gray-400" />
                }}
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <FiLock className="mr-2 text-gray-400" />
                }}
              />
              
              <Box className="flex justify-end mt-4">
                <Button
                  type="submit"
                  variant="contained"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Update Password
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SettingsTab;