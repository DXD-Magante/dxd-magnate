import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Avatar,
  Typography,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  LinearProgress,
  Alert,
  Tabs,
  Tab
} from "@mui/material";
import {
  FiUser,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMessageSquare,
  FiGlobe,
  FiEdit2,
  FiSave,
  FiX,
  FiCheck,
  FiDollarSign,
  FiBookmark,
  FiClock,
  FiFileText
} from "react-icons/fi";
import { db } from "../../services/firebase";
import { doc, updateDoc } from "firebase/firestore";

const LeadDetailsModal = ({ open, onClose, lead, onLeadUpdated }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(lead);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await updateDoc(doc(db, 'leads', lead.id), formData);
      
      onLeadUpdated(formData);
      setEditMode(false);
    } catch (err) {
      console.error("Error updating lead:", err);
      setError("Failed to update lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e2e8f0',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: '#4f46e5',
            fontSize: '1.25rem'
          }}>
            {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {lead.firstName} {lead.lastName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {lead.company || 'No company specified'}
            </Typography>
          </Box>
        </Box>
        <Box>
          {editMode ? (
            <Button
              variant="contained"
              size="small"
              startIcon={<FiSave size={16} />}
              onClick={handleSave}
              disabled={loading}
              sx={{
                mr: 1,
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FiEdit2 size={16} />}
              onClick={() => setEditMode(true)}
              sx={{
                mr: 1,
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': { 
                  borderColor: '#c7d2fe',
                  backgroundColor: '#eef2ff'
                }
              }}
            >
              Edit
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            sx={{
              borderColor: '#e2e8f0',
              color: '#64748b',
              '&:hover': { 
                borderColor: '#fee2e2',
                backgroundColor: '#fef2f2'
              }
            }}
          >
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Overview" icon={<FiUser size={16} />} />
          <Tab label="Details" icon={<FiFileText size={16} />} />
          <Tab label="Activity" icon={<FiClock size={16} />} />
        </Tabs>

        {tabValue === 0 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FiUser size={16} />
                Personal Information
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <FiUser className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
                
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                />
              </div>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FiBriefcase size={16} />
                Company Information
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Company Name"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <FiBriefcase className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
                
                <TextField
                  label="Job Title"
                  name="jobTitle"
                  value={formData.jobTitle || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                />
              </div>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FiMail size={16} />
                Contact Information
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <FiMail className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
                
                <TextField
                  label="Phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <FiPhone className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </div>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FiDollarSign size={16} />
                Lead Details
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormControl fullWidth margin="normal" disabled={!editMode}>
                  <InputLabel>Source</InputLabel>
                  <Select
                    label="Source"
                    name="source"
                    value={formData.source || ''}
                    onChange={handleChange}
                  >
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Event">Event</MenuItem>
                    <MenuItem value="Cold Call">Cold Call</MenuItem>
                    <MenuItem value="Email Campaign">Email Campaign</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal" disabled={!editMode}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    name="status"
                    value={formData.status || 'new'}
                    onChange={handleChange}
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="qualified">Qualified</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Budget"
                  name="budget"
                  value={formData.budget || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <FiDollarSign className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />

                <TextField
                  label="Expected Close Date"
                  name="expectedCloseDate"
                  type="date"
                  value={formData.expectedCloseDate || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <FiCalendar className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </div>
            </Box>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="subtitle2" sx={{ 
              fontWeight: 'bold', 
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}>
              <FiClock size={16} />
              Lead Activity
            </Typography>
            
            <Box sx={{ 
              backgroundColor: '#f8fafc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center'
            }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No activity recorded yet
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsModal;