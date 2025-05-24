import React from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Tooltip 
} from '@mui/material';
import { 
  FiSend, 
  FiPaperclip, 
  FiSmile 
} from 'react-icons/fi';

import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  handleEmojiClick,
  handleFileUpload,
  chatCustomization
}) => {
  return (
    <Box className={`p-4 border-t border-gray-200 ${chatCustomization.theme === 'dark' ? 'bg-gray-700' : 'bg-white'} relative`}>
      {showEmojiPicker && (
        <Box className="absolute bottom-16 left-0 z-10">
          <EmojiPicker
            width="100%"
            height={350}
            onEmojiClick={handleEmojiClick}
            theme={chatCustomization.theme === 'dark' ? 'dark' : 'light'}
          />
        </Box>
      )}
      <Box className="flex items-center">
        <Tooltip title="Attach file">
          <IconButton
            onClick={() => document.getElementById('file-upload').click()}
            className={chatCustomization.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
          >
            <FiPaperclip />
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
            />
          </IconButton>
        </Tooltip>
        <Tooltip title="Emoji">
          <IconButton
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={chatCustomization.theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'}
          >
            <FiSmile />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          InputProps={{
            sx: {
              borderRadius: '9999px',
              backgroundColor: chatCustomization.theme === 'dark' ? '#374151' : '#f9fafb',
              color: chatCustomization.theme === 'dark' ? 'white' : 'inherit',
              '& fieldset': {
                border: 'none'
              }
            }
          }}
        />
        <Tooltip title="Send">
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <FiSend />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default MessageInput;