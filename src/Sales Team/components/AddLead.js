import React, { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
  Avatar,
  Typography,
  Divider,
  IconButton,
  TextareaAutosize
} from '@mui/material';
import { 
  FiUser, FiX, FiCheck, FiMail, FiPhone, 
  FiBriefcase, FiDollarSign, FiCalendar, 
  FiFlag, FiUpload, FiFileText, FiPlus 
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, doc } from 'firebase/firestore';

const AddNewLeadModal = ({ open, onClose }) => {
  const [leadData, setLeadData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    leadSource: '',
    industry: '',
    budget: '',
    service: '',
    priority: 'medium',
    expectedCloseDate: '',
    status: 'new',
    assignedTo: '',
    notes: '',
    attachments: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [salesTeam, setSalesTeam] = useState([]);
  const [fetchingSalesTeam, setFetchingSalesTeam] = useState(false);

  const leadSources = ['Website', 'Referral', 'Event', 'Cold Call', 'Social Media', 'Email Campaign', 'Other'];
  const industries = ['Technology', 'Retail', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Other'];
  const services = ['SEO', 'Web Development', 'Marketing', 'Consulting', 'Design', 'Software', 'Other'];
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['new', 'contacted', 'proposal sent', 'negotiation', 'closed'];

  useEffect(() => {
    const fetchSalesTeam = async () => {
      setFetchingSalesTeam(true);
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'sales'));
        const querySnapshot = await getDocs(q);
        
        const team = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          team.push({
            id: doc.id,
            name: `${userData.firstName} ${userData.lastName}`,
            ...userData
          });
        });
        
        setSalesTeam(team);
      } catch (err) {
        console.error('Error fetching sales team:', err);
        setError('Failed to load sales team data');
      } finally {
        setFetchingSalesTeam(false);
      }
    };

    if (open) {
      fetchSalesTeam();
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeadData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    setFileUploading(true);
    
    // Simulate file upload
    setTimeout(() => {
      const newAttachments = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }));
      
      setLeadData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
      setFileUploading(false);
    }, 1500);
  };

  const removeAttachment = (index) => {
    const updatedAttachments = [...leadData.attachments];
    updatedAttachments.splice(index, 1);
    setLeadData(prev => ({ ...prev, attachments: updatedAttachments }));
  };

  const handleSubmit = async () => {
    if (!leadData.firstName || !leadData.lastName || !leadData.email || !leadData.phone) {
      setError('First name, last name, email, and phone are required fields');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      const currentUser = auth.currentUser;
      
      const leadToSave = {
        ...leadData,
        fullName: `${leadData.firstName} ${leadData.lastName}`,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        lastUpdated: serverTimestamp()
      };
  
      // Add the lead to the 'leads' collection
      const leadRef = await addDoc(collection(db, 'leads'), leadToSave);
  
      // Create notification for salesperson (if assigned)
      if (leadData.assignedTo) {
        const salesNotificationRef = doc(collection(db, 'sales-notifications'));
        await setDoc(salesNotificationRef, {
          message: `New lead assigned: ${leadData.firstName} ${leadData.lastName}`,
          userId: leadData.assignedTo,
          timestamp: serverTimestamp(),
          type: 'lead',
          leadId: leadRef.id,
          viewed: false,
          priority: leadData.priority,
          status: leadData.status
        });
      }
  
      // Create notification for admin
      const adminNotificationRef = doc(collection(db, 'admin-notifications'));
      await setDoc(adminNotificationRef, {
        message: `New lead created: ${leadData.firstName} ${leadData.lastName}`,
        userId: 'aEwk9CJl8MRfMRsU5K4Z02Ah9963', // Admin user ID
        timestamp: serverTimestamp(),
        type: 'lead',
        leadId: leadRef.id,
        viewed: false,
        createdBy: currentUser.uid,
        createdByName: `${currentUser.firstName} ${currentUser.lastName}`,
        company: leadData.company
      });
  
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setLeadData({
          firstName: '',
          lastName: '',
          title: '',
          company: '',
          phone: '',
          email: '',
          leadSource: '',
          industry: '',
          budget: '',
          service: '',
          priority: 'medium',
          expectedCloseDate: '',
          status: 'new',
          assignedTo: '',
          notes: '',
          attachments: []
        });
      }, 2000);
    } catch (err) {
      console.error('Error adding lead:', err);
      setError('Failed to add lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
        }
      }}
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
              <FiUser size={22} />
            </div>
            <Typography variant="h6" className="font-bold text-gray-800">
              Add New Lead
            </Typography>
          </motion.div>
          <IconButton onClick={onClose}>
            <FiX size={20} className="text-gray-500 hover:text-gray-700" />
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
              Lead Added Successfully!
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-center max-w-xs">
              {leadData.firstName} {leadData.lastName} has been added to your leads database.
            </Typography>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Section 1: Lead Information */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiUser className="text-indigo-500" />
                Lead Information
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextField
                  label="First Name"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="firstName"
                  value={leadData.firstName}
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
                  required
                />
                <TextField
                  label="Last Name"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="lastName"
                  value={leadData.lastName}
                  onChange={handleInputChange}
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                  required
                />
                <TextField
                  label="Title/Position"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="title"
                  value={leadData.title}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <FiBriefcase className="text-gray-400 mr-3" size={18} />
                    ),
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Company Name"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="company"
                  value={leadData.company}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <FiBriefcase className="text-gray-400 mr-3" size={18} />
                    ),
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                />
                <TextField
                  label="Phone Number"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="phone"
                  value={leadData.phone}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <FiPhone className="text-gray-400 mr-3" size={18} />
                    ),
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Email Address"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  type="email"
                  name="email"
                  value={leadData.email}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <FiMail className="text-gray-400 mr-3" size={18} />
                    ),
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                  required
                />
                <FormControl fullWidth size="medium">
                  <InputLabel>Lead Source</InputLabel>
                  <Select
                    label="Lead Source"
                    name="leadSource"
                    value={leadData.leadSource}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    {leadSources.map((source) => (
                      <MenuItem key={source} value={source}>{source}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
            
            <Divider className="my-2" />
            
            {/* Section 2: Lead Qualification */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiDollarSign className="text-blue-500" />
                Lead Qualification
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormControl fullWidth size="medium">
                  <InputLabel>Industry Type</InputLabel>
                  <Select
                    label="Industry Type"
                    name="industry"
                    value={leadData.industry}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    {industries.map((industry) => (
                      <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Budget Range"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="budget"
                  value={leadData.budget}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <FiDollarSign className="text-gray-400 mr-3" size={18} />
                    ),
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormControl fullWidth size="medium">
                  <InputLabel>Service Interested In</InputLabel>
                  <Select
                    label="Service Interested In"
                    name="service"
                    value={leadData.service}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    {services.map((service) => (
                      <MenuItem key={service} value={service}>{service}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="medium">
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    label="Priority Level"
                    name="priority"
                    value={leadData.priority}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        <div className="flex items-center gap-2 capitalize">
                          {priority === 'high' && <FiFlag className="text-red-500" />}
                          {priority === 'medium' && <FiFlag className="text-yellow-500" />}
                          {priority === 'low' && <FiFlag className="text-green-500" />}
                          {priority}
                        </div>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              
              <TextField
                label="Expected Closing Date"
                type="date"
                fullWidth
                variant="outlined"
                size="medium"
                name="expectedCloseDate"
                value={leadData.expectedCloseDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <FiCalendar className="text-gray-400 mr-3" size={18} />
                  ),
                  sx: {
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }
                }}
              />
            </div>
            
            <Divider className="my-2" />
            
            {/* Section 3: Lead Status & Assigning */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiFlag className="text-purple-500" />
                Lead Status & Assigning
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormControl fullWidth size="medium">
                  <InputLabel>Lead Status</InputLabel>
                  <Select
                    label="Lead Status"
                    name="status"
                    value={leadData.status}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status} className="capitalize">
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="medium">
                  <InputLabel>Assigned Salesperson</InputLabel>
                  <Select
                    label="Assigned Salesperson"
                    name="assignedTo"
                    value={leadData.assignedTo}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                    disabled={fetchingSalesTeam}
                  >
                    {fetchingSalesTeam ? (
                      <MenuItem disabled>
                        <div className="flex items-center gap-2">
                          <CircularProgress size={16} />
                          Loading sales team...
                        </div>
                      </MenuItem>
                    ) : (
                      salesTeam.map((person) => (
                        <MenuItem key={person.id} value={person.id}>
                          {person.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </div>
            </div>
            
            <Divider className="my-2" />
            
            {/* Section 4: Notes & Attachments */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiFileText className="text-green-500" />
                Notes & Attachments
              </Typography>
              
              <TextareaAutosize
                minRows={4}
                placeholder="Additional notes about the lead..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                name="notes"
                value={leadData.notes}
                onChange={handleInputChange}
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachments
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50">
                    <FiUpload className="mr-2 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Upload Files</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      multiple
                    />
                  </label>
                  {fileUploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CircularProgress size={16} />
                      Uploading...
                    </div>
                  )}
                </div>
                
                {leadData.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {leadData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FiFileText className="text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-red-50 border border-red-100"
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
              <FiPlus size={18} />
            )}
            disabled={loading || !leadData.firstName || !leadData.lastName || !leadData.email || !leadData.phone}
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
            {loading ? 'Adding Lead...' : 'Add Lead'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AddNewLeadModal;