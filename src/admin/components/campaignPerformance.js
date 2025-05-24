import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Divider, 
  Tabs, 
  Tab, 
  Paper, 
  CircularProgress,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  useMediaQuery,
  Button,
  useTheme
} from '@mui/material';
import { 
  FiRefreshCw, 
  FiDownload, 
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiEye,
  FiMousePointer,
  FiFilter,
  FiPieChart,
  FiSmartphone,
  FiMonitor,
  FiTablet
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Scatter
} from 'recharts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminCampaignPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [campaignData, setCampaignData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange, selectedCampaign, platformFilter]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selection
      let startDate;
      const endDate = new Date();
      
      switch(timeRange) {
        case '7d':
          startDate = subDays(endDate, 7);
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          break;
        case '90d':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 7);
      }

      // Fetch campaigns from Firestore with optional filters
      let campaignsQuery = query(
        collection(db, 'campaigns'),
        where('status', 'in', ['active', 'ended'])
      );
      
      const campaignsSnapshot = await getDocs(campaignsQuery);
      let campaignsData = campaignsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply platform filter if not 'all'
      if (platformFilter !== 'all') {
        campaignsData = campaignsData.filter(campaign => 
          campaign.platforms?.includes(platformFilter)
        );
      }

      setCampaignData(campaignsData);

      // Fetch performance data from Firestore with optional campaign filter
      let perfQuery = query(
        collection(db, 'campaignPerformance'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date')
      );

      if (selectedCampaign !== 'all') {
        perfQuery = query(perfQuery, where('campaignId', '==', selectedCampaign));
      }

      const perfSnapshot = await getDocs(perfQuery);
      const perfData = perfSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate() // Convert Firestore timestamp to Date
      }));
      
      setPerformanceData(perfData);
      calculateMetrics(campaignsData, perfData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setLoading(false);
    }
  };

  const calculateMetrics = (campaigns, perfData) => {
    // Calculate summary metrics from performance data
    const totalSpend = perfData.reduce((sum, item) => sum + (item.spend || 0), 0);
    const totalImpressions = perfData.reduce((sum, item) => sum + (item.impressions || 0), 0);
    const totalClicks = perfData.reduce((sum, item) => sum + (item.clicks || 0), 0);
    const totalConversions = perfData.reduce((sum, item) => sum + (item.conversions || 0), 0);
    const totalROI = totalSpend > 0 ? ((totalConversions * 100 - totalSpend) / totalSpend) * 100 : 0;
    
    // Calculate rates
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
    
    setMetrics({
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      roi: totalROI,
      ctr: ctr.toFixed(2),
      conversionRate: conversionRate.toFixed(2),
      avgCpc: avgCpc.toFixed(2)
    });
  };

  const generateTrendData = () => {
    if (performanceData.length === 0) return [];
    
    // Group performance data by date
    const groupedByDate = performanceData.reduce((acc, item) => {
      const dateStr = format(item.date, 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: item.date,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0
        };
      }
      acc[dateStr].impressions += item.impressions || 0;
      acc[dateStr].clicks += item.clicks || 0;
      acc[dateStr].conversions += item.conversions || 0;
      acc[dateStr].spend += item.spend || 0;
      return acc;
    }, {});

    // Fill in missing dates with zero values
    const startDate = performanceData[0]?.date || new Date();
    const endDate = performanceData[performanceData.length - 1]?.date || new Date();
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });

    return allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingData = groupedByDate[dateStr];
      return existingData || {
        date,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        dateStr: format(date, 'MMM d')
      };
    }).map(item => ({
      ...item,
      dateStr: format(item.date, 'MMM d'),
      cpc: item.clicks > 0 ? item.spend / item.clicks : 0,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      conversionRate: item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0
    }));
  };

  const generatePlatformData = () => {
    if (campaignData.length === 0) return [];
    
    const platformMap = {};
    
    campaignData.forEach(campaign => {
      campaign.platforms?.forEach(platform => {
        if (!platformMap[platform]) {
          platformMap[platform] = {
            name: platform,
            spend: 0,
            clicks: 0,
            impressions: 0,
            conversions: 0
          };
        }
        
        // Add performance data for this campaign
        const campaignPerf = performanceData.filter(p => p.campaignId === campaign.id);
        platformMap[platform].spend += campaignPerf.reduce((sum, p) => sum + (p.spend || 0), 0);
        platformMap[platform].clicks += campaignPerf.reduce((sum, p) => sum + (p.clicks || 0), 0);
        platformMap[platform].impressions += campaignPerf.reduce((sum, p) => sum + (p.impressions || 0), 0);
        platformMap[platform].conversions += campaignPerf.reduce((sum, p) => sum + (p.conversions || 0), 0);
      });
    });
    
    return Object.values(platformMap).filter(p => p.spend > 0);
  };

  const generateDeviceData = () => {
    if (performanceData.length === 0) return [];
    
    const deviceMap = {};
    
    performanceData.forEach(item => {
      if (item.deviceBreakdown) {
        Object.entries(item.deviceBreakdown).forEach(([device, percentage]) => {
          if (!deviceMap[device]) {
            deviceMap[device] = 0;
          }
          deviceMap[device] += percentage;
        });
      }
    });
    
    // Convert to array and calculate average percentages
    const total = Object.values(deviceMap).reduce((sum, val) => sum + val, 0);
    return Object.entries(deviceMap).map(([name, value]) => ({
      name,
      value: total > 0 ? (value / total) * 100 : 0
    }));
  };

  const generateCampaignPerformanceData = () => {
    return campaignData.map(campaign => {
      const campaignPerf = performanceData.filter(p => p.campaignId === campaign.id);
      const totalSpend = campaignPerf.reduce((sum, p) => sum + (p.spend || 0), 0);
      const totalClicks = campaignPerf.reduce((sum, p) => sum + (p.clicks || 0), 0);
      const totalImpressions = campaignPerf.reduce((sum, p) => sum + (p.impressions || 0), 0);
      const totalConversions = campaignPerf.reduce((sum, p) => sum + (p.conversions || 0), 0);
      
      return {
        name: campaign.name,
        spend: totalSpend,
        clicks: totalClicks,
        impressions: totalImpressions,
        conversions: totalConversions,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0
      };
    }).filter(c => c.spend > 0);
  };

  const renderMetricCard = (icon, title, value, subtitle, color) => (
    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Box
            sx={{
              backgroundColor: `${color}.50`,
              color: `${color}.600`,
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" fontWeight="bold" mb={1}>
          {typeof value === 'number' ? 
            title.includes('Rate') || title.includes('CTR') || title.includes('ROI') ? 
              `${parseFloat(value).toLocaleString()}%` :
              title.includes('CPC') || title.includes('Spend') ?
                `$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                parseFloat(value).toLocaleString()
            : value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  const getDeviceIcon = (device) => {
    switch(device.toLowerCase()) {
      case 'mobile': return <FiSmartphone size={16} />;
      case 'desktop': return <FiMonitor size={16} />;
      case 'tablet': return <FiTablet size={16} />;
      default: return <FiSmartphone size={16} />;
    }
  };

  const trendData = generateTrendData();
  const platformData = generatePlatformData();
  const deviceData = generateDeviceData();
  const campaignPerformanceData = generateCampaignPerformanceData();

  return (
    <Box sx={{ p: isMobile ? 2 : 4 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Campaign Performance Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive analytics and insights for your marketing campaigns
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mt: isMobile ? 2 : 0 }}>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={fetchPerformanceData}
            disabled={loading}
          >
            Refresh Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiDownload />}
            onClick={() => {}}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Campaign</InputLabel>
              <Select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                label="Campaign"
              >
                <MenuItem value="all">All Campaigns</MenuItem>
                {campaignData.map(campaign => (
                  <MenuItem key={campaign.id} value={campaign.id}>{campaign.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                label="Platform"
              >
                <MenuItem value="all">All Platforms</MenuItem>
                <MenuItem value="Google Ads">Google Ads</MenuItem>
                <MenuItem value="Facebook">Facebook</MenuItem>
                <MenuItem value="Instagram">Instagram</MenuItem>
                <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                <MenuItem value="Twitter">Twitter</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Key Metrics Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Key Performance Indicators
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              {renderMetricCard(
                <FiDollarSign size={20} />,
                'Total Spend',
                metrics?.spend || 0,
                'Across all campaigns',
                'primary'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              {renderMetricCard(
                <FiEye size={20} />,
                'Impressions',
                metrics?.impressions || 0,
                'Total ad views',
                'info'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              {renderMetricCard(
                <FiMousePointer size={20} />,
                'Clicks',
                metrics?.clicks || 0,
                'Total interactions',
                'success'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              {renderMetricCard(
                <FiUsers size={20} />,
                'Conversions',
                metrics?.conversions || 0,
                'Total conversions',
                'warning'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              {renderMetricCard(
                <FiTrendingUp size={20} />,
                'CTR',
                metrics?.ctr || 0,
                'Click-through rate',
                'error'
              )}
            </Grid>
          </Grid>

          {/* Tabs Section */}
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Performance Trends" />
              <Tab label="Platform Analysis" />
              <Tab label="Device Breakdown" />
              <Tab label="Campaign Comparison" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box sx={{ mb: 4 }}>
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Card sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                      Performance Over Time
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={trendData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="dateStr" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#ff8042" />
                          <RechartsTooltip 
                            formatter={(value, name) => {
                              if (name === 'Spend') return [`$${value.toFixed(2)}`, name];
                              if (name === 'CPC') return [`$${value.toFixed(2)}`, name];
                              return [value, name];
                            }}
                          />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="impressions"
                            stackId="1"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.2}
                            name="Impressions"
                          />
                          <Bar
                            yAxisId="left"
                            dataKey="clicks"
                            barSize={20}
                            fill="#82ca9d"
                            name="Clicks"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cpc"
                            stroke="#ff8042"
                            name="CPC ($)"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Card sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                      Conversion Rates
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="dateStr" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value) => [`${value.toFixed(2)}%`, 'Rate']}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="ctr"
                            stroke="#8884d8"
                            name="CTR (%)"
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="conversionRate"
                            stroke="#82ca9d"
                            name="Conversion Rate (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && platformData.length > 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                      Spend by Platform
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={platformData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="spend"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value, name) => [`$${value.toFixed(2)}`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                      Platform Performance
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={platformData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" />
                          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                          <RechartsTooltip />
                          <Legend />
                          <Bar
                            yAxisId="left"
                            dataKey="clicks"
                            fill="#8884d8"
                            name="Clicks"
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="conversions"
                            fill="#82ca9d"
                            name="Conversions"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && deviceData.length > 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                      Device Distribution
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {deviceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value) => [`${value.toFixed(2)}%`, 'Percentage']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                    <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                      Device Performance
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={deviceData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value) => [`${value.toFixed(2)}%`, 'Percentage']}
                          />
                          <Legend />
                          <Bar
                            dataKey="value"
                            fill="#8884d8"
                            name="Distribution (%)"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 3 && campaignPerformanceData.length > 0 && (
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                  Campaign Performance Comparison
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 500 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaignPerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          if (name === 'Spend') return [`$${value.toFixed(2)}`, name];
                          if (name === 'CPC') return [`$${value.toFixed(2)}`, name];
                          if (name === 'CTR' || name === 'Conversion Rate') return [`${value.toFixed(2)}%`, name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="spend"
                        fill="#8884d8"
                        name="Spend ($)"
                      />
                      <Bar
                        dataKey="clicks"
                        fill="#82ca9d"
                        name="Clicks"
                      />
                      <Bar
                        dataKey="conversions"
                        fill="#ff8042"
                        name="Conversions"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            )}
          </Box>

          {/* Additional Insights Section */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Additional Insights
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Device Breakdown Details
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {deviceData.map((device, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        backgroundColor: COLORS[index % COLORS.length],
                        color: 'white',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        {getDeviceIcon(device.name)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">{device.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {device.value.toFixed(2)}% of total
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight="bold">
                        {device.value.toFixed(2)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Platform Efficiency
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {platformData.map((platform, index) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {platform.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Box sx={{ 
                          width: '100%',
                          height: 8,
                          backgroundColor: '#e0e0e0',
                          borderRadius: 4,
                          overflow: 'hidden',
                          mr: 2
                        }}>
                          <Box 
                            sx={{ 
                              width: `${(platform.clicks / platform.impressions * 100).toFixed(2)}%`,
                              height: '100%',
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </Box>
                        <Typography variant="body2">
                          CTR: {(platform.clicks / platform.impressions * 100).toFixed(2)}%
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          ${platform.spend.toFixed(2)} spent
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {platform.conversions} conversions
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AdminCampaignPerformance;