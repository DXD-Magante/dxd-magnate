import React from 'react';
import { Card, CardContent, Typography, Box, TextField, Button, Avatar, Chip, useTheme, useMediaQuery } from '@mui/material';
import { FiCalendar, FiClock, FiDollarSign, FiPlus } from 'react-icons/fi';

const ProjectOverviewCard = ({ 
  selectedProject, 
  handleAddRole, 
  handleRemoveRole,
  newRole,
  setNewRole
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card sx={{ 
      borderRadius: 2, 
      height: '100%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid rgba(0,0,0,0.08)'
    }}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: 600, 
          mb: 2,
          color: '#4f46e5'
        }}>
          Project Overview
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            mb: 1
          }}>
            {selectedProject.title}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: isMobile ? 1 : 3,
            mb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiCalendar style={{ marginRight: 8, color: '#64748b' }} />
              <Typography variant="body2">
                <span style={{ fontWeight: 500 }}>Start:</span> {new Date(selectedProject.startDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiClock style={{ marginRight: 8, color: '#64748b' }} />
              <Typography variant="body2">
                <span style={{ fontWeight: 500 }}>Duration:</span> {selectedProject.duration}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FiDollarSign style={{ marginRight: 8, color: '#64748b' }} />
            <Typography variant="body2">
              <span style={{ fontWeight: 500 }}>Budget:</span> ${parseInt(selectedProject.budget).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ 
            fontWeight: 500, 
            mb: 1,
            color: '#64748b'
          }}>
            Project Manager
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ 
              bgcolor: '#e0e7ff', 
              color: '#4f46e5', 
              width: 40, 
              height: 40,
              fontSize: '1rem',
              fontWeight: 600
            }}>
              {selectedProject.projectManager?.charAt(0) || 'P'}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {selectedProject.projectManager || 'Not assigned'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Project Lead
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ 
            fontWeight: 500, 
            mb: 1,
            color: '#64748b'
          }}>
            Project Roles
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            mb: 2,
            minHeight: 40
          }}>
            {(selectedProject.roles || []).map((role) => (
              <Chip
                key={role}
                label={role}
                onDelete={() => handleRemoveRole(role)}
                sx={{
                  backgroundColor: '#e0e7ff',
                  color: '#4f46e5',
                  fontWeight: 500,
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
              onClick={handleAddRole}
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

export default ProjectOverviewCard;