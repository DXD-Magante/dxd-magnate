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
  useMediaQuery
} from '@mui/material';
import { 
  FiRefreshCw, 
  FiDownload, 
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiEye,
  FiMousePointer
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
  Area
} from 'recharts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PerformanceMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [campaignData, setCampaignData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

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

      // Fetch campaigns from Firestore
      const campaignsQuery = query(
        collection(db, 'campaigns'),
        where('status', 'in', ['active', 'ended'])
      );
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaignsData = campaignsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCampaignData(campaignsData);

      // Fetch performance data from Firestore (assuming you have a 'campaignPerformance' collection)
      const perfQuery = query(
        collection(db, 'campaignPerformance'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date')
      );
      const perfSnapshot = await getDocs(perfQuery);
      const perfData = perfSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate() // Convert Firestore timestamp to Date
      }));
      setPerformanceData(perfData);

      // Calculate metrics from the actual data
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
    
    // Calculate CTR and Conversion Rate
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    setMetrics({
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: ctr.toFixed(2),
      conversionRate: conversionRate.toFixed(2),
      avgCpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : 0
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
    const startDate = performanceData[0].date;
    const endDate = performanceData[performanceData.length - 1].date;
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
      cpc: item.clicks > 0 ? item.spend / item.clicks : 0
    }));
  };

  const generatePlatformData = () => {
    if (campaignData.length === 0) return [];
    
    // Group by platform (assuming platforms is an array in each campaign)
    const platformMap = {};
    
    campaignData.forEach(campaign => {
      campaign.platforms?.forEach(platform => {
        if (!platformMap[platform]) {
          platformMap[platform] = {
            name: platform,
            spend: 0,
            clicks: 0,
            impressions: 0
          };
        }
        platformMap[platform].spend += campaign.budget || 0;
        
        // Add performance data for this campaign
        const campaignPerf = performanceData.filter(p => p.campaignId === campaign.id);
        platformMap[platform].clicks += campaignPerf.reduce((sum, p) => sum + (p.clicks || 0), 0);
        platformMap[platform].impressions += campaignPerf.reduce((sum, p) => sum + (p.impressions || 0), 0);
      });
    });
    
    return Object.values(platformMap).filter(p => p.spend > 0);
  };

  const generateDeviceData = () => {
    if (performanceData.length === 0) return [];
    
    // Group by device (assuming device data is in performance records)
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

  const generateConversionData = () => {
    return [
      { name: 'Impressions', value: metrics?.impressions || 0 },
      { name: 'Clicks', value: metrics?.clicks || 0 },
      { name: 'Conversions', value: metrics?.conversions || 0 }
    ];
  };

  const handleRefresh = () => {
    fetchPerformanceData();
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
          {typeof value === 'number' ? value.toLocaleString() : value}
          {title.includes('Rate') || title.includes('CTR') ? '%' : ''}
          {title.includes('CPC') ? '$' : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  const trendData = generateTrendData();
  const platformData = generatePlatformData();
  const deviceData = generateDeviceData();
  const conversionData = generateConversionData();

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Campaign Performance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze and optimize your marketing campaigns
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} color="primary">
              <FiRefreshCw />
            </IconButton>
          </Tooltip>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Metrics Cards */}
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
                'Total views',
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

          {/* Tabs */}
          <Paper sx={{ mb: 3, borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Performance Trends" />
              <Tab label="Platform Distribution" />
              <Tab label="Conversion Funnel" />
              <Tab label="Device Breakdown" />
              <Tab label="Campaign Comparison" />
            </Tabs>
          </Paper>

          {/* Tab Content */}
          <Box sx={{ mb: 4 }}>
            {activeTab === 0 && (
              <Card sx={{ mb: 3, p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                  Performance Over Time
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dateStr" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.2}
                        name="Impressions"
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.2}
                        name="Clicks"
                      />
                      <Area
                        type="monotone"
                        dataKey="spend"
                        stackId="3"
                        stroke="#ffc658"
                        fill="#ffc658"
                        fillOpacity={0.2}
                        name="Spend ($)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
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
                      Clicks by Platform
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={platformData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="clicks" fill="#8884d8" name="Clicks" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && (
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                  Conversion Funnel
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={conversionData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            )}

            {activeTab === 3 && deviceData.length > 0 && (
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                  Device Breakdown
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
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            )}

            {activeTab === 4 && campaignData.length > 0 && (
              <Card sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 1 }}>
                  Campaign Performance Comparison
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={campaignData.slice(0, 5).map(campaign => ({
                        ...campaign,
                        clicks: performanceData
                          .filter(p => p.campaignId === campaign.id)
                          .reduce((sum, p) => sum + (p.clicks || 0), 0),
                        impressions: performanceData
                          .filter(p => p.campaignId === campaign.id)
                          .reduce((sum, p) => sum + (p.impressions || 0), 0)
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="clicks" fill="#8884d8" name="Clicks" />
                      <Bar yAxisId="right" dataKey="impressions" fill="#82ca9d" name="Impressions" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            )}
          </Box>

          {/* Additional Metrics */}
          {trendData.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Key Performance Indicators
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Conversion Rate Over Time
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData.map(item => ({
                            ...item,
                            conversionRate: item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="dateStr" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value) => [`${value.toFixed(2)}%`, 'Conversion Rate']}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="conversionRate"
                            stroke="#ff8042"
                            name="Conversion Rate (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Cost Per Click (CPC) Over Time
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="dateStr" />
                          <YAxis />
                          <RechartsTooltip 
                            formatter={(value) => [`$${value.toFixed(2)}`, 'CPC']}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="cpc"
                            stroke="#0088FE"
                            name="Cost Per Click ($)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default PerformanceMetrics;