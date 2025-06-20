import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Select, MenuItem, Typography, Box 
} from '@mui/material';

const ReassignDialog = ({
  reassignDialogOpen,
  setReassignDialogOpen,
  selectedMemberToReassign,
  newProjectForMember,
  setNewProjectForMember,
  projects,
  selectedProjectForTeam,
  handleReassignMember
}) => {
  return (
    <Dialog 
      open={reassignDialogOpen} 
      onClose={() => setReassignDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Reassign Team Member</DialogTitle>
      <DialogContent>
        <Box className="space-y-4 mt-3">
          <Typography variant="body1">
            Reassign <strong>{selectedMemberToReassign?.name}</strong> to another project
          </Typography>
          
          <Select
            fullWidth
            value={newProjectForMember?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setNewProjectForMember(project);
            }}
            displayEmpty
            sx={{ mt: 2 }}
          >
            <MenuItem value="" disabled>
              Select target project
            </MenuItem>
            {projects
              .filter(p => p.id !== selectedProjectForTeam?.id)
              .map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
          </Select>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setReassignDialogOpen(false)}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleReassignMember}
          variant="contained"
          disabled={!newProjectForMember}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Reassign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReassignDialog;