import React from 'react';
import { Paper, Box, Avatar, Typography, Chip, IconButton, Tooltip, MenuItem } from '@mui/material';
import { FiTrash2 } from 'react-icons/fi';

const TeamMemberCard = ({ member, handleRemoveMember, isMarketing = false }) => {
  // Handle both string and Timestamp formats for createdAt
  const getJoinedDate = () => {
    if (!member.createdAt) return 'Unknown date';
    
    // If it's a string (ISO format)
    if (typeof member.createdAt === 'string') {
      return new Date(member.createdAt).toLocaleDateString();
    }
    
    // If it's a Firestore Timestamp
    if (typeof member.createdAt.toDate === 'function') {
      return member.createdAt.toDate().toLocaleDateString();
    }
    
    return 'Unknown date';
  };

  return (
    <Paper elevation={0} sx={{ 
      p: 2, 
      borderRadius: 2,
      border: '1px solid #e2e8f0',
      position: 'relative'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar 
          sx={{ 
            width: 48, 
            height: 48, 
            bgcolor: '#e0e7ff', 
            color: '#4f46e5',
            fontSize: '1rem'
          }}
        >
          {member.name?.charAt(0) || 'U'}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {member.name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {member.role}
          </Typography>
          {!isMarketing && (
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={member.projectRole}
                size="small"
                sx={{
                  backgroundColor: '#e0e7ff',
                  color: '#4f46e5',
                  fontSize: '0.65rem',
                  height: '20px'
                }}
              />
            </Box>
          )}
          {isMarketing && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Joined: {getJoinedDate()}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ 
        position: 'absolute', 
        top: 8, 
        right: 8,
        display: 'flex',
        gap: 0.5
      }}>
        <Tooltip title={`Remove from ${isMarketing ? 'collaboration' : 'project'}`}>
          <IconButton
            size="small"
            onClick={() => handleRemoveMember(member.id)}
            sx={{ color: '#ef4444' }}
          >
            <FiTrash2 size={16} />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default TeamMemberCard;