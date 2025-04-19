// Chats.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  TextField, 
  IconButton, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider, 
  Badge,
  Paper,
  InputAdornment,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import { 
  FiSearch, 
  FiSend, 
  FiChevronLeft,
  FiMoreVertical,
  FiCheck,
  FiCheckCircle,
  FiMessageSquare,
  FiPaperclip,
  FiSmile,
  FiSettings,
  FiBell,
  FiBellOff,
  FiArchive,
  FiTrash2,
  FiUserPlus,
  FiImage,
  FiVolume2,
  FiVolumeX,
  FiEye,
  FiEyeOff,
  FiLock
} from 'react-icons/fi';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import useUnreadChatCount from './components/UnReadCount';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [conversationUsers, setConversationUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const unreadChatCount = useUnreadChatCount();
  
  // Chat settings state
  const [anchorEl, setAnchorEl] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    sounds: true,
    desktopAlerts: true,
    previewMessages: true
  });
  const [privacySettings, setPrivacySettings] = useState({
    readReceipts: true,
    typingIndicators: true,
    lastSeen: true
  });
  const [chatCustomization, setChatCustomization] = useState({
    theme: 'light',
    fontSize: 'medium',
    bubbleColor: 'default'
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);

  // Fetch users with existing conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const messagesCollection = collection(db, 'platform-messages');
        
        const q = query(
          messagesCollection,
          where('senderId', '==', auth.currentUser?.uid)
        );
        
        const q2 = query(
          messagesCollection,
          where('receiverId', '==', auth.currentUser?.uid)
        );

        const [sentMessages, receivedMessages] = await Promise.all([
          getDocs(q),
          getDocs(q2)
        ]);

        const allMessages = [
          ...sentMessages.docs.map(doc => doc.data().receiverId),
          ...receivedMessages.docs.map(doc => doc.data().senderId)
        ];
        const uniqueUserIds = [...new Set(allMessages)];

        const usersCollection = collection(db, 'users');
        const usersQuery = query(usersCollection, where('__name__', 'in', uniqueUserIds));
        const usersSnapshot = await getDocs(usersQuery);
        
        const usersData = usersSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          unreadCount: 0
        }));

        setConversationUsers(usersData);
        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser) return;
  
    setMessageLoading(true);
    const messagesCollection = collection(db, 'platform-messages');
    const q = query(
      messagesCollection,
      where('senderId', 'in', [auth.currentUser?.uid, selectedUser.id]),
      where('receiverId', 'in', [auth.currentUser?.uid, selectedUser.id]),
      orderBy('timestamp', 'asc')
    );
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setMessages(messagesData);
      setMessageLoading(false);
      
      // Mark messages as read
      if (selectedUser) {
        const unreadMessages = messagesData.filter(
          msg => msg.receiverId === auth.currentUser?.uid && !msg.read
        );
        
        if (unreadMessages.length > 0) {
          const batch = [];
          unreadMessages.forEach((msg) => {
            const messageRef = doc(db, 'platform-messages', msg.id);
            batch.push(updateDoc(messageRef, { read: true }));
          });
          
          try {
            await Promise.all(batch);
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        }
      }
  
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  
    return () => unsubscribe();
  }, [selectedUser]);

  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await addDoc(collection(db, 'platform-messages'), {
        message: newMessage,
        senderId: auth.currentUser?.uid,
        receiverId: selectedUser.id,
        read: false,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const filteredUsers = conversationUsers.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    return format(timestamp, 'h:mm a');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    console.log('File selected:', file.name);
  };

  // Chat settings handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
    handleMenuClose();
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleNotificationChange = (setting) => (event) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: event.target.checked
    });
  };

  const handlePrivacyChange = (setting) => (event) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: event.target.checked
    });
  };

  const handleChatCustomization = (setting, value) => {
    setChatCustomization({
      ...chatCustomization,
      [setting]: value
    });
  };

  const openConfirmDialog = (action) => {
    setDialogAction(action);
    setConfirmDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmAction = () => {
    switch(dialogAction) {
      case 'clear':
        // Implement clear chat logic
        break;
      case 'delete':
        // Implement delete chat logic
        break;
      case 'block':
        // Implement block user logic
        break;
      default:
        break;
    }
    setConfirmDialogOpen(false);
  };

  const renderSettingsDialog = () => (
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

  const renderConfirmDialog = () => (
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

  const renderChatMenu = () => (
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

  return (
    <Box className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Box className="w-full md:w-80 border-r border-gray-200 bg-white" sx={{marginTop:'60px'}}>
        <Box className="p-4 border-b border-gray-200">
          <Box sx={{display:'flex', justifyContent:'space-between', alignItems:"center"}}>
            <Typography variant="h6" className="font-bold text-gray-800">
              Messages <Badge sx={{marginLeft:'10px'}} badgeContent={unreadChatCount} color='error'/>
            </Typography>
            <IconButton onClick={handleMenuOpen}>
              <FiMoreVertical/>
            </IconButton>
          </Box> 
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch className="text-gray-400" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '9999px',
                backgroundColor: '#f9fafb',
                '& fieldset': {
                  border: 'none'
                }
              }
            }}
            sx={{ mt: 2 }}
          />
        </Box>

        {loading ? (
          <Box className="flex justify-center items-center h-64">
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
            {filteredUsers.map((user) => (
              <React.Fragment key={user.id}>
                <ListItem 
                  button 
                  onClick={() => setSelectedUser(user)}
                  className={`hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-blue-50' : ''}`}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color="success"
                      invisible={!user.isOnline}
                    >
                      <Avatar 
                        src={user.photoURL} 
                        alt={`${user.firstName} ${user.lastName}`}
                        sx={{ width: 48, height: 48 }}
                      >
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography className="font-semibold text-gray-800">
                        {user.firstName} {user.lastName}
                      </Typography>
                    }
                    secondary={
                      <Typography className="text-gray-500 text-sm truncate">
                        {user.role || 'Team Member'}
                      </Typography>
                    }
                  />
                  <Box className="flex flex-col items-end">
                    <Typography variant="caption" className="text-gray-400">
                      {user.lastSeen ? format(new Date(user.lastSeen), 'h:mm a') : ''}
                    </Typography>
                    {user.unreadCount > 0 && (
                      <Box className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs mt-1">
                        {user.unreadCount}
                      </Box>
                    )}
                  </Box>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Chat Area */}
      <Box className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <Box className="p-4 border-b border-gray-200 bg-white flex items-center" sx={{marginTop:'60px'}}>
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

            {/* Messages */}
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

            {/* Message Input */}
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
          </>
        ) : (
          <Box className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50">
            <Paper elevation={0} className="p-8 text-center max-w-md">
              <Avatar sx={{ width: 80, height: 80, mb: 2, mx: 'auto', bgcolor: 'primary.main' }}>
                <FiMessageSquare size={40} />
              </Avatar>
              <Typography variant="h6" className="font-bold text-gray-800 mb-2">
                Select a conversation
              </Typography>
              <Typography variant="body2" className="text-gray-500">
                Choose from your existing conversations or search for users to start a new chat.
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Chat Menu and Dialogs */}
      {renderChatMenu()}
      {renderSettingsDialog()}
      {renderConfirmDialog()}
    </Box>
  );
};

export default ChatPage;