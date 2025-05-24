import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Avatar, Chip, 
  LinearProgress, Table, TableBody, 
  TableCell, TableContainer, TableHead, 
  TableRow, Tabs, Tab, Divider, Tooltip,
  IconButton, CircularProgress
} from '@mui/material';
import { 
  FiAward, FiTrendingUp, FiCheckCircle, 
  FiUser, FiBarChart2, FiDollarSign,
  FiFilter, FiRefreshCw, FiChevronUp, FiChevronDown, FiTrendingDown
} from 'react-icons/fi';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, limit, updateDoc, doc } from 'firebase/firestore';

const SalesLeaderboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'revenue',
    direction: 'desc'
  });

  const tabs = [
    { label: 'Revenue Leaders', icon: <FiDollarSign /> },
    { label: 'Deal Closers', icon: <FiCheckCircle /> },
    { label: 'Conversion Rate', icon: <FiTrendingUp /> }
  ];

  const metrics = [
    { key: 'revenue', label: 'Revenue', icon: <FiDollarSign /> },
    { key: 'dealsClosed', label: 'Deals Closed', icon: <FiCheckCircle /> },
    { key: 'conversionRate', label: 'Conversion Rate', icon: <FiTrendingUp /> }
  ];

  const updateUserRanks = async (performers) => {
    try {
      const batchUpdates = performers.map((performer, index) => {
        const userRef = doc(db, 'users', performer.id);
        return updateDoc(userRef, {
          rank: index + 1,
          lastRankUpdate: new Date()
        });
      });
      
      await Promise.all(batchUpdates);
    } catch (error) {
      console.error('Error updating user ranks:', error);
    }
  };

  const calculateRanks = (data, key) => {
    if (data.length === 0) return data;
    
    // Sort the data by the specified key
    const sorted = [...data].sort((a, b) => b[key] - a[key]);
    
    // Assign ranks with tie handling
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i][key] < sorted[i - 1][key]) {
        currentRank = i + 1;
      }
      sorted[i].rank = currentRank;
    }
    
    return sorted;
  };


 useEffect(() => {
    const fetchSalesPerformance = async () => {
      try {
        setLoading(true);
        
        // First get all sales team members
        const usersRef = collection(db, 'users');
        const salesQuery = query(
          usersRef, 
          where('role', '==', 'sales'),
          limit(10)
        );
        
        const salesSnapshot = await getDocs(salesQuery);
        const performers = [];
        
        // For each sales rep, query their leads to calculate metrics
        for (const salesDoc of salesSnapshot.docs) {
          const userData = salesDoc.data();
          const userId = salesDoc.id;
          
          // Query all leads assigned to this sales rep
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
            
            // Count all leads as total deals
            dealsTotal++;
            
            // Only count closed-won for revenue and deals closed
            if (lead.status === 'closed-won') {
              totalRevenue += budget;
              dealsClosed++;
            }
          });
          
          // Avoid division by zero for conversion rate
          const conversionRate = dealsTotal > 0 ? (dealsClosed / dealsTotal) * 100 : 0;
          
          performers.push({
            id: userId,
            name: userData.displayName || `${userData.firstName} ${userData.lastName}`,
            avatar: userData.photoURL,
            revenue: totalRevenue,
            dealsClosed: dealsClosed,
            dealsTotal: dealsTotal,
            conversionRate: conversionRate,
            role: userData.role
          });
        }
        
        // Determine sort field based on active tab
        let sortField;
        switch(activeTab) {
          case 0: sortField = 'revenue'; break;
          case 1: sortField = 'dealsClosed'; break;
          case 2: sortField = 'conversionRate'; break;
          default: sortField = 'revenue';
        }
        
        // Calculate ranks with tie handling
        const rankedPerformers = calculateRanks(performers, sortField);
        
        // Update state with ranked performers
        setTopPerformers(rankedPerformers);
        
        // Update ranks in Firestore
        await updateUserRanks(rankedPerformers);
      } catch (error) {
        console.error('Error fetching sales performance:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSalesPerformance();
  }, [activeTab]);

  const handleSort = async (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
    
    // Sort the performers array with tie handling
    const sortedPerformers = calculateRanks([...topPerformers], key);
    
    if (direction === 'asc') {
      sortedPerformers.reverse();
      // Re-rank after reverse
      sortedPerformers.forEach((performer, index) => {
        performer.rank = index + 1;
      });
    }
    
    setTopPerformers(sortedPerformers);
    
    // Update ranks in Firestore
    await updateUserRanks(sortedPerformers);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
      case 2: return 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)';
      case 3: return 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)';
      default: return '#f8fafc';
    }
  };

  return (
    <Paper elevation={0} sx={{ 
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      height: '100%'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 3,
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        marginTop:'60px'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            p: 1.5,
            mr: 2,
            borderRadius: '50%',
            backgroundColor: '#4f46e5',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiAward size={20} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Sales Leaderboard
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" sx={{ color: '#64748b' }}>
            <FiRefreshCw size={16} />
          </IconButton>
          <IconButton size="small" sx={{ color: '#64748b' }}>
            <FiFilter size={16} />
          </IconButton>
        </Box>
      </Box>
      
      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: '#4f46e5',
            height: 3
          },
          borderBottom: '1px solid #e2e8f0'
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
              '&.Mui-selected': {
                color: '#4f46e5'
              }
            }}
          />
        ))}
      </Tabs>
      
      {/* Table Header */}
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ width: '50px', fontWeight: 'bold', color: '#64748b' }}>Rank</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Sales Rep</TableCell>
              {metrics.map((metric) => (
                <TableCell 
                  key={metric.key}
                  align="right"
                  sx={{ 
                    fontWeight: 'bold', 
                    color: '#64748b',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f1f5f9'
                    }
                  }}
                  onClick={() => handleSort(metric.key)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {metric.icon}
                    <Box component="span" sx={{ ml: 1 }}>{metric.label}</Box>
                    {sortConfig.key === metric.key && (
                      sortConfig.direction === 'asc' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          {/* Table Body */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : topPerformers.length > 0 ? (
              topPerformers.map((performer, index) => (
                <TableRow 
                  key={performer.id}
                  hover
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    '&:hover': { backgroundColor: '#f8fafc' }
                  }}
                >
                  <TableCell>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: getRankColor(index + 1),
                      color: index < 3 ? 'white' : '#1e293b',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      {index + 1}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={performer.avatar}
                        sx={{ width: 36, height: 36 }}
                      >
                        {performer.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {performer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {performer.role}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(performer.revenue)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((performer.revenue / (topPerformers[0]?.revenue || 1)) * 100, 100)}
                      sx={{
                        height: 4,
                        mt: 1,
                        borderRadius: 2,
                        backgroundColor: '#e0e7ff',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#4f46e5'
                        }
                      }}
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {performer.dealsClosed}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((performer.dealsClosed / (topPerformers[0]?.dealsClosed || 1)) * 100, 100)}
                      sx={{
                        height: 4,
                        mt: 1,
                        borderRadius: 2,
                        backgroundColor: '#e0e7ff',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#10b981'
                        }
                      }}
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 1 }}>
                        {performer.conversionRate.toFixed(1)}%
                      </Typography>
                      {performer.conversionRate > 50 ? (
                        <FiTrendingUp color="#10b981" />
                      ) : (
                        <FiTrendingDown color="#ef4444" />
                      )}
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={performer.conversionRate}
                      sx={{
                        height: 4,
                        mt: 1,
                        borderRadius: 2,
                        backgroundColor: '#e0e7ff',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: performer.conversionRate > 50 ? '#10b981' : '#ef4444'
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No performance data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Footer */}
      <Box sx={{
        p: 2,
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Updated just now
        </Typography>
        <Typography variant="caption" sx={{ color: '#4f46e5', fontWeight: 'medium' }}>
          View Full Leaderboard
        </Typography>
      </Box>
    </Paper>
  );
};

export default SalesLeaderboard;