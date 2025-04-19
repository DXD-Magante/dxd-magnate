import React, { useState } from "react";
import { auth } from "../services/firebase";
import { 
  Button, 
  TextField, 
  Typography, 
  Link, 
  Box,
  CircularProgress,
  Fade,
  Alert,
  InputAdornment
} from "@mui/material";
import { sendPasswordResetEmail } from "firebase/auth";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSnackbar } from 'notistack';
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      enqueueSnackbar('Password reset email sent!', { variant: 'success' });
    } catch (err) {
      const errorMessage = err.message.replace("Firebase: ", "");
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
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
              Reset Your Password
            </Typography>
            <Typography 
              variant="subtitle1" 
              className="text-blue-100 mt-2"
              sx={{
                opacity: 0.9
              }}
            >
              Enter your email to receive a reset link
            </Typography>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && !success && (
              <Fade in={!!error}>
                <Alert severity="error" className="mb-6" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </Fade>
            )}

            {success && (
              <Fade in={success}>
                <Alert 
                  severity="success" 
                  className="mb-6"
                  icon={<FaCheckCircle className="text-xl" />}
                >
                  Password reset email sent! Please check your inbox.
                </Alert>
              </Fade>
            )}

            {!success ? (
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

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      background: 'linear-gradient(to right, #4f46e5, #7c3aed)',
                      padding: '12px',
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '16px',
                      fontWeight: 500,
                      boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.06)',
                      '&:hover': {
                        background: 'linear-gradient(to right, #4338ca, #6d28d9)',
                        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2), 0 4px 6px -2px rgba(79, 70, 229, 0.05)',
                      },
                      '&:disabled': {
                        background: '#e2e8f0',
                        color: '#94a3b8',
                      }
                    }}
                    startIcon={
                      loading ? (
                        <CircularProgress 
                          size={20} 
                          color="inherit" 
                        />
                      ) : null
                    }
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </motion.div>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-5"
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#64748b',
                    textAlign: 'center',
                    mb: 3
                  }}
                >
                  If an account exists for {email}, you'll receive an email with instructions to reset your password.
                </Typography>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setSuccess(false)}
                    sx={{
                      py: 1.5,
                      borderRadius: '12px',
                      borderColor: '#e2e8f0',
                      textTransform: 'none',
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#334155',
                      '&:hover': {
                        borderColor: '#cbd5e0',
                        backgroundColor: '#f8fafc',
                      }
                    }}
                  >
                    Try another email
                  </Button>
                </motion.div>
              </motion.div>
            )}

            <div className="mt-6 text-center">
              <Link 
                onClick={() => navigate(-1)}
                sx={{ 
                  color: '#4f46e5',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  '&:hover': {
                    color: '#4338ca',
                    cursor: 'pointer'
                  }
                }}
                underline="hover"
              >
                <FaArrowLeft className="mr-2" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;