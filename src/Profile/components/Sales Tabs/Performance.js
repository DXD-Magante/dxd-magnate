import React, { useEffect, useState } from "react";
import { 
  Card, CardContent, Typography, Box, Grid, Paper, 
  LinearProgress, Button, FormControl, InputLabel, 
  Select, MenuItem, Chip, CircularProgress,
  Divider
} from "@mui/material";
import { 
  FiDollarSign, FiTrendingUp, FiClock, FiDownload,
  FiBarChart2, FiPieChart, FiRefreshCw, FiCalendar
} from "react-icons/fi";
import { auth, db } from "../../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
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
  const [timeRange, setTimeRange] = useState('last_quarter');
  const [loading, setLoading] = useState(true);

  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

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

          // Group by month for trends
          if (lead.createdAt) {
            const month = lead.createdAt.toDate().getMonth();
            monthlyTrends[month] += budget;
          }
        });

        // Prepare data for charts
        const leadStatusData = Object.entries(leadStatusCount).map(([name, value]) => ({
          name: name.replace('-', ' '),
          value
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
            
            {/* Activity Card */}
            <Grid item xs={12} md={4}>
              <Paper className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 h-full">
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle2" className="text-amber-600">
                    Avg. Deal Cycle
                  </Typography>
                  <FiClock className="text-amber-400" size={20} />
                </Box>
                <Typography variant="h4" className="font-bold text-amber-900 mb-2">
                  {performanceData.avgDealCycle} days
                </Typography>
                <Box className="flex items-center">
                  <Chip 
                    label="Industry avg: 21 days"
                    size="small"
                    className="bg-amber-100 text-amber-800"
                  />
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
              <BarChart
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
                <Bar dataKey="target" name="Revenue Target" fill="#c7d2fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
      
   {/* Pipeline Analysis */}
<Card className="shadow-lg rounded-xl border border-gray-200">
  <CardContent className="p-6">
    <Typography variant="h6" className="font-bold text-gray-800 mb-4">
      Pipeline Analysis
    </Typography>
    
    <Grid >
      {/* Lead Status Distribution */}
      <Grid item xs={12} md={6}>
        <Paper elevation={0} className="p-4 rounded-lg h-full flex flex-col">
          <Box className="flex items-center justify-between mb-3">
            <Typography variant="subtitle1" className="font-medium text-gray-700">
              Lead Status Distribution
            </Typography>
            <FiBarChart2 className="text-indigo-500" size={20} />
          </Box>
          <Box className="flex-1" sx={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData.leadStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => (
                    <text 
                      x={0} 
                      y={0} 
                      fill="#374151" 
                      textAnchor="middle" 
                      dominantBaseline="central"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                >
                  {performanceData.leadStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value, name, props) => [
                    `${value} leads`, 
                    props.payload.name.replace('-', ' ')
                  ]}
                />
                <Legend 
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{
                    paddingLeft: '20px'
                  }}
                  formatter={(value, entry, index) => (
                    <span className="text-gray-600 text-sm">
                      {value.replace('-', ' ')}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      {/* Deal Size Distribution */}
      <Grid item xs={12} md={6}>
        <Paper elevation={0} className="p-4 rounded-lg h-full flex flex-col">
          <Box className="flex items-center justify-between mb-3">
            <Typography variant="subtitle1" className="font-medium text-gray-700">
              Deal Size Distribution
            </Typography>
            <FiPieChart className="text-indigo-500" size={20} />
          </Box>
          <Box className="flex-1" sx={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData.dealSizeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => (
                    <text 
                      x={0} 
                      y={0} 
                      fill="#374151" 
                      textAnchor="middle" 
                      dominantBaseline="central"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                >
                  {performanceData.dealSizeDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value, name, props) => [
                    `${value} deals`, 
                    props.payload.name
                  ]}
                />
                <Legend 
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{
                    paddingLeft: '20px'
                  }}
                  formatter={(value) => (
                    <span className="text-gray-600 text-sm">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  </CardContent>
</Card>
    </Box>
  );
};

export default PerformanceTab;