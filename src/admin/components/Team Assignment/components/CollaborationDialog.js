import React from 'react';
import { Box, Typography, TextField, Button, Chip, MenuItem } from '@mui/material';
import { FiPlus } from 'react-icons/fi';

const CollaborationDialog = ({
  newCollaboration,
  setNewCollaboration,
  mentors,
  newRole,
  setNewRole,
  handleCreateCollaboration,
  handleCloseDialog
}) => {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
        Create New Marketing Collaboration
      </Typography>
      <TextField
        label="Collaboration Title"
        fullWidth
        value={newCollaboration.title}
        onChange={(e) => setNewCollaboration({...newCollaboration, title: e.target.value})}
        sx={{ mb: 2 }}
      />
      <TextField
        select
        label="Select Mentor"
        fullWidth
        value={newCollaboration.mentorId}
        onChange={(e) => setNewCollaboration({...newCollaboration, mentorId: e.target.value})}
        sx={{ mb: 2 }}
      >
        <MenuItem value="" disabled>Select a mentor</MenuItem>
        {mentors.map(mentor => (
          <MenuItem key={mentor.id} value={mentor.id}>
            {mentor.firstName} {mentor.lastName}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: '500' }}>
          Initial Roles:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {newCollaboration.roles.map((role, index) => (
            <Chip
              key={index}
              label={role}
              onDelete={() => setNewCollaboration({
                ...newCollaboration,
                roles: newCollaboration.roles.filter((_, i) => i !== index)
              })}
              sx={{
                backgroundColor: '#e0e7ff',
                color: '#4f46e5'
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Add role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={() => {
              if (newRole.trim()) {
                setNewCollaboration({
                  ...newCollaboration,
                  roles: [...newCollaboration.roles, newRole.trim()]
                });
                setNewRole('');
              }
            }}
            sx={{
              minWidth: 'auto',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            <FiPlus />
          </Button>
        </Box>
      </Box>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={handleCloseDialog}
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
          onClick={handleCreateCollaboration}
          disabled={!newCollaboration.mentorId}
          sx={{
            textTransform: 'none',
            borderRadius: '6px',
            backgroundColor: '#10b981',
            '&:hover': { backgroundColor: '#0d9f6e' }
          }}
        >
          Create Collaboration
        </Button>
      </Box>
    </Box>
  );
};

export default CollaborationDialog;