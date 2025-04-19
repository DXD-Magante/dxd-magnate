import React, { useState } from "react";
import { 
  Typography, Avatar, LinearProgress, 
  Box, Chip, Table, TableBody, 
  TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Badge,
  CircularProgress, Menu, MenuItem, 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Snackbar, Alert
} from "@mui/material";
import { 
  FiDollarSign, FiUsers, FiTrendingUp, 
  FiCalendar, FiCheckCircle, FiPieChart, 
  FiMessageSquare, FiHome, FiFlag, 
  FiEdit2, FiTrash2, FiPlus, 
  FiChevronDown, FiX, FiCheck,
  FiUser, FiPhone, FiMail,
  FiBriefcase, FiGlobe, FiDroplet
} from "react-icons/fi";
import AddNewLeadModal from "./AddLead";
import OnboardClientModal from "./OnboardClient";

const LeadManagement = ({ 
  leads, 
  loading, 
  leadStats, 
  statusOptions,
  priorityOptions,
  addLeadOpen,
  setAddLeadOpen,
  onStatusChange,
  onDeleteLead,
  onEditLead,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  setSnackbarOpen
}) => {
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const handleOnboardClick = (lead) => {
    setSelectedLead(lead);
    setOnboardModalOpen(true);
  };

  const handleStatusMenuOpen = (event, leadId) => {
    setStatusMenuAnchor(event.currentTarget);
    setCurrentLeadId(leadId);
  };

  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
    setCurrentLeadId(null);
  };

  const handleStatusChange = async (newStatus) => {
    await onStatusChange(currentLeadId, newStatus);
    handleStatusMenuClose();
  };

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await onDeleteLead(leadToDelete);
    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  };

  const handleEditClick = (lead) => {
    setCurrentLead(lead);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    await onEditLead(currentLead);
    setEditDialogOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLead(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'primary';
      case 'contacted': return 'secondary';
      case 'proposal-sent': return 'info';
      case 'negotiation': return 'warning';
      case 'closed-won': return 'success';
      case 'closed-lost': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            Lead Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track and manage your sales pipeline efficiently
          </Typography>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button
            variant="outlined"
            startIcon={<FiPlus size={18} />}
            onClick={() => setAddLeadOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              borderColor: '#e2e8f0',
              color: '#4f46e5',
              '&:hover': {
                borderColor: '#c7d2fe',
                backgroundColor: '#eef2ff'
              }
            }}
          >
            Add Lead
          </Button>
          <Button
            variant="contained"
            startIcon={<FiTrendingUp size={18} />}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              textTransform: 'none',
              borderRadius: '8px'
            }}
          >
            Pipeline View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statusOptions.map((status) => (
          <div key={status.value} className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                  {status.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                  {leadStats[status.value] || 0}
                </Typography>
              </div>
              <div className={`p-3 rounded-full bg-${status.color}-50`}>
                {React.cloneElement(status.icon, { className: `text-${status.color}-600` })}
              </div>
            </div>
            <LinearProgress 
              variant="determinate" 
              value={leadStats.total > 0 ? ((leadStats[status.value] || 0) / leadStats.total) * 100 : 0} 
              sx={{ 
                height: 4, 
                borderRadius: 4,
                mt: 2,
                backgroundColor: '#e0e7ff',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: `#4f46e5`
                }
              }} 
            />
          </div>
        ))}
      </div>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <Table sx={{ minWidth: 650 }} aria-label="leads table">
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Lead</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#64748b', textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    hover 
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': { backgroundColor: '#f8fafc' }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#e0e7ff', color: '#4f46e5' }}>
                          {lead.fullName ? lead.fullName.charAt(0).toUpperCase() : 'L'}
                        </Avatar>
                        <div>
                          <Typography fontWeight="medium" sx={{ color: '#1e293b' }}>
                            {lead.firstName} {lead.lastName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {lead.title || 'No title'}
                          </Typography>


                          {lead.status === 'closed-won' && !lead.converted === true &&(
      <Button
        size="small"
        variant="contained"
        color="success"
        sx={{
          borderRadius: '6px',
          textTransform: 'none',
          backgroundColor: '#10b981',
          '&:hover': { backgroundColor: '#0d9f6e' }
        }}
        onClick={() => handleOnboardClick(lead)}
      >
        Onboard 
      </Button>
    )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FiBriefcase className="text-gray-400" size={16} />
                        <Typography>{lead.company || 'N/A'}</Typography>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <FiMail className="text-gray-400" size={14} />
                          <Typography variant="body2">{lead.email || 'N/A'}</Typography>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-gray-400" size={14} />
                          <Typography variant="body2" color="text.secondary">
                            {lead.phone || 'N/A'}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                    {lead.converted === true ? (
  <Box sx={{ 
    mt: 1,
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: '16px',
    padding: '4px 10px',
    border: '1px solid #bbf7d0'
  }}>
    <FiCheckCircle 
      size={14} 
      style={{ 
        color: '#16a34a',
        marginRight: '6px',
        flexShrink: 0
      }} 
    />
    <Typography 
      variant="caption" 
      sx={{
        color: '#166534',
        fontWeight: 500,
        fontSize: '0.7rem',
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}
    >
      Converted to Client
    </Typography>
  </Box>
):(

                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<FiChevronDown size={16} />}
                        onClick={(e) => handleStatusMenuOpen(e, lead.id)}
                        sx={{
                          textTransform: 'capitalize',
                          borderColor: '#e2e8f0',
                          color: '#1e293b',
                          '&:hover': {
                            borderColor: '#c7d2fe',
                            backgroundColor: '#eef2ff'
                          }
                        }}
                      >
                        <Chip 
                          label={lead.status.replace(/-/g, ' ')} 
                          size="small" 
                          color={getStatusColor(lead.status)}
                          sx={{ 
                            mr: 1,
                            textTransform: 'capitalize',
                            fontSize: '0.75rem'
                          }}
                        />
                      </Button>)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={lead.priority} 
                        size="small" 
                        color={getPriorityColor(lead.priority)}
                        sx={{ 
                          textTransform: 'capitalize',
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {lead.budget? (
                        <Typography fontWeight="medium" sx={{ color: '#10b981' }}>
                          ${parseInt(lead.budget).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex gap-2 justify-end">
       
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<FiEdit2 size={14} />}
                          onClick={() => handleEditClick(lead)}
                          sx={{
                            borderRadius: '6px',
                            borderColor: '#e2e8f0',
                            textTransform: 'none',
                            color: '#64748b',
                            '&:hover': {
                              borderColor: '#c7d2fe',
                              backgroundColor: '#eef2ff'
                            }
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<FiTrash2 size={14} />}
                          onClick={() => handleDeleteClick(lead)}
                          sx={{
                            borderRadius: '6px',
                            textTransform: 'none'
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiUser className="text-gray-400" size={48} />
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 'medium' }}>
                        No leads found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        Start by adding your first lead
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<FiPlus size={16} />}
                        onClick={() => setAddLeadOpen(true)}
                        sx={{
                          mt: 2,
                          backgroundColor: '#4f46e5',
                          '&:hover': { backgroundColor: '#4338ca' },
                          textTransform: 'none',
                          borderRadius: '8px'
                        }}
                      >
                        Add New Lead
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            minWidth: 200
          }
        }}
      >
        {statusOptions.map((status) => (
          <MenuItem 
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            sx={{
              '&:hover': {
                backgroundColor: '#f8fafc'
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1 rounded-full bg-${status.color}-50`}>
                {React.cloneElement(status.icon, { className: `text-${status.color}-600` })}
              </div>
              <Typography variant="body2" sx={{ color: '#1e293b' }}>
                {status.label}
              </Typography>
            </div>
          </MenuItem>
        ))}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '500px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Delete Lead
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Are you sure you want to delete the lead for <strong>{leadToDelete?.fullName}</strong> from <strong>{leadToDelete?.company}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              textTransform: 'none',
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: '6px'
            }}
          >
            Delete Lead
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
          Edit Lead
        </DialogTitle>
        <DialogContent sx={{ paddingTop: '20px !important' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Full Name"
              name="fullName"
              value={currentLead?.fullName || ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <FiUser className="text-gray-400 mr-2" size={18} />
                )
              }}
            />
            <TextField
              label="Company"
              name="company"
              value={currentLead?.company || ''}
              onChange={handleInputChange}
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
              label="Email"
              name="email"
              value={currentLead?.email || ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <FiMail className="text-gray-400 mr-2" size={18} />
                )
              }}
            />
            <TextField
              label="Phone"
              name="phone"
              value={currentLead?.phone || ''}
              onChange={handleInputChange}
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
              label="Lead Value ($)"
              name="value"
              value={currentLead?.value || ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
              type="number"
              InputProps={{
                startAdornment: (
                  <FiDollarSign className="text-gray-400 mr-2" size={18} />
                )
              }}
            />
            <TextField
              select
              label="Priority"
              name="priority"
              value={currentLead?.priority || ''}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              variant="outlined"
            >
              {priorityOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Chip 
                    label={option.label} 
                    size="small" 
                    color={option.color}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </MenuItem>
              ))}
            </TextField>
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{
              textTransform: 'none',
              color: '#64748b',
              '&:hover': {
                backgroundColor: '#f1f5f9'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            startIcon={<FiCheck size={18} />}
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Lead Modal */}
      <AddNewLeadModal 
        open={addLeadOpen} 
        onClose={() => setAddLeadOpen(false)}
        onSuccess={() => {
          setSnackbarOpen(true);
        }}
        onError={() => {
          setSnackbarOpen(true);
        }}
      />

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ 
            width: '100%',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      <OnboardClientModal 
  open={onboardModalOpen} 
  onClose={() => setOnboardModalOpen(false)} 
  lead={selectedLead}
/>
    </div>
  );
};

export default LeadManagement;