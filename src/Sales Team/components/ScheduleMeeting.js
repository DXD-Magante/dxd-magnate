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
  Typography,
  Divider,
  IconButton,
  TextareaAutosize,
  FormControlLabel,
  Switch,
  Box
} from '@mui/material';
import { 
  FiCalendar, FiClock, FiVideo, FiPhone, 
  FiMapPin, FiMail, FiUser, FiX, 
  FiCheck, FiPlus, FiLink, FiBell, FiFileText
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { db, auth } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

const ScheduleMeetingModal = ({ open, onClose, leadId }) => {
  const [meetingData, setMeetingData] = useState({
    leadId: leadId || '',
    title: '',
    type: 'video',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: 30,
    location: '',
    agenda: '',
    sendReminder: true,
    reminderMinutes: 15
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [leads, setLeads] = useState([]);
  const [fetchingLeads, setFetchingLeads] = useState(false);

  const meetingTypes = [
    { value: 'video', label: 'Video Call', icon: <FiVideo /> },
    { value: 'phone', label: 'Phone Call', icon: <FiPhone /> },
    { value: 'in-person', label: 'In-Person', icon: <FiMapPin /> }
  ];

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const reminderOptions = [
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' }
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
          where('status', 'in', ['new', 'contacted', 'proposal-sent', 'negotiation'])
        );
        
        const querySnapshot = await getDocs(q);
        const leadsData = [];
        
        querySnapshot.forEach((doc) => {
          const lead = doc.data();
          leadsData.push({
            id: doc.id,
            ...lead,
            displayName: `${lead.fullName} - ${lead.company || 'No Company'}`
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

    if (open && !leadId) {
      fetchLeads();
    }
  }, [open, leadId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeetingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!meetingData.leadId) {
      setError('Please select a lead/client');
      return;
    }

    if (!meetingData.title) {
      setError('Please enter a meeting title');
      return;
    }

    if (!meetingData.agenda) {
      setError('Please enter a meeting agenda');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      
      // Combine date and time
      const [hours, minutes] = meetingData.time.split(':').map(Number);
      const meetingDateTime = new Date(meetingData.date);
      meetingDateTime.setHours(hours);
      meetingDateTime.setMinutes(minutes);
      
      const meetingToSave = {
        ...meetingData,
        dateTime: meetingDateTime,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'scheduled'
      };

      await addDoc(collection(db, 'meetings'), meetingToSave);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setMeetingData({
          leadId: leadId || '',
          title: '',
          type: 'video',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          duration: 30,
          location: '',
          agenda: '',
          sendReminder: true,
          reminderMinutes: 15
        });
      }, 2000);
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      setError('Failed to schedule meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatMeetingLink = () => {
    if (meetingData.type !== 'video') return '';
    
    const platforms = [
      'https://meet.google.com/new',
      'https://zoom.us/start',
      'https://teams.microsoft.com'
    ];
    return platforms[Math.floor(Math.random() * platforms.length)];
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
              <FiCalendar size={22} />
            </div>
            <Typography variant="h6" className="font-bold text-gray-800">
              Schedule New Meeting
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
              Meeting Scheduled Successfully!
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-center max-w-xs">
              The meeting has been scheduled and notifications have been sent.
            </Typography>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Section 1: Meeting Details */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiCalendar className="text-indigo-500" />
                Meeting Details
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Meeting Title"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="title"
                  value={meetingData.title}
                  onChange={handleInputChange}
                  InputProps={{
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                  required
                />
                
                {!leadId && (
                  <FormControl fullWidth size="medium">
                    <InputLabel>Select Lead/Client</InputLabel>
                    <Select
                      label="Select Lead/Client"
                      name="leadId"
                      value={meetingData.leadId}
                      onChange={handleInputChange}
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
                            Loading leads...
                          </div>
                        </MenuItem>
                      ) : (
                        leads.map((lead) => (
                          <MenuItem key={lead.id} value={lead.id}>
                            {lead.displayName}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                )}
              </div>
              
              <FormControl fullWidth size="medium">
                <InputLabel>Meeting Type</InputLabel>
                <Select
                  label="Meeting Type"
                  name="type"
                  value={meetingData.type}
                  onChange={handleInputChange}
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  {meetingTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        {type.label}
                      </div>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {meetingData.type === 'video' && (
                <TextField
                  label="Meeting Link"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="location"
                  value={meetingData.location || formatMeetingLink()}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <FiLink className="text-gray-400 mr-3" size={18} />
                    ),
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                  placeholder="https://meet.google.com/abc-xyz"
                />
              )}
              
              {meetingData.type === 'in-person' && (
                <TextField
                  label="Meeting Location"
                  variant="outlined"
                  size="medium"
                  fullWidth
                  name="location"
                  value={meetingData.location}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: (
                      <FiMapPin className="text-gray-400 mr-3" size={18} />
                    ),
                    sx: {
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                  placeholder="Office address or meeting point"
                />
              )}
            </div>
            
            <Divider className="my-2" />
            
            {/* Section 2: Date & Time */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiClock className="text-blue-500" />
                Date & Time
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextField
                  label="Meeting Date"
                  type="date"
                  name="date"
                  value={meetingData.date}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  fullWidth
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }}
                />
                
                <TextField
                  label="Start Time"
                  type="time"
                  name="time"
                  value={meetingData.time}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                  fullWidth
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc'
                  }}
                />
                
                <FormControl fullWidth size="medium">
                  <InputLabel>Duration</InputLabel>
                  <Select
                    label="Duration"
                    name="duration"
                    value={meetingData.duration}
                    onChange={handleInputChange}
                    sx={{
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    {durationOptions.map((duration) => (
                      <MenuItem key={duration.value} value={duration.value}>
                        {duration.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
            </div>
            
            <Divider className="my-2" />
            
            {/* Section 3: Agenda & Reminders */}
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-bold text-gray-700 flex items-center gap-2">
                <FiFileText className="text-purple-500" />
                Agenda & Reminders
              </Typography>
              
              <TextareaAutosize
                minRows={4}
                placeholder="Meeting agenda and discussion points..."
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                name="agenda"
                value={meetingData.agenda}
                onChange={handleInputChange}
              />
              
              <div className="space-y-3">
                <FormControlLabel
                  control={
                    <Switch
                      checked={meetingData.sendReminder}
                      onChange={(e) => setMeetingData(prev => ({
                        ...prev,
                        sendReminder: e.target.checked
                      }))}
                      color="primary"
                    />
                  }
                  label="Send reminder notification"
                  className="flex items-center"
                />
                
                {meetingData.sendReminder && (
                  <FormControl fullWidth size="medium">
                    <InputLabel>Reminder Time</InputLabel>
                    <Select
                      label="Reminder Time"
                      name="reminderMinutes"
                      value={meetingData.reminderMinutes}
                      onChange={handleInputChange}
                      sx={{
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc'
                      }}
                    >
                      {reminderOptions.map((reminder) => (
                        <MenuItem key={reminder.value} value={reminder.value}>
                          {reminder.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ScheduleMeetingModal;