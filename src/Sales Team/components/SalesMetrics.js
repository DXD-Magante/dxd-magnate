import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, LinearProgress, 
  Divider, Chip, Table, TableBody, TableCell, 
  TableHead, TableRow, Select, MenuItem, 
  FormControl, InputLabel, Button, CircularProgress, 
  TableContainer, Modal, IconButton
} from "@mui/material";
import { 
  FiTrendingUp, FiTrendingDown, FiDollarSign, 
  FiBarChart2, FiPieChart, FiDownload, 
  FiFilter, FiCalendar, FiRefreshCw, FiX,
  FiChevronUp, FiChevronDown
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const SalesMetrics = () => {
  const [timeRange, setTimeRange] = useState('last_quarter');
  const [isLoading, setIsLoading] = useState(true);
  const [metricsData, setMetricsData] = useState({
    revenue: { current: 0, target: 0, trend: 'up', change: 0 },
    deals: { won: 0, lost: 0, conversion: 0 },
    activities: { completed: 0, pending: 0 },
    performance: [],
    topPerformers: []
  });
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthDetails, setMonthDetails] = useState(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const now = new Date();
        const currentTargetMonth = now.toLocaleString('default', { month: 'long' });
        const currentYear = now.getFullYear().toString();
        
        const targetQuery = query(
          collection(db, 'monthly-target'),
          where('department', '==', 'sales'),
          where('month', '==', currentTargetMonth),
          where('year', '==', currentYear)
        );
        
        const targetSnapshot = await getDocs(targetQuery);
        let monthlyTarget = 50000; // Default value if no target is found
        
        if (!targetSnapshot.empty) {
          targetSnapshot.forEach(doc => {
            monthlyTarget = parseInt(doc.data().target || 50000);
          });
        }

        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', userId)
        );
        
        const activitiesQuery = query(
          collection(db, 'sales-activities'),
          where('assignedTo', '==', userId)
        );

        const [leadsSnapshot, activitiesSnapshot] = await Promise.all([
          getDocs(leadsQuery),
          getDocs(activitiesQuery)
        ]);

        // Process leads data
        let totalRevenue = 0;
        let wonDeals = 0;
        let lostDeals = 0;
        const monthlyRevenue = Array(12).fill(0);
        const currentMonth = new Date().getMonth();
        const dailyRevenueData = {}; // To store daily data for each month

        leadsSnapshot.forEach(doc => {
          const lead = doc.data();
          const budget = parseInt(lead.budget || 0);
          
          if (lead.status === 'closed-won') {
            totalRevenue += budget;
            wonDeals++;
          } else if (lead.status === 'closed-lost') {
            lostDeals++;
          }

          if (lead.createdAt) {
            const date = lead.createdAt.toDate();
            const month = date.getMonth();
            const day = date.getDate();
            monthlyRevenue[month] += budget;
            
            // Initialize month data if not exists
            const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
            if (!dailyRevenueData[monthName]) {
              dailyRevenueData[monthName] = Array(31).fill(0); // Max 31 days in a month
            }
            dailyRevenueData[monthName][day - 1] += budget; // days are 1-indexed
          }
        });

        // Process activities data
        let completedActivities = 0;
        let pendingActivities = 0;

        activitiesSnapshot.forEach(doc => {
          const activity = doc.data();
          if (activity.status === 'completed') {
            completedActivities++;
          } else {
            pendingActivities++;
          }
        });

        // Calculate conversion rate
        const conversionRate = wonDeals + lostDeals > 0 ? 
          (wonDeals / (wonDeals + lostDeals)) * 100 : 0;

        // Prepare performance data (last 6 months)
        const performanceData = [];
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = monthNames[monthIndex];
          performanceData.push({
            month: monthName,
            revenue: monthlyRevenue[monthIndex],
            target: monthlyRevenue[monthIndex] * 1.2, // Example target calculation
            dailyData: dailyRevenueData[monthName] || Array(31).fill(0)
          });
        }

        setMetricsData({
          revenue: {
            current: totalRevenue,
            target: monthlyTarget,
            trend: 'up',
            change: 12.5
          },
          deals: {
            won: wonDeals,
            lost: lostDeals,
            conversion: conversionRate
          },
          activities: {
            completed: completedActivities,
            pending: pendingActivities
          },
          performance: performanceData,
          topPerformers: []
        });

      } catch (error) {
        console.error("Error fetching metrics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, userId]);

  const handleMonthClick = (monthData) => {
    setSelectedMonth(monthData);
    setMonthDetails({
      ...monthData,
      weekData: generateWeekData(monthData.dailyData)
    });
  };

  const generateWeekData = (dailyData) => {
    const weeks = [];
    for (let i = 0; i < dailyData.length; i += 7) {
      const weekDays = dailyData.slice(i, i + 7);
      weeks.push({
        total: weekDays.reduce((sum, val) => sum + val, 0),
        days: weekDays
      });
    }
    return weeks;
  };

  const handleExport = () => {
    const exportData = {
      Revenue: [
        ['Metric', 'Value'],
        ['Current Revenue', `₹${(metricsData.revenue.current / 1000).toFixed(1)}k`],
        ['Target Revenue', `₹${(metricsData.revenue.target / 1000).toFixed(1)}k`],
        ['Progress', `${revenueProgress.toFixed(1)}%`],
        ['Change', `${metricsData.revenue.change}%`]
      ],
      Deals: [
        ['Metric', 'Value'],
        ['Won Deals', metricsData.deals.won],
        ['Lost Deals', metricsData.deals.lost],
        ['Conversion Rate', `${metricsData.deals.conversion.toFixed(1)}%`]
      ],
      Activities: [
        ['Metric', 'Value'],
        ['Completed Activities', metricsData.activities.completed],
        ['Pending Activities', metricsData.activities.pending],
        ['Completion Rate', `${(
          (metricsData.activities.completed / 
          (metricsData.activities.completed + metricsData.activities.pending || 1) * 100
        ).toFixed(1))}%`]
      ],
      'Revenue Trend': [
        ['Month', 'Actual Revenue', 'Target Revenue'],
        ...metricsData.performance.map(item => [
          item.month,
          `₹${(item.revenue / 1000).toFixed(1)}k`,
          `₹${(item.target / 1000).toFixed(1)}k`
        ])
      ]
    };
  
    const csvContent = Object.entries(exportData)
      .map(([sheetName, data]) => {
        const csvRows = data.map(row => 
          row.map(field => `"${field}"`).join(',')
        ).join('\n');
        return `"${sheetName}"\n${csvRows}\n\n`;
      })
      .join('');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Sales_Metrics_Report.csv');
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setTimeRange(timeRange);
  };

  const revenueProgress = metricsData.revenue.target > 0 ? 
    Math.min((metricsData.revenue.current / metricsData.revenue.target) * 100, 100) : 0;

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with filters */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Sales Metrics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
              startAdornment={<FiCalendar style={{ marginRight: 8 }} />}
            >
              <MenuItem value="last_week">Last Week</MenuItem>
              <MenuItem value="last_month">Last Month</MenuItem>
              <MenuItem value="last_quarter">Last Quarter</MenuItem>
              <MenuItem value="last_year">Last Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<FiRefreshCw />}
            onClick={handleRefresh}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<FiDownload />}
            onClick={handleExport}
            sx={{ 
              textTransform: 'none',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            Export as CSV
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            height: '100%'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                p: 1,
                mr: 2,
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                color: '#16a34a'
              }}>
                <FiDollarSign size={20} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Revenue
              </Typography>
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              ₹{(metricsData.revenue.current / 1000).toFixed(1)}k
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Chip 
                label={`${metricsData.revenue.change}%`} 
                size="small"
                icon={<FiTrendingUp size={14} />}
                sx={{ 
                  mr: 1,
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a'
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                vs. previous period
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={revenueProgress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                mb: 1,
                backgroundColor: '#e0e7ff',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4f46e5'
                }
              }} 
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Target: ₹{(metricsData.revenue.target / 1000).toFixed(1)}k
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {revenueProgress.toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Deals Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            height: '100%'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                p: 1,
                mr: 2,
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                color: '#2563eb'
              }}>
                <FiBarChart2 size={20} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Deals
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {metricsData.deals.won}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Won
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {metricsData.deals.lost}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Lost
                </Typography>
              </Box>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={metricsData.deals.conversion} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                mb: 1,
                backgroundColor: '#e0e7ff',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4f46e5'
                }
              }} 
            />
            
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Conversion Rate: {metricsData.deals.conversion.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>
        
        {/* Activities Card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            height: '100%'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                p: 1,
                mr: 2,
                borderRadius: '50%',
                backgroundColor: '#f5f3ff',
                color: '#7c3aed'
              }}>
                <FiPieChart size={20} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Activities
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {metricsData.activities.completed}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Completed
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {metricsData.activities.pending}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Pending
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              height: 8, 
              borderRadius: 4,
              mb: 1,
              backgroundColor: '#e0e7ff',
              display: 'flex'
            }}>
              <Box sx={{ 
                width: `${(metricsData.activities.completed / (metricsData.activities.completed + metricsData.activities.pending || 1)) * 100}%`,
                backgroundColor: '#4f46e5',
                borderRadius: '4px 0 0 4px'
              }} />
              <Box sx={{ 
                width: `${(metricsData.activities.pending / (metricsData.activities.completed + metricsData.activities.pending || 1)) * 100}%`,
                backgroundColor: '#c7d2fe',
                borderRadius: '0 4px 4px 0'
              }} />
            </Box>
            
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Completion Rate: {(
                (metricsData.activities.completed / 
                (metricsData.activities.completed + metricsData.activities.pending || 1) * 100
              ).toFixed(1))}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 4 }} />
      
      {/* Revenue Trend Chart */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 4,
        borderRadius: 2,
        border: '1px solid #e2e8f0'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Revenue Trend (Last 6 Months)
        </Typography>
        
        <Box sx={{ height: 300 }}>
          <Box sx={{ 
            display: 'flex', 
            height: '100%',
            alignItems: 'flex-end',
            gap: 2
          }}>
            {metricsData.performance.map((item, index) => {
              const maxValue = Math.max(...metricsData.performance.map(p => p.target));
              const actualHeight = (item.revenue / maxValue) * 70;
              const targetHeight = (item.target / maxValue) * 70;
              
              return (
                <Box 
                  key={index} 
                  sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}
                  onClick={() => handleMonthClick(item)}
                >
                  <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end'
                  }}>
                    {/* Target bar */}
                    <Box sx={{
                      height: `${targetHeight}%`,
                      backgroundColor: '#e0e7ff',
                      borderRadius: '4px 4px 0 0',
                      mb: 0.5,
                      transition: 'height 0.3s ease'
                    }} />
                    
                    {/* Actual bar */}
                    <Box sx={{
                      height: `${actualHeight}%`,
                      backgroundColor: '#4f46e5',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }} />
                  </Box>
                  
                  <Typography variant="caption" sx={{ 
                    textAlign: 'center', 
                    mt: 1,
                    color: '#64748b'
                  }}>
                    {item.month}
                  </Typography>
                  
                  <Typography variant="caption" sx={{ 
                    textAlign: 'center',
                    color: '#4f46e5',
                    fontWeight: 'bold'
                  }}>
                    ₹{(item.revenue / 1000).toFixed(1)}k
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 3,
            mt: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: '#4f46e5',
                borderRadius: 2
              }} />
              <Typography variant="caption">Actual Revenue</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: '#e0e7ff',
                borderRadius: 2
              }} />
              <Typography variant="caption">Revenue Target</Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Recent Activities Table */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        borderRadius: 2,
        border: '1px solid #e2e8f0'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Recent Activities
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell>Follow-up</TableCell>
                <TableCell>SNS Infotech</TableCell>
                <TableCell>
                  <Chip 
                    label="Completed" 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      fontWeight: 'bold'
                    }} 
                  />
                </TableCell>
                <TableCell align="right">Apr 5, 2025</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Month Details Modal */}
 {/* Month Details Modal */}
<Modal
  open={Boolean(selectedMonth)}
  onClose={() => setSelectedMonth(null)}
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)'
  }}
>
  <Paper sx={{
    width: '80%',
    maxWidth: 900,
    maxHeight: '90vh',
    overflow: 'auto',
    p: 4,
    borderRadius: 3,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: 'none',
    position: 'relative'
  }}>
    <IconButton
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
        color: '#64748b'
      }}
      onClick={() => setSelectedMonth(null)}
    >
      <FiX size={24} />
    </IconButton>
    
    <Typography variant="h5" sx={{ 
      fontWeight: 'bold', 
      mb: 2,
      color: '#1e293b'
    }}>
      {selectedMonth?.month} Revenue Breakdown
    </Typography>
    
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4
    }}>
      <Box>
        <Typography variant="subtitle1" sx={{ color: '#64748b' }}>
          Total Revenue
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          ₹{(selectedMonth?.revenue / 1000).toFixed(1)}k
        </Typography>
      </Box>
      
      <Box sx={{ 
        backgroundColor: '#f1f5f9',
        borderRadius: 2,
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <FiDollarSign size={18} color="#64748b" />
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Target: ₹{(selectedMonth?.target / 1000).toFixed(1)}k
        </Typography>
      </Box>
    </Box>
    
    <Divider sx={{ my: 3 }} />
    
    <Typography variant="h6" sx={{ 
      fontWeight: 'bold', 
      mb: 3,
      color: '#1e293b'
    }}>
      Daily Revenue Performance
    </Typography>
    
    <Box sx={{ height: 400 }}>
      <Box sx={{ 
        display: 'flex',
        height: '100%',
        alignItems: 'flex-end',
        gap: 1
      }}>
        {selectedMonth?.dailyData?.map((day, index) => {
          const maxValue = Math.max(...selectedMonth.dailyData);
          const height = maxValue > 0 ? (day / maxValue) * 100 : 0;
          
          return (
            <Box 
              key={index} 
              sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scaleY(1.05)'
                }
              }}
            >
              <Box sx={{
                height: `${height}%`,
                backgroundColor: day > 0 ? '#4f46e5' : '#e2e8f0',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease, background-color 0.3s ease'
              }} />
              <Typography variant="caption" sx={{ 
                textAlign: 'center',
                fontSize: '0.6rem',
                color: '#64748b',
                mt: 0.5
              }}>
                {index + 1}
              </Typography>
              {day > 0 && (
                <Typography variant="caption" sx={{ 
                  textAlign: 'center',
                  fontSize: '0.6rem',
                  color: '#4f46e5',
                  fontWeight: 'bold'
                }}>
                  ₹{(day / 1000).toFixed(1)}k
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  </Paper>
</Modal>
    </Box>
  );
};

export default SalesMetrics;