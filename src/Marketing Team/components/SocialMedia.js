import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  LinearProgress,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  FiBarChart2, 
  FiUsers, 
  FiHeart, 
  FiMessageSquare, 
  FiShare2,
  FiCalendar,
  FiRefreshCw,
  FiMoreVertical,
  FiArrowUp,
  FiArrowDown,
  FiImage,
  FiLock
} from 'react-icons/fi';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { formatNumber, formatDate } from '../../utils/helpers';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SocialMediaDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7days');
  const [anchorEl, setAnchorEl] = useState(null);
  const [instagramData, setInstagramData] = useState({
    engagement: [],
    followers: [],
    topPosts: []
  });
  const [stats, setStats] = useState({
    totalFollowers: 0,
    followerChange: 0,
    engagementRate: 0,
    engagementChange: 0,
    totalPosts: 0,
    avgLikes: 0,
    avgComments: 0
  });
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');

  const fetchInstagramData = async (token, uid) => {
    try {
      if (!token || !uid) {
        setAuthDialogOpen(true);
        return null;
      }

      // Fetch Instagram business account ID
      const accountsRes = await fetch(
        `https://graph.facebook.com/v19.0/${uid}/accounts?access_token=${token}`
      );
      const accountsData = await accountsRes.json();
      
      if (accountsData.error) {
        console.error("Error fetching accounts:", accountsData.error);
        setAuthDialogOpen(true);
        return null;
      }

      const instagramAccount = accountsData.data.find(account => account.instagram_business_account);
      if (!instagramAccount) {
        console.error("No Instagram business account found");
        setAuthDialogOpen(true);
        return null;
      }

      const igUserId = instagramAccount.instagram_business_account.id;

      // Fetch insights data
      const insightsRes = await fetch(
        `https://graph.facebook.com/v19.0/${igUserId}/insights?metric=follower_count,impressions,reach,engagement&period=day&access_token=${token}`
      );
      const insightsData = await insightsRes.json();

      // Fetch media data
      const mediaRes = await fetch(
        `https://graph.facebook.com/v19.0/${igUserId}/media?fields=id,caption,like_count,comments_count,media_url,permalink,timestamp,insights.metric(engagement,impressions,reach){name,values}&access_token=${token}`
      );
      const mediaData = await mediaRes.json();

      // Process insights data
      const followersData = insightsData.data.find(d => d.name === 'follower_count')?.values.map(v => ({
        date: v.end_time,
        count: v.value
      })) || [];

      const engagementData = insightsData.data.find(d => d.name === 'engagement')?.values.map(v => ({
        date: v.end_time,
        engagement: v.value
      })) || [];

      // Process media data
      const postsData = mediaData.data.map(post => ({
        id: post.id,
        caption: post.caption || '',
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        media_url: post.media_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        engagement: post.insights?.data.find(i => i.name === 'engagement')?.values[0].value || 0
      })).sort((a, b) => b.engagement - a.engagement);

      return {
        engagement: engagementData,
        followers: followersData,
        topPosts: postsData
      };
    } catch (error) {
      console.error("Error fetching Instagram data:", error);
      setAuthDialogOpen(true);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check if we have cached data in Firestore
        const engagementSnapshot = await getDocs(collection(db, 'social-media-engagement'));
        const followersSnapshot = await getDocs(collection(db, 'social-media-follower-growth'));
        const postsSnapshot = await getDocs(collection(db, 'social-media-top-posts'));
        
        if (!engagementSnapshot.empty && !followersSnapshot.empty && !postsSnapshot.empty) {
          // Use cached data
          const engagementData = engagementSnapshot.docs.map(doc => doc.data());
          const followersData = followersSnapshot.docs.map(doc => doc.data());
          const postsData = postsSnapshot.docs.map(doc => doc.data());
          
          setInstagramData({
            engagement: engagementData,
            followers: followersData,
            topPosts: postsData
          });
          
          calculateStats(engagementData, followersData, postsData);
        } else {
          // Try to get token from localStorage
          const savedToken = localStorage.getItem('instagramAccessToken');
          const savedUserId = localStorage.getItem('instagramUserId');
          
          if (savedToken && savedUserId) {
            const freshData = await fetchInstagramData(savedToken, savedUserId);
            
            if (freshData) {
              setInstagramData(freshData);
              calculateStats(freshData.engagement, freshData.followers, freshData.topPosts);
              await updateFirestoreData(freshData);
            }
          } else {
            setAuthDialogOpen(true);
          }
        }
      } catch (error) {
        console.error("Error loading social media data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const updateFirestoreData = async (data) => {
    try {
      // Update engagement data
      const engagementCol = collection(db, 'social-media-engagement');
      await Promise.all(data.engagement.map(async (item) => {
        const docRef = doc(engagementCol, item.date);
        await updateDoc(docRef, item, { merge: true });
      }));
      
      // Update follower data
      const followersCol = collection(db, 'social-media-follower-growth');
      await Promise.all(data.followers.map(async (item) => {
        const docRef = doc(followersCol, item.date);
        await updateDoc(docRef, item, { merge: true });
      }));
      
      // Update top posts data
      const postsCol = collection(db, 'social-media-top-posts');
      await Promise.all(data.topPosts.map(async (item) => {
        const docRef = doc(postsCol, item.id);
        await updateDoc(docRef, item, { merge: true });
      }));
      
    } catch (error) {
      console.error("Error updating Firestore data:", error);
    }
  };

  const calculateStats = (engagement, followers, posts) => {
    if (!engagement?.length || !followers?.length || !posts?.length) return;
    
    // Calculate follower stats
    const latestFollowers = followers[followers.length - 1].count;
    const previousFollowers = followers.length > 1 ? followers[followers.length - 2].count : 0;
    const followerChange = latestFollowers - previousFollowers;
    
    // Calculate engagement stats
    const latestEngagement = engagement[engagement.length - 1].engagement;
    const previousEngagement = engagement.length > 1 ? engagement[engagement.length - 2].engagement : 0;
    const engagementChange = latestEngagement - previousEngagement;
    
    // Calculate post stats
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
    
    setStats({
      totalFollowers: latestFollowers,
      followerChange,
      engagementRate: latestEngagement,
      engagementChange,
      totalPosts,
      avgLikes: Math.round(totalLikes / totalPosts),
      avgComments: Math.round(totalComments / totalPosts)
    });
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const savedToken = localStorage.getItem('instagramAccessToken');
      const savedUserId = localStorage.getItem('instagramUserId');
      
      if (savedToken && savedUserId) {
        const freshData = await fetchInstagramData(savedToken, savedUserId);
        
        if (freshData) {
          setInstagramData(freshData);
          calculateStats(freshData.engagement, freshData.followers, freshData.topPosts);
          await updateFirestoreData(freshData);
        }
      } else {
        setAuthDialogOpen(true);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAuthSubmit = async () => {
    if (!accessToken || !userId) return;
    
    try {
      setLoading(true);
      localStorage.setItem('instagramAccessToken', accessToken);
      localStorage.setItem('instagramUserId', userId);
      
      const freshData = await fetchInstagramData(accessToken, userId);
      
      if (freshData) {
        setInstagramData(freshData);
        calculateStats(freshData.engagement, freshData.followers, freshData.topPosts);
        await updateFirestoreData(freshData);
        setAuthDialogOpen(false);
      }
    } catch (error) {
      console.error("Error authenticating:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const filterDataByTimeRange = (data) => {
    if (!data) return [];
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeRange) {
      case '7days':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        cutoffDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90days':
        cutoffDate = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const renderStatCard = (title, value, change, icon, isPercent = false) => {
    const isPositive = change >= 0;
    
    return (
      <Paper sx={{ 
        p: 2, 
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.08)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 500 }}>
            {title}
          </Typography>
          <Box sx={{ 
            color: '#4f46e5',
            backgroundColor: '#e0e7ff',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
          {isPercent ? `${value}%` : formatNumber(value)}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mt: 0.5,
          color: isPositive ? '#10b981' : '#ef4444'
        }}>
          {isPositive ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
          <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 500 }}>
            {Math.abs(change)} {isPercent ? '%' : ''} {isPositive ? 'increase' : 'decrease'}
          </Typography>
        </Box>
      </Paper>
    );
  };

  const renderPostCard = (post) => {
    return (
      <Paper sx={{ 
        p: 2, 
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.08)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            backgroundColor: '#f1f5f9',
            borderRadius: 1,
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {post.media_url ? (
              <img 
                src={post.media_url} 
                alt="Post" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#64748b'
              }}>
                <FiImage size={20} />
              </Box>
            )}
          </Box>
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {post.caption ? post.caption.substring(0, 50) + (post.caption.length > 50 ? '...' : '') : 'Untitled Post'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {formatDate(post.timestamp)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FiHeart color="#ef4444" size={16} />
            <Typography variant="body2" sx={{ ml: 0.5, mr: 2 }}>
              {formatNumber(post.likes)}
            </Typography>
            <FiMessageSquare color="#3b82f6" size={16} />
            <Typography variant="body2" sx={{ ml: 0.5 }}>
              {formatNumber(post.comments)}
            </Typography>
          </Box>
          <Chip 
            label="View Post" 
            size="small" 
            component="a" 
            href={post.permalink} 
            target="_blank"
            clickable
            sx={{ 
              backgroundColor: '#f1f5f9',
              '&:hover': { backgroundColor: '#e2e8f0' }
            }}
          />
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Dialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiLock size={20} />
            <Typography variant="h6">Instagram Authentication</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter your Instagram API credentials to access your analytics data.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Facebook User ID"
            type="text"
            fullWidth
            variant="outlined"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Access Token"
            type="text"
            fullWidth
            variant="outlined"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
          <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
            Note: We store these credentials only in your browser's localStorage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuthDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAuthSubmit} 
            variant="contained"
            disabled={!accessToken || !userId}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: isMobile ? '1.75rem' : '2.125rem'
        }}>
          Social Media Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ 
              backgroundColor: '#f1f5f9',
              '&:hover': { backgroundColor: '#e2e8f0' }
            }}
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          </IconButton>
          
          <IconButton onClick={handleMenuOpen}>
            <FiMoreVertical />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Export Data</MenuItem>
            <MenuItem onClick={() => {
              localStorage.removeItem('instagramAccessToken');
              localStorage.removeItem('instagramUserId');
              setAuthDialogOpen(true);
              handleMenuClose();
            }}>Re-authenticate</MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {instagramData.topPosts.length === 0 ? (
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.08)'
        }}>
          <FiLock size={48} color="#64748b" />
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Instagram Data Not Connected
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
            Please authenticate with Instagram to view your analytics data.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => setAuthDialogOpen(true)}
            startIcon={<FiLock size={16} />}
          >
            Connect Instagram
          </Button>
        </Paper>
      ) : (
        <>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
            variant={isMobile ? 'scrollable' : 'standard'}
          >
            <Tab label="Overview" />
            <Tab label="Engagement Metrics" />
            <Tab label="Follower Growth" />
            <Tab label="Top Performing Posts" />
          </Tabs>
          
          {activeTab === 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  {renderStatCard(
                    'Total Followers', 
                    stats.totalFollowers, 
                    stats.followerChange, 
                    <FiUsers size={16} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  {renderStatCard(
                    'Engagement Rate', 
                    stats.engagementRate, 
                    stats.engagementChange, 
                    <FiHeart size={16} />,
                    true
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  {renderStatCard(
                    'Total Posts', 
                    stats.totalPosts, 
                    0, 
                    <FiBarChart2 size={16} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  {renderStatCard(
                    'Avg. Engagement', 
                    Math.round((stats.avgLikes + stats.avgComments) / 2), 
                    0, 
                    <FiMessageSquare size={16} />
                  )}
                </Grid>
              </Grid>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Follower Growth
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={filterDataByTimeRange(instagramData.followers)}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => formatDate(value, 'MMM d')}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value) => [formatNumber(value), 'Followers']}
                            labelFormatter={(value) => `Date: ${formatDate(value)}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#4f46e5" 
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper sx={{ 
                    p: 2, 
                    height: '100%',
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Engagement Rate
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filterDataByTimeRange(instagramData.engagement)}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => formatDate(value, 'MMM d')}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value) => [`${value}%`, 'Engagement']}
                            labelFormatter={(value) => `Date: ${formatDate(value)}`}
                          />
                          <Bar 
                            dataKey="engagement" 
                            fill="#8884d8" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Top Performing Posts
                </Typography>
                <Grid container spacing={2}>
                  {instagramData.topPosts.slice(0, isMobile ? 2 : 4).map((post) => (
                    <Grid item xs={12} sm={6} key={post.id}>
                      {renderPostCard(post)}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </>
          )}
          
          {activeTab === 1 && (
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Engagement Metrics Over Time
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filterDataByTimeRange(instagramData.engagement)}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => formatDate(value, 'MMM d')}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Engagement']}
                      labelFormatter={(value) => `Date: ${formatDate(value)}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      name="Engagement Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Engagement Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Likes', value: stats.avgLikes },
                        { name: 'Comments', value: stats.avgComments },
                        { name: 'Shares', value: Math.round(stats.avgLikes * 0.1) }, // Estimated
                        { name: 'Saves', value: Math.round(stats.avgLikes * 0.15) }   // Estimated
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Engagements']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
          
          {activeTab === 2 && (
            <Paper sx={{ 
              p: 2, 
              borderRadius: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Follower Growth Over Time
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={filterDataByTimeRange(instagramData.followers)}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => formatDate(value, 'MMM d')}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [formatNumber(value), 'Followers']}
                      labelFormatter={(value) => `Date: ${formatDate(value)}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      name="Followers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Follower Acquisition Sources
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Organic', value: 65 },
                      { name: 'Hashtags', value: 15 },
                      { name: 'Explore', value: 10 },
                      { name: 'Profile Visits', value: 5 },
                      { name: 'Other', value: 5 }
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      fill="#10b981" 
                      radius={[0, 4, 4, 0]}
                      name="Percentage"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
          
          {activeTab === 3 && (
            <Box>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Top Performing Posts
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<FiCalendar size={14} />}
                  >
                    Sort by Date
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    startIcon={<FiHeart size={14} />}
                  >
                    Sort by Engagement
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                {instagramData.topPosts.map((post) => (
                  <Grid item xs={12} sm={6} md={4} key={post.id}>
                    {renderPostCard(post)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SocialMediaDashboard;