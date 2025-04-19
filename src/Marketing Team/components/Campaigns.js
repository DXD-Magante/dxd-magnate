import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Avatar, LinearProgress, Divider, Chip, 
  Button, IconButton, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination,
  Menu, MenuItem, Tooltip, CircularProgress, Snackbar, Alert, TextField, InputAdornment
} from "@mui/material";
import { 
  FiFilter, FiSearch, FiPlus, FiMoreVertical, 
  FiTrendingUp, FiBarChart2, FiDownload, FiEye,
  FiEdit2, FiTrash2, FiShare2, FiRefreshCw, FiDollarSign
} from "react-icons/fi";
import { MdOutlineCampaign } from "react-icons/md";

const CampaignsContent = () => {
  // State for campaigns data
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const open = Boolean(anchorEl);

  // Google Ads API configuration
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [googleAdsClient, setGoogleAdsClient] = useState(null);

  // Initialize Google API client
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client:auth2', {
        callback: () => {
          window.gapi.client.init({
            apiKey: 'AIzaSyB8gbDwWVrFwt7jIRV-XFybwdyFGUB_8vE',
            clientId: '778430544439-37a6j5s493pmg21r4u3ndrh83hhidk7q.apps.googleusercontent.com',
            discoveryDocs: ['https://googleads.googleapis.com/$discovery/rest'],
            scope: 'https://www.googleapis.com/auth/adwords'
          }).then(() => {
            setGapiLoaded(true);
            // Initialize Google Ads client after auth
            initGoogleAdsClient();
          }).catch(error => {
            console.error('Google API initialization error:', error);
            setError('Failed to initialize Google Ads API');
            setSnackbar({
              open: true,
              message: 'Failed to initialize Google Ads integration',
              severity: 'error'
            });
          });
        },
        onerror: () => {
          console.error('Failed to load Google API client');
          setError('Failed to load Google Ads API');
          setSnackbar({
            open: true,
            message: 'Failed to load Google Ads integration',
            severity: 'error'
          });
        },
        timeout: 5000
      });
    };
    script.onerror = () => {
      console.error('Failed to load Google API script');
      setError('Failed to load Google Ads API');
      setSnackbar({
        open: true,
        message: 'Failed to load Google Ads integration',
        severity: 'error'
      });
    };
    document.body.appendChild(script);
  
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initGoogleAdsClient = () => {
    // This would be replaced with actual Google Ads client initialization
    // For now, we'll simulate it
    setGoogleAdsClient({ initialized: true });
    fetchCampaigns();
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would call the Google Ads API here
      // This is a mock implementation for demonstration
      const mockCampaigns = await mockFetchGoogleAdsData();
      
      setCampaigns(mockCampaigns);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError(err.message);
      setSnackbar({
        open: true,
        message: 'Error fetching campaign data',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Mock function to simulate Google Ads API response
  const mockFetchGoogleAdsData = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "12345",
            name: "Summer Sale 2023",
            status: "active",
            progress: 75,
            budget: "$5,000",
            spent: "$3,750",
            startDate: "Jun 1, 2023",
            endDate: "Aug 31, 2023",
            clicks: 2450,
            impressions: 51020,
            conversions: 324,
            ctr: 4.8,
            roi: 2.5,
            costPerClick: "$1.53"
          },
          {
            id: "12346",
            name: "Product Launch: X-Series",
            status: "active",
            progress: 45,
            budget: "$8,000",
            spent: "$3,600",
            startDate: "Jul 15, 2023",
            endDate: "Sep 30, 2023",
            clicks: 1820,
            impressions: 56875,
            conversions: 210,
            ctr: 3.2,
            roi: 1.8,
            costPerClick: "$1.98"
          },
          {
            id: "12347",
            name: "Back to School",
            status: "paused",
            progress: 0,
            budget: "$6,500",
            spent: "$0",
            startDate: "Aug 15, 2023",
            endDate: "Sep 30, 2023",
            clicks: 0,
            impressions: 0,
            conversions: 0,
            ctr: 0,
            roi: 0,
            costPerClick: "$0.00"
          },
          {
            id: "12348",
            name: "Holiday Special",
            status: "ended",
            progress: 100,
            budget: "$10,000",
            spent: "$9,800",
            startDate: "Nov 20, 2022",
            endDate: "Dec 31, 2022",
            clicks: 5200,
            impressions: 85230,
            conversions: 780,
            ctr: 6.1,
            roi: 3.2,
            costPerClick: "$1.88"
          },
        ]);
      }, 1000);
    });
  };

  const handleClickMenu = (event, campaign) => {
    setAnchorEl(event.currentTarget);
    setSelectedCampaign(campaign);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedCampaign(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    fetchCampaigns();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'ended': return 'bg-purple-100 text-purple-800';
      case 'removed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateProgress = (campaign) => {
    if (campaign.status === 'ended' || campaign.status === 'removed') return 100;
    
    const start = new Date(campaign.startDate).getTime();
    const end = new Date(campaign.endDate).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            Google Ads Campaigns
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Real-time data from your Google Ads account
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outlined"
            startIcon={<FiFilter size={16} />}
            sx={{
              borderColor: '#e2e8f0',
              color: '#64748b',
              '&:hover': {
                borderColor: '#cbd5e1',
                backgroundColor: '#f8fafc',
              }
            }}
          >
            Filters
          </Button>
          <TextField
            size="small"
            placeholder="Search campaigns..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch className="text-gray-400" size={16} />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: '#f8fafc',
                borderRadius: 1,
                width: 200
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<FiRefreshCw size={16} />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca'
              }
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Paper className="p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                  Total Campaigns
                </Typography>
                <div className="p-2 rounded-lg bg-indigo-50">
                  <MdOutlineCampaign className="text-indigo-600" size={18} />
                </div>
              </div>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {campaigns.length}
              </Typography>
              <div className="flex items-center text-sm text-green-600 mt-2">
                <FiTrendingUp className="mr-1" size={14} />
                <span>Active: {campaigns.filter(c => c.status === 'active').length}</span>
              </div>
            </Paper>

            <Paper className="p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                  Total Spend
                </Typography>
                <div className="p-2 rounded-lg bg-pink-50">
                  <FiDollarSign className="text-pink-600" size={18} />
                </div>
              </div>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {formatCurrency(campaigns.reduce((sum, c) => sum + parseFloat(c.spent.replace(/[^0-9.]/g, '')), 0))}
              </Typography>
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <span>This period</span>
              </div>
            </Paper>

            <Paper className="p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                  Total Clicks
                </Typography>
                <div className="p-2 rounded-lg bg-blue-50">
                  <FiBarChart2 className="text-blue-600" size={18} />
                </div>
              </div>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
              </Typography>
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <span>Across all campaigns</span>
              </div>
            </Paper>

            <Paper className="p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <Typography variant="subtitle2" sx={{ color: '#64748b' }}>
                  Avg. CTR
                </Typography>
                <div className="p-2 rounded-lg bg-green-50">
                  <FiTrendingUp className="text-green-600" size={18} />
                </div>
              </div>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {campaigns.length > 0 
                  ? (campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length).toFixed(1) + '%'
                  : '0%'}
              </Typography>
              <div className="flex items-center text-sm text-gray-600 mt-2">
                <span>Click-through rate</span>
              </div>
            </Paper>
          </div>

          {/* Campaigns Table */}
          <Paper className="rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Campaign Performance
              </Typography>
              <div className="flex items-center gap-2">
                <Tooltip title="Download Report">
                  <IconButton size="small">
                    <FiDownload size={16} />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Campaign Name</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Progress</TableCell>
                    <TableCell align="right">Budget</TableCell>
                    <TableCell align="right">Spent</TableCell>
                    <TableCell align="right">Clicks</TableCell>
                    <TableCell align="right">Impressions</TableCell>
                    <TableCell align="right">CTR</TableCell>
                    <TableCell align="right">CPC</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((campaign) => (
                    <TableRow key={campaign.id} hover>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar 
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              bgcolor: '#e0e7ff',
                              color: '#4f46e5',
                              mr: 2,
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {campaign.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <div>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {campaign.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {campaign.startDate} - {campaign.endDate}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          size="small"
                          className={`${getStatusColor(campaign.status)} capitalize`}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <div className="flex items-center gap-2">
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateProgress(campaign)} 
                            sx={{
                              width: '100%',
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: 
                                  campaign.status === 'ended' ? '#8b5cf6' : 
                                  campaign.status === 'active' ? '#10b981' : 
                                  campaign.status === 'paused' ? '#f59e0b' : '#ef4444'
                              }
                            }}
                          />
                          <Typography variant="body2" sx={{ color: '#64748b', minWidth: 40 }}>
                            {calculateProgress(campaign)}%
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {campaign.budget}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {campaign.spent}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {campaign.clicks.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {campaign.impressions?.toLocaleString() || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {campaign.ctr}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {campaign.costPerClick}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleClickMenu(e, campaign)}
                        >
                          <FiMoreVertical size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={campaigns.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleCloseMenu}>
          <FiEye className="mr-2" size={16} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <FiEdit2 className="mr-2" size={16} />
          Edit in Google Ads
        </MenuItem>
        <MenuItem onClick={handleCloseMenu}>
          <FiShare2 className="mr-2" size={16} />
          Share Report
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCloseMenu} sx={{ color: '#ef4444' }}>
          <FiTrash2 className="mr-2" size={16} />
          Pause Campaign
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CampaignsContent;