import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Checkbox, 
  Avatar, 
  Chip, 
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import { 
  FiUser, 
  FiUserPlus, 
  FiSearch, 
  FiPhone,
  FiMail,
  FiX
} from 'react-icons/fi';

const TeamMemberDialog = ({
  open,
  onClose,
  selectedCollaboration,
  users,
  selectedUsers,
  handleUserSelect,
  newMember,
  setNewMember,
  handleAddNewMember
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.email?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    user?.role?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 600,
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        Add Team Members
        <Button 
          onClick={onClose}
          sx={{ 
            minWidth: 0,
            p: 0.5,
            color: 'inherit'
          }}
        >
          <FiX size={20} />
        </Button>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab 
            label="Existing Users" 
            icon={<FiUser size={16} />}
            iconPosition="start"
            sx={{ 
              textTransform: 'none',
              minHeight: '48px'
            }}
          />
          <Tab 
            label="New Member" 
            icon={<FiUserPlus size={16} />}
            iconPosition="start"
            sx={{ 
              textTransform: 'none',
              minHeight: '48px'
            }}
          />
        </Tabs>

        {tabValue === 0 ? (
          <Box>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              select
              label="Marketing Role"
              fullWidth
              value={newMember.projectRole}
              onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select role</MenuItem>
              {(selectedCollaboration?.roles || []).map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </TextField>
            
            <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <ListItem
                    key={user.id}
                    secondaryAction={
                      <Checkbox
                        edge="end"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                      />
                    }
                  >
                    <ListItemAvatar>
                      <Avatar 
                        alt={`${user.firstName} ${user.lastName}`}
                        sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}
                      >
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {user.role}
                          </Typography>
                          <Chip
                            label={user.department}
                            size="small"
                            sx={{
                              ml: 1,
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              fontSize: '0.65rem'
                            }}
                          />
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" sx={{ p: 2, color: '#64748b', textAlign: 'center' }}>
                  No users found
                </Typography>
              )}
            </List>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Onboard New Team Member
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                fullWidth
                value={newMember.firstName}
                onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Last Name"
                fullWidth
                value={newMember.lastName}
                onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                sx={{ mb: 2 }}
              />
            </Box>
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <FiMail style={{ marginRight: 8, color: '#64748b' }} />,
              }}
            />
            <TextField
              label="Phone"
              fullWidth
              value={newMember.phone}
              onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <FiPhone style={{ marginRight: 8, color: '#64748b' }} />,
              }}
            />
            <TextField
              select
              label="Marketing Role"
              fullWidth
              value={newMember.projectRole}
              onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
              sx={{ mb: 2 }}
            >
              <MenuItem value="" disabled>Select role</MenuItem>
              {(selectedCollaboration?.roles || []).map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ 
        px: 3, 
        py: 2,
        borderTop: '1px solid rgba(0,0,0,0.08)'
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#64748b',
            '&:hover': { 
              backgroundColor: 'rgba(0,0,0,0.04)',
              color: '#1e293b'
            },
            mr: 1
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAddNewMember}
          disabled={
            (tabValue === 0 && selectedUsers.length === 0) ||
            (tabValue === 1 && (!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.projectRole))
          }
          sx={{
            backgroundColor: tabValue === 0 ? '#4f46e5' : '#10b981',
            '&:hover': { backgroundColor: tabValue === 0 ? '#4338ca' : '#0d9f6e' },
            textTransform: 'none',
            borderRadius: '6px'
          }}
        >
          {tabValue === 0 ? 'Add Selected Members' : 'Onboard & Add to Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeamMemberDialog;