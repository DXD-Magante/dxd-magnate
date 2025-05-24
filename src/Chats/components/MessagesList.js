import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import { db, auth } from '../../services/firebase';

const MessagesList = ({ messageLoading, messages, chatCustomization, messagesEndRef }) => {
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    return format(timestamp, 'h:mm a');
  };

  return (
    <>
      {messageLoading ? (
        <Box className="flex-1 flex items-center justify-center">
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box className={`flex-1 p-4 overflow-y-auto ${chatCustomization.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
          {messages.length === 0 ? (
            <Box className="flex items-center justify-center h-full">
              <Typography className={chatCustomization.theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            messages.map((msg) => (
              <Box
                key={msg.id}
                className={`flex mb-4 ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <Box
                  className={`max-w-xs md:max-w-md rounded-lg p-3 ${msg.senderId === auth.currentUser?.uid
                    ? chatCustomization.theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : chatCustomization.theme === 'dark'
                      ? 'bg-gray-700 text-white'
                      : 'bg-white border border-gray-200'}`}
                  style={{
                    fontSize: chatCustomization.fontSize === 'small' ? '0.875rem' :
                      chatCustomization.fontSize === 'large' ? '1.125rem' : '1rem'
                  }}
                >
                  <Typography className="text-sm">{msg.message}</Typography>
                  <Box className="flex items-center justify-end mt-1 space-x-1">
                    <Typography variant="caption" className={
                      msg.senderId === auth.currentUser?.uid
                        ? chatCustomization.theme === 'dark'
                          ? 'text-blue-200'
                          : 'text-blue-100'
                        : chatCustomization.theme === 'dark'
                          ? 'text-gray-400'
                          : 'text-gray-500'
                    }>
                      {formatMessageTime(msg.timestamp)}
                    </Typography>
                    {msg.senderId === auth.currentUser?.uid && (
                      <span className={
                        msg.read
                          ? chatCustomization.theme === 'dark'
                            ? 'text-blue-300'
                            : 'text-blue-200'
                          : chatCustomization.theme === 'dark'
                            ? 'text-blue-100'
                            : 'text-blue-50'
                      }>
                        {msg.read ? <FiCheckCircle size={12} /> : <FiCheck size={12} />}
                      </span>
                    )}
                  </Box>
                </Box>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>
      )}
    </>
  );
};

export default MessagesList;