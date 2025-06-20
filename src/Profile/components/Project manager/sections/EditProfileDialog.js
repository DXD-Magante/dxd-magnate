import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, TextField, Button, Avatar, Badge, IconButton , Box
} from '@mui/material';
import { FiEdit2, FiUpload } from 'react-icons/fi';

const EditProfileDialog = ({
  editOpen,
  handleEditClose,
  tempData,
  handleInputChange,
  handleSave
}) => {
  return (
    <Dialog 
      open={editOpen} 
      onClose={handleEditClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { borderRadius: '12px' } }}
    >
      <DialogTitle className="font-bold bg-gray-50 border-b">
        <Box className="flex items-center">
          <FiEdit2 className="mr-2 text-indigo-600" />
          Edit Profile
        </Box>
      </DialogTitle>
      <DialogContent className="py-6">
        <Grid container spacing={3}>
          <Grid item xs={12} className="text-center">
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton size="small" color="primary" component="label">
                  <FiUpload size={16} />
                  <input type="file" hidden />
                </IconButton>
              }
            >
              <Avatar
                src={tempData.photoURL}
                sx={{ width: 80, height: 80, margin: '0 auto' }}
              />
            </Badge>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={tempData.firstName || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={tempData.lastName || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={tempData.email || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={tempData.phone || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              name="bio"
              value={tempData.bio || ""}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className="border-t px-6 py-4">
        <Button 
          onClick={handleEditClose} 
          variant="outlined"
          className="border-gray-300 text-gray-700"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileDialog;