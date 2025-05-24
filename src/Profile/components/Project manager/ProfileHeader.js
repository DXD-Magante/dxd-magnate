import React from 'react';
import { Box, Typography, Avatar, Button, Badge, IconButton, Chip } from '@mui/material';
import { FiEdit2, FiMail, FiPhone, FiCheckCircle, FiDownload } from 'react-icons/fi';

const ProfileHeader = ({ profileData, currentUser, handleEditOpen }) => {
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
          />
        </Badge>
        <Box>
          <Typography variant="h4" className="font-bold text-gray-800">
            {profileData.firstName} {profileData.lastName}
          </Typography>
          <Box className="flex items-center space-x-2 mt-1">
            <Typography variant="subtitle1" className="text-gray-600">
              Project Manager
            </Typography>
            <Chip
              label="Active"
              color="success"
              size="small"
              icon={<FiCheckCircle size={14} />}
              className="text-xs"
            />
          </Box>
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
          startIcon={<FiDownload />}
          className="bg-gray-800 hover:bg-gray-700"
        >
          Export Data
        </Button>
        {currentUser && currentUser.uid === profileData?.uid && (
          <Button
            variant="contained"
            startIcon={<FiEdit2 />}
            onClick={handleEditOpen}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Edit Profile
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ProfileHeader;