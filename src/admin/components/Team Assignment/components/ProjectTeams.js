import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { FiEdit2, FiUserPlus, FiSearch } from 'react-icons/fi';
import ProjectOverviewCard from './ProjectOverviewCard';
import TeamMemberCard from './TeamMemberCard';

const ProjectTeams = ({ 
  projects, 
  selectedProject, 
  handleProjectChange, 
  searchTerm, 
  setSearchTerm, 
  handleOpenDialog,
  filteredProjects,
  handleAddRole,
  handleRemoveRole,
  newRole,
  setNewRole,
  handleRemoveMember
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ p: isMobile ? 1 : 0 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        gap: 2, 
        mb: 3,
        alignItems: isMobile ? 'stretch' : 'center'
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search projects..."
          InputProps={{
            startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
          size={isMobile ? 'small' : 'medium'}
        />
        
        <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 300 }}>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={selectedProject?.id || (projects.length > 0 ? projects[0].id : '')}
            onChange={(e) => handleProjectChange(e.target.value)}
            label="Select Project"
            sx={{ borderRadius: '8px' }}
            size={isMobile ? 'small' : 'medium'}
          >
            {filteredProjects.length === 0 && (
              <MenuItem value="" disabled>
                No projects available
              </MenuItem>
            )}
            {filteredProjects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedProject ? (
        <Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            mb: 3,
            gap: isMobile ? 2 : 0
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: '#1e293b'
            }}>
              {selectedProject.title}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              width: isMobile ? '100%' : 'auto'
            }}>
              <Button
                variant="outlined"
                startIcon={<FiEdit2 />}
                onClick={() => handleOpenDialog('edit')}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  height: isMobile ? '40px' : 'auto',
                  flex: isMobile ? 1 : 'none'
                }}
                size={isMobile ? 'small' : 'medium'}
              >
                {isMobile ? 'Edit' : 'Edit Project'}
              </Button>
              <Button
                variant="contained"
                startIcon={<FiUserPlus />}
                onClick={() => handleOpenDialog('add')}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' },
                  height: isMobile ? '40px' : 'auto',
                  flex: isMobile ? 1 : 'none'
                }}
                size={isMobile ? 'small' : 'medium'}
              >
                {isMobile ? 'Add Member' : 'Add Team Member'}
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <ProjectOverviewCard 
                selectedProject={selectedProject} 
                handleAddRole={handleAddRole} 
                handleRemoveRole={handleRemoveRole}
                newRole={newRole}
                setNewRole={setNewRole}
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ 
                borderRadius: 2,
                height: '100%',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.08)'
              }}>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <Typography variant="subtitle1" sx={{ 
                      fontWeight: 600,
                      color: '#4f46e5'
                    }}>
                      Team Members ({selectedProject.teamMembers?.length || 0})
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDialog('add')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        borderColor: '#e2e8f0',
                        color: '#4f46e5'
                      }}
                    >
                      Add Member
                    </Button>
                  </Box>
                  
                  {selectedProject.teamMembers?.length > 0 ? (
                    <Grid container spacing={2}>
                      {selectedProject.teamMembers.map((member) => (
                        <Grid item xs={12} sm={6} key={member.id}>
                          <TeamMemberCard 
                            member={member} 
                            handleRemoveMember={handleRemoveMember} 
                          />
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      border: '1px dashed #e2e8f0',
                      borderRadius: 2
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: '#64748b',
                        mb: 1
                      }}>
                        No team members assigned to this project
                      </Typography>
                      <Button
                        variant="text"
                        onClick={() => handleOpenDialog('add')}
                        sx={{
                          textTransform: 'none',
                          color: '#4f46e5'
                        }}
                      >
                        Add your first member
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 6,
          border: '1px dashed #e2e8f0',
          borderRadius: 2
        }}>
          <Typography variant="body1" sx={{ 
            color: '#64748b',
            mb: 2
          }}>
            {projects.length === 0 ? 'No projects available' : 'No project selected'}
          </Typography>
          {projects.length === 0 && (
            <Button
              variant="contained"
              onClick={() => handleOpenDialog('new-project')}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
            >
              Create New Project
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ProjectTeams;