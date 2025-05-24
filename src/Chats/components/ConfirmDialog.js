import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const ConfirmDialog = ({
  confirmDialogOpen,
  setConfirmDialogOpen,
  dialogAction,
  selectedUser,
  handleConfirmAction
}) => {
  return (
    <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogContent>
        <Typography>
          {dialogAction === 'clear' && 'Are you sure you want to clear this chat history?'}
          {dialogAction === 'delete' && 'Are you sure you want to delete this conversation?'}
          {dialogAction === 'block' && `Are you sure you want to block ${selectedUser?.firstName}?`}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirmAction} color="secondary" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;