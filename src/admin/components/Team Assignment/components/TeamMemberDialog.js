import React from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemAvatar, ListItemText, Checkbox, Avatar, Chip, MenuItem, } from '@mui/material';
import { FiUser, FiUserPlus, FiSearch } from 'react-icons/fi';

const TeamMemberDialog = ({
  dialogType,
  selectedProject,
  selectedCollaboration,
  addMode,
  showAddOptions,
  setAddMode,
  setShowAddOptions,
  newMember,
  setNewMember,
  searchUserTerm,
  setSearchUserTerm,
  filteredUsers,
  selectedUsers,
  setSelectedUsers,
  handleUserSelect,
  handleAddSelectedUsers,
  handleAddNewMember,
  handleAddMarketingMembers,
  isMarketing
}) => {
  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
        Add new team members to {isMarketing ? selectedCollaboration?.title : selectedProject?.title}
      </Typography>
      
      {showAddOptions ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Add Team Member Options
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<FiUser />}
              onClick={() => setAddMode('existing')}
              fullWidth
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
            >
              Select from Existing Users
            </Button>
            <Button
              variant="contained"
              startIcon={<FiUserPlus />}
              onClick={() => setAddMode('new')}
              fullWidth
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#0d9f6e' }
              }}
            >
              Onboard New Collaborator
            </Button>
          </Box>
          <Button
            variant="text"
            onClick={() => setShowAddOptions(false)}
            sx={{ color: '#64748b' }}
          >
            Cancel
          </Button>
        </Box>
      ) : null}

      {addMode === 'existing' && (
        <Box>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search users..."
            value={searchUserTerm}
            onChange={(e) => setSearchUserTerm(e.target.value)}
            InputProps={{
              startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
            }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            select
            label={isMarketing ? "Marketing Role" : "Project Role"}
            fullWidth
            value={newMember.projectRole}
            onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>Select role</MenuItem>
            {(isMarketing ? selectedCollaboration?.roles : selectedProject?.roles || []).map((role) => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </TextField>
          
          <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
            {filteredUsers.map((user) => (
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
                  <Avatar alt={`${user.firstName} ${user.lastName}`} />
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
            ))}
          </List>
          {selectedUsers.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedUsers([]);
                  setAddMode(null);
                  setNewMember(prev => ({ ...prev, projectRole: '' }));
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  borderColor: '#e2e8f0',
                  color: '#64748b'
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={isMarketing ? handleAddMarketingMembers : handleAddSelectedUsers}
                disabled={!newMember.projectRole}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' }
                }}
              >
                Add Selected Members
              </Button>
            </Box>
          )}
        </Box>
      )}

      {addMode === 'new' && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Onboard New {isMarketing ? 'Marketing' : ''} Team Member
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
          />
          <TextField
            label="Phone"
            fullWidth
            value={newMember.phone}
            onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
            sx={{ mb: 2 }}
          />
          {!isMarketing && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Role"
                fullWidth
                value={newMember.role}
                onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                sx={{ mb: 2 }}
              >
                <MenuItem value="Collaborator">Collaborator</MenuItem>
                <MenuItem value="Intern">Intern</MenuItem>
                <MenuItem value="Freelancer">Freelancer</MenuItem>
              </TextField>
              <TextField
                select
                label="Department"
                fullWidth
                value={newMember.department}
                onChange={(e) => setNewMember({...newMember, department: e.target.value})}
                sx={{ mb: 2 }}
              >
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Content">Content</MenuItem>
              </TextField>
            </Box>
          )}
          <TextField
            select
            label={isMarketing ? "Marketing Role" : "Project Role"}
            fullWidth
            value={newMember.projectRole}
            onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>Select role</MenuItem>
            {(isMarketing ? selectedCollaboration?.roles : selectedProject?.roles || []).map((role) => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </TextField>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setAddMode(null)}
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                borderColor: '#e2e8f0',
                color: '#64748b'
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAddNewMember}
              disabled={!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.projectRole}
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                backgroundColor: '#10b981',
                '&:hover': { backgroundColor: '#0d9f6e' }
              }}
            >
              Onboard & Add to Team
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TeamMemberDialog;