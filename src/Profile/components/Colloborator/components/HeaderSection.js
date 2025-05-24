import React from 'react';
import { Box, Typography, Avatar, Button, Badge, IconButton } from '@mui/material';
import { FiEdit2, FiMail, FiPhone } from 'react-icons/fi';
import { getInitials } from '../utils/helpers';

const HeaderSection = ({ profileData, handleEditOpen }) => {
  return (
    <Box className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
      <Box className="flex items-center space-x-4 mb-4 md:mb-0">
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <IconButton size="small" color="primary" component="label">
              <FiEdit2 size={12} />
              <input type="file" hidden />
            </IconButton>
          }
        >
          <Avatar
            alt={`${profileData.firstName} ${profileData.lastName}`}
            src={profileData.photoURL}
            sx={{ width: 100, height: 100 }}
            className="shadow-lg ring-2 ring-white"
          >
            {getInitials(`${profileData.firstName} ${profileData.lastName}`)}
          </Avatar>
        </Badge>
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            {profileData.firstName} {profileData.lastName}
          </Typography>
          <Typography variant="subtitle1" className="text-gray-600 mt-1">
            {profileData.department || "Collaborator"} • {profileData.role}
          </Typography>
          <Box className="flex space-x-2 mt-2">
            <div className="flex items-center text-sm text-gray-600">
              <FiMail className="mr-1" />
              <span>{profileData.email}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FiPhone className="mr-1" />
              <span>{profileData.phone || "Not provided"}</span>
            </div>
          </Box>
        </Box>
      </Box>
      <Box className="flex space-x-3">
        <Button
          variant="contained"
          startIcon={<FiEdit2 />}
          onClick={handleEditOpen}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Edit Profile
        </Button>
      </Box>
    </Box>
  );
};

export default HeaderSection;