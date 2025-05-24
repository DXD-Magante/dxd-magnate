import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Divider,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Avatar,
  Badge,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,

} from '@mui/material';
import {
  FiBell,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiMessageSquare,
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiX,
  FiSave,
  FiRefreshCw,
  FiSliders,
  FiClock
} from 'react-icons/fi';
import { styled } from '@mui/material/styles';
import { auth, db } from '../../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  minHeight: 48,
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.pxToRem(14),
  marginRight: theme.spacing(1),
  color: 'rgba(255, 255, 255, 0.7)',
  '&.Mui-selected': {
    color: '#fff',
  },
  '&.Mui-focusVisible': {
    backgroundColor: 'rgba(100, 95, 228, 0.32)',
  },
}));

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState('preferences');
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    projectUpdates: true,
    taskAssignments: true,
    invoiceReminders: true,
    approvalRequests: true,
    meetingReminders: true,
    urgentAlerts: true,
    digestFrequency: 'weekly',
    quietHoursEnabled: false,
    quietStartTime: '22:00',
    quietEndTime: '07:00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.notificationSettings) {
            setNotificationSettings(userData.notificationSettings);
          }
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingChange = (setting) => (event) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: event.target.checked
    });
  };

  const handleTimeChange = (setting) => (event) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: event.target.value
    });
  };

  const handleSelectChange = (setting) => (event) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: event.target.value
    });
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationSettings: notificationSettings
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setNotificationSettings({
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      projectUpdates: true,
      taskAssignments: true,
      invoiceReminders: true,
      approvalRequests: true,
      meetingReminders: true,
      urgentAlerts: true,
      digestFrequency: 'weekly',
      quietHoursEnabled: false,
      quietStartTime: '22:00',
      quietEndTime: '07:00'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body1" mt={2}>Loading notification settings...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="notification settings tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5',
              height: 3,
            },
          }}
        >
          <StyledTab label="Notification Preferences" value="preferences" icon={<FiSliders size={18} />} iconPosition="start" />
          <StyledTab label="Delivery Methods" value="delivery" icon={<FiMail size={18} />} iconPosition="start" />
          <StyledTab label="Quiet Hours" value="quiet" icon={<FiClock size={18} />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 'preferences' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FiBell className="mr-2" /> Project Notifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.projectUpdates}
                        onChange={handleSettingChange('projectUpdates')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Project Updates</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Major milestones, status changes
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.taskAssignments}
                        onChange={handleSettingChange('taskAssignments')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Task Assignments</Typography>
                        <Typography variant="caption" color="text.secondary">
                          When new tasks are assigned to you
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.approvalRequests}
                        onChange={handleSettingChange('approvalRequests')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Approval Requests</Typography>
                        <Typography variant="caption" color="text.secondary">
                          When your approval is needed
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FiDollarSign className="mr-2" /> Financial Notifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.invoiceReminders}
                        onChange={handleSettingChange('invoiceReminders')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Invoice Reminders</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Upcoming and overdue invoices
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FiAlertCircle className="mr-2" /> Urgent Notifications
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.urgentAlerts}
                        onChange={handleSettingChange('urgentAlerts')}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography>Urgent Alerts</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Critical issues requiring immediate attention
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'delivery' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Delivery Channels
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.emailEnabled}
                          onChange={handleSettingChange('emailEnabled')}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiMail className="mr-2" />
                          <Typography>Email Notifications</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                      Receive notifications via your registered email
                    </Typography>
                  </Box>
                  
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.pushEnabled}
                          onChange={handleSettingChange('pushEnabled')}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiBell className="mr-2" />
                          <Typography>Push Notifications</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                      Receive notifications in your browser or mobile app
                    </Typography>
                  </Box>
                  
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSettings.smsEnabled}
                          onChange={handleSettingChange('smsEnabled')}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiPhone className="mr-2" />
                          <Typography>SMS Notifications</Typography>
                        </Box>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 4, display: 'block' }}>
                      Receive urgent notifications via SMS (standard rates may apply)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Notification Digest
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="digest-frequency-label">Digest Frequency</InputLabel>
                  <Select
                    labelId="digest-frequency-label"
                    value={notificationSettings.digestFrequency}
                    onChange={handleSelectChange('digestFrequency')}
                    label="Digest Frequency"
                  >
                    <MenuItem value="disabled">Disabled</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Receive a summary of non-urgent notifications
                  </Typography>
                </FormControl>
                
                <Box sx={{ backgroundColor: '#f8fafc', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Current Notification Channels
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {notificationSettings.emailEnabled && (
                      <Chip
                        avatar={<Avatar><FiMail size={16} /></Avatar>}
                        label="Email"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {notificationSettings.pushEnabled && (
                      <Chip
                        avatar={<Avatar><FiBell size={16} /></Avatar>}
                        label="Push"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {notificationSettings.smsEnabled && (
                      <Chip
                        avatar={<Avatar><FiPhone size={16} /></Avatar>}
                        label="SMS"
                        variant="outlined"
                        size="small"
                      />
                    )}
                    {!notificationSettings.emailEnabled && !notificationSettings.pushEnabled && !notificationSettings.smsEnabled && (
                      <Typography variant="caption" color="text.secondary">
                        No active notification channels
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'quiet' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Quiet Hours
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.quietHoursEnabled}
                      onChange={handleSettingChange('quietHoursEnabled')}
                      color="primary"
                    />
                  }
                  label="Enable Quiet Hours"
                  sx={{ mb: 3 }}
                />
                
                {notificationSettings.quietHoursEnabled && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="time"
                        value={notificationSettings.quietStartTime}
                        onChange={handleTimeChange('quietStartTime')}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="time"
                        value={notificationSettings.quietEndTime}
                        onChange={handleTimeChange('quietEndTime')}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        During quiet hours, only urgent notifications will be delivered
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Notification Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ 
                  backgroundColor: '#f8fafc', 
                  p: 3, 
                  borderRadius: 1,
                  borderLeft: '4px solid #4f46e5'
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Sample Notification
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {notificationSettings.quietHoursEnabled ? 
                      "During quiet hours, you would only see urgent alerts like:" : 
                      "You would receive notifications like:"}
                  </Typography>
                  
                  <Box sx={{ 
                    backgroundColor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {notificationSettings.quietHoursEnabled ?
                        "🚨 Urgent: Project deadline moved up!" :
                        "New task assigned: Review homepage design"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FiRefreshCw />}
          onClick={handleResetDefaults}
          disabled={saving}
        >
          Reset Defaults
        </Button>
        <Button
          variant="contained"
          startIcon={<FiSave />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': {
              backgroundColor: '#4338ca'
            }
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {saveSuccess && (
        <Box sx={{ 
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#10b981',
          color: 'white',
          px: 3,
          py: 2,
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <FiCheck className="mr-2" />
          <Typography>Notification settings saved successfully!</Typography>
        </Box>
      )}
    </Box>
  );
};

export default NotificationSettings;