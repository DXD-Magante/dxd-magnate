import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Typography,
  Chip,
  CircularProgress,
  Fade,
  Slide,
  IconButton
} from '@mui/material';
import { 
  FiUserPlus, 
  FiX, 
  FiCheck, 
  FiMail, 
  FiPhone, 
  FiBriefcase,
  FiUser,
  FiPhoneCall,
  FiGlobe
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { auth, db } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const AddClientModal = ({ open, onClose }) => {
  const [clientData, setClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: 'client',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!clientData.firstName || !clientData.lastName || !clientData.email) {
      setError('First name, last name, and email are required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        clientData.email,
        generateTempPassword()
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...clientData,
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        salesRep: auth.currentUser.uid
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setClientData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          role: 'client',
          status: 'active'
        });
      }, 1800);
    } catch (err) {
      console.error('Error adding client:', err);
      setError(err.message.includes('email-already-in-use') 
        ? 'This email is already registered' 
        : 'Failed to add client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8) + 'A1!';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
        }
      }}
      TransitionComponent={Slide}
      transitionDuration={300}
    >
      {/* Header */}
      <DialogTitle className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <FiUserPlus size={22} />
            </div>
            <Typography variant="h6" className="font-bold text-gray-800">
              Add New Client
            </Typography>
          </motion.div>
          <IconButton 
            onClick={onClose}
            sx={{
              color: 'gray.500',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.03)'
              }
            }}
          >
            <FiX size={20} />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent className="py-6 px-8">
        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <div className="p-4 rounded-full bg-green-50 mb-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.6 }}
              >
                <FiCheck className="text-green-500 text-3xl" />
              </motion.div>
            </div>
            <Typography variant="h6" className="font-semibold text-gray-800 mb-2">
              Client Added Successfully!
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-center max-w-xs">
              {clientData.firstName} {clientData.lastName} is now in your client database.
            </Typography>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Avatar Preview */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex justify-center mb-8"
            >
       
            </motion.div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <TextField
                label="First Name"
                variant="outlined"
                size="medium"
                fullWidth
                name="firstName"
                value={clientData.firstName}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <FiUser className="text-gray-400 mr-3" size={18} />
                  ),
                  sx: {
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#c7d2fe',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#818cf8',
                      boxShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)'
                    },
                  }
                }}
                required
              />
              <TextField
                label="Last Name"
                variant="outlined"
                size="medium"
                fullWidth
                name="lastName"
                value={clientData.lastName}
                onChange={handleInputChange}
                InputProps={{
                  sx: {
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#c7d2fe',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#818cf8',
                      boxShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)'
                    },
                  }
                }}
                required
              />
            </div>

            <TextField
              label="Email Address"
              variant="outlined"
              size="medium"
              fullWidth
              type="email"
              name="email"
              value={clientData.email}
              onChange={handleInputChange}
              className="mb-5"
              InputProps={{
                startAdornment: (
                  <FiMail className="text-gray-400 mr-3" size={18} />
                ),
                sx: {
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  marginBottom:'20px'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#c7d2fe',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#818cf8',
                    boxShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)'
                  },
                }
              }}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <TextField
                label="Phone Number"
                variant="outlined"
                size="medium"
                fullWidth
                name="phone"
                value={clientData.phone}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <FiPhoneCall className="text-gray-400 mr-3" size={18} />
                  ),
                  sx: {
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#c7d2fe',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#818cf8',
                      boxShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)'
                    },
                  }
                }}
              />
              <TextField
                label="Company"
                variant="outlined"
                size="medium"
                fullWidth
                name="company"
                value={clientData.company}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <FiGlobe className="text-gray-400 mr-3" size={18} />
                  ),
                  sx: {
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#c7d2fe',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#818cf8',
                      boxShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)'
                    },
                  }
                }}
              />
            </div>

            <FormControl 
              fullWidth 
              size="medium"
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#c7d2fe',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#818cf8',
                    boxShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)'
                  },
                }
              }}
            >
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                name="status"
                value={clientData.status}
                onChange={handleInputChange}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      borderRadius: '10px',
                      marginTop: '8px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }
                  }
                }}
              >
                <MenuItem value="active">
                  <Chip 
                    label="Active" 
                    color="success" 
                    size="small" 
                    sx={{ borderRadius: '6px' }}
                  />
                </MenuItem>
                <MenuItem value="inactive">
                  <Chip 
                    label="Inactive" 
                    color="error" 
                    size="small" 
                    sx={{ borderRadius: '6px' }}
                  />
                </MenuItem>
                <MenuItem value="prospect">
                  <Chip 
                    label="Prospect" 
                    color="warning" 
                    size="small" 
                    sx={{ borderRadius: '6px' }}
                  />
                </MenuItem>
              </Select>
            </FormControl>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 border border-red-100 mb-4"
              >
                <Typography variant="body2" className="text-red-600 flex items-center gap-2">
                  <FiX className="text-red-500" />
                  {error}
                </Typography>
              </motion.div>
            )}
          </motion.div>
        )}
      </DialogContent>

      {!success && (
        <DialogActions className="border-t border-gray-100 px-8 py-4">
          <Button
            variant="outlined"
            onClick={onClose}
            startIcon={<FiX size={18} />}
            sx={{
              borderRadius: '10px',
              padding: '8px 16px',
              borderColor: '#e2e8f0',
              color: '#64748b',
              '&:hover': {
                borderColor: '#cbd5e1',
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <FiUserPlus size={18} />
            )}
            disabled={loading || !clientData.firstName || !clientData.lastName || !clientData.email}
            sx={{
              borderRadius: '10px',
              padding: '8px 20px',
              backgroundColor: '#4f46e5',
              color: 'white',
              textTransform: 'none',
              fontWeight: '500',
              boxShadow: '0 4px 6px rgba(79, 70, 229, 0.1)',
              '&:hover': {
                backgroundColor: '#4338ca',
                boxShadow: '0 6px 8px rgba(79, 70, 229, 0.15)'
              },
              '&:disabled': {
                backgroundColor: '#c7d2fe',
                color: '#e0e7ff'
              }
            }}
          >
            {loading ? 'Adding Client...' : 'Add Client'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AddClientModal;