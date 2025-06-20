import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Avatar, 
  LinearProgress, Tabs, Tab, Divider, 
  TextField, IconButton, CircularProgress,
  Grid, useMediaQuery, useTheme, Dialog,
  DialogTitle, DialogContent, DialogActions,
  Button, Chip, Tooltip
} from '@mui/material';
import { 
  FiAward, FiTrendingUp, FiCheckCircle, 
  FiUser, FiBarChart2, FiDollarSign,
  FiFilter, FiRefreshCw, FiSearch,
  FiChevronRight,
  FiTrendingDown, FiStar, FiAperture
} from 'react-icons/fi';
import { FaCrown as FiCrown, FaMedal as FiMedal } from "react-icons/fa";
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const SalesLeaderboard = () => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState([]);
  const [allPerformers, setAllPerformers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserStats, setCurrentUserStats] = useState({
    rank: 0,
    name: '',
    avatar: '',
    revenue: 0,
    dealsClosed: 0,
    dealsTotal: 0,
    conversionRate: 0,
    role: '',
    skills: []
  });
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const tabs = [
    { label: 'Revenue', icon: <FiDollarSign />, key: 'revenue' },
    { label: 'Deals Closed', icon: <FiCheckCircle />, key: 'dealsClosed' },
    { label: 'Conversion', icon: <FiTrendingUp />, key: 'conversionRate' }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSalesPerformance = async () => {
    try {
      setLoading(true);
      
      const usersRef = collection(db, 'users');
      const salesQuery = query(
        usersRef, 
        where('role', '==', 'sales'),
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      const performers = [];
      
      for (const salesDoc of salesSnapshot.docs) {
        const userData = salesDoc.data();
        const userId = salesDoc.id;
        
        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', userId)
        );
        
        const leadsSnapshot = await getDocs(leadsQuery);
        
        let totalRevenue = 0;
        let dealsClosed = 0;
        let dealsTotal = 0;
        
        leadsSnapshot.forEach((leadDoc) => {
          const lead = leadDoc.data();
          const budget = parseInt(lead.budget || 0);
          
          dealsTotal++;
          
          if (lead.status === 'closed-won') {
            totalRevenue += budget;
            dealsClosed++;
          }
        });
        
        const conversionRate = dealsTotal > 0 ? (dealsClosed / dealsTotal) * 100 : 0;
        
        const performerData = {
          id: userId,
          name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
          avatar: userData.profilePicture || '',
          revenue: totalRevenue,
          dealsClosed: dealsClosed,
          dealsTotal: dealsTotal,
          conversionRate: conversionRate,
          role: userData.role,
          rank: userData.rank || 0,
          skills: userData.skills || []
        };
        
        performers.push(performerData);
        
        if (userId === currentUserId) {
          setCurrentUserStats(performerData);
        }
      }
      
      // Sort by active tab metric
      const sortField = tabs[activeTab].key;
      const sortedPerformers = [...performers].sort((a, b) => b[sortField] - a[sortField]);
      
      // Assign ranks based on sorted order
      const rankedPerformers = sortedPerformers.map((performer, index) => ({
        ...performer,
        rank: index + 1
      }));
      
      setTopPerformers(rankedPerformers.slice(0, 3));
      setAllPerformers(rankedPerformers);
      
      // Update current user stats with rank if they exist
      if (currentUserId) {
        const currentUser = rankedPerformers.find(p => p.id === currentUserId);
        if (currentUser) {
          setCurrentUserStats(currentUser);
        }
      }
    } catch (error) {
      console.error('Error fetching sales performance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesPerformance();
  }, [activeTab, currentUserId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return theme.palette.primary.main;
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <FiCrown size={20} />;
      case 2: return <FiMedal size={18} />;
      case 3: return <FiMedal size={18} />;
      default: return <FiStar size={16} />;
    }
  };

  const filteredPerformers = allPerformers.filter(performer =>
    performer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTrophyStage = () => {
    const top3 = [
      topPerformers[0] || null,
      topPerformers[1] || null,
      topPerformers[2] || null
    ];

    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: { xs: 1, md: 4 },
        my: 4,
        height: { xs: 220, md: 280 },
        position: 'relative'
      }}>
        {/* Second Place */}
        <Box sx={{
          width: { xs: 100, md: 140 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '80%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}>
          <Box sx={{
            bgcolor: 'background.paper',
            borderRadius: '12px 12px 0 0',
            p: 2,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            border: '1px solid',
            borderColor: 'divider',
            borderBottom: 'none',
            boxShadow: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: '#C0C0C0'
            }
          }}>
            <Box sx={{
              width: { xs: 56, md: 72 },
              height: { xs: 56, md: 72 },
              borderRadius: '50%',
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              border: '3px solid #C0C0C0',
              boxShadow: 2
            }}>
              {top3[1] ? (
                <Avatar 
                  src={top3[1].avatar}
                  sx={{ width: '100%', height: '100%' }}
                >
                  {top3[1]?.name?.charAt(0) || '2'}
                </Avatar>
              ) : (
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: '50%',
                  color: 'text.secondary'
                }}>
                  <FiUser size={24} />
                </Box>
              )}
            </Box>
            <Typography variant={isMobile ? 'body2' : 'body1'} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              {top3[1]?.name || 'Not Available'}
            </Typography>
            <Typography variant={isMobile ? 'caption' : 'body2'} sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {activeTab === 0 ? (top3[1] ? formatCurrency(top3[1].revenue) : '-') :
               activeTab === 1 ? (top3[1]?.dealsClosed || '-') :
               (top3[1] ? `${top3[1].conversionRate.toFixed(1)}%` : '-')}
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: '#C0C0C0',
            color: 'common.white',
            width: '100%',
            py: 1,
            borderRadius: '0 0 12px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxShadow: 3
          }}>
            <FiMedal size={20} />
            <Typography variant="subtitle2">2nd</Typography>
          </Box>
        </Box>
        
        {/* First Place */}
        <Box sx={{
          width: { xs: 120, md: 160 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '100%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}>
          <Box sx={{
            bgcolor: 'background.paper',
            borderRadius: '12px 12px 0 0',
            p: 2,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            border: '1px solid',
            borderColor: 'divider',
            borderBottom: 'none',
            boxShadow: 6,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: '#FFD700'
            }
          }}>
            <Box sx={{
              width: { xs: 72, md: 88 },
              height: { xs: 72, md: 88 },
              borderRadius: '50%',
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              border: '3px solid #FFD700',
              boxShadow: 3
            }}>
              {top3[0] ? (
                <Avatar 
                  src={top3[0].avatar}
                  sx={{ width: '100%', height: '100%' }}
                >
                  {top3[0]?.name?.charAt(0) || '1'}
                </Avatar>
              ) : (
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: '50%',
                  color: 'text.secondary'
                }}>
                  <FiUser size={28} />
                </Box>
              )}
            </Box>
            <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              {top3[0]?.name || 'Not Available'}
            </Typography>
            <Typography variant={isMobile ? 'body2' : 'body1'} sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {activeTab === 0 ? (top3[0] ? formatCurrency(top3[0].revenue) : '-') :
               activeTab === 1 ? (top3[0]?.dealsClosed || '-') :
               (top3[0] ? `${top3[0].conversionRate.toFixed(1)}%` : '-')}
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: '#FFD700',
            color: 'common.white',
            width: '100%',
            py: 1.5,
            borderRadius: '0 0 12px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxShadow: 3
          }}>
            <FiCrown size={24} />
            <Typography variant="subtitle1">1st</Typography>
          </Box>
        </Box>
        
        {/* Third Place */}
        <Box sx={{
          width: { xs: 100, md: 140 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height: '70%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}>
          <Box sx={{
            bgcolor: 'background.paper',
            borderRadius: '12px 12px 0 0',
            p: 2,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            border: '1px solid',
            borderColor: 'divider',
            borderBottom: 'none',
            boxShadow: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: '#CD7F32'
            }
          }}>
            <Box sx={{
              width: { xs: 56, md: 72 },
              height: { xs: 56, md: 72 },
              borderRadius: '50%',
              bgcolor: 'background.default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              border: '3px solid #CD7F32',
              boxShadow: 2
            }}>
              {top3[2] ? (
                <Avatar 
                  src={top3[2].avatar}
                  sx={{ width: '100%', height: '100%' }}
                >
                  {top3[2]?.name?.charAt(0) || '3'}
                </Avatar>
              ) : (
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'action.hover',
                  borderRadius: '50%',
                  color: 'text.secondary'
                }}>
                  <FiUser size={24} />
                </Box>
              )}
            </Box>
            <Typography variant={isMobile ? 'body2' : 'body1'} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
              {top3[2]?.name || 'Not Available'}
            </Typography>
            <Typography variant={isMobile ? 'caption' : 'body2'} sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {activeTab === 0 ? (top3[2] ? formatCurrency(top3[2].revenue) : '-') :
               activeTab === 1 ? (top3[2]?.dealsClosed || '-') :
               (top3[2] ? `${top3[2].conversionRate.toFixed(1)}%` : '-')}
            </Typography>
          </Box>
          <Box sx={{
            bgcolor: '#CD7F32',
            color: 'common.white',
            width: '100%',
            py: 1,
            borderRadius: '0 0 12px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            boxShadow: 3
          }}>
            <FiMedal size={20} />
            <Typography variant="subtitle2">3rd</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderCurrentUserStats = () => {
    if (!currentUserStats) return null;
    
    return (
      <Paper elevation={0} sx={{
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Your Performance
          </Typography>
          <Chip 
            label={`Rank #${currentUserStats.rank}`}
            size="small"
            icon={<FiAward size={14} />}
            sx={{ 
              bgcolor: getRankColor(currentUserStats.rank),
              color: currentUserStats.rank <= 3 ? 'white' : 'text.primary',
              fontWeight: 'bold'
            }}
          />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              height: '100%'
            }}>
              <Avatar 
                src={currentUserStats.avatar}
                sx={{ 
                  width: 60, 
                  height: 60,
                  border: `2px solid ${getRankColor(currentUserStats.rank)}`
                }}
              >
                {currentUserStats.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {currentUserStats.name}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mt: 0.5
                }}>
                  <Box sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: getRankColor(currentUserStats.rank),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: currentUserStats.rank <= 3 ? 'white' : 'inherit'
                  }}>
                    {getRankIcon(currentUserStats.rank)}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {currentUserStats.role}
                  </Typography>
                </Box>
                {currentUserStats.skills.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentUserStats.skills.slice(0, 3).map((skill, index) => (
                      <Chip 
                        key={index}
                        label={skill}
                        size="small"
                        sx={{ 
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: 'action.selected'
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: '8px', 
                  bgcolor: 'rgba(56, 182, 255, 0.1)',
                  border: '1px solid rgba(56, 182, 255, 0.2)',
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FiDollarSign size={16} color="#0891b2" />
                    <Typography variant="body2" sx={{ color: '#0891b2', fontWeight: 'medium' }}>
                      Revenue
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(currentUserStats.revenue)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((currentUserStats.revenue / (topPerformers[0]?.revenue || 1)) * 100, 100)}
                    sx={{
                      height: 6,
                      mt: 1.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(56, 182, 255, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#0891b2'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 0.5,
                    color: 'text.secondary',
                    textAlign: 'right'
                  }}>
                    {topPerformers[0] ? `${Math.round((currentUserStats.revenue / topPerformers[0].revenue) * 100)}% of top` : '-'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: '8px', 
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FiCheckCircle size={16} color="#059669" />
                    <Typography variant="body2" sx={{ color: '#059669', fontWeight: 'medium' }}>
                      Deals Closed
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {currentUserStats.dealsClosed}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((currentUserStats.dealsClosed / (topPerformers[0]?.dealsClosed || 1)) * 100, 100)}
                    sx={{
                      height: 6,
                      mt: 1.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#059669'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 0.5,
                    color: 'text.secondary',
                    textAlign: 'right'
                  }}>
                    {topPerformers[0] ? `${Math.round((currentUserStats.dealsClosed / topPerformers[0].dealsClosed) * 100)}% of top` : '-'}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: '8px', 
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FiTrendingUp size={16} color="#b45309" />
                    <Typography variant="body2" sx={{ color: '#b45309', fontWeight: 'medium' }}>
                      Conversion
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {currentUserStats.conversionRate.toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={currentUserStats.conversionRate}
                    sx={{
                      height: 6,
                      mt: 1.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: currentUserStats.conversionRate > 50 ? '#b45309' : '#dc2626'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 0.5,
                    color: currentUserStats.conversionRate > 50 ? 'success.main' : 'error.main',
                    textAlign: 'right'
                  }}>
                    {currentUserStats.conversionRate > 50 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <FiTrendingUp size={14} /> +{currentUserStats.conversionRate.toFixed(1)}%
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <FiTrendingDown size={14} /> {currentUserStats.conversionRate.toFixed(1)}%
                      </Box>
                    )}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Paper sx={{ 
                  p: 2, 
                  borderRadius: '8px', 
                  bgcolor: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <FiBarChart2 size={16} color="#7c3aed" />
                    <Typography variant="body2" sx={{ color: '#7c3aed', fontWeight: 'medium' }}>
                      Total Leads
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {currentUserStats.dealsTotal}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((currentUserStats.dealsTotal / (topPerformers[0]?.dealsTotal || 1)) * 100, 100)}
                    sx={{
                      height: 6,
                      mt: 1.5,
                      borderRadius: 3,
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        backgroundColor: '#7c3aed'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ 
                    display: 'block', 
                    mt: 0.5,
                    color: 'text.secondary',
                    textAlign: 'right'
                  }}>
                    {currentUserStats.dealsClosed} closed
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderMobileStatsButton = () => {
    if (!isMobile || !currentUserStats) return null;
    
    return (
      <Box sx={{ mb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          endIcon={<FiChevronRight />}
          onClick={() => setMobileStatsOpen(true)}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            borderColor: 'divider',
            textTransform: 'none',
            justifyContent: 'space-between',
            backgroundColor: 'background.paper',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={currentUserStats.avatar}
              sx={{ 
                width: 40, 
                height: 40,
                border: `2px solid ${getRankColor(currentUserStats.rank)}`
              }}
            >
              {currentUserStats.name.charAt(0)}
            </Avatar>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Your Performance
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: getRankColor(currentUserStats.rank),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentUserStats.rank <= 3 ? 'white' : 'inherit',
                  fontSize: '0.75rem'
                }}>
                  {currentUserStats.rank}
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {activeTab === 0 ? formatCurrency(currentUserStats.revenue) :
                   activeTab === 1 ? `${currentUserStats.dealsClosed} deals` :
                   `${currentUserStats.conversionRate.toFixed(1)}%`}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Button>
      </Box>
    );
  };

  const renderMobileStatsDialog = () => {
    if (!isMobile) return null;
    
    return (
      <Dialog
        fullScreen
        open={mobileStatsOpen}
        onClose={() => setMobileStatsOpen(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Your Performance
            </Typography>
            <Chip 
              label={`Rank #${currentUserStats.rank}`}
              size="small"
              icon={<FiAward size={14} />}
              sx={{ 
                bgcolor: getRankColor(currentUserStats.rank),
                color: currentUserStats.rank <= 3 ? 'white' : 'text.primary',
                fontWeight: 'bold'
              }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderCurrentUserStats()}
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Button 
            onClick={() => setMobileStatsOpen(false)}
            sx={{ 
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderLeaderboardTable = () => {
    return (
      <Paper elevation={0} sx={{
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
      }}>
        <Box sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Full Leaderboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh data">
              <IconButton 
                size="small"
                onClick={fetchSalesPerformance}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: 'action.hover'
                }}
              >
                <FiRefreshCw size={16} />
              </IconButton>
            </Tooltip>
            <TextField
              size="small"
              placeholder="Search sales rep..."
              InputProps={{
                startAdornment: <FiSearch style={{ marginRight: 8, color: theme.palette.text.secondary }} />
              }}
              sx={{
                width: 200,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: 'background.paper'
                }
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Box>
        </Box>
        
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: 600 }}>
            <Box sx={{
              display: 'flex',
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'action.hover'
            }}>
              <Box sx={{ 
                width: 60, 
                p: 2, 
                fontWeight: 'bold', 
                color: 'text.secondary',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Rank
              </Box>
              <Box sx={{ 
                flex: 2, 
                p: 2, 
                fontWeight: 'bold', 
                color: 'text.secondary',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Sales Rep
              </Box>
              <Box sx={{ 
                flex: 1, 
                p: 2, 
                fontWeight: 'bold', 
                color: 'text.secondary',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'right'
              }}>
                Revenue
              </Box>
              <Box sx={{ 
                flex: 1, 
                p: 2, 
                fontWeight: 'bold', 
                color: 'text.secondary',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'right'
              }}>
                Deals Closed
              </Box>
              <Box sx={{ 
                flex: 1, 
                p: 2, 
                fontWeight: 'bold', 
                color: 'text.secondary',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                textAlign: 'right'
              }}>
                Conversion
              </Box>
            </Box>
            
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredPerformers.length > 0 ? (
              filteredPerformers.map((performer) => (
                <Box 
                  key={performer.id}
                  sx={{
                    display: 'flex',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: performer.id === currentUserId ? 'rgba(99, 102, 241, 0.05)' : 'inherit',
                    '&:hover': { 
                      backgroundColor: performer.id === currentUserId ? 'rgba(99, 102, 241, 0.08)' : 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ 
                    width: 60, 
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Box sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: getRankColor(performer.rank),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: performer.rank <= 3 ? 'white' : 'inherit',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      border: performer.rank <= 3 ? '2px solid white' : 'none',
                      boxShadow: performer.rank <= 3 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}>
                      {performer.rank <= 3 ? getRankIcon(performer.rank) : performer.rank}
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 2, 
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Avatar 
                      src={performer.avatar}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        border: `2px solid ${getRankColor(performer.rank)}`
                      }}
                    >
                      {performer.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {performer.name}
                        {performer.id === currentUserId && (
                          <Chip 
                            label="You"
                            size="small"
                            sx={{ 
                              ml: 1,
                              height: 20,
                              fontSize: '0.65rem',
                              bgcolor: 'primary.light',
                              color: 'primary.dark'
                            }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}>
                        <FiAperture size={12} />
                        {performer.role}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1, 
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(performer.revenue)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((performer.revenue / (topPerformers[0]?.revenue || 1)) * 100, 100)}
                      sx={{
                        height: 4,
                        mt: 1,
                        width: '80%',
                        borderRadius: 2,
                        backgroundColor: 'rgba(56, 182, 255, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          backgroundColor: '#0891b2'
                        }
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1, 
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {performer.dealsClosed}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        / {performer.dealsTotal}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((performer.dealsClosed / (topPerformers[0]?.dealsClosed || 1)) * 100, 100)}
                      sx={{
                        height: 4,
                        mt: 1,
                        width: '80%',
                        borderRadius: 2,
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          backgroundColor: '#059669'
                        }
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1, 
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 'medium',
                        color: performer.conversionRate > 50 ? 'success.main' : 'error.main'
                      }}>
                        {performer.conversionRate.toFixed(1)}%
                      </Typography>
                      {performer.conversionRate > 50 ? (
                        <FiTrendingUp color={theme.palette.success.main} size={16} />
                      ) : (
                        <FiTrendingDown color={theme.palette.error.main} size={16} />
                      )}
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={performer.conversionRate}
                      sx={{
                        height: 4,
                        mt: 1,
                        width: '80%',
                        borderRadius: 2,
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 2,
                          backgroundColor: performer.conversionRate > 50 ? '#b45309' : '#dc2626'
                        }
                      }}
                    />
                  </Box>
                </Box>
              ))
            ) : (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}>
                <FiSearch size={32} color={theme.palette.text.disabled} />
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  No matching sales reps found
                </Typography>
                <Button 
                  variant="text"
                  onClick={() => setSearchQuery('')}
                  sx={{ textTransform: 'none' }}
                >
                  Clear search
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  return (
    <Box sx={{ 
      p: isMobile ? 2 : 3,
      maxWidth: '100%',
      overflow: 'hidden',
      marginTop:'50px'
    }}>
      {/* Header */}
      <Box sx={{ 
        mb: 3, 
        mt: isMobile ? 2 : 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>
          Sales Leaderboard
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'text.secondary',
          maxWidth: '600px'
        }}>
          Track performance metrics and celebrate top performers across your sales team
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Paper elevation={0} sx={{ 
        mb: 3,
        borderRadius: '12px',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        p: 1
      }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3,
              borderRadius: '4px 4px 0 0'
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 'medium',
                minHeight: 48,
                borderRadius: '8px',
                '&.Mui-selected': {
                  color: 'primary.main'
                },
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            />
          ))}
        </Tabs>
      </Paper>
      
      {/* Mobile Stats Button */}
      {renderMobileStatsButton()}
      
      {/* Current User Stats (Desktop) */}
      {!isMobile && renderCurrentUserStats()}
      
      {/* Trophy Stage */}
      {renderTrophyStage()}
      
      {/* Leaderboard Table */}
      {renderLeaderboardTable()}
      
      {/* Mobile Stats Dialog */}
      {renderMobileStatsDialog()}
    </Box>
  );
};

export default SalesLeaderboard;