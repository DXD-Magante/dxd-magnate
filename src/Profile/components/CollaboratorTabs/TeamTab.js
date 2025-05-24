// src/components/CollaboratorTabs/TeamTab.js
import React from 'react';
import { 
  Box, Typography, Avatar, Grid, Paper, Divider, 
  Select, MenuItem, FormControl, InputLabel, IconButton 
} from '@mui/material';
import { FiMessageCircle, FiMail, FiPhone } from 'react-icons/fi';

const TeamTab = ({ projects, selectedProject, setSelectedProject, formatDate }) => {
  if (!projects || projects.length === 0) {
    return (
      <Box className="flex items-center justify-center p-8">
        <Typography variant="body1" className="text-gray-600">
          You are not assigned to any projects yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {/* Project Selector */}
      <FormControl fullWidth size="small" className="max-w-md">
        <InputLabel id="project-select-label">Select Project</InputLabel>
        <Select
          labelId="project-select-label"
          value={selectedProject?.id || ''}
          onChange={(e) => {
            const selected = projects.find(p => p.id === e.target.value);
            setSelectedProject(selected);
          }}
          label="Select Project"
        >
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.title || 'Untitled Project'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Project Manager Section */}
      {selectedProject?.projectManagerId && (
        <Paper className="p-4 rounded-lg shadow-sm">
          <Typography variant="h6" className="font-bold mb-4">
            Project Manager
          </Typography>
          <Box className="flex items-center space-x-4">
            <Avatar sx={{ width: 56, height: 56 }}>
              {selectedProject.projectManager?.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box className="flex-1">
              <Typography variant="subtitle1" className="font-medium">
                {selectedProject.projectManager}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                Project Manager
              </Typography>
              <Box className="flex items-center space-x-4 mt-2">
                <Typography variant="body2" className="flex items-center text-gray-600">
                  <FiMail className="mr-1" size={14} />
                  {selectedProject.projectManagerEmail || 'Email not available'}
                </Typography>
              </Box>
            </Box>
            <IconButton color="primary" aria-label="chat">
              <FiMessageCircle />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Team Members Section */}
      <Paper className="p-4 rounded-lg shadow-sm">
        <Typography variant="h6" className="font-bold mb-4">
          Team Members
        </Typography>
        <Grid container spacing={3}>
          {selectedProject?.teamMembers?.map((member) => (
            <Grid item xs={12} sm={6} md={4} key={member.id}>
              <Box className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <Avatar sx={{ width: 48, height: 48 }}>
                  {member.name?.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box className="flex-1">
                  <Typography variant="subtitle2" className="font-medium">
                    {member.name}
                  </Typography>
                  <Typography variant="caption" className="text-gray-600">
                    {member.projectRole}
                  </Typography>
                  <Box className="flex items-center space-x-2 mt-1">
                    <Typography variant="caption" className="flex items-center text-gray-500">
                      <FiMail className="mr-1" size={12} />
                      {member.email || 'Email not available'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" color="primary" aria-label="chat">
                  <FiMessageCircle size={16} />
                </IconButton>
              </Box>
              <Divider className="my-2" />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

export default TeamTab;