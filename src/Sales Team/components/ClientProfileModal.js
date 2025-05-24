import React, { useState, useEffect } from "react";
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
  Paper,
  Grid,
  Badge
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
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiPercent,
  FiUpload,
  FiFileText,
  FiPaperclip,
  FiImage,
  FiDollarSign
} from "react-icons/fi";
import { db } from "../../services/firebase";
import { doc, updateDoc } from "firebase/firestore";

const paymentMethods = [
  "Bank Transfer",
  "Credit Card",
  "Debit Card",
  "PayPal",
  "UPI",
  "Cheque",
  "Cash"
];

const paymentStatuses = [
  { value: "paid", label: "Paid", icon: <FiCheckCircle />, color: "success" },
  { value: "partially_paid", label: "Partially Paid", icon: <FiPercent />, color: "warning" },
  { value: "not_paid", label: "Not Paid", icon: <FiAlertCircle />, color: "error" }
];

const ClientProfileModal = ({ open, onClose, client, onClientUpdated }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    ...client,
    paymentProof: client.paymentProof || [],
    startDate: client.startDate || '',
    endDate: client.endDate || '',
    duration: client.duration || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPaymentProof, setNewPaymentProof] = useState([]);

  useEffect(() => {
    if (formData.startDate && formData.duration) {
      const durationMatch = formData.duration.match(/(\d+)\s*(day|week|month|year)/i);
      if (durationMatch) {
        const amount = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        const startDate = new Date(formData.startDate);
        
        let endDate = new Date(startDate);
        if (unit === 'day') {
          endDate.setDate(startDate.getDate() + amount);
        } else if (unit === 'week') {
          endDate.setDate(startDate.getDate() + (amount * 7));
        } else if (unit === 'month') {
          endDate.setMonth(startDate.getMonth() + amount);
        } else if (unit === 'year') {
          endDate.setFullYear(startDate.getFullYear() + amount);
        }
        
        setFormData(prev => ({
          ...prev,
          endDate: endDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.startDate, formData.duration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentProofChange = (e) => {
    setNewPaymentProof([...e.target.files]);
  };

  const removePaymentProof = (index) => {
    const newFiles = [...formData.paymentProof];
    newFiles.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      paymentProof: newFiles
    }));
  };

  const getFileIcon = (file) => {
    if (typeof file === 'string' || file.type?.startsWith('image/')) {
      return <FiImage size={16} />;
    }
    return <FiPaperclip size={16} />;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedData = {
        ...formData,
        paymentProof: [
          ...formData.paymentProof,
          ...newPaymentProof.map(file => file.name)
        ]
      };
      
      await updateDoc(doc(db, 'users', client.id), updatedData);
      
      onClientUpdated(updatedData);
      setEditMode(false);
      setNewPaymentProof([]);
    } catch (err) {
      console.error("Error updating client:", err);
      setError("Failed to update client. Please try again.");
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
          borderRadius: '12px',
          marginTop:'-30px',
          height:'80vh'
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
            {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {client.firstName} {client.lastName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {client.company || 'No company specified'}
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
              label="Industry"
              name="industry"
              value={formData.industry || ''}
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
            <FiCalendar size={16} />
            Project Timeline
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              disabled={!editMode}
              InputProps={{
                startAdornment: (
                  <FiCalendar className="text-gray-400 mr-2" size={18} />
                )
              }}
            />
            
            <TextField
              label="Duration"
              name="duration"
              value={formData.duration || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              disabled={!editMode}
              placeholder="e.g., 2 weeks, 1 month"
            />
            
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate || ''}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              disabled={!editMode}
              InputProps={{
                startAdornment: (
                  <FiCalendar className="text-gray-400 mr-2" size={18} />
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
            <FiCreditCard size={16} />
            Payment Information
          </Typography>
          
          <Paper elevation={0} sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc'
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Payment Status"
                  name="paymentStatus"
                  value={formData.paymentStatus || 'not_paid'}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  disabled={!editMode}
                >
                  {paymentStatuses.map((status) => (
                    <MenuItem 
                      key={status.value} 
                      value={status.value}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: `${status.color}.main`
                      }}>
                        {status.icon}
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                
                {(formData.paymentStatus === 'partially_paid') && (
                  <TextField
                    label="Paid Amount (₹)"
                    name="paidAmount"
                    value={formData.paidAmount || ''}
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
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                {(formData.paymentStatus === 'paid' || formData.paymentStatus === 'partially_paid') && (
                  <>
                    <TextField
                      select
                      label="Payment Method"
                      name="paymentMethod"
                      value={formData.paymentMethod || ''}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      disabled={!editMode}
                    >
                      {paymentMethods.map((method) => (
                        <MenuItem key={method} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </TextField>
                    
                    <Box sx={{ mt: 2 }}>
                      <input
                        type="file"
                        id="payment-proof-upload"
                        multiple
                        onChange={handlePaymentProofChange}
                        style={{ display: 'none' }}
                        disabled={!editMode}
                      />
                      <label htmlFor="payment-proof-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<FiUpload size={16} />}
                          disabled={!editMode}
                          sx={{
                            textTransform: 'none',
                            borderRadius: '6px',
                            borderColor: '#e2e8f0',
                            color: '#64748b',
                            '&:hover': {
                              borderColor: '#c7d2fe',
                              backgroundColor: '#eef2ff'
                            }
                          }}
                        >
                          Upload Payment Proof
                        </Button>
                      </label>
                      
                      {(formData.paymentProof.length > 0 || newPaymentProof.length > 0) && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Payment proofs:
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            mt: 1, 
                            flexWrap: 'wrap',
                            maxHeight: '120px',
                            overflowY: 'auto'
                          }}>
                            {formData.paymentProof.map((file, index) => (
                              <Paper 
                                key={index}
                                elevation={0}
                                sx={{
                                  p: 1,
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  width: '100%'
                                }}
                              >
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                  badgeContent={getFileIcon(file)}
                                >
                                  <Avatar 
                                    src={typeof file === 'string' ? file : (file.type?.startsWith('image/') ? URL.createObjectURL(file) : null)}
                                    variant="rounded"
                                    sx={{ width: 40, height: 40, bgcolor: 'grey.100' }}
                                  >
                                    <FiFileText size={18} color="#64748b" />
                                  </Avatar>
                                </Badge>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap>
                                    {typeof file === 'string' ? file.split('/').pop() : file.name}
                                  </Typography>
                                </Box>
                                {editMode && (
                                  <Button 
                                    size="small" 
                                    onClick={() => removePaymentProof(index)}
                                    sx={{ minWidth: 'auto', p: 0.5 }}
                                    disabled={!editMode}
                                  >
                                    <FiX size={16} />
                                  </Button>
                                )}
                              </Paper>
                            ))}
                            
                            {newPaymentProof.map((file, index) => (
                              <Paper 
                                key={`new-${index}`}
                                elevation={0}
                                sx={{
                                  p: 1,
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  width: '100%'
                                }}
                              >
                                <Badge
                                  overlap="circular"
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                  badgeContent={getFileIcon(file)}
                                >
                                  <Avatar 
                                    src={file.type.startsWith('image/') ? URL.createObjectURL(file) : null}
                                    variant="rounded"
                                    sx={{ width: 40, height: 40, bgcolor: 'grey.100' }}
                                  >
                                    <FiFileText size={18} color="#64748b" />
                                  </Avatar>
                                </Badge>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap>
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </Typography>
                                </Box>
                                <Button 
                                  size="small" 
                                  onClick={() => {
                                    const newFiles = [...newPaymentProof];
                                    newFiles.splice(index, 1);
                                    setNewPaymentProof(newFiles);
                                  }}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                  <FiX size={16} />
                                </Button>
                              </Paper>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold', 
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}>
            <FiMessageSquare size={16} />
            Communication Preferences
          </Typography>
          
          <FormControl fullWidth margin="normal" disabled={!editMode}>
            <InputLabel>Preferred Channel</InputLabel>
            <Select
              label="Preferred Channel"
              name="communicationChannel"
              value={formData.communicationChannel || ''}
              onChange={handleChange}
              startAdornment={
                <FiMessageSquare className="text-gray-400 mr-2" size={18} />
              }
            >
              <MenuItem value="Email">Email</MenuItem>
              <MenuItem value="WhatsApp">WhatsApp</MenuItem>
              <MenuItem value="Phone Call">Phone Call</MenuItem>
              <MenuItem value="Zoom">Zoom</MenuItem>
              <MenuItem value="Microsoft Teams">Microsoft Teams</MenuItem>
              <MenuItem value="Slack">Slack</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileModal;