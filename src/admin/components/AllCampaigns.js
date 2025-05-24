import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
  Checkbox,
  ListItemText,
  FormGroup,
  FormControlLabel,
  FormHelperText,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  FiPlus,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiBarChart2,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiTarget,
  FiFilter,
  FiSearch,
  FiDownload,
  FiPieChart,
  FiTrendingUp
} from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const statusColors = {
    active: 'success',
    paused: 'warning',
    ended: 'error',
    draft: 'default'
  };

  const platformOptions = ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'YouTube'];
  const statusOptions = ['all', 'active', 'paused', 'ended', 'draft'];

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'campaigns'));
      const campaignsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setSnackbar({ open: true, message: 'Failed to fetch campaigns', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      setSnackbar({ open: true, message: 'Campaign deleted successfully', severity: 'success' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setSnackbar({ open: true, message: 'Failed to delete campaign', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCampaign(null);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    // Apply status filter
    if (statusFilter !== 'all' && campaign.status !== statusFilter) return false;
    
    // Apply platform filter
    if (platformFilter !== 'all' && !campaign.platforms?.includes(platformFilter)) return false;
    
    // Apply search filter
    if (searchTerm && !campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Prepare data for charts
  const getPlatformDistributionData = () => {
    const platformCounts = {};
    
    platformOptions.forEach(platform => {
      platformCounts[platform] = campaigns.filter(c => 
        c.platforms?.includes(platform))
        .length;
    });
    
    return Object.entries(platformCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getStatusDistributionData = () => {
    const statusCounts = {};
    
    Object.keys(statusColors).forEach(status => {
      statusCounts[status] = campaigns.filter(c => c.status === status).length;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getBudgetTrendData = () => {
    // Group by month
    const monthlyData = {};
    
    campaigns.forEach(campaign => {
      if (!campaign.startDate) return;
      
      const monthYear = format(new Date(campaign.startDate), 'MMM yyyy');
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear] += campaign.budget || 0;
    });
    
    return Object.entries(monthlyData).map(([name, budget]) => ({
      name,
      budget: Math.round(budget)
    })).sort((a, b) => new Date(a.name) - new Date(b.name));
  };

  const formatTargetAudience = (audience) => {
    if (!audience) return 'Not specified';
    
    const parts = [];
    if (audience.genders?.length > 0) parts.push(`Genders: ${audience.genders.join(', ')}`);
    if (audience.ageRanges?.length > 0) parts.push(`Ages: ${audience.ageRanges.join(', ')}`);
    if (audience.locations?.length > 0) {
      const locs = audience.locations.map(loc => 
        `${loc.country}${loc.regions?.length > 0 ? ` (${loc.regions.join(', ')})` : ''}`
      );
      parts.push(`Locations: ${locs.join('; ')}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Not specified';
  };

  return (
    <Box className="p-4 md:p-6">
      {/* Header Section */}
      <Box className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <Box>
          <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
            Campaign Analytics Dashboard
          </Typography>
          <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
            Comprehensive overview and management of all marketing campaigns
          </Typography>
        </Box>
        
        <Box className="flex flex-wrap gap-2">
          <Button
            variant="contained"
            color="primary"
            startIcon={<FiPlus />}
            onClick={() => setOpenDialog(true)}
            className="whitespace-nowrap"
          >
            New Campaign
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw className={loading ? "animate-spin" : ""} />}
            onClick={fetchCampaigns}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiDownload />}
            onClick={() => {
              // TODO: Implement export functionality
              setSnackbar({ open: true, message: 'Export functionality coming soon', severity: 'info' });
            }}
          >
            Export
          </Button>
        </Box>
      </Box>
      
      {/* Filters Section */}
      <Paper className="p-4 mb-6 rounded-lg shadow-sm">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search campaigns..."
              InputProps={{
                startAdornment: <FiSearch className="mr-2 text-gray-500" />
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="ended">Ended</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Platform</InputLabel>
              <Select
                label="Platform"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <MenuItem value="all">All Platforms</MenuItem>
                {platformOptions.map(platform => (
                  <MenuItem key={platform} value={platform}>{platform}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Analytics Charts Section */}
      <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Platform Distribution */}
        <Paper className="p-4 rounded-lg shadow-sm">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="font-medium flex items-center">
              <FiPieChart className="mr-2" /> Platform Distribution
            </Typography>
          </Box>
          <Box className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPlatformDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getPlatformDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
        
        {/* Status Distribution */}
        <Paper className="p-4 rounded-lg shadow-sm">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="font-medium flex items-center">
              <FiBarChart2 className="mr-2" /> Status Overview
            </Typography>
          </Box>
          <Box className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getStatusDistributionData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Campaigns" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
        
        {/* Budget Trend */}
        <Paper className="p-4 rounded-lg shadow-sm">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="font-medium flex items-center">
              <FiTrendingUp className="mr-2" /> Budget Trend
            </Typography>
          </Box>
          <Box className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={getBudgetTrendData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="budget" stroke="#8884d8" activeDot={{ r: 8 }} name="Budget ($)" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
      
      {/* Campaigns List Section */}
      <Paper className="p-4 rounded-lg shadow-sm">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-medium">
            {filteredCampaigns.length} Campaigns Found
          </Typography>
          <Tabs 
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            className="min-h-[40px]"
          >
            <Tab label="All" />
            <Tab label="Active" />
            <Tab label="Paused" />
            <Tab label="Ended" />
          </Tabs>
        </Box>
        
        {loading ? (
          <Box className="flex justify-center items-center h-64">
            <CircularProgress />
          </Box>
        ) : filteredCampaigns.length === 0 ? (
          <Box className="p-8 text-center rounded-lg">
            <FiBarChart2 className="mx-auto text-gray-400" size={48} />
            <Typography variant="h6" className="mt-4 text-gray-600">
              No campaigns match your filters
            </Typography>
            <Typography variant="body2" className="text-gray-500 mt-2">
              Try adjusting your search or filters
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredCampaigns.map((campaign) => (
              <Grid item xs={12} sm={6} lg={4} key={campaign.id}>
                <Card className="h-full flex flex-col rounded-lg shadow-xs hover:shadow-md transition-shadow">
                  <CardContent className="flex-grow">
                    <Box className="flex justify-between items-start mb-2">
                      <Typography variant="h6" className="font-medium">
                        {campaign.name}
                      </Typography>
                      <Chip
                        label={campaign.status}
                        size="small"
                        color={statusColors[campaign.status] || 'default'}
                        className="capitalize"
                      />
                    </Box>
                    
                    <Typography variant="body2" className="text-gray-600 mb-3">
                      {campaign.description}
                    </Typography>
                    
                    <Box className="grid grid-cols-2 gap-2 mb-3">
                      <Box className="flex items-center gap-1">
                        <FiDollarSign className="text-gray-500" size={14} />
                        <Typography variant="body2" className="text-gray-700">
                          ${campaign.budget?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                      
                      <Box className="flex items-center gap-1">
                        <FiCalendar className="text-gray-500" size={14} />
                        <Typography variant="body2" className="text-gray-700">
                          {format(new Date(campaign.startDate), 'MMM d, yyyy')} - {campaign.endDate ? format(new Date(campaign.endDate), 'MMM d, yyyy') : 'Ongoing'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box className="mb-3">
                      <Typography variant="caption" className="text-gray-500">
                        Target Audience
                      </Typography>
                      <Typography variant="body2" className="text-gray-700 line-clamp-2">
                        {formatTargetAudience(campaign.targetAudience)}
                      </Typography>
                    </Box>
                    
                    <Box className="flex flex-wrap gap-1 mb-3">
                      {campaign.platforms?.map((platform, index) => (
                        <Chip
                          key={index}
                          label={platform}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    
                    {campaign.isGoogleAds && (
                      <Box className="bg-blue-50 p-2 rounded mb-3">
                        <Typography variant="body2" className="text-blue-800 font-medium">
                          Google Ads Performance
                        </Typography>
                        <Box className="grid grid-cols-2 gap-2 mt-1">
                          <Box>
                            <Typography variant="caption" className="text-gray-500">
                              Clicks
                            </Typography>
                            <Typography variant="body2" className="font-medium">
                              {campaign.clicks}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" className="text-gray-500">
                              Impressions
                            </Typography>
                            <Typography variant="body2" className="font-medium">
                              {campaign.impressions?.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                  
                  <Box className="p-2">
                    <Divider className="my-1" />
                    <Box className="flex justify-between items-center mt-2 px-2">
                      <Typography variant="caption" className="text-gray-500">
                        {campaign.isGoogleAds ? 'Synced from Google Ads' : `Created by ${campaign.memberId}`}
                      </Typography>
                      
                      <Box className="flex gap-1">
                        {!campaign.isGoogleAds && (
                          <>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <FiEdit2 size={16} className="text-gray-600 hover:text-blue-600" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDelete(campaign.id)}>
                                <FiTrash2 size={16} className="text-gray-600 hover:text-red-600" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {campaign.isGoogleAds && (
                          <Tooltip title="View in Google Ads">
                            <IconButton size="small">
                              <FiExternalLink size={16} className="text-gray-600 hover:text-blue-600" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminCampaigns;