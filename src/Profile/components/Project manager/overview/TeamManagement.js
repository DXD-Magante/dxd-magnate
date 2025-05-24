import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { FiPlus, FiRefreshCw, FiChevronDown, FiUserPlus } from 'react-icons/fi';

const TeamManagement = ({
  projects,
  selectedProjectForTeam,
  setSelectedProjectForTeam,
  teamWorkloads,
  refreshingTeam,
  handleRemoveMember,
  setSelectedProject,
  setOpenTeamDialog,
  setSelectedMemberToReassign,
  setReassignDialogOpen
}) => {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardContent className="p-6">
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-gray-800">
            Team Management
          </Typography>
          <Box className="flex items-center gap-2">
            <IconButton 
              size="small" 
              onClick={() => setSelectedProjectForTeam(selectedProjectForTeam)}
              disabled={refreshingTeam}
            >
              <FiRefreshCw className={refreshingTeam ? "animate-spin" : ""} />
            </IconButton>
            <Select
              value={selectedProjectForTeam?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProjectForTeam(project);
              }}
              displayEmpty
              size="small"
              sx={{
                minWidth: 200,
                backgroundColor: 'white',
                '& .MuiSelect-select': {
                  py: 0.8
                }
              }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="" disabled>
                Select a project
              </MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              size="small"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                if (selectedProjectForTeam) {
                  setSelectedProject(selectedProjectForTeam);
                  setOpenTeamDialog(true);
                }
              }}
              disabled={!selectedProjectForTeam}
            >
              Manage Team
            </Button>
          </Box>
        </Box>
        
        {!selectedProjectForTeam ? (
          <Box className="text-center py-6">
            <Typography variant="body2" className="text-gray-500">
              Select a project to view team members
            </Typography>
          </Box>
        ) : selectedProjectForTeam.teamMembers?.length === 0 ? (
          <Box className="text-center py-6">
            <Typography variant="body2" className="text-gray-500">
              No team members assigned to this project
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FiUserPlus />}
              className="mt-3 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              onClick={() => {
                setSelectedProject(selectedProjectForTeam);
                setOpenTeamDialog(true);
              }}
            >
              Add Team Members
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {selectedProjectForTeam.teamMembers?.map((member) => {
              const workload = teamWorkloads[member.id] || { 
                total: 0, 
                completed: 0, 
                pending: 0, 
                status: 'Available' 
              };
              const progress = workload.total > 0 ? 
                Math.round((workload.completed / workload.total) * 100) : 0;
              
              const statusColor = {
                'Available': 'success',
                'Moderate': 'info',
                'Busy': 'warning',
                'Overloaded': 'error',
                'Behind': 'error'
              }[workload.status] || 'default';
              
              return (
                <Grid item xs={12} sm={6} key={member.id}>
                  <Paper className="p-4 rounded-lg hover:shadow-md transition-shadow">
                    <Box className="flex items-start space-x-3">
                      <Avatar
                        sx={{ width: 48, height: 48 }}
                        className="bg-indigo-100 text-indigo-600"
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box className="flex-1">
                        <Typography variant="subtitle1" className="font-bold">
                          {member.name}
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 mb-2">
                          {member.role} • {member.projectRole || 'No role'}
                        </Typography>
                        <Box className="flex items-center justify-between">
                          <Chip
                            label={workload.status}
                            size="small"
                            color={statusColor}
                          />
                          <Box className="text-right">
                            <Typography variant="caption" className="text-gray-600">
                              Workload: {workload.pending} pts
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                width: '80px',
                                backgroundColor: '#e2e8f0',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  backgroundColor: progress >= 80 ? '#10b981' : 
                                                  progress >= 50 ? '#f59e0b' : '#ef4444'
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    <Box className="flex justify-end space-x-2 mt-3">
                      <Button
                        variant="outlined"
                        size="small"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setSelectedMemberToReassign(member);
                          setReassignDialogOpen(true);
                        }}
                      >
                        Reassign
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        className="hover:bg-red-50"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamManagement;