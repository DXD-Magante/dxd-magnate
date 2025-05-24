import React, { useEffect, useState } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, 
  Switch, Button, TextField, IconButton, LinearProgress,
  Chip, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, Paper, Avatar, CircularProgress,  Dialog,
  DialogTitle, DialogContent, DialogActions, Alert,  FormGroup,
  FormControlLabel,
} from '@mui/material';
import { 
  FiShield, FiLogOut, FiEye, FiEyeOff, FiKey, 
  FiAlertCircle, FiHardDrive, FiDatabase, FiServer, 
  FiCode, FiLayers, FiCheckCircle, FiChevronDown,
  FiSettings, FiRefreshCw, FiDownload,
  FiSmartphone, FiMonitor, FiTablet, FiClock, FiCopy
} from 'react-icons/fi';
import { auth, db } from '../../../services/firebase';
import { 
  fetchActiveSessions, 
  revokeSession, 
  revokeAllSessions,
  parseUserAgent,
  formatLastActive
} from '../../../utils/SecurityUtils';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  multiFactor,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  TotpMultiFactorGenerator,
  TotpSecret
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  serverTimestamp, 
  setDoc,
  getDoc,
  doc
} from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { copyToClipboard } from '../../../utils/CommonUtils';

const SecurityTab = () => {
  // Password state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Access logs state
  const [accessLogs, setAccessLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Two-factor auth state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [totpSecret, setTotpSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [alertPreferences, setAlertPreferences] = useState({
    failedLogins: { email: true, sms: false },
    passwordChanges: { email: true, sms: true },
    dataExports: { email: true, sms: false },
    sensitiveActions: { email: true, sms: true, push: true },
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    return strength;
  };


  const fetchAlertPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const user = auth.currentUser;
      if (!user) return;
  
      const docRef = doc(db, 'alert-preferences', user.uid);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        setAlertPreferences(docSnap.data());
      } else {
        // Set default preferences if none exist
        await setDoc(docRef, alertPreferences);
        await logAlertPreferencesActivity(user, 'initialize');
      }
    } catch (err) {
      console.error('Error fetching alert preferences:', err);
      setError('Failed to load alert preferences');
    } finally {
      setLoadingPreferences(false);
    }
  };
  
  const updateAlertPreferences = async (newPreferences) => {
    try {
      setLoadingPreferences(true);
      const user = auth.currentUser;
      if (!user) return;
  
      const docRef = doc(db, 'alert-preferences', user.uid);
      await setDoc(docRef, newPreferences);
      setAlertPreferences(newPreferences);
  
      // Log the activity
      await logAlertPreferencesActivity(user, 'update');
      
      // Also update access logs
      await logAccessActivity(user, 'alert_preferences_update');
    } catch (err) {
      console.error('Error updating alert preferences:', err);
      setError('Failed to update alert preferences');
    } finally {
      setLoadingPreferences(false);
    }
  };
  
  const resetToDefaultPreferences = async () => {
    const defaultPreferences = {
      failedLogins: { email: true, sms: false },
      passwordChanges: { email: true, sms: true },
      dataExports: { email: true, sms: false },
      sensitiveActions: { email: true, sms: true, push: true },
    };
    
    await updateAlertPreferences(defaultPreferences);
  };
  
  const logAlertPreferencesActivity = async (user, action) => {
    try {
      const timestamp = serverTimestamp();
      const ip = await fetchClientIP();
  
      await addDoc(collection(db, 'admin-activities'), {
        userId: user.uid,
        userEmail: user.email,
        activityType: 'security',
        action: `alert_preferences_${action}`,
        timestamp: timestamp,
        metadata: {
          ipAddress: ip,
          userAgent: navigator.userAgent,
          preferences: alertPreferences,
        },
        status: 'completed'
      });
    } catch (err) {
      console.error('Error logging alert preferences activity:', err);
    }
  };
  
  const logAccessActivity = async (user, action) => {
    try {
      const timestamp = serverTimestamp();
      const ip = await fetchClientIP();
  
      await addDoc(collection(db, 'admin-access-logs'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Unknown',
        action: action,
        timestamp: timestamp,
        ipAddress: ip,
        userAgent: navigator.userAgent,
        status: 'success'
      });
    } catch (err) {
      console.error('Error logging access activity:', err);
    }
  };

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

  // Format action names
  const formatActionName = (action) => {
    const actionsMap = {
      'password_change': 'Password Changed',
      'login': 'User Login',
      'logout': 'User Logout',
      'session_revoked': 'Session Revoked',
      'failed_login': 'Failed Login Attempt',
    };
    return actionsMap[action] || action.replace(/_/g, ' ');
  };


  const refreshToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user signed in");
    
    // Force Firebase to refresh the token
    const refreshedToken = await user.getIdToken(true); // true = force refresh
    return user;
  };
  
    // Check if 2FA is enabled
    useEffect(() => {
      const checkMFAStatus = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          
          const enrolledFactors = multiFactor(user).enrolledFactors;
          setTwoFactorEnabled(enrolledFactors.length > 0);
        } catch (err) {
          console.error('Error checking MFA status:', err);
          if (err.code === 'auth/invalid-user-token') {
            setAuthError('Session expired. Please refresh the page.');
          }
        }
      };
      
      checkMFAStatus();
    }, []);
  
    const generateTotpSecret = async () => {
      try {
        setIsSettingUp(true);
        
        // Refresh token first!
        const user = await refreshToken(); 
        if (!user) throw new Error("User not authenticated");
    
        const secret = await TotpMultiFactorGenerator.generateSecret(
          multiFactor(user),
          user.email || "My App",
          "My App"
        );
        
        setTotpSecret(secret);
        setDialogOpen(true);
      } catch (error) {
        if (error.code === "auth/invalid-user-token") {
          // Token is invalid - require reauthentication
          setAuthError("Session expired. Please sign in again.");
        } else {
          setError("2FA setup failed: " + error.message);
        }
      } finally {
        setIsSettingUp(false);
      }
    };

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          setAuthError("Your session expired. Please sign in.");
        }
      });
      return () => unsubscribe();
    }, []);
    // Verify TOTP code
    const verifyTotpCode = async () => {
      try {
        setIsVerifying(true);
        setVerificationError('');
        
        if (!verificationCode || !totpSecret) {
          throw new Error('Verification code is required');
        }
        
        const user = await refreshToken();
        if (!user) throw new Error('User not authenticated');
        
        const assertion = TotpMultiFactorGenerator.assertionForEnrollment(
          totpSecret,
          verificationCode
        );
        
        await multiFactor(user).enroll(assertion, 'Authenticator App');
        
        const codes = Array.from({ length: 5 }, () => 
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        setBackupCodes(codes);
        setShowBackupCodes(true);
        
        setTwoFactorEnabled(true);
        setDialogOpen(false);
        
        await logTwoFactorActivity(user, 'enable');
      } catch (err) {
        console.error('Error verifying TOTP code:', err);
        
        if (err.code === 'auth/invalid-user-token') {
          setVerificationError('Session expired. Please refresh the page.');
        } else {
          setVerificationError('Invalid verification code. Please try again.');
        }
      } finally {
        setIsVerifying(false);
      }
    };
  
    // Disable 2FA
    const disableTwoFactor = async () => {
      try {
        const user = await refreshToken();
        if (!user) throw new Error('User not authenticated');
        
        const enrolledFactors = multiFactor(user).enrolledFactors;
        
        for (const factor of enrolledFactors) {
          await multiFactor(user).unenroll(factor);
        }
        
        setTwoFactorEnabled(false);
        setTotpSecret(null);
        
        await logTwoFactorActivity(user, 'disable');
      } catch (err) {
        console.error('Error disabling two-factor authentication:', err);
        
        if (err.code === 'auth/invalid-user-token') {
          setAuthError('Session expired. Please refresh the page.');
        } else {
          setError('Failed to disable two-factor authentication');
        }
      }
    };
  
    // Log 2FA activity
    const logTwoFactorActivity = async (user, action) => {
      try {
        const timestamp = serverTimestamp();
        const ip = await fetchClientIP();
  
        await addDoc(collection(db, 'admin-access-logs'), {
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Unknown',
          action: `two_factor_${action}`,
          timestamp: timestamp,
          ipAddress: ip,
          userAgent: navigator.userAgent,
          status: 'success'
        });
      } catch (err) {
        console.error('Error logging 2FA activity:', err);
      }
    };
  
  // Fetch active sessions
  const fetchUserSessions = async () => {
    try {
      setLoadingSessions(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const activeSessions = await fetchActiveSessions(currentUser.uid);
      const formattedSessions = activeSessions.map(session => ({
        ...session,
        device: parseUserAgent(session.userAgent),
        lastActiveFormatted: formatLastActive(session.lastActive),
        isCurrent: session.id.includes(Date.now().toString().slice(0, 8))
      }));
      
      setSessions(formattedSessions);
    } catch (err) {
      setError('Failed to load active sessions');
      console.error('Error loading sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch access logs
  const fetchAccessLogs = async () => {
    try {
      setLoadingLogs(true);
      const user = auth.currentUser;
      if (!user) return;

      const logsRef = collection(db, 'admin-access-logs');
      const q = query(
        logsRef,
        where('userId', '==', user.uid),
      );

      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString() || 'Unknown'
      }));

      setAccessLogs(logs);
    } catch (err) {
      console.error('Error fetching access logs:', err);
      setError('Failed to load access logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Log password change activity
  const logPasswordChangeActivity = async (user) => {
    try {
      const timestamp = serverTimestamp();
      const ip = await fetchClientIP();

      // Log to admin-access-logs
      await addDoc(collection(db, 'admin-access-logs'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Unknown',
        action: 'password_change',
        timestamp: timestamp,
        ipAddress: ip,
        userAgent: navigator.userAgent,
        deviceInfo: {
          platform: navigator.platform,
          language: navigator.language,
        },
        details: {
          method: 'email/password',
          changedFrom: 'self-service',
          passwordStrength: passwordStrength,
        },
        status: 'success'
      });
      
      // Log to admin-activities
      await addDoc(collection(db, 'admin-activities'), {
        userId: user.uid,
        userEmail: user.email,
        activityType: 'security',
        action: 'password_change',
        timestamp: timestamp,
        metadata: {
          ipAddress: ip,
          userAgent: navigator.userAgent,
          location: 'Unknown',
        },
        status: 'completed'
      });
    } catch (err) {
      console.error('Error logging password change:', err);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    try {
      setChangingPassword(true);
      const user = auth.currentUser;
      
      // Validate inputs
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError('Please fill in all password fields');
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (passwordStrength < 3) {
        setError('Password is not strong enough');
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
      
      // Log the activity
      await logPasswordChangeActivity(user);
      
      // Reset form and show success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength(0);
      setError(null);
      
      // Refresh sessions and logs
      await Promise.all([fetchUserSessions(), fetchAccessLogs()]);
      
      alert('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
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

  const handleTwoFactorToggle = async () => {
    if (twoFactorEnabled) {
      if (window.confirm('Are you sure you want to disable two-factor authentication? This will reduce your account security.')) {
        await disableTwoFactor();
      }
    } else {
      await generateTotpSecret();
    }
  };


  // Handle revoke session
  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      await fetchAccessLogs(); // Refresh logs
    } catch (err) {
      setError('Failed to revoke session');
      console.error('Error revoking session:', err);
    }
  };

  
  // Handle revoke all sessions
  const handleRevokeAllSessions = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      await revokeAllSessions(currentUser.uid);
      await auth.signOut();
    } catch (err) {
      setError('Failed to revoke all sessions');
      console.error('Error revoking all sessions:', err);
    }
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

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUserSessions(), 
        fetchAccessLogs(),
        fetchAlertPreferences() // Add this line
      ]);
    };
    loadData();
  }, []);

  return (
    <Grid container spacing={3}>
      {authError && (
  <Alert 
    severity="error"
    action={
      <>
        <Button 
          color="inherit" 
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
        <Button 
          color="inherit" 
          onClick={() => auth.signOut().then(() => window.location.href = "/login")}
        >
          Sign In Again
        </Button>
      </>
    }
  >
    {authError}
  </Alert>
)}

      {/* Two-Factor Authentication Section */}
      <Grid item xs={12} md={6}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent>
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Two-Factor Authentication
            </Typography>
            
            <Box className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <Box>
                <Typography variant="subtitle2" className="font-medium">
                  Authenticator App
                </Typography>
                <Typography variant="caption" className="text-gray-600">
                  {twoFactorEnabled ? 
                    'Enabled - Requires code at login' : 
                    'Requires Google Authenticator or similar'}
                </Typography>
              </Box>
              <Switch
                checked={twoFactorEnabled}
                onChange={handleTwoFactorToggle}
                color="primary"
                disabled={isSettingUp}
              />
            </Box>

            {twoFactorEnabled && (
              <Box className="space-y-4">
                {showBackupCodes ? (
                  <Box className="p-4 border border-gray-200 rounded-lg">
                    <Typography variant="subtitle2" className="font-medium mb-2">
                      Backup Codes
                    </Typography>
                    <Alert severity="warning" className="mb-3">
                      Save these codes in a secure place. Each code can be used only once.
                    </Alert>
                    <Box className="grid grid-cols-2 gap-2 mb-3">
                      {backupCodes.map((code, i) => (
                        <Typography 
                          key={i} 
                          variant="body2" 
                          className="font-mono bg-gray-100 p-2 rounded text-center flex items-center justify-between"
                        >
                          {code}
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(code)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <FiCopy size={14} />
                          </IconButton>
                        </Typography>
                      ))}
                    </Box>
                    <Button 
                      variant="outlined" 
                      className="border-gray-300 text-gray-700"
                      startIcon={<FiRefreshCw size={14} />}
                      onClick={() => {
                        const newCodes = Array.from({ length: 5 }, () => 
                          Math.random().toString(36).substring(2, 8).toUpperCase()
                        );
                        setBackupCodes(newCodes);
                      }}
                    >
                      Generate New Codes
                    </Button>
                  </Box>
                ) : (
                  <Box className="p-4 border border-gray-200 rounded-lg">
                    <Typography variant="subtitle2" className="font-medium mb-2">
                      Authenticator App Setup
                    </Typography>
                    <Typography variant="body2" className="text-gray-600 mb-3">
                      Two-factor authentication is now active. You'll need to enter a verification code from your authenticator app when logging in.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="error"
                      onClick={() => setShowBackupCodes(true)}
                    >
                      Show Backup Codes
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Active Sessions Section */}
      <Grid item xs={12}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent>
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold text-gray-800">
                Active Sessions
              </Typography>
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<FiLogOut />}
                onClick={handleRevokeAllSessions}
                disabled={loadingSessions}
              >
                Log Out All Devices
              </Button>
            </Box>
            
            {error && (
              <Box className="mb-4">
                <Typography color="error">{error}</Typography>
              </Box>
            )}

            {loadingSessions ? (
              <Box className="flex justify-center py-4">
                <CircularProgress size={24} />
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
                            {getDeviceIcon(session.device)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" className="font-bold">
                              {session.device}
                              {session.isCurrent && (
                                <Chip 
                                  label="Current" 
                                  size="small" 
                                  className="ml-2 bg-green-100 text-green-800"
                                />
                              )}
                            </Typography>
                            <Typography variant="body2" className="text-gray-600">
                              {session.lastActiveFormatted} • {session.ip}
                            </Typography>
                          </Box>
                        </Box>
                        {!session.isCurrent && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleRevokeSession(session.id)}
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
          </CardContent>
        </Card>
      </Grid>

      {/* Password Change Section */}
      <Grid item xs={12} md={6}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent>
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Change Password
            </Typography>
            
            {error && (
              <Typography color="error" variant="body2" className="mb-2">
                {error}
              </Typography>
            )}
            
            <Box className="space-y-3">
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type={showPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={handlePasswordInput}
                size="small"
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
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
                size="small"
              />
              
              <Button 
                fullWidth
                variant="contained"
                className="bg-indigo-600 hover:bg-indigo-700"
                startIcon={<FiKey />}
                onClick={handlePasswordChange}
                disabled={
                  changingPassword ||
                  !passwordData.currentPassword || 
                  !passwordData.newPassword || 
                  !passwordData.confirmPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword ||
                  passwordStrength < 3
                }
              >
                {changingPassword ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Access & Permissions Section */}
      <Grid item xs={12} md={6}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent>
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Access & Permissions
            </Typography>
            
            <Box className="mb-4 p-3 bg-gray-50 rounded-lg">
              <Typography variant="subtitle2" className="font-medium mb-1">
                Current Role
              </Typography>
              <Box className="flex items-center space-x-2">
                <Chip 
                  label="Super Admin" 
                  color="primary" 
                  icon={<FiShield size={14} />}
                />
                <Typography variant="caption" className="text-gray-600">
                  Full system access
                </Typography>
              </Box>
            </Box>
            
            <Accordion className="shadow-none border border-gray-200 rounded-lg mb-2">
              <AccordionSummary expandIcon={<FiChevronDown />}>
                <Typography variant="subtitle2" className="font-medium">
                  Permission Summary
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {[
                    'User management (create/edit/delete users)',
                    'Role and permission assignments',
                    'Billing and subscription management',
                    'Full data access and reporting',
                    'System configuration'
                  ].map((permission, i) => (
                    <ListItem key={i} className="p-0">
                      <Box className="flex items-center">
                        <FiCheckCircle className="text-green-500 mr-2" size={16} />
                        <Typography variant="body2">{permission}</Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
            
            <Accordion className="shadow-none border border-gray-200 rounded-lg">
              <AccordionSummary expandIcon={<FiChevronDown />}>
                <Box className="flex justify-between items-center w-full">
                  <Typography variant="subtitle2" className="font-medium">
                    Recent Access Logs
                  </Typography>
                  <IconButton size="small" onClick={fetchAccessLogs}>
                    <FiRefreshCw size={16} />
                  </IconButton>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {loadingLogs ? (
                  <Box className="flex justify-center py-4">
                    <CircularProgress size={24} />
                  </Box>
                ) : accessLogs.length === 0 ? (
                  <Typography variant="body2" className="text-gray-600">
                    No access logs found.
                  </Typography>
                ) : (
                  <List dense className="space-y-2">
                    {accessLogs.map(log => (
                      <ListItem key={log.id} className="p-0">
                        <Box className="w-full">
                          <Box className="flex items-center justify-between">
                            <Typography variant="body2" className="font-medium">
                              {formatActionName(log.action)}
                            </Typography>
                            <Chip 
                              label={log.status} 
                              size="small" 
                              className={
                                log.status === 'success' ? 'bg-green-100 text-green-800' :
                                log.status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            />
                          </Box>
                          <Typography variant="caption" className="text-gray-600">
                            {log.timestamp} • IP: {log.ipAddress || 'Unknown'}
                          </Typography>
                          {log.details?.method && (
                            <Typography variant="caption" className="text-gray-600 block">
                              Method: {log.details.method}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Grid>

      {/* Security Alerts Section */}
      <Grid item xs={12}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent>
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold text-gray-800">
                Security Alerts
              </Typography>
                <Button 
                  variant="text" 
                  className="text-indigo-600"
                  startIcon={<FiSettings size={14} />}
                  onClick={() => setPreferencesDialogOpen(true)}
                >
                  Alert Preferences
                </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                  <Box className="flex items-center space-x-3">
                    <Avatar className="bg-red-100 text-red-600">
                      <FiAlertCircle size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" className="font-medium">
                        Failed Logins
                      </Typography>
                      <Typography variant="caption" className="text-gray-600">
                        Email notifications enabled
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                  <Box className="flex items-center space-x-3">
                    <Avatar className="bg-amber-100 text-amber-600">
                      <FiKey size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" className="font-medium">
                        Password Changes
                      </Typography>
                      <Typography variant="caption" className="text-gray-600">
                        Email and SMS notifications
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                  <Box className="flex items-center space-x-3">
                    <Avatar className="bg-blue-100 text-blue-600">
                      <FiHardDrive size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" className="font-medium">
                        Data Exports
                      </Typography>
                      <Typography variant="caption" className="text-gray-600">
                        Email notifications only
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                  <Box className="flex items-center space-x-3">
                    <Avatar className="bg-purple-100 text-purple-600">
                      <FiDatabase size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" className="font-medium">
                        Sensitive Actions
                      </Typography>
                      <Typography variant="caption" className="text-gray-600">
                        All notifications enabled
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Up Authenticator App</DialogTitle>
        <DialogContent>
          {totpSecret && (
            <>
              <Typography variant="body1" gutterBottom>
                Scan this QR code with your authenticator app:
              </Typography>
              
              <Box className="flex justify-center my-4 p-4 bg-white rounded border border-gray-200">
                <QRCodeSVG 
                  value={totpSecret.generateQrCodeUrl()} 
                  size={200} 
                  level="H"
                />
              </Box>
              
              <Typography variant="body2" className="mb-4">
                Or enter this code manually:
              </Typography>
              
              <Box className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <Typography variant="body1" className="font-mono">
                  {totpSecret.sharedSecretKey}
                </Typography>
                <IconButton onClick={() => copyToClipboard(totpSecret.sharedSecretKey)}>
                  <FiCopy />
                </IconButton>
              </Box>
              
              <Typography variant="body2" className="mt-4 mb-2">
                After scanning, enter the 6-digit code from your app:
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                label="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                error={!!verificationError}
                helperText={verificationError}
                InputProps={{
                  endAdornment: (
                    <IconButton>
                      <FiClock />
                    </IconButton>
                  )
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={verifyTotpCode}
            disabled={!verificationCode || isVerifying}
          >
            {isVerifying ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={preferencesDialogOpen} onClose={() => setPreferencesDialogOpen(false)} maxWidth="md" fullWidth>
  <DialogTitle>Alert Preferences</DialogTitle>
  <DialogContent>
    {loadingPreferences ? (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    ) : (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" gutterBottom className="font-bold">
            Failed Login Attempts
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.failedLogins.email}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    failedLogins: {
                      ...alertPreferences.failedLogins,
                      email: e.target.checked
                    }
                  })}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.failedLogins.sms}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    failedLogins: {
                      ...alertPreferences.failedLogins,
                      sms: e.target.checked
                    }
                  })}
                />
              }
              label="SMS Notifications"
            />
          </FormGroup>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" gutterBottom className="font-bold">
            Password Changes
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.passwordChanges.email}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    passwordChanges: {
                      ...alertPreferences.passwordChanges,
                      email: e.target.checked
                    }
                  })}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.passwordChanges.sms}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    passwordChanges: {
                      ...alertPreferences.passwordChanges,
                      sms: e.target.checked
                    }
                  })}
                />
              }
              label="SMS Notifications"
            />
          </FormGroup>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" gutterBottom className="font-bold">
            Data Exports
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.dataExports.email}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    dataExports: {
                      ...alertPreferences.dataExports,
                      email: e.target.checked
                    }
                  })}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.dataExports.sms}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    dataExports: {
                      ...alertPreferences.dataExports,
                      sms: e.target.checked
                    }
                  })}
                />
              }
              label="SMS Notifications"
            />
          </FormGroup>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle1" gutterBottom className="font-bold">
            Sensitive Actions
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.sensitiveActions.email}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    sensitiveActions: {
                      ...alertPreferences.sensitiveActions,
                      email: e.target.checked
                    }
                  })}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.sensitiveActions.sms}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    sensitiveActions: {
                      ...alertPreferences.sensitiveActions,
                      sms: e.target.checked
                    }
                  })}
                />
              }
              label="SMS Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={alertPreferences.sensitiveActions.push}
                  onChange={(e) => setAlertPreferences({
                    ...alertPreferences,
                    sensitiveActions: {
                      ...alertPreferences.sensitiveActions,
                      push: e.target.checked
                    }
                  })}
                />
              }
              label="Push Notifications"
            />
          </FormGroup>
        </Grid>
      </Grid>
    )}
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={resetToDefaultPreferences}
      color="secondary"
      disabled={loadingPreferences}
    >
      Reset to Default
    </Button>
    <Button 
      onClick={() => setPreferencesDialogOpen(false)}
      disabled={loadingPreferences}
    >
      Cancel
    </Button>
    <Button 
      onClick={() => updateAlertPreferences(alertPreferences)}
      color="primary"
      disabled={loadingPreferences}
    >
      {loadingPreferences ? <CircularProgress size={24} /> : 'Save Preferences'}
    </Button>
  </DialogActions>
</Dialog>
    </Grid>
    
  );
};

export default SecurityTab;