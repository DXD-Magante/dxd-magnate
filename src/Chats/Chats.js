import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Avatar, Typography } from '@mui/material';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import ChatSidebar from './components/ChatSidebar';
import ChatHeader from './components/ChatHeader';
import MessagesList from './components/MessagesList';
import MessageInput from './components/MessageInput';
import ChatSettingsDialog from './components/ChatSettingsDialog';
import ConfirmDialog from './components/ConfirmDialog';
import ChatMenu from './components/ChatMenu';
import useUnreadChatCount from './components/UnReadCount';
import { FiMessageSquare } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';


const ChatPage = () => {
  const location = useLocation();
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
// In Chats.js, modify the useEffect that fetches conversations:
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

      // Check if there's a contactId in location state
      const locationState = location.state;
      const contactId = locationState?.contactId;

      // If contactId exists and isn't already in uniqueUserIds, add it
      if (contactId && !uniqueUserIds.includes(contactId)) {
        uniqueUserIds.push(contactId);
      }

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

      // If we have a contactId in state, set that user as selected
      if (contactId) {
        const contactUser = usersData.find(u => u.id === contactId);
        if (contactUser) {
          setSelectedUser(contactUser);
        } else {
          // If user not found in existing conversations, create a minimal user object
          const contactFromProps = locationState?.contact;
          if (contactFromProps) {
            setSelectedUser({
              id: contactFromProps.id,
              firstName: contactFromProps.name.split(' ')[0],
              lastName: contactFromProps.name.split(' ')[1] || '',
              photoURL: contactFromProps.photoURL,
              role: contactFromProps.role
            });
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };
  fetchConversations();
}, [location.state]); // Add location.state to dependencies

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser) return;

    setMessageLoading(true);
    const messagesCollection = collection(db, 'platform-messages');
    const q = query(
      messagesCollection,
      where('senderId', 'in', [auth.currentUser?.uid, selectedUser.id]),
      where('receiverId', 'in', [auth.currentUser?.uid, selectedUser.id]),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
            Promise.all(batch).catch(error => {
              console.error('Error marking messages as read:', error);
            });
          } catch (error) {
            console.error('Error in mark as read batch:', error);
          }
        }
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedUser]);

  // UPDATED send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    // Create optimistic update
    const tempId = Date.now().toString(); // Temporary ID for the optimistic update
    const newMsg = {
      id: tempId,
      message: newMessage,
      senderId: auth.currentUser?.uid,
      receiverId: selectedUser.id,
      read: false,
      timestamp: new Date() // Local timestamp for immediate display
    };

    // Add to local state immediately
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setShowEmojiPicker(false);

    // Scroll to bottom after local update
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    try {
      // Send to Firebase
      const docRef = await addDoc(collection(db, 'platform-messages'), {
        message: newMessage,
        senderId: auth.currentUser?.uid,
        receiverId: selectedUser.id,
        read: false,
        timestamp: serverTimestamp()
      });

      // Replace optimistic update with real data when it comes back
      // The onSnapshot listener will handle this automatically
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic update if there was an error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };


  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const filteredUsers = conversationUsers.filter(user => 
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    console.log('File selected:', file.name);
  };

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

  return (
    <Box className="flex h-screen bg-gray-50">
      <ChatSidebar
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredUsers={filteredUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        unreadChatCount={unreadChatCount}
        handleMenuOpen={handleMenuOpen}
      />

      <Box className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <ChatHeader 
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              handleMenuOpen={handleMenuOpen}
            />

            <MessagesList
              messageLoading={messageLoading}
              messages={messages}
              chatCustomization={chatCustomization}
              messagesEndRef={messagesEndRef}
            />

            <MessageInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              handleEmojiClick={handleEmojiClick}
              handleFileUpload={handleFileUpload}
              chatCustomization={chatCustomization}
            />
          </>
        ) : (
          <EmptyChatState />
        )}
      </Box>

      <ChatMenu
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        handleSettingsOpen={handleSettingsOpen}
        openConfirmDialog={openConfirmDialog}
        selectedUser={selectedUser}
      />

      <ChatSettingsDialog
        settingsOpen={settingsOpen}
        handleSettingsClose={handleSettingsClose}
        notificationSettings={notificationSettings}
        handleNotificationChange={handleNotificationChange}
        privacySettings={privacySettings}
        handlePrivacyChange={handlePrivacyChange}
        chatCustomization={chatCustomization}
        handleChatCustomization={handleChatCustomization}
      />

      <ConfirmDialog
        confirmDialogOpen={confirmDialogOpen}
        setConfirmDialogOpen={setConfirmDialogOpen}
        dialogAction={dialogAction}
        selectedUser={selectedUser}
        handleConfirmAction={handleConfirmAction}
      />
    </Box>
  );
};

const EmptyChatState = () => (
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
);

export default ChatPage;