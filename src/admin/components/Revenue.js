import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Alert,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiBarChart2,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiUser,
  FiCreditCard,
  FiFileText,
  FiGlobe,
  FiPhone,
  FiMail,
  FiMapPin,
  FiChevronDown
} from 'react-icons/fi';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format, subMonths, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const RevenueProfitAnalysis = () => {
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('last3months');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedProjectType, setSelectedProjectType] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Time range options
  const timeRangeOptions = [
    { value: 'lastmonth', label: 'Last Month' },
    { value: 'last3months', label: 'Last 3 Months' },
    { value: 'last6months', label: 'Last 6 Months' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'all', label: 'All Time' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch transactions
        const transactionsQuery = query(
          collection(db, "platform-transactions"),
          orderBy("timestamp", "desc")
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => {
          const data = doc.data();
          const timestamp = data.timestamp ? 
            (typeof data.timestamp === 'string' ? parseISO(data.timestamp) : data.timestamp.toDate()) : 
            null;
          
          return {
            id: doc.id,
            ...data,
            formattedDate: timestamp ? format(timestamp, 'dd MMM yyyy') : 'N/A',
            monthYear: timestamp ? format(timestamp, 'MMM yyyy') : 'N/A',
            isRevenue: true
          };
        });

        // Fetch projects
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("status", "!=", "cancelled")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => {
          const data = doc.data();
          const createdAt = data.createdAt ? 
            (typeof data.createdAt === 'string' ? parseISO(data.createdAt) : data.createdAt.toDate()) : 
            null;
          
          return {
            id: doc.id,
            ...data,
            formattedDate: createdAt ? format(createdAt, 'dd MMM yyyy') : 'N/A',
            monthYear: createdAt ? format(createdAt, 'MMM yyyy') : 'N/A',
            amount: data.budget ? parseInt(data.budget) : 0,
            isRevenue: false
          };
        });

        setTransactions(transactionsData);
        setProjects(projectsData);
        setLoading(false);
      } catch (err) {
        alert(err)
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filterData = () => {
      let filteredTxns = transactions;
      let filteredProjs = projects;
    
      // Apply time range filter
      const now = new Date();
      let cutoffDate;
      
      switch (timeRange) {
        case 'lastmonth':
          cutoffDate = subMonths(now, 1);
          break;
        case 'last3months':
          cutoffDate = subMonths(now, 3);
          break;
        case 'last6months':
          cutoffDate = subMonths(now, 6);
          break;
        case 'lastyear':
          cutoffDate = subMonths(now, 12);
          break;
        default:
          cutoffDate = null;
      }
    
      // Date filtering with proper type checking
      if (cutoffDate) {
        filteredTxns = filteredTxns.filter(txn => {
          if (!txn.timestamp) return false;
          
          try {
            const txnDate = typeof txn.timestamp === 'string' ? 
              parseISO(txn.timestamp) : 
              txn.timestamp?.toDate?.() || txn.timestamp;
            
            return txnDate >= cutoffDate;
          } catch (error) {
            console.error('Error processing transaction date:', error);
            return false;
          }
        });
        
        filteredProjs = filteredProjs.filter(proj => {
          if (!proj.createdAt) return false;
          
          try {
            const projDate = typeof proj.createdAt === 'string' ? 
              parseISO(proj.createdAt) : 
              proj.createdAt?.toDate?.() || proj.createdAt;
            
            return projDate >= cutoffDate;
          } catch (error) {
            console.error('Error processing project date:', error);
            return false;
          }
        });
      }
    
      // Apply client filter
      if (selectedClient !== 'all') {
        filteredTxns = filteredTxns.filter(txn => 
          txn.clientId === selectedClient
        );
        filteredProjs = filteredProjs.filter(proj => 
          proj.clientId === selectedClient
        );
      }
    
      // Apply project type filter
      if (selectedProjectType !== 'all') {
        filteredTxns = filteredTxns.filter(txn => 
          txn.projectType === selectedProjectType
        );
        filteredProjs = filteredProjs.filter(proj => 
          proj.type === selectedProjectType
        );
      }
    
      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredTxns = filteredTxns.filter(txn => 
          txn.clientName?.toLowerCase().includes(term) ||
          txn.projectTitle?.toLowerCase().includes(term) ||
          txn.invoiceNumber?.toLowerCase().includes(term)
        );
        filteredProjs = filteredProjs.filter(proj => 
          proj.clientName?.toLowerCase().includes(term) ||
          proj.title?.toLowerCase().includes(term) ||
          proj.company?.toLowerCase().includes(term)
        );
      }
    
      setFilteredTransactions(filteredTxns);
      setFilteredProjects(filteredProjs);
    };

    filterData();
  }, [transactions, projects, timeRange, selectedClient, selectedProjectType, searchTerm]);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTransaction(null);
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Re-fetch data
      const transactionsQuery = query(
        collection(db, "platform-transactions"),
        orderBy("timestamp", "desc")
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().timestamp ? format(parseISO(doc.data().timestamp), 'dd MMM yyyy') : 'N/A',
        monthYear: doc.data().timestamp ? format(parseISO(doc.data().timestamp), 'MMM yyyy') : 'N/A',
        isRevenue: true
      }));

      const projectsQuery = query(
        collection(db, "dxd-magnate-projects"),
        where("status", "!=", "cancelled")
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          formattedDate: data.createdAt ? format(parseISO(data.createdAt), 'dd MMM yyyy') : 'N/A',
          monthYear: data.createdAt ? format(parseISO(data.createdAt), 'MMM yyyy') : 'N/A',
          amount: data.budget ? parseInt(data.budget) : 0,
          isRevenue: false
        };
      });

      setTransactions(transactionsData);
      setProjects(projectsData);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Prepare data for charts
  const prepareChartData = () => {
    const allData = [...filteredTransactions, ...filteredProjects];
    const monthlyData = {};
    
    allData.forEach(item => {
      const key = item.monthYear;
      if (!key) return;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          name: key,
          revenue: 0,
          potential: 0
        };
      }
      
      if (item.isRevenue) {
        monthlyData[key].revenue += item.amount || 0;
      } else {
        monthlyData[key].potential += item.amount || 0;
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => {
      return new Date(a.name) - new Date(b.name);
    });
  };

  const chartData = prepareChartData();

  const revenueByType = filteredTransactions.reduce((acc, txn) => {
    const type = txn.projectType || 'Other';
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += txn.amount || 0;
    return acc;
  }, {});

  const pieData = Object.entries(revenueByType).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Get unique clients for filter dropdown
  const uniqueClients = [...new Set([
    ...transactions.map(t => ({ id: t.clientId, name: t.clientName })),
    ...projects.map(p => ({ id: p.clientId, name: p.clientName || p.company }))
  ].filter(c => c.id))];

  // Get unique project types for filter dropdown
  const uniqueProjectTypes = [...new Set([
    ...transactions.map(t => t.projectType),
    ...projects.map(p => p.type)
  ].filter(Boolean))];

  // Calculate totals
  const totalRevenue = filteredTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
  const totalPotential = filteredProjects.reduce((sum, proj) => sum + (proj.amount || 0), 0);
  const avgRevenuePerProject = filteredTransactions.length > 0 
    ? totalRevenue / filteredTransactions.length 
    : 0;

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Revenue & Profit Analysis
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading financial data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Revenue & Profit Analysis
          </Typography>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="space-y-6">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Revenue & Profit Analysis
        </Typography>
        <Button
          variant="text"
          onClick={refreshData}
          startIcon={<FiRefreshCw />}
          sx={{
            textTransform: 'none',
            color: '#4F46E5',
            '&:hover': { backgroundColor: '#EEF2FF' }
          }}
        >
          Refresh Data
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Comprehensive financial performance metrics and analytics
      </Typography>

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          mb: 3
        }}
      >
        <Tab label="Overview" />
        <Tab label="Transactions" />
        <Tab label="Projects" />
      </Tabs>

      {/* Filters */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={2} mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch color="#64748B" />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: 'white',
              borderRadius: 1,
              '& fieldset': {
                borderColor: '#E2E8F0',
              },
            }
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            {timeRangeOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Client</InputLabel>
          <Select
            value={selectedClient}
            label="Client"
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <MenuItem value="all">All Clients</MenuItem>
            {uniqueClients.map(client => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Project Type</InputLabel>
          <Select
            value={selectedProjectType}
            label="Project Type"
            onChange={(e) => setSelectedProjectType(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            {uniqueProjectTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {tabValue === 0 && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    TOTAL REVENUE
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                      ₹{totalRevenue.toLocaleString()}
                    </Typography>
                    <Avatar sx={{ bgcolor: '#10B98110' }}>
                      <FiTrendingUp size={20} color="#10B981" />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    From {filteredTransactions.length} transactions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    POTENTIAL REVENUE
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3B82F6' }}>
                      ₹{totalPotential.toLocaleString()}
                    </Typography>
                    <Avatar sx={{ bgcolor: '#3B82F610' }}>
                      <FiBarChart2 size={20} color="#3B82F6" />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    From {filteredProjects.length} projects
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    AVG REVENUE PER PROJECT
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      ₹{avgRevenuePerProject.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </Typography>
                    <Avatar sx={{ bgcolor: '#F59E0B10' }}>
                      <FiPieChart size={20} color="#F59E0B" />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Based on completed projects
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    TOP PROJECT TYPE
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {pieData.length > 0 ? pieData[0].name : 'N/A'}
                    </Typography>
                    <Avatar sx={{ bgcolor: '#8B5CF610' }}>
                      <FiDollarSign size={20} color="#8B5CF6" />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {pieData.length > 0 ? `₹${pieData[0].value.toLocaleString()}` : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Monthly Revenue vs Potential
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" stroke="#64748B" />
                        <YAxis stroke="#64748B" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" name="Actual Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="potential" name="Potential Revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Revenue by Project Type
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {tabValue === 1 && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
              Revenue Transactions
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((txn) => (
                    <TableRow key={txn.id} hover>
                      <TableCell>{txn.invoiceNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {txn.clientName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {txn.clientEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {txn.projectTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {txn.projectType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <FiCalendar size={16} style={{ marginRight: 8, color: '#64748b' }} />
                          <Typography variant="body2">
                            {txn.formattedDate}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <FiDollarSign size={16} style={{ marginRight: 8, color: '#64748b' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            ₹{txn.amount?.toLocaleString() || '0'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={txn.type?.replace('_', ' ') || 'N/A'} 
                          size="small"
                          sx={{ 
                            backgroundColor: '#E0E7FF',
                            color: '#4F46E5',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={txn.status || 'N/A'} 
                          size="small"
                          sx={{ 
                            backgroundColor: txn.status === 'completed' ? '#10B98110' : '#F59E0B10',
                            color: txn.status === 'completed' ? '#10B981' : '#F59E0B',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(txn)}
                          sx={{ 
                            textTransform: 'none',
                            borderColor: '#E2E8F0',
                            '&:hover': { borderColor: '#CBD5E1' }
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 3 }}>
              Potential Revenue Projects
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Budget</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.map((proj) => (
                    <TableRow key={proj.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {proj.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {proj.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {proj.clientName || proj.company}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {proj.projectManager || 'No manager'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <FiDollarSign size={16} style={{ marginRight: 8, color: '#64748b' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            ₹{proj.amount?.toLocaleString() || '0'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <FiCalendar size={16} style={{ marginRight: 8, color: '#64748b' }} />
                          <Typography variant="body2">
                            {proj.startDate} - {proj.endDate}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={proj.status || 'N/A'} 
                          size="small"
                          sx={{ 
                            backgroundColor: proj.status === 'Completed' ? '#10B98110' : 
                                          proj.status === 'In Progress' ? '#3B82F610' : '#F59E0B10',
                            color: proj.status === 'Completed' ? '#10B981' : 
                                  proj.status === 'In Progress' ? '#3B82F6' : '#F59E0B',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={proj.type || 'N/A'} 
                          size="small"
                          sx={{ 
                            backgroundColor: '#E0E7FF',
                            color: '#4F46E5',
                            fontWeight: 'medium'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(proj)}
                          sx={{ 
                            textTransform: 'none',
                            borderColor: '#E2E8F0',
                            '&:hover': { borderColor: '#CBD5E1' }
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Transaction/Project Detail Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {selectedTransaction?.isRevenue ? 'Transaction Details' : 'Project Details'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransaction && (
            <Box>
              <Box display="flex" justifyContent="space-between" mb={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    {selectedTransaction.isRevenue ? 'INVOICE NUMBER' : 'PROJECT ID'}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {selectedTransaction.isRevenue ? 
                      selectedTransaction.invoiceNumber : 
                      selectedTransaction.id}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    DATE
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {selectedTransaction.formattedDate}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box mb={4}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  CLIENT INFORMATION
                </Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2,
                    bgcolor: stringToColor(selectedTransaction.clientName)
                  }}>
                    {getProfileInitials(selectedTransaction.clientName)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {selectedTransaction.clientName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedTransaction.clientEmail}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <Box display="flex" alignItems="center">
                    <FiMail size={16} style={{ marginRight: 8, color: '#64748b' }} />
                    <Typography variant="body2">
                      {selectedTransaction.clientEmail}
                    </Typography>
                  </Box>
                  {selectedTransaction.clientPhone && (
                    <Box display="flex" alignItems="center">
                      <FiPhone size={16} style={{ marginRight: 8, color: '#64748b' }} />
                      <Typography variant="body2">
                        {selectedTransaction.clientPhone}
                      </Typography>
                    </Box>
                  )}
                  {selectedTransaction.clientAddress && (
                    <Box display="flex" alignItems="center">
                      <FiMapPin size={16} style={{ marginRight: 8, color: '#64748b' }} />
                      <Typography variant="body2">
                        {selectedTransaction.clientAddress}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box mb={4}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  {selectedTransaction.isRevenue ? 'PAYMENT DETAILS' : 'PROJECT DETAILS'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Project:</strong> {selectedTransaction.projectTitle || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type:</strong> {selectedTransaction.projectType || selectedTransaction.type || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Amount:</strong> ₹{selectedTransaction.amount?.toLocaleString() || '0'}
                    </Typography>
                    {selectedTransaction.isRevenue ? (
                      <>
                        <Typography variant="body2">
                          <strong>Payment Method:</strong> {selectedTransaction.paymentMethod || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong> 
                          <Chip 
                            label={selectedTransaction.status} 
                            size="small"
                            sx={{ 
                              ml: 1,
                              backgroundColor: selectedTransaction.status === 'completed' ? '#10B98110' : '#F59E0B10',
                              color: selectedTransaction.status === 'completed' ? '#10B981' : '#F59E0B',
                              fontWeight: 'medium'
                            }}
                          />
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2">
                          <strong>Status:</strong> 
                          <Chip 
                            label={selectedTransaction.status} 
                            size="small"
                            sx={{ 
                              ml: 1,
                              backgroundColor: selectedTransaction.status === 'Completed' ? '#10B98110' : 
                                            selectedTransaction.status === 'In Progress' ? '#3B82F610' : '#F59E0B10',
                              color: selectedTransaction.status === 'Completed' ? '#10B981' : 
                                    selectedTransaction.status === 'In Progress' ? '#3B82F6' : '#F59E0B',
                              fontWeight: 'medium'
                            }}
                          />
                        </Typography>
                        <Typography variant="body2">
                          <strong>Manager:</strong> {selectedTransaction.projectManager || 'Not assigned'}
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
              </Box>
              
              {selectedTransaction.isRevenue && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" mb={1}>
                      ADDITIONAL INFORMATION
                    </Typography>
                    <Typography variant="body2">
                      <strong>Payment ID:</strong> {selectedTransaction.paymentId || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Platform Fee:</strong> ₹{selectedTransaction.platformFee?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Tax Amount:</strong> ₹{selectedTransaction.taxAmount?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: '#64748B',
              '&:hover': { backgroundColor: '#F1F5F9' }
            }}
          >
            Close
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (selectedTransaction.isRevenue) {
                // Handle download receipt
              } else {
                // Handle view project
              }
            }}
            sx={{ 
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            {selectedTransaction?.isRevenue ? 'Download Receipt' : 'View Project'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Helper functions
const stringToColor = (string) => {
  let hash = 0;
  let i;
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const getProfileInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.map(n => n[0]).join('').toUpperCase();
};

export default RevenueProfitAnalysis;