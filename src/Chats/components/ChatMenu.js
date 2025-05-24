import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  FiSettings,
  FiArchive,
  FiTrash2,
  FiUserPlus,
  
} from 'react-icons/fi';


const ChatMenu = ({
  anchorEl,
  handleMenuClose,
  handleSettingsOpen,
  openConfirmDialog,
  selectedUser
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={handleSettingsOpen}>
        <ListItemIcon>
          <FiSettings />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => openConfirmDialog('clear')}>
        <ListItemIcon>
          <FiArchive />
        </ListItemIcon>
        <ListItemText>Clear chat</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => openConfirmDialog('delete')}>
        <ListItemIcon>
          <FiTrash2 />
        </ListItemIcon>
        <ListItemText>Delete conversation</ListItemText>
      </MenuItem>
      {selectedUser && (
        <MenuItem onClick={() => openConfirmDialog('block')}>
          <ListItemIcon>
            <FiUserPlus />
          </ListItemIcon>
          <ListItemText>Block user</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};

export default ChatMenu;