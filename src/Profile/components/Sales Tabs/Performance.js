import React, { useEffect, useState } from "react";
import { 
  Card, CardContent, Typography, Box, Grid, Paper, 
  LinearProgress, Button, FormControl, InputLabel, 
  Select, MenuItem, Chip, CircularProgress,
  Divider, Avatar, Stack,
  Tooltip as MuiTooltip, List, ListItem, ListItemAvatar, ListItemText, 
} from "@mui/material";
import { 
  FiDollarSign, FiTrendingUp, FiClock, FiDownload,
  FiBarChart2, FiPieChart, FiRefreshCw, FiCalendar,
  FiUser, FiCheckCircle, FiXCircle, FiDroplet,
  FiLayers, FiTarget, FiAward, FiDatabase,
  FiArrowRight, FiAlertCircle, FiBarChart, FiFileText
} from "react-icons/fi";
import { auth, db } from "../../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, RadialBarChart, RadialBar,
  ComposedChart, Line
} from 'recharts';

const PerformanceTab = () => {
  const [performanceData, setPerformanceData] = useState({
    revenue: { current: 0, target: 0 },
    conversionRate: 0,
    totalLeads: 0,
    convertedLeads: 0,
    avgDealCycle: 0,
    leadStatus: [],
    monthlyTrends: [],
    dealSizeDistribution: []
  });
  const [pipelineStats, setPipelineStats] = useState({
    totalValue: 0,
    avgDealSize: 0,
    winRate: 0,
    hotLeads: 0,
    stuckDeals: 0,
    daysInPipeline: 0
  });
  const [stageAnalysis, setStageAnalysis] = useState([]);
  const [timeRange, setTimeRange] = useState('last_quarter');
  const [loading, setLoading] = useState(true);

  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];
  const STAGE_COLORS = {
    'new': '#4f46e5',
    'contacted': '#6366f1',
    'proposal-sent': '#818cf8',
    'negotiation': '#a5b4fc',
    'closed-won': '#10b981',
    'closed-lost': '#ef4444'
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Fetch current month's target
        const now = new Date();
        const currentMonth = now.toLocaleString('default', { month: 'long' });
        const currentYear = now.getFullYear().toString();

        const targetQuery = query(
          collection(db, 'monthly-target'),
          where('department', '==', 'sales'),
          where('month', '==', currentMonth),
          where('year', '==', currentYear)
        );
        
        const targetSnapshot = await getDocs(targetQuery);
        let monthlyTarget = 50000; // Default value if no target is found
        
        if (!targetSnapshot.empty) {
          targetSnapshot.forEach(doc => {
            monthlyTarget = parseInt(doc.data().target || 50000);
          });
        }

        // Fetch leads data
        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid)
        );
        const leadsSnapshot = await getDocs(leadsQuery);

        let totalRevenue = 0;
        let wonDeals = 0;
        let lostDeals = 0;
        let totalDeals = 0;
        let totalSalesCycleDays = 0;
        let dealCount = 0;
        const monthlyTrends = Array(12).fill(0);
        
        // Pipeline analysis metrics
        let totalValue = 0;
        let hotLeads = 0;
        let stuckDeals = 0;
        let totalDaysInPipeline = 0;
        let activeDeals = 0;
        
        const leadStatusCount = {
          'new': 0,
          'contacted': 0,
          'proposal-sent': 0,
          'negotiation': 0,
          'closed-won': 0,
          'closed-lost': 0
        };
        
        const dealSizeRanges = {
          '0-10k': 0,
          '10k-50k': 0,
          '50k-100k': 0,
          '100k-500k': 0,
          '500k+': 0
        };

        leadsSnapshot.forEach((doc) => {
          const lead = doc.data();
          const budget = parseInt(lead.budget || 0);
          
          // Count lead statuses
          if (lead.status) {
            leadStatusCount[lead.status] = (leadStatusCount[lead.status] || 0) + 1;
          }

          // Calculate revenue from won deals
          if (lead.status === 'closed-won') {
            totalRevenue += budget;
            wonDeals++;
            totalDeals++;
            
            // Categorize deal size
            if (budget < 10000) dealSizeRanges['0-10k']++;
            else if (budget < 50000) dealSizeRanges['10k-50k']++;
            else if (budget < 100000) dealSizeRanges['50k-100k']++;
            else if (budget < 500000) dealSizeRanges['100k-500k']++;
            else dealSizeRanges['500k+']++;
          } else if (lead.status === 'closed-lost') {
            lostDeals++;
            totalDeals++;
          }

          // Calculate sales cycle (if we have created and expected close dates)
          if (lead.createdAt && lead.expectedCloseDate) {
            const createdDate = lead.createdAt.toDate();
            const closeDate = new Date(lead.expectedCloseDate);
            const days = Math.ceil((closeDate - createdDate) / (1000 * 60 * 60 * 24));
            totalSalesCycleDays += days;
            dealCount++;
          }

          // Pipeline analysis calculations
          if (lead.status && !['closed-won', 'closed-lost'].includes(lead.status)) {
            totalValue += budget;
            activeDeals++;
            
            // Calculate days in pipeline
            if (lead.createdAt) {
              const createdDate = lead.createdAt.toDate();
              const daysInPipeline = Math.ceil((new Date() - createdDate) / (1000 * 60 * 60 * 24));
              totalDaysInPipeline += daysInPipeline;
            }
          }

          // Count hot leads (recent and high priority)
          if (lead.priority === 'high' && 
              lead.createdAt && 
              new Date() - lead.createdAt.toDate() < 7 * 24 * 60 * 60 * 1000) {
            hotLeads++;
          }

          // Count stuck deals (in same stage for >30 days)
          if (lead.lastUpdated && 
              new Date() - lead.lastUpdated.toDate() > 30 * 24 * 60 * 60 * 1000 &&
              !['closed-won', 'closed-lost'].includes(lead.status)) {
            stuckDeals++;
          }

          // Group by month for trends
          if (lead.createdAt) {
            const month = lead.createdAt.toDate().getMonth();
            monthlyTrends[month] += budget;
          }
        });

        // Prepare data for charts
        const leadStatusData = Object.entries(leadStatusCount).map(([name, value]) => ({
          name: name.replace('-', ' '),
          value,
          fill: STAGE_COLORS[name]
        }));

        const dealSizeData = Object.entries(dealSizeRanges).map(([name, value]) => ({
          name,
          value
        }));

        // Get last 6 months trends
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonthIndex = now.getMonth();
        const monthlyTrendsData = [];
        
        for (let i = 5; i >= 0; i--) {
          const monthIndex = (currentMonthIndex - i + 12) % 12;
          monthlyTrendsData.push({
            name: monthNames[monthIndex],
            revenue: monthlyTrends[monthIndex],
            target: monthlyTrends[monthIndex] * 1.2 // Example target calculation
          });
        }

        setPerformanceData({
          revenue: {
            current: totalRevenue,
            target: monthlyTarget
          },
          conversionRate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
          totalLeads: leadsSnapshot.size,
          convertedLeads: wonDeals,
          avgDealCycle: dealCount > 0 ? Math.round(totalSalesCycleDays / dealCount) : 0,
          leadStatus: leadStatusData,
          monthlyTrends: monthlyTrendsData,
          dealSizeDistribution: dealSizeData
        });

        setPipelineStats({
          totalValue,
          avgDealSize: activeDeals > 0 ? totalValue / activeDeals : 0,
          winRate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
          hotLeads,
          stuckDeals,
          daysInPipeline: activeDeals > 0 ? Math.round(totalDaysInPipeline / activeDeals) : 0
        });

        setStageAnalysis(leadStatusData);

      } catch (err) {
        console.error('Error fetching performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [timeRange]);

  const progressValue = performanceData.revenue.target > 0 ? 
    Math.min((performanceData.revenue.current / performanceData.revenue.target) * 100, 100) : 0;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-medium">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'closed-won': return <FiCheckCircle className="text-green-500" />;
      case 'closed-lost': return <FiXCircle className="text-red-500" />;
      case 'negotiation': return <FiDollarSign className="text-yellow-500" />;
      case 'proposal-sent': return <FiFileText className="text-blue-500" />;
      case 'contacted': return <FiUser className="text-purple-500" />;
      default: return <FiUser className="text-indigo-500" />;
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
           {/* Performance Overview */}
           <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-bold text-gray-800 mb-4">
            Performance Overview
          </Typography>
          
          <Grid container spacing={3}>
            {/* Revenue Card */}
            <Grid item xs={12} md={4}>
              <Paper className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 h-full">
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle2" className="text-indigo-600">
                    Total Revenue
                  </Typography>
                  <FiDollarSign className="text-indigo-400" size={20} />
                </Box>
                <Typography variant="h4" className="font-bold text-indigo-900 mb-2">
                  ₹{performanceData.revenue.current.toLocaleString('en-IN')}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e0e7ff',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#4f46e5'
                    }
                  }}
                />
                <Box className="flex justify-between mt-1">
                  <Typography variant="caption" className="text-gray-500">
                    Target: ₹{performanceData.revenue.target.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" className="font-medium">
                    {progressValue.toFixed(1)}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {/* Conversion Card */}
            <Grid item xs={12} md={4}>
              <Paper className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 h-full">
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle2" className="text-green-600">
                    Conversion Rate
                  </Typography>
                  <FiTrendingUp className="text-green-400" size={20} />
                </Box>
                <Typography variant="h4" className="font-bold text-green-900 mb-2">
                  {performanceData.conversionRate.toFixed(1)}%
                </Typography>
                <Box className="flex items-center">
                  <Chip 
                    label={`${performanceData.convertedLeads}/${performanceData.totalLeads}`}
                    size="small"
                    className="bg-green-100 text-green-800"
                  />
                  <Typography variant="caption" className="ml-2 text-gray-500">
                    Closed/Total Leads
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
          
          </Grid>
        </CardContent>
      </Card>
      
      {/* Performance Trends */}
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-bold text-gray-800">
              Revenue Trends
            </Typography>
            <Box className="flex items-center space-x-2">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  label="Time Range"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  sx={{ textTransform: 'capitalize' }}
                >
                  <MenuItem value="last_week">Last Week</MenuItem>
                  <MenuItem value="last_month">Last Month</MenuItem>
                  <MenuItem value="last_quarter">Last Quarter</MenuItem>
                  <MenuItem value="last_year">Last Year</MenuItem>
                </Select>
              </FormControl>
              <Button 
                variant="outlined" 
                startIcon={<FiDownload />}
                sx={{ textTransform: 'none' }}
              >
                Export
              </Button>
            </Box>
          </Box>
          
          <Box className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={performanceData.monthlyTrends}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Actual Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
               
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
      
      {/* Enhanced Pipeline Analysis */}
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Box className="flex justify-between items-center mb-6">
            <Typography variant="h5" className="font-bold text-gray-800">
              Pipeline Analysis
            </Typography>
            <Box className="flex items-center space-x-2">
              <Button 
                variant="outlined" 
                startIcon={<FiRefreshCw size={16} />}
                size="small"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
              <Button 
                variant="contained" 
                startIcon={<FiDownload size={16} />}
                size="small"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Export
              </Button>
            </Box>
          </Box>

          {/* Conversion Funnel */}
          <Box className="mt-6">
            <Card variant="outlined" className="rounded-lg">
              <CardContent>
                <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                  Conversion Funnel
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'New', value: stageAnalysis.find(s => s.name === 'new')?.value || 0 },
                        { name: 'Contacted', value: stageAnalysis.find(s => s.name === 'contacted')?.value || 0 },
                        { name: 'Proposal Sent', value: stageAnalysis.find(s => s.name === 'proposal sent')?.value || 0 },
                        { name: 'Negotiation', value: stageAnalysis.find(s => s.name === 'negotiation')?.value || 0 },
                        { name: 'Closed Won', value: stageAnalysis.find(s => s.name === 'closed won')?.value || 0 }
                      ]}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`${value} leads`]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#4f46e5" 
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Recent Activity */}
          <Box className="mt-6">
            <Card variant="outlined" className="rounded-lg">
              <CardContent>
                <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                  Recent Activity
                </Typography>
                <List sx={{ width: '100%' }}>
                  {performanceData.leadStatus.slice(0, 5).map((lead, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start" className="hover:bg-gray-50 rounded-lg">
                        <ListItemAvatar>
                          <Avatar className="bg-indigo-100 text-indigo-600">
                            {getStatusIcon(lead.name.replace(' ', '-'))}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" className="font-medium">
                              {lead.name}
                            </Typography>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                className="inline-flex items-center text-gray-600"
                              >
                                {lead.value} leads
                              </Typography>
                            </React.Fragment>
                          }
                        />
                        <Box className="flex items-center">
                          <Chip 
                            label={lead.name} 
                            size="small" 
                            className={`capitalize ${lead.name.includes('won') ? 'bg-green-100 text-green-800' : 
                              lead.name.includes('lost') ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'}`}
                          />
                        </Box>
                      </ListItem>
                      {index < performanceData.leadStatus.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceTab;