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
  TextareaAutosize,
  Collapse,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Badge
} from '@mui/material';
import { 
  FiUser, FiX, FiCheck, FiMail, FiPhone, 
  FiBriefcase, FiDollarSign, FiCalendar, 
  FiFlag, FiFileText, FiPlus, FiChevronDown,
  FiChevronUp, FiSend, FiEdit2, FiInfo,
  FiClock, FiLayers, FiMessageSquare
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import AddNewLeadModal from './AddLead';

const CreateProposalModal = ({ open, onClose }) => {
  const [proposalData, setProposalData] = useState({
    client: '',
    clientDetails: null,
    newClient: false,
    newClientData: {
      fullName: '',
      company: '',
      email: '',
      phone: '',
      leadSource: ''
    },
    services: [],
    serviceOther: '',
    pricingModel: 'fixed',
    fixedPrice: '',
    hourlyRate: '',
    estimatedHours: '',
    duration: '',
    message: '',
    status: 'draft'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [leads, setLeads] = useState([]);
  const [fetchingLeads, setFetchingLeads] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const serviceOptions = [
    'Web Development',
    'Mobile App Development',
    'UI/UX Design',
    'SEO & Digital Marketing',
    'Branding & Identity',
    'Content Creation',
    'E-commerce Solutions',
    'Other'
  ];

  const pricingModels = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'negotiable', label: 'Negotiable' }
  ];

  useEffect(() => {
    const fetchLeads = async () => {
      setFetchingLeads(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const q = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid),
          where('status', 'in', ['contacted', 'proposal-sent', 'negotiation'])
        );
        
        const querySnapshot = await getDocs(q);
        const leadsData = [];
        
        querySnapshot.forEach((doc) => {
          const lead = doc.data();
          leadsData.push({
            id: doc.id,
            ...lead,
            displayName: `${lead.fullName} - ${lead.company || 'No Company'} (#LEAD${doc.id.slice(0, 5).toUpperCase()})`
          });
        });
        
        setLeads(leadsData);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to load leads data');
      } finally {
        setFetchingLeads(false);
      }
    };

    if (open) {
      fetchLeads();
    }
  }, [open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProposalData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewClientChange = (e) => {
    const { name, value } = e.target;
    setProposalData(prev => ({
      ...prev,
      newClientData: {
        ...prev.newClientData,
        [name]: value
      }
    }));
  };

  const handleClientSelect = (leadId) => {
    const selectedLead = leads.find(lead => lead.id === leadId);
    setProposalData(prev => ({
      ...prev,
      client: leadId,
      clientDetails: selectedLead
    }));
  };

  const toggleNewClient = () => {
    setProposalData(prev => ({
      ...prev,
      newClient: !prev.newClient,
      client: '',
      clientDetails: null
    }));
  };

  const handleServiceChange = (e) => {
    const { value } = e.target;
    if (value === 'Other') return;
    
    setProposalData(prev => {
      if (prev.services.includes(value)) {
        return {
          ...prev,
          services: prev.services.filter(service => service !== value)
        };
      } else {
        return {
          ...prev,
          services: [...prev.services, value]
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (!proposalData.client && !proposalData.newClient) {
      setError('Please select a client or add a new one');
      return;
    }

    if (proposalData.newClient && (
      !proposalData.newClientData.fullName || 
      !proposalData.newClientData.email || 
      !proposalData.newClientData.phone
    )) {
      setError('For new clients, full name, email and phone are required');
      return;
    }

    if (proposalData.services.length === 0) {
      setError('Please select at least one service');
      return;
    }

    if (proposalData.pricingModel === 'fixed' && !proposalData.fixedPrice) {
      setError('Please enter fixed price amount');
      return;
    }

    if (proposalData.pricingModel === 'hourly' && (!proposalData.hourlyRate || !proposalData.estimatedHours)) {
      setError('Please enter both hourly rate and estimated hours');
      return;
    }

    if (!proposalData.duration) {
      setError('Please enter estimated duration');
      return;
    }

    if (!proposalData.message || proposalData.message.length < 20) {
      setError('Proposal message should be at least 20 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      
      // If new client, first create the lead
      let clientId = proposalData.client;
      if (proposalData.newClient) {
        const leadToSave = {
          ...proposalData.newClientData,
          status: 'proposal-sent',
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
          assignedTo: currentUser.uid,
          lastUpdated: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'leads'), leadToSave);
        clientId = docRef.id;
      }

      // Create the proposal
      const proposalToSave = {
        clientId,
        clientDetails: proposalData.newClient ? {
          ...proposalData.newClientData,
          id: clientId
        } : proposalData.clientDetails,
        services: proposalData.services,
        serviceOther: proposalData.serviceOther,
        pricingModel: proposalData.pricingModel,
        pricingDetails: {
          fixedPrice: proposalData.fixedPrice,
          hourlyRate: proposalData.hourlyRate,
          estimatedHours: proposalData.estimatedHours
        },
        duration: proposalData.duration,
        message: proposalData.message,
        status: proposalData.status,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };

      await addDoc(collection(db, 'proposals'), proposalToSave);

      // Update lead status if not new client
      if (!proposalData.newClient && proposalData.client) {
        await updateDoc(doc(db, 'leads', proposalData.client), {
          status: 'proposal-sent',
          lastUpdated: serverTimestamp()
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError('Failed to create proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProposalData({
      client: '',
      clientDetails: null,
      newClient: false,
      newClientData: {
        fullName: '',
        company: '',
        email: '',
        phone: '',
        leadSource: ''
      },
      services: [],
      serviceOther: '',
      pricingModel: 'fixed',
      fixedPrice: '',
      hourlyRate: '',
      estimatedHours: '',
      duration: '',
      message: '',
      status: 'draft'
    });
  };

  const calculateTotal = () => {
    if (proposalData.pricingModel === 'fixed') {
      return proposalData.fixedPrice ? `₹${Number(proposalData.fixedPrice).toLocaleString()}` : 'Not specified';
    } else if (proposalData.pricingModel === 'hourly') {
      if (proposalData.hourlyRate && proposalData.estimatedHours) {
        return `₹${(Number(proposalData.hourlyRate) * Number(proposalData.estimatedHours))} (₹${proposalData.hourlyRate}/hr x ${proposalData.estimatedHours} hrs)`;
      }
      return 'Not specified';
    }
    return 'To be negotiated';
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
              <FiFileText size={22} />
            </div>
            <Typography variant="h6" className="font-bold text-gray-800">
              Create New Proposal
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
              Proposal Created Successfully!
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-center max-w-xs">
              {proposalData.newClient ? 
                `Proposal for ${proposalData.newClientData.fullName} has been created.` : 
                `Proposal for ${proposalData.clientDetails?.fullName} has been created.`}
            </Typography>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Section 1: Client Information */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiUser className="text-indigo-500" />
                Client Information
              </Typography>
              
              <div className="flex items-center justify-between mb-2">
                <Typography variant="body2" className="text-gray-600">
                  {proposalData.newClient ? 'Add New Client' : 'Select Existing Client'}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={proposalData.newClient}
                      onChange={toggleNewClient}
                      color="primary"
                    />
                  }
                  label={proposalData.newClient ? 'New Client' : 'Existing Client'}
                  labelPlacement="start"
                />
              </div>

              {proposalData.newClient ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <TextField
                    label="Full Name"
                    variant="outlined"
                    size="medium"
                    fullWidth
                    name="fullName"
                    value={proposalData.newClientData.fullName}
                    onChange={handleNewClientChange}
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
                    label="Company Name"
                    variant="outlined"
                    size="medium"
                    fullWidth
                    name="company"
                    value={proposalData.newClientData.company}
                    onChange={handleNewClientChange}
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
                    label="Email Address"
                    variant="outlined"
                    size="medium"
                    fullWidth
                    type="email"
                    name="email"
                    value={proposalData.newClientData.email}
                    onChange={handleNewClientChange}
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
                  <TextField
                    label="Phone Number"
                    variant="outlined"
                    size="medium"
                    fullWidth
                    name="phone"
                    value={proposalData.newClientData.phone}
                    onChange={handleNewClientChange}
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
              ) : (
                <FormControl fullWidth size="medium">
                  <InputLabel>Select Client</InputLabel>
                  <Select
                    label="Select Client"
                    name="client"
                    value={proposalData.client}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                    disabled={fetchingLeads}
                  >
                    {fetchingLeads ? (
                      <MenuItem disabled>
                        <div className="flex items-center gap-2">
                          <CircularProgress size={16} />
                          Loading clients...
                        </div>
                      </MenuItem>
                    ) : (
                      leads.map((lead) => (
                        <MenuItem key={lead.id} value={lead.id}>
                          {lead.displayName}
                        </MenuItem>
                      ))
                    )}
                    {!fetchingLeads && leads.length === 0 && (
                      <MenuItem disabled>
                        No qualified leads found
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              )}

              {(proposalData.clientDetails || proposalData.newClient) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Typography variant="subtitle2" className="font-semibold mb-2 flex items-center gap-2">
                    <FiInfo className="text-blue-500" />
                    Client Summary
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Typography variant="caption" className="text-gray-500 block">
                        Name
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {proposalData.newClient ? 
                          proposalData.newClientData.fullName : 
                          proposalData.clientDetails?.fullName}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" className="text-gray-500 block">
                        Company
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {proposalData.newClient ? 
                          (proposalData.newClientData.company || 'Not specified') : 
                          (proposalData.clientDetails?.company || 'Not specified')}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" className="text-gray-500 block">
                        Email
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {proposalData.newClient ? 
                          proposalData.newClientData.email : 
                          proposalData.clientDetails?.email}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="caption" className="text-gray-500 block">
                        Phone
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {proposalData.newClient ? 
                          proposalData.newClientData.phone : 
                          proposalData.clientDetails?.phone}
                      </Typography>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Divider className="my-2" />
            
            {/* Section 2: Service Details */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiLayers className="text-blue-500" />
                Service Details
              </Typography>
              
              <FormControl fullWidth size="medium">
                <InputLabel>Select Services</InputLabel>
                <Select
                  label="Select Services"
                  multiple
                  value={proposalData.services}
                  onChange={handleServiceChange}
                  renderValue={(selected) => (
                    <div className="flex flex-wrap gap-1">
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </div>
                  )}
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  {serviceOptions.map((service) => (
                    <MenuItem key={service} value={service}>
                      {service}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {proposalData.services.includes('Other') && (
                <TextField
                  label="Please specify other service"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="serviceOther"
                  value={proposalData.serviceOther}
                  onChange={handleInputChange}
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                />
              )}
            </div>
            
            <Divider className="my-2" />
            
            {/* Section 3: Pricing & Duration */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiDollarSign className="text-green-500" />
                Pricing & Duration
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormControl fullWidth size="medium">
                  <InputLabel>Pricing Model</InputLabel>
                  <Select
                    label="Pricing Model"
                    name="pricingModel"
                    value={proposalData.pricingModel}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    {pricingModels.map((model) => (
                      <MenuItem key={model.value} value={model.value}>
                        {model.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {proposalData.pricingModel === 'fixed' && (
                  <TextField
                    label="Fixed Price (₹)"
                    variant="outlined"
                    size="medium"
                    fullWidth
                    name="fixedPrice"
                    type="number"
                    value={proposalData.fixedPrice}
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
                )}
                
                {proposalData.pricingModel === 'hourly' && (
                  <>
                    <TextField
                      label="Hourly Rate (₹)"
                      variant="outlined"
                      size="medium"
                      fullWidth
                      name="hourlyRate"
                      type="number"
                      value={proposalData.hourlyRate}
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
                    <TextField
                      label="Estimated Hours"
                      variant="outlined"
                      size="medium"
                      fullWidth
                      name="estimatedHours"
                      type="number"
                      value={proposalData.estimatedHours}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <FiClock className="text-gray-400 mr-3" size={18} />
                        ),
                        sx: {
                          borderRadius: '10px',
                          backgroundColor: '#f8fafc'
                        }
                      }}
                    />
                  </>
                )}
              </div>
              
              <TextField
                label="Estimated Duration"
                variant="outlined"
                size="medium"
                fullWidth
                name="duration"
                value={proposalData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 2 weeks, 1 month, etc."
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
            
            {/* Section 4: Proposal Message */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiMessageSquare className="text-purple-500" />
                Proposal Message
              </Typography>
              
              <TextareaAutosize
                minRows={4}
                placeholder="Write your proposal message here..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                name="message"
                value={proposalData.message}
                onChange={handleInputChange}
                maxLength={500}
              />
              <Typography variant="caption" className="text-gray-500 block text-right">
                {proposalData.message.length}/500 characters
              </Typography>
            </div>
            
            {/* Preview Section */}
            <Accordion 
              expanded={showPreview}
              onChange={() => setShowPreview(!showPreview)}
              sx={{
                boxShadow: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: '8px !important',
                overflow: 'hidden'
              }}
            >
              <AccordionSummary
                expandIcon={<FiChevronDown />}
                sx={{
                  backgroundColor: '#f8fafc',
                  '& .MuiAccordionSummary-content': {
                    alignItems: 'center'
                  }
                }}
              >
                <Typography variant="subtitle2" className="font-semibold flex items-center gap-2">
                  <FiFileText className="text-indigo-500" />
                  Proposal Preview
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ backgroundColor: '#ffffff' }}>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Typography variant="subtitle2" className="font-semibold mb-3">
                      Client Information
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Typography variant="caption" className="text-gray-500 block">
                          Client Name
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {proposalData.newClient ? 
                            proposalData.newClientData.fullName : 
                            proposalData.clientDetails?.fullName || 'Not selected'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-gray-500 block">
                          Company
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {proposalData.newClient ? 
                            (proposalData.newClientData.company || 'Not specified') : 
                            (proposalData.clientDetails?.company || 'Not specified')}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Typography variant="subtitle2" className="font-semibold mb-3">
                      Services
                    </Typography>
                    {proposalData.services.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {proposalData.services.map((service, index) => (
                          <Chip key={index} label={service} size="small" />
                        ))}
                        {proposalData.services.includes('Other') && proposalData.serviceOther && (
                          <Chip label={proposalData.serviceOther} size="small" />
                        )}
                      </div>
                    ) : (
                      <Typography variant="body2" className="text-gray-500">
                        No services selected
                      </Typography>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Typography variant="subtitle2" className="font-semibold mb-3">
                      Pricing & Duration
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Typography variant="caption" className="text-gray-500 block">
                          Pricing Model
                        </Typography>
                        <Typography variant="body2" className="font-medium capitalize">
                          {proposalData.pricingModel}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-gray-500 block">
                          Estimated Total
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {calculateTotal()}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-gray-500 block">
                          Duration
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {proposalData.duration || 'Not specified'}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Typography variant="subtitle2" className="font-semibold mb-3">
                      Proposal Message
                    </Typography>
                    <Typography variant="body2" className="whitespace-pre-line">
                      {proposalData.message || 'No message entered'}
                    </Typography>
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>
            
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
          <div className="flex gap-2">
            <Button
              variant="outlined"
              onClick={() => setProposalData(prev => ({ ...prev, status: 'draft' }))}
              startIcon={<FiEdit2 size={18} />}
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
              Save Draft
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setProposalData(prev => ({ ...prev, status: 'sent' }));
                handleSubmit();
              }}
              startIcon={loading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <FiSend size={18} />
              )}
              disabled={loading}
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
              {loading ? 'Sending...' : 'Send Proposal'}
            </Button>
          </div>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CreateProposalModal;