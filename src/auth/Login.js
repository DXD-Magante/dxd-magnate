import React, { useState } from "react";
import { auth, db } from "../services/firebase";
import { 
  Button, 
  TextField, 
  Typography, 
  Link, 
  Divider, 
  IconButton, 
  InputAdornment, 
  Box,
  CircularProgress,
  Fade,
  Alert
} from "@mui/material";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { FaEye, FaEyeSlash, FaLock, FaEnvelope } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSnackbar } from 'notistack';
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import GoogleLogo from '../assets/google-icon.png';

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [success, setSuccess] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const trackLoginSession = async (user) => {
    try {
      const sessionData = {
        userId: user.uid,
        email: user.email,
        userAgent: window.navigator.userAgent,
        ip: window.location.hostname, // Note: For real IP, use a cloud function
        loggedInAt: serverTimestamp(),
        isActive: true,
        lastActive: serverTimestamp()
      };
  
      // Create a new session document
      const sessionRef = doc(db, "user_sessions", `${user.uid}_${Date.now()}`);
      await setDoc(sessionRef, sessionData);
  
      // Update user's last login
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    } catch (error) {
      console.error("Error tracking login session:", error);
    }
  };

  const updateActivityLogs = async (userId, email) => {
    const host = window.location.hostname;
    const activityLogRef = doc(db, "Activity-logs", `${userId}_${Date.now()}`);
    
    await setDoc(activityLogRef, {
      action: "login",
      userId,
      timestamp: serverTimestamp(),
      message: `Logged in from ${host}`,
      ip: host,
      email,
    });
  };

  const updateUserStatus = async (userId) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      profileStatus: 'online',
      lastActive: serverTimestamp()
    });
  };

  const handleSuccessfulLogin = async (user) => {
    try {
      await Promise.all([
        updateActivityLogs(user.uid, user.email),
        updateUserStatus(user.uid)
      ]);
      
      setSuccess(true);
      enqueueSnackbar('Login successful!', { variant: 'success' });
      
      setTimeout(() => {
        setLoading(false);
        setSuccess(false);
        // Redirect or handle in parent component
      }, 3000);
    } catch (err) {
      console.error("Error updating records:", err);
      setError("Login successful but failed to update records");
      enqueueSnackbar('Login successful but failed to update records', { variant: 'error' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(userCredential.user);
      await trackLoginSession(userCredential.user);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      enqueueSnackbar(err.message.replace("Firebase: ", ""), { variant: 'error' });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(userCredential.user);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      enqueueSnackbar(err.message.replace("Firebase: ", ""), { variant: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
            <Typography 
              variant="h4" 
              className="font-bold text-white"
              sx={{ 
                fontWeight: 700,
                letterSpacing: '-0.5px'
              }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="subtitle1" 
              className="text-blue-100 mt-2"
              sx={{
                opacity: 0.9
              }}
            >
              Sign in to access your dashboard
            </Typography>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <Fade in={!!error}>
                <Alert severity="error" className="mb-6" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Fade>
            )}

            {success && (
              <Fade in={success}>
                <Alert severity="success" className="mb-6">
                  Login successful! Redirecting...
                </Alert>
              </Fade>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaEnvelope className="text-gray-400" />
                    </InputAdornment>
                  ),
                  className: "rounded-lg",
                  sx: {
                    borderRadius: '12px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#cbd5e0',
                    },
                  }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: '#64748b',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#4f46e5',
                  },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock className="text-gray-400" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{
                          color: '#64748b',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: '#4f46e5',
                          }
                        }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  className: "rounded-lg",
                  sx: {
                    borderRadius: '12px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#cbd5e0',
                    },
                  }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    color: '#64748b',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#4f46e5',
                  },
                }}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                    Remember me
                  </label>
                </div>

                <Link 
                  href="/forgot-password" 
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  underline="hover"
                >
                  Forgot password?
                </Link>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || success}
                  sx={{
                    background: success ? '#10b981' : 'linear-gradient(to right, #4f46e5, #7c3aed)',
                    padding: '12px',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 500,
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.06)',
                    '&:hover': {
                      background: success ? '#10b981' : 'linear-gradient(to right, #4338ca, #6d28d9)',
                      boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2), 0 4px 6px -2px rgba(79, 70, 229, 0.05)',
                    },
                    '&:disabled': {
                      background: success ? '#10b981' : '#e2e8f0',
                      color: '#94a3b8',
                    }
                  }}
                  startIcon={
                    (loading || success) ? (
                      <CircularProgress 
                        size={20} 
                        color="inherit" 
                        sx={{
                          color: success ? 'white' : 'inherit'
                        }}
                      />
                    ) : null
                  }
                >
                  {loading ? 'Signing in...' : success ? 'Success! Redirecting...' : 'Sign in'}
                </Button>
              </motion.div>
            </form>

            <Divider sx={{ my: 3, '&::before, &::after': { borderColor: '#e2e8f0' } }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  px: 2,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.5px'
                }}
              >
                OR CONTINUE WITH
              </Typography>
            </Divider>

            {/* Enhanced Google Login Button with Image Logo */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={loading || success}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  borderColor: success ? '#10b981' : '#e2e8f0',
                  textTransform: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: success ? '#10b981' : '#334155',
                  '&:hover': {
                    borderColor: success ? '#10b981' : '#cbd5e0',
                    backgroundColor: success ? 'rgba(16, 185, 129, 0.04)' : '#f8fafc',
                  },
                  '&:disabled': {
                    borderColor: '#e2e8f0',
                    color: '#94a3b8',
                  }
                }}
                startIcon={
                  success ? (
                    <Box sx={{ color: '#10b981' }}>
                      ✓
                    </Box>
                  ) : (
                    <Box 
                      sx={{
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img 
                        src={GoogleLogo} 
                        alt="Google logo"
                        style={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  )
                }
              >
                {success ? 'Login successful!' : 'Sign in with Google'}
              </Button>
            </motion.div>

            <div className="mt-6 text-center">
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}
              >
                Don't have an account?{' '}
                <Link 
                  href="/signup" 
                  sx={{ 
                    color: '#4f46e5',
                    fontWeight: 500,
                    '&:hover': {
                      color: '#4338ca',
                    }
                  }}
                  underline="hover"
                >
                  Sign up
                </Link>
              </Typography>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;