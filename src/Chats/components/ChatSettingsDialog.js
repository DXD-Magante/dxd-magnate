import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Box,
  Typography
} from '@mui/material';

import { FiBell, FiLock, FiImage, FiSettings } from 'react-icons/fi';

const ChatSettingsDialog = ({
  settingsOpen,
  handleSettingsClose,
  notificationSettings,
  handleNotificationChange,
  privacySettings,
  handlePrivacyChange,
  chatCustomization,
  handleChatCustomization
}) => {
  return (
    <Dialog
      open={settingsOpen}
      onClose={handleSettingsClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle className="flex items-center">
        <FiSettings className="mr-2" />
        Chat Settings
      </DialogTitle>
      <DialogContent dividers>
        <Box className="mb-6">
          <Typography variant="h6" className="font-semibold mb-3 flex items-center">
            <FiBell className="mr-2" />
            Notifications
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.sounds}
                onChange={handleNotificationChange('sounds')}
                color="primary"
              />
            }
            label="Message sounds"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.desktopAlerts}
                onChange={handleNotificationChange('desktopAlerts')}
                color="primary"
              />
            }
            label="Desktop notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={notificationSettings.previewMessages}
                onChange={handleNotificationChange('previewMessages')}
                color="primary"
              />
            }
            label="Show message preview"
          />
        </Box>

        <Box className="mb-6">
          <Typography variant="h6" className="font-semibold mb-3 flex items-center">
            <FiLock className="mr-2" />
            Privacy
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={privacySettings.readReceipts}
                onChange={handlePrivacyChange('readReceipts')}
                color="primary"
              />
            }
            label="Read receipts"
          />
          <FormControlLabel
            control={
              <Switch
                checked={privacySettings.typingIndicators}
                onChange={handlePrivacyChange('typingIndicators')}
                color="primary"
              />
            }
            label="Typing indicators"
          />
          <FormControlLabel
            control={
              <Switch
                checked={privacySettings.lastSeen}
                onChange={handlePrivacyChange('lastSeen')}
                color="primary"
              />
            }
            label="Last seen"
          />
        </Box>

        <Box>
          <Typography variant="h6" className="font-semibold mb-3 flex items-center">
            <FiImage className="mr-2" />
            Appearance
          </Typography>
          <Typography variant="subtitle2" className="mb-2">Theme</Typography>
          <Box className="flex space-x-2 mb-4">
            {['light', 'dark', 'system'].map((theme) => (
              <Button
                key={theme}
                variant={chatCustomization.theme === theme ? 'contained' : 'outlined'}
                onClick={() => handleChatCustomization('theme', theme)}
                className="capitalize"
              >
                {theme}
              </Button>
            ))}
          </Box>
          
          <Typography variant="subtitle2" className="mb-2">Message font size</Typography>
          <Box className="flex space-x-2">
            {['small', 'medium', 'large'].map((size) => (
              <Button
                key={size}
                variant={chatCustomization.fontSize === size ? 'contained' : 'outlined'}
                onClick={() => handleChatCustomization('fontSize', size)}
                className="capitalize"
              >
                {size}
              </Button>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSettingsClose} color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatSettingsDialog;