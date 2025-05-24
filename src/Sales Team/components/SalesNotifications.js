import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Divider, 
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Pagination,
  Chip,
  Avatar,
  Badge
} from '@mui/material';
import { 
  FiBell, 
  FiSearch, 
  FiFilter, 
  FiChevronDown, 
  FiClock,
  FiUser,
  FiDollarSign,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiArchive
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { styled } from '@mui/material/styles';

const StyledTabs = styled(Tabs)({
  '& .MuiTabs-indicator': {
    backgroundColor: '#4f46e5',
    height: 3,
  },
});

const StyledTab = styled(Tab)({
  textTransform: 'none',
  fontWeight: '600',
  fontSize: '0.875rem',
  color: '#64748b',
  '&.Mui-selected': {
    color: '#4f46e5',
  },
});

const NotificationItem = ({ notification, markAsRead, markAsUnread, archiveNotification }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'lead':
        return <FiUser className="text-indigo-600" />;
      case 'payment':
        return <FiDollarSign className="text-green-600" />;
      case 'alert':
        return <FiAlertCircle className="text-red-600" />;
      default:
        return <FiBell className="text-blue-600" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`p-4 border-b border-gray-100 ${!notification.viewed ? 'bg-blue-50' : 'bg-white'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg ${!notification.viewed ? 'bg-blue-100' : 'bg-gray-100'}`}>
          {getNotificationIcon()}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <Typography variant="subtitle1" className="font-semibold">
              {notification.message}
            </Typography>
            {isHovered && (
              <div className="flex gap-2">
                {notification.viewed ? (
                  <button 
                    onClick={() => markAsUnread(notification.id)}
                    className="text-gray-500 hover:text-blue-600"
                    title="Mark as unread"
                  >
                    <FiClock size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="text-gray-500 hover:text-green-600"
                    title="Mark as read"
                  >
                    <FiCheck size={16} />
                  </button>
                )}
                <button 
                  onClick={() => archiveNotification(notification.id)}
                  className="text-gray-500 hover:text-red-600"
                  title="Archive"
                >
                  <FiX size={16} />
                </button>
              </div>
            )}
          </div>
          
          {notification.description && (
            <Typography variant="body2" className="text-gray-600 mt-1">
              {notification.description}
            </Typography>
          )}
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {notification.priority && (
                <Chip 
                  label={notification.priority} 
                  size="small"
                  color={
                    notification.priority === 'high' ? 'error' : 
                    notification.priority === 'medium' ? 'warning' : 'success'
                  }
                />
              )}
              {notification.type && (
                <Chip 
                  label={notification.type} 
                  size="small"
                  variant="outlined"
                />
              )}
            </div>
            
            <Typography variant="caption" className="text-gray-400 flex items-center">
              <FiClock className="mr-1" size={14} />
              {formatDate(notification.timestamp)}
            </Typography>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SalesNotifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    priority: [],
    type: [],
    status: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const filterOpen = Boolean(filterAnchorEl);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Replace with your actual user ID or get it from auth
        const userId = auth.currentUser.uid;
        const q = query(
          collection(db, 'sales-notifications'),
          where('userId', '==', userId)
        );

        const querySnapshot = await getDocs(q);
        const fetchedNotifications = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedNotifications.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });

        // Sort by timestamp in descending order (newest first)
        fetchedNotifications.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setCurrentPage(1);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const toggleFilter = (filterType, value) => {
    setSelectedFilters(prev => {
      const currentFilters = [...prev[filterType]];
      const index = currentFilters.indexOf(value);
      
      if (index === -1) {
        return {
          ...prev,
          [filterType]: [...currentFilters, value]
        };
      } else {
        return {
          ...prev,
          [filterType]: currentFilters.filter(item => item !== value)
        };
      }
    });
    setCurrentPage(1);
  };

  const toggleStatusFilter = (status) => {
    setSelectedFilters(prev => ({
      ...prev,
      status
    }));
    setCurrentPage(1);
  };

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'sales-notifications', id), {
        viewed: true
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, viewed: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (id) => {
    try {
      await updateDoc(doc(db, 'sales-notifications', id), {
        viewed: false
      });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, viewed: false } : n)
      );
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const archiveNotification = async (id) => {
    try {
      // Implement archive logic (either delete or update status)
      // For now, we'll just filter it out from the UI
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.viewed);
      const batch = unreadNotifications.map(n => 
        updateDoc(doc(db, 'sales-notifications', n.id), { viewed: true })
      );
      
      await Promise.all(batch);
      setNotifications(prev => 
        prev.map(n => ({ ...n, viewed: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert(error)
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    // Tab filtering
    if (activeTab === 'unread' && notification.viewed) return false;
    if (activeTab === 'leads' && notification.type !== 'lead') return false;
    
    // Search filtering
    if (searchQuery && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(notification.description && notification.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }
    
    // Priority filtering
    if (selectedFilters.priority.length > 0 && 
        (!notification.priority || !selectedFilters.priority.includes(notification.priority))) {
      return false;
    }
    
    // Type filtering
    if (selectedFilters.type.length > 0 && 
        (!notification.type || !selectedFilters.type.includes(notification.type))) {
      return false;
    }
    
    // Status filtering
    if (selectedFilters.status === 'read' && !notification.viewed) return false;
    if (selectedFilters.status === 'unread' && notification.viewed) return false;
    
    return true;
  });

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Box className="max-w-6xl mx-auto px-4 py-8" sx={{marginTop:'60px'}}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
              <FiBell size={24} />
            </div>
            <Typography variant="h4" className="font-bold text-gray-800">
              Notifications
            </Typography>
            <Badge 
              badgeContent={notifications.filter(n => !n.viewed).length} 
              color="primary"
              className="ml-2"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outlined"
              startIcon={<FiArchive />}
              onClick={() => {
                // Implement archive all logic
              }}
              sx={{
                borderRadius: '8px',
                textTransform: 'none'
              }}
            >
              Archive All
            </Button>
            <Button
              variant="contained"
              startIcon={<FiCheck />}
              onClick={markAllAsRead}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                backgroundColor: '#4f46e5',
                '&:hover': {
                  backgroundColor: '#4338ca'
                }
              }}
            >
              Mark All as Read
            </Button>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch className="text-gray-400" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '8px',
                backgroundColor: 'white'
              }
            }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FiFilter />}
            endIcon={<FiChevronDown />}
            onClick={handleFilterClick}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              minWidth: '120px'
            }}
          >
            Filters
          </Button>
          
          <Menu
            anchorEl={filterAnchorEl}
            open={filterOpen}
            onClose={handleFilterClose}
            PaperProps={{
              sx: {
                width: 300,
                padding: 2,
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Typography variant="subtitle1" className="font-semibold mb-2">
              Priority
            </Typography>
            <div className="flex flex-wrap gap-2 mb-4">
              {['high', 'medium', 'low'].map(priority => (
                <Chip
                  key={priority}
                  label={priority}
                  clickable
                  color={
                    selectedFilters.priority.includes(priority) ? 
                    (priority === 'high' ? 'error' : 
                     priority === 'medium' ? 'warning' : 'success') : 'default'
                  }
                  variant={selectedFilters.priority.includes(priority) ? 'filled' : 'outlined'}
                  onClick={() => toggleFilter('priority', priority)}
                />
              ))}
            </div>
            
            <Typography variant="subtitle1" className="font-semibold mb-2">
              Type
            </Typography>
            <div className="flex flex-wrap gap-2 mb-4">
              {['lead', 'payment', 'alert', 'system'].map(type => (
                <Chip
                  key={type}
                  label={type}
                  clickable
                  variant={selectedFilters.type.includes(type) ? 'filled' : 'outlined'}
                  onClick={() => toggleFilter('type', type)}
                />
              ))}
            </div>
            
            <Typography variant="subtitle1" className="font-semibold mb-2">
              Status
            </Typography>
            <div className="flex gap-2 mb-2">
              <Chip
                label="All"
                clickable
                variant={selectedFilters.status === 'all' ? 'filled' : 'outlined'}
                color={selectedFilters.status === 'all' ? 'primary' : 'default'}
                onClick={() => toggleStatusFilter('all')}
              />
              <Chip
                label="Unread"
                clickable
                variant={selectedFilters.status === 'unread' ? 'filled' : 'outlined'}
                color={selectedFilters.status === 'unread' ? 'primary' : 'default'}
                onClick={() => toggleStatusFilter('unread')}
              />
              <Chip
                label="Read"
                clickable
                variant={selectedFilters.status === 'read' ? 'filled' : 'outlined'}
                color={selectedFilters.status === 'read' ? 'primary' : 'default'}
                onClick={() => toggleStatusFilter('read')}
              />
            </div>
          </Menu>
        </div>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <StyledTabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <StyledTab label="All" value="all" />
            <StyledTab 
              label="Unread" 
              value="unread" 
              icon={
                <Badge 
                  badgeContent={notifications.filter(n => !n.viewed).length} 
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { transform: 'scale(0.8) translate(50%, -50%)' } }}
                />
              }
              iconPosition="end"
            />
            <StyledTab label="Leads" value="leads" />
            <StyledTab label="Payments" value="payments" />
            <StyledTab label="Alerts" value="alerts" />
          </StyledTabs>
        </Box>
        
        {/* Notifications List */}
        <Box className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <Box className="flex justify-center items-center py-12">
              <CircularProgress />
            </Box>
          ) : paginatedNotifications.length === 0 ? (
            <Box className="flex flex-col items-center justify-center py-12 text-center">
              <FiBell size={48} className="text-gray-300 mb-4" />
              <Typography variant="h6" className="text-gray-500 mb-2">
                No notifications found
              </Typography>
              <Typography variant="body2" className="text-gray-400">
                {activeTab === 'unread' ? 
                  "You're all caught up!" : 
                  "Try adjusting your filters or search"}
              </Typography>
            </Box>
          ) : (
            <AnimatePresence>
              {paginatedNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  markAsRead={markAsRead}
                  markAsUnread={markAsUnread}
                  archiveNotification={archiveNotification}
                />
              ))}
            </AnimatePresence>
          )}
        </Box>
        
        {/* Pagination */}
        {filteredNotifications.length > itemsPerPage && (
          <Box className="flex justify-center mt-6">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              shape="rounded"
              color="primary"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: '8px',
                },
                '& .Mui-selected': {
                  backgroundColor: '#4f46e5 !important',
                  color: 'white'
                }
              }}
            />
          </Box>
        )}
      </Box>
    </div>
  );
};

export default SalesNotifications;