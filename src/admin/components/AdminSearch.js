import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  InputBase,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Typography,
  Divider,
  Chip,
  Avatar,
  IconButton,
  styled,
  alpha,
  Badge
} from "@mui/material";
import {
  FiSearch,
  FiExternalLink,
  FiX,
  FiUsers,
  FiBriefcase
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '8px',
  backgroundColor: alpha(theme.palette.common.white, 0.95),
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
  '&:hover': {
    boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)',
    borderColor: alpha(theme.palette.primary.main, 0.5),
  },
  '&:focus-within': {
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    borderColor: theme.palette.primary.main,
  },
  transition: 'all 0.2s ease',
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  '& .MuiInputBase-input': {
    padding: theme.spacing(1.5, 1, 1.5, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
    fontSize: '0.925rem',
    '&::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 1,
    },
  },
}));

const HighlightText = styled('span')(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  padding: '0 2px',
  borderRadius: '2px',
}));

const AdminSearch = ({ users = [], projects = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Debug logs to verify data
  useEffect(() => {
    console.log("Users data:", users);
    console.log("Projects data:", projects);
  }, [users, projects]);

  const highlightMatch = (text, query) => {
    if (!query || !text) return text || '';
    const textStr = String(text);
    const parts = textStr.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
      <HighlightText key={i}>{part}</HighlightText> : 
      part
    );
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    
    setSearchLoading(true);
    setSearchOpen(true);
    
    const searchTimer = setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      // Search users with fallbacks
      const filteredUsers = users.filter(user => {
        if (!user) return false;
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const userEmail = user.email || '';
        const userRole = user.role || '';
        return (
          fullName.toLowerCase().includes(lowerQuery) ||
          userEmail.toLowerCase().includes(lowerQuery) ||
          userRole.toLowerCase().includes(lowerQuery)
        );
      }).slice(0, 5);
      
      // Search projects with fallbacks
      const filteredProjects = projects.filter(project => {
        if (!project) return false;
        const projectName = project.name || '';
        const projectClient = project.client || '';
        const projectId = project.id || '';
        return (
          projectName.toLowerCase().includes(lowerQuery) ||
          projectClient.toLowerCase().includes(lowerQuery) ||
          projectId.toLowerCase().includes(lowerQuery)
        );
      }).slice(0, 5);
      
      console.log("Filtered users:", filteredUsers);
      console.log("Filtered projects:", filteredProjects);
      
      setSearchResults([
        ...filteredUsers.map(u => ({ type: 'user', data: u })),
        ...filteredProjects.map(p => ({ type: 'project', data: p }))
      ]);
      
      setSearchLoading(false);
    }, 300);
    
    return () => clearTimeout(searchTimer);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const handleSearchItemClick = (item) => {
    if (item.type === 'project') {
      navigate(`/admin-dashboard/projects/${item.data.id}`);
    } else {
      navigate(`/admin-dashboard/profile/${item.data.username || item.data.id}`);
    }
    handleSearchClose();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSearchClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Box sx={{ 
      position: 'relative',
      flexGrow: 1,
      display: 'flex',
      justifyContent: 'center',
      mx: 2
    }}>
      <Search ref={searchRef}>
        <SearchIconWrapper>
          <FiSearch size={18} />
        </SearchIconWrapper>
        <StyledInputBase
          placeholder="Search users, projects..."
          inputProps={{ 'aria-label': 'search' }}
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchQuery.trim() && setSearchOpen(true)}
          inputRef={inputRef}
          fullWidth
        />
        {searchQuery && (
          <IconButton
            size="small"
            onClick={handleSearchClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
                backgroundColor: 'transparent'
              }
            }}
          >
            <FiX size={16} />
          </IconButton>
        )}
      </Search>

      <Popper
        open={searchOpen}
        anchorEl={searchRef.current}
        placement="bottom-start"
        sx={{ 
          zIndex: 1300,
          width: searchRef.current ? `${searchRef.current.clientWidth}px` : 'auto',
          maxHeight: '70vh',
          overflow: 'auto',
          marginTop: '4px !important',
        }}
      >
        <Paper 
          elevation={8} 
          sx={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {searchLoading ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress size={20} thickness={4} sx={{ mr: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Searching...
              </Typography>
            </Box>
          ) : searchResults.length > 0 ? (
            <List sx={{ py: 0 }}>
              <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="overline" color="text.secondary">
                  {`${searchResults.length} results found`}
                </Typography>
              </Box>
              {searchResults.map((result, index) => (
                <React.Fragment key={`${result.type}-${result.data.id || index}`}>
                  <ListItem 
                    button
                    onClick={() => handleSearchItemClick(result)}
                    sx={{
                      px: 2.5,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: '44px' }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box sx={{
                            bgcolor: result.type === 'project' ? 'primary.light' : 'success.light',
                            color: result.type === 'project' ? 'primary.dark' : 'success.dark',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white'
                          }}>
                            {result.type === 'project' ? 
                              <FiBriefcase size={10} /> : 
                              <FiUsers size={10} />}
                          </Box>
                        }
                      >
                        <Avatar
                          sx={{
                            bgcolor: result.type === 'project' ? 'primary.light' : 'success.light',
                            color: result.type === 'project' ? 'primary.dark' : 'success.dark',
                            width: 36,
                            height: 36,
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          {result.type === 'project' ? 
                            (result.data.name || 'P').charAt(0).toUpperCase() : 
                            (result.data.firstName || 'U').charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {highlightMatch(
                            result.type === 'project' ? 
                              (result.data.name || 'Unnamed Project') : 
                              `${result.data.firstName || ''} ${result.data.lastName || ''}`.trim(),
                            searchQuery
                          )}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block', fontSize: '0.75rem' }}
                          >
                            {result.type === 'project' ? 
                              highlightMatch(`Client: ${result.data.client || 'No client'}`, searchQuery) : 
                              highlightMatch(`Role: ${result.data.role || 'User'}`, searchQuery)}
                          </Typography>
                          {result.type === 'project' ? (
                            <Chip
                              label={result.data.status || 'active'}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: '20px',
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                backgroundColor: 
                                  result.data.status === 'completed' ? 'success.light' :
                                  'primary.light',
                                color: 
                                  result.data.status === 'completed' ? 'success.dark' :
                                  'primary.dark',
                              }}
                            />
                          ) : (
                            <Chip
                              label={result.data.status || 'active'}
                              size="small"
                              sx={{
                                mt: 0.5,
                                height: '20px',
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                backgroundColor: 
                                  result.data.status === 'active' ? 'success.light' :
                                  'error.light',
                                color: 
                                  result.data.status === 'active' ? 'success.dark' :
                                  'error.dark',
                              }}
                            />
                          )}
                        </>
                      }
                      sx={{ my: 0 }}
                    />
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      ml: 1,
                      color: 'text.secondary'
                    }}>
                      <FiExternalLink size={14} />
                    </Box>
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider sx={{ my: 0 }} />}
                </React.Fragment>
              ))}
            </List>
          ) : searchQuery ? (
            <Box sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <FiSearch size={24} style={{ marginBottom: '8px', color: '#94a3b8' }} />
              <Typography variant="body2" color="text.secondary">
                No results found for <strong>"{searchQuery}"</strong>
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                Try different keywords
              </Typography>
            </Box>
          ) : null}
        </Paper>
      </Popper>
    </Box>
  );
};

export default AdminSearch;