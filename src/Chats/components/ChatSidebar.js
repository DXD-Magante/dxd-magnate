import React from 'react';
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
  CircularProgress,
  InputAdornment,
  Tabs,
  Tab,
  
} from '@mui/material';
import { 
  FiSearch, 
  FiMoreVertical, 
  FiUsers,
  FiMail,
  FiPhone,
  FiMessageSquare
} from 'react-icons/fi';

const ChatSidebar = ({
  loading,
  searchTerm,
  setSearchTerm,
  filteredUsers,
  filteredContacts,
  selectedUser,
  setSelectedUser,
  unreadChatCount,
  handleMenuOpen,
  activeTab,
  setActiveTab,
  userRole
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'default';
      case 'away': return 'warning';
      default: return 'default';
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Unknown";
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleTimeString();
    return timestamp.toDate().toLocaleTimeString();
  };

  return (
    <Box className="w-full md:w-80 border-r border-gray-200 bg-white" sx={{ marginTop: '60px' }}>
      <Box className="p-4 border-b border-gray-200">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: "center" }}>
          <Typography variant="h6" className="font-bold text-gray-800">
            {userRole === 'client' ? 'Contacts & Messages' : 'Messages'}
            <Badge 
              sx={{ 
                marginLeft: '10px',
                '& .MuiBadge-badge': {
                  right: -5,
                  top: -5
                }
              }} 
              badgeContent={unreadChatCount} 
              color="error" 
            />
          </Typography>
          <IconButton onClick={handleMenuOpen} size="small">
            <FiMoreVertical />
          </IconButton>
        </Box>

        {userRole === 'client' && (
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ 
              mt: 2,
              '& .MuiTabs-indicator': {
                height: 3,
              },
              '& .MuiTab-root': {
                minHeight: 40,
                fontSize: '0.875rem',
                padding: '6px 12px'
              }
            }}
          >
            <Tab 
              label="Contacts" 
              value="contacts" 
              icon={<FiUsers size={16} />}
              iconPosition="start"
            />
            <Tab 
              label="Messages" 
              value="chats" 
              icon={<FiMessageSquare size={16} />}
              iconPosition="start"
            />
          </Tabs>
        )}

        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder={activeTab === 'contacts' ? "Search contacts..." : "Search users..."}
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
              },
              '& input': {
                paddingTop: '8px',
                paddingBottom: '8px'
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
        <List className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {activeTab === 'contacts' ? (
            filteredContacts.length === 0 ? (
              <Box className="p-4 text-center text-gray-500">
                No contacts found
              </Box>
            ) : (
              filteredContacts.map((contact) => (
                <React.Fragment key={contact.id}>
                  <ListItem
                    button
                    onClick={() => {
                      // Find if this contact exists in filteredUsers
                      const existingChatUser = filteredUsers.find(u => u.id === contact.id);
                      if (existingChatUser) {
                        setSelectedUser(existingChatUser);
                        setActiveTab('chats');
                      } else {
                        // Create a new chat user object
                        setSelectedUser({
                          id: contact.id,
                          firstName: contact.name.split(' ')[0],
                          lastName: contact.name.split(' ')[1] || '',
                          photoURL: contact.photoURL,
                          role: contact.role
                        });
                        setActiveTab('chats');
                      }
                    }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={getStatusColor(contact.profileStatus)}
                      >
                        <Avatar
                          src={contact.photoURL}
                          alt={contact.name}
                          sx={{ 
                            width: 48, 
                            height: 48,
                            bgcolor: contact.photoURL ? 'transparent' : 'primary.main'
                          }}
                        >
                          {contact.name?.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography 
                          className="font-semibold text-gray-800"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {contact.name}
                        </Typography>
                      }
                      secondary={
                        <Typography 
                          className="text-gray-500 text-sm"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {contact.role}
                        </Typography>
                      }
                      sx={{ 
                        marginTop: 0,
                        marginBottom: 0
                      }}
                    />
                    <Box className="flex flex-col items-end ml-2">
                      <Typography 
                        variant="caption" 
                        className="text-gray-400"
                        sx={{
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {contact.profileStatus === 'online' 
                          ? 'Online' 
                          : `Last seen ${formatLastActive(contact.lastActive)}`}
                      </Typography>
                      <Box className="flex space-x-1 mt-1">
                        <IconButton 
                          size="small" 
                          href={`mailto:${contact.email}`}
                          sx={{
                            padding: '4px',
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.08)'
                            }
                          }}
                        >
                          <FiMail size={16} />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          href={`tel:${contact.phone}`}
                          sx={{
                            padding: '4px',
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'rgba(25, 118, 210, 0.08)'
                            }
                          }}
                        >
                          <FiPhone size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider 
                    variant="inset" 
                    component="li" 
                    sx={{ 
                      marginLeft: '72px',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    }} 
                  />
                </React.Fragment>
              ))
            )
          ) : (
            filteredUsers.length === 0 ? (
              <Box className="p-4 text-center text-gray-500">
                No conversations found
              </Box>
            ) : (
              filteredUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <ListItem
                    button
                    onClick={() => setSelectedUser(user)}
                    className={`transition-colors duration-150 ${selectedUser?.id === user.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    sx={{
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: selectedUser?.id === user.id 
                          ? 'rgba(25, 118, 210, 0.12)' 
                          : 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={user.isOnline ? 'success' : 'default'}
                      >
                        <Avatar
                          src={user.photoURL}
                          alt={`${user.firstName} ${user.lastName}`}
                          sx={{ 
                            width: 48, 
                            height: 48,
                            bgcolor: user.photoURL ? 'transparent' : 'primary.main'
                          }}
                        >
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography 
                          className="font-semibold text-gray-800"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {user.firstName} {user.lastName}
                        </Typography>
                      }
                      secondary={
                        <Typography 
                          className="text-gray-500 text-sm"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {user.role || 'Team Member'}
                        </Typography>
                      }
                      sx={{ 
                        marginTop: 0,
                        marginBottom: 0
                      }}
                    />
                    <Box className="flex flex-col items-end ml-2">
                      <Typography 
                        variant="caption" 
                        className="text-gray-400"
                        sx={{
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {user.lastSeen ? new Date(user.lastSeen).toLocaleTimeString() : ''}
                      </Typography>
                      {user.unreadCount > 0 && (
                        <Box 
                          className="rounded-full flex items-center justify-center text-white text-xs mt-1"
                          sx={{
                            backgroundColor: 'error.main',
                            width: 20,
                            height: 20,
                            fontSize: '0.7rem'
                          }}
                        >
                          {user.unreadCount}
                        </Box>
                      )}
                    </Box>
                  </ListItem>
                  <Divider 
                    variant="inset" 
                    component="li" 
                    sx={{ 
                      marginLeft: '72px',
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    }} 
                  />
                </React.Fragment>
              ))
            )
          )}
        </List>
      )}
    </Box>
  );
};

export default ChatSidebar;