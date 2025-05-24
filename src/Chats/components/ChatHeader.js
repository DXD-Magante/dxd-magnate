import React from 'react';
import { Box, Typography, Avatar, IconButton, Tooltip } from '@mui/material';
import { FiChevronLeft, FiMoreVertical,  } from 'react-icons/fi';


const ChatHeader = ({ selectedUser, setSelectedUser, handleMenuOpen }) => {
  return (
    <Box className="p-4 border-b border-gray-200 bg-white flex items-center" sx={{ marginTop: '60px' }}>
      <IconButton
        onClick={() => setSelectedUser(null)}
        className="md:hidden mr-2"
      >
        <FiChevronLeft />
      </IconButton>
      <Avatar
        src={selectedUser.photoURL}
        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
        sx={{ width: 40, height: 40, mr: 2 }}
      >
        {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
      </Avatar>
      <Box className="flex-1">
        <Typography className="font-semibold text-gray-800">
          {selectedUser.firstName} {selectedUser.lastName}
        </Typography>
        <Typography variant="caption" className="text-gray-500">
          {selectedUser.profileStatus ? 'Online' : 'Offline'}
        </Typography>
      </Box>
      <Tooltip title="Chat settings">
        <IconButton onClick={handleMenuOpen}>
          <FiMoreVertical />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ChatHeader;