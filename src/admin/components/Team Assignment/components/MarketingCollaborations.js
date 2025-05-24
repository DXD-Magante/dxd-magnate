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
  useMediaQuery,
  useTheme
} from '@mui/material';
import { FiSearch, FiUserPlus } from 'react-icons/fi';
import CollaborationOverviewCard from './CollaborationOverviewCard';
import TeamMemberCard from './TeamMemberCard';

const MarketingCollaborations = ({ 
  collaborations, 
  selectedCollaboration, 
  handleCollaborationChange, 
  searchTerm, 
  setSearchTerm, 
  handleOpenDialog,
  filteredCollaborations,
  mentors,
  handleAddMarketingRole,
  handleRemoveMarketingRole,
  newRole,
  setNewRole,
  handleRemoveMarketingMember,
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
          placeholder="Search collaborations..."
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
        
        <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 300 }} size={isMobile ? 'small' : 'medium'}>
          <InputLabel>Select Collaboration</InputLabel>
          <Select
            value={selectedCollaboration?.id || (collaborations.length > 0 ? collaborations[0].id : '')}
            onChange={(e) => handleCollaborationChange(e.target.value)}
            label="Select Collaboration"
            sx={{ borderRadius: '8px' }}
          >
            {filteredCollaborations.length === 0 && (
              <MenuItem value="" disabled>
                No collaborations available
              </MenuItem>
            )}
            {filteredCollaborations.map((collab) => (
              <MenuItem key={collab.id} value={collab.id}>
                {collab.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<FiUserPlus />}
          onClick={() => handleOpenDialog('add-marketing')}
          disabled={!selectedCollaboration}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            height: isMobile ? '40px' : '56px',
            width: isMobile ? '100%' : 'auto',
            minWidth: 'fit-content'
          }}
        >
          {isMobile ? 'Add Member' : 'Add Team Member'}
        </Button>
      </Box>

      {selectedCollaboration ? (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <CollaborationOverviewCard 
              selectedCollaboration={selectedCollaboration}
              mentors={mentors}
              handleAddMarketingRole={handleAddMarketingRole}
              handleRemoveMarketingRole={handleRemoveMarketingRole}
              newRole={newRole}
              setNewRole={setNewRole}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Team Members ({selectedCollaboration.TeamMembers?.length || 0})
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenDialog('add-marketing')}
                    disabled={!selectedCollaboration}
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
                
                {selectedCollaboration.TeamMembers?.length > 0 ? (
                  <Grid container spacing={2}>
                    {selectedCollaboration.TeamMembers.map((member) => (
                      <Grid item xs={12} sm={6} key={member.id}>
                        <TeamMemberCard 
                          member={member} 
                          handleRemoveMember={handleRemoveMarketingMember} 
                          isMarketing={true}
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
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No team members assigned to this collaboration
                    </Typography>
                    <Button
                      variant="text"
                      onClick={() => handleOpenDialog('add-marketing')}
                      sx={{
                        mt: 2,
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
      ) : (
        <Box sx={{ 
          textAlign: 'center', 
          py: 6,
          border: '1px dashed #e2e8f0',
          borderRadius: 2
        }}>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
            {collaborations.length === 0 ? 'No marketing collaborations available' : 'No collaboration selected'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleOpenDialog('new-collab')}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            Create New Collaboration
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MarketingCollaborations;