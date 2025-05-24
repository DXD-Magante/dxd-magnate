import React from 'react';
import { Card, CardContent, Typography, Box, TextField, Button, Avatar, Chip } from '@mui/material';
import { FiPlus } from 'react-icons/fi';

const CollaborationOverviewCard = ({ 
  selectedCollaboration,
  mentors,
  handleAddMarketingRole,
  handleRemoveMarketingRole,
  newRole,
  setNewRole
}) => {
  return (
    <Card sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
          Collaboration Overview
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedCollaboration.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Created: {new Date(selectedCollaboration.createdAt?.toDate() || new Date()).toLocaleDateString()}
          </Typography>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: '500', mb: 1, color: '#64748b' }}>
            Mentor
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ 
              bgcolor: '#e0e7ff', 
              color: '#4f46e5', 
              width: 36, 
              height: 36,
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
              {mentors.find(m => m.id === selectedCollaboration.mentorId)?.firstName?.charAt(0) || 'M'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {mentors.find(m => m.id === selectedCollaboration.mentorId)?.firstName + ' ' + 
                mentors.find(m => m.id === selectedCollaboration.mentorId)?.lastName || 'Not assigned'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Marketing Mentor
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box>
          <Typography variant="body2" sx={{ fontWeight: '500', mb: 1, color: '#64748b' }}>
            Marketing Roles
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {(selectedCollaboration.roles || []).map((role) => (
              <Chip
                key={role}
                label={role}
                onDelete={() => handleRemoveMarketingRole(role)}
                sx={{
                  backgroundColor: '#e0e7ff',
                  color: '#4f46e5',
                  '& .MuiChip-deleteIcon': {
                    color: '#4f46e5',
                    '&:hover': {
                      color: '#4338ca'
                    }
                  }
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add new role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              sx={{ flex: 1 }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleAddMarketingRole}
              disabled={!newRole.trim()}
              sx={{
                minWidth: '40px',
                width: '40px',
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
            >
              <FiPlus />
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CollaborationOverviewCard;