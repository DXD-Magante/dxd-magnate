import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Chip,
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Avatar,
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
  FiClock,
  FiDollarSign,
  FiFileText,
  FiMessageSquare,
  FiSend,
  FiX,
  FiCheck,
  FiUpload,
  FiCreditCard,
  FiCheckCircle,
  FiDollarSign as FiDollar,
  FiAlertCircle,
  FiPercent,
  FiImage,
  FiPaperclip
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import emailjs from "@emailjs/browser"; 

const projectTypes = [
  "Branding",
  "Web Development",
  "Marketing",
  "UI/UX Design",
  "SEO",
  "Content Writing",
  "Social Media",
  "Video Production"
];

const communicationChannels = [
  "Email",
  "WhatsApp",
  "Phone Call",
  "Zoom",
  "Microsoft Teams",
  "Slack"
];

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

const OnboardClientModal = ({ open, onClose, lead }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    projectTitle: "",
    projectType: lead?.service || "",
    projectDescription: "",
    startDate: "",
    endDate: "",
    duration: "",
    budget: "",
    notes: lead?.notes || "",
    communicationChannel: "",
    sendWelcomeEmail: true,
    paymentStatus: "not_paid",
    paymentMethod: "",
    paidAmount: "",
    paymentProof: []
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    emailjs.init("yCz1x3bWkjQXBkJTA");
  }, []);

  // Auto-fill form when lead data changes
  useEffect(() => {
    if (lead) {
      setFormData({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        companyName: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        projectTitle: `${lead.company || 'Project'} ${lead.service || 'Engagement'}`,
        projectType: lead.service || '',
        projectDescription: `New ${lead.service || 'project'} engagement for ${lead.company || 'client'}`,
        startDate: lead.expectedCloseDate || new Date().toISOString().split('T')[0],
        endDate: "",
        duration: "1 month",
        budget: lead.budget || '',
        notes: lead.notes || '',
        communicationChannel: "",
        sendWelcomeEmail: true,
        paymentStatus: "not_paid",
        paymentMethod: "",
        paidAmount: "",
        paymentProof: []
      });
    }
  }, [lead]);

  // Calculate end date based on start date and duration
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

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handlePaymentProofChange = (e) => {
    setFormData(prev => ({
      ...prev,
      paymentProof: [...e.target.files]
    }));
  };

  const removePaymentProof = (index) => {
    const newFiles = [...formData.paymentProof];
    newFiles.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      paymentProof: newFiles
    }));
  };

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8) + 'A1!';
  };

  const sendWelcomeEmail = async (email, firstName) => {
    try {
      const templateParams = {
        to_email: email,
        to_name: firstName,
        from_name: 'DXD Magnate',
        message: `Welcome to our platform! Your account has been created. Your temporary password is ${generateTempPassword()}. Please change it after logging in.`
      };

      await emailjs.send(
        'service_t3r4nqe',
        'template_i8v9cwi',
        templateParams
      );
    } catch (err) {
      console.error('Error sending welcome email:', err);
      throw err;
    }
  };

  const handleSubmit = async (sendEmail = false) => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('First name, last name, and email are required');
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create client account
      const tempPassword = "defaultPassword123";
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        tempPassword
      );

      // 2. Create user document with additional info
      const userDoc = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.companyName,
        role: 'client',
        status: 'active',
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        salesRep: lead.assignedTo,
        onboardedBy: lead.assignedTo,
        onboardedDate: new Date().toISOString(),
        communicationChannel: formData.communicationChannel,
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

      // 3. Create project document
      const projectDoc = {
        title: formData.projectTitle,
        type: formData.projectType,
        description: formData.projectDescription,
        startDate: formData.startDate,
        endDate: formData.endDate,
        duration: formData.duration,
        budget: formData.budget,
        clientId: userCredential.user.uid,
        clientName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName:formData.lastName,
        company: formData.companyName,
        status: 'Not started yet',
        projectManager: 'Not assigned',
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.uid,
        notes: formData.notes,
        leadId: lead?.id || null,
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod,
        paidAmount: formData.paidAmount
      };

      await addDoc(collection(db, 'dxd-magnate-projects'), projectDoc);

      // 4. Update lead document if it exists
      if (lead?.id) {
        await updateDoc(doc(db, 'leads', lead.id), {
          converted:true,
          convertedDate: new Date().toISOString(),
          convertedBy: lead.assignedTo,
          budget: formData.budget || lead.budget,
          clientId: userCredential.user.uid
        });
      }

      // 5. Send welcome email if selected
      if (formData.sendWelcomeEmail || sendEmail) {
        await sendWelcomeEmail(formData.email, formData.firstName);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error onboarding client:', err);
      setError(err.message.includes('email-already-in-use') 
        ? 'This email is already registered' 
        : 'Failed to onboard client. Please try again.');
      setSnackbarOpen(true);
      alert(err)
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return <FiImage size={16} />;
    }
    return <FiPaperclip size={16} />;
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
          height:'80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 'bold', 
        color: '#1e293b',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <FiUser size={20} />
        Onboard New Client: {lead?.company || `${lead?.firstName || ''} ${lead?.lastName || ''}`}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {success ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            py: 8 
          }}>
            <Box sx={{
              p: 2,
              bgcolor: 'success.light',
              borderRadius: '50%',
              mb: 3
            }}>
              <FiCheck size={32} color="#4caf50" />
            </Box>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              Client Onboarded Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.firstName} {formData.lastName} has been added as a client.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FiFileText size={16} />
                Client & Project Info
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  required
                  InputProps={{
                    startAdornment: (
                      <FiUser className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
                
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  required
                />
                
                <TextField
                  label="Company / Brand Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FiBriefcase className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
                
                <TextField
                  label="Email ID"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  required
                  InputProps={{
                    startAdornment: (
                      <FiMail className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
                
                <TextField
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FiPhone className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
                
                <TextField
                  label="Project Title"
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <TextField
                  select
                  label="Project Type"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  required
                >
                  {projectTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  label="Budget (₹)"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FiDollarSign className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </div>
              
              <TextField
                label="Project Description"
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleChange}
                fullWidth
                margin="normal"
                variant="outlined"
                multiline
                rows={3}
                required
              />
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
                <FiClock size={16} />
                Timeline & Budget
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextField
                  label="Expected Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <FiCalendar className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                  required
                />
                
                <TextField
                  label="Estimated Duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="e.g., 2 weeks, 1 month"
                  required
                />
                
                <TextField
                  label="Expected End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <FiCalendar className="text-gray-400 mr-2" size={18} />
                    )
                  }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <TextField
                  label="Budget (₹)"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <FiDollarSign className="text-gray-400 mr-2" size={18} />
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
                      value={formData.paymentStatus}
                      onChange={handleChange}
                      fullWidth
                      margin="normal"
                      variant="outlined"
                      required
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
                    
                    {formData.paymentStatus === 'partially_paid' && (
                      <TextField
                        label="Paid Amount (₹)"
                        name="paidAmount"
                        value={formData.paidAmount}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <FiDollar className="text-gray-400 mr-2" size={18} />
                          )
                        }}
                        required
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
                          value={formData.paymentMethod}
                          onChange={handleChange}
                          fullWidth
                          margin="normal"
                          variant="outlined"
                          required
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
                          />
                          <label htmlFor="payment-proof-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={<FiUpload size={16} />}
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
                          
                          {formData.paymentProof.length > 0 && (
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
                                {Array.from(formData.paymentProof).map((file, index) => (
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
                                      onClick={() => removePaymentProof(index)}
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
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ 
                fontWeight: 'bold', 
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2
              }}>
                <FiUpload size={16} />
                Attachments (Optional)
              </Typography>
              
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FiUpload size={16} />}
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
                  Upload Files
                </Button>
              </label>
              
              {files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Selected files:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    {Array.from(files).map((file, index) => (
                      <Chip
                        key={index}
                        label={file.name}
                        size="small"
                        onDelete={() => {
                          const newFiles = [...files];
                          newFiles.splice(index, 1);
                          setFiles(newFiles);
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
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
                Sales Notes (Internal Use)
              </Typography>
              
              <TextField
                label="Client Expectations / Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                fullWidth
                margin="normal"
                variant="outlined"
                multiline
                rows={3}
              />
              
              <TextField
                select
                label="Preferred Communication Channel"
                name="communicationChannel"
                value={formData.communicationChannel}
                onChange={handleChange}
                fullWidth
                margin="normal"
                variant="outlined"
                sx={{ mt: 2 }}
              >
                {communicationChannels.map((channel) => (
                  <MenuItem key={channel} value={channel}>
                    {channel}
                  </MenuItem>
                ))}
              </TextField>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sendWelcomeEmail}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sendWelcomeEmail: e.target.checked
                    }))}
                    name="sendWelcomeEmail"
                    color="primary"
                  />
                }
                label="Send Welcome Email to Client"
                sx={{ mt: 1 }}
              />
            </Box>
          </>
        )}
      </DialogContent>
      
      {!success && (
        <DialogActions sx={{ 
          padding: '16px 24px', 
          borderTop: '1px solid #e2e8f0',
          justifyContent: 'space-between'
        }}>
          <Button
            onClick={onClose}
            variant="outlined"
            startIcon={<FiX size={18} />}
            disabled={loading}
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
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleSubmit(false)}
              variant="contained"
              startIcon={loading ? <CircularProgress size={18} /> : <FiCheck size={18} />}
              disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
            >
              {loading ? 'Onboarding...' : 'Save & Onboard'}
            </Button>
            
            {formData.sendWelcomeEmail && (
              <Button
                onClick={() => handleSubmit(true)}
                variant="contained"
                startIcon={loading ? <CircularProgress size={18} /> : <FiSend size={18} />}
                disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#10b981',
                  '&:hover': { backgroundColor: '#0d9f6e' }
                }}
              >
                {loading ? 'Sending...' : 'Onboard & Send Email'}
              </Button>
            )}
          </div>
        </DialogActions>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>
          {error || 'Operation completed successfully!'}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default OnboardClientModal;