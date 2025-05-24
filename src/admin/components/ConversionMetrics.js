import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  Tooltip,
  styled
} from "@mui/material";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiPieChart,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiBarChart2,
  FiChevronDown
} from "react-icons/fi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { FaRupeeSign } from "react-icons/fa";

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const statusColors = {
  "closed-won": "success",
  "closed-lost": "error",
  "new": "primary",
  "contacted": "secondary",
  "proposal-sent": "info",
  "negotiation": "warning"
};

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B'];

const ConversionMetrics = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedService, setSelectedService] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [stats, setStats] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    totalRevenue: 0,
    avgDealSize: 0
  });
  const [sources, setSources] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const leadsQuery = query(collection(db, "leads"));
        const leadsSnapshot = await getDocs(leadsQuery);
        
        const leadsData = [];
        const sourcesSet = new Set();
        const servicesSet = new Set();
        let totalRevenue = 0;
        let convertedCount = 0;

        leadsSnapshot.forEach(doc => {
          const lead = { id: doc.id, ...doc.data() };
          leadsData.push(lead);
          
          if (lead.leadSource) sourcesSet.add(lead.leadSource);
          if (lead.service) servicesSet.add(lead.service);
          
          if (lead.status === "closed-won" && lead.budget) {
            totalRevenue += parseInt(lead.budget) || 0;
            convertedCount++;
          }
        });

        setLeads(leadsData);
        setSources(Array.from(sourcesSet));
        setServices(Array.from(servicesSet));
        
        const totalLeads = leadsData.length;
        const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;
        const avgDealSize = convertedCount > 0 ? Math.round(totalRevenue / convertedCount) : 0;
        
        setStats({
          totalLeads,
          convertedLeads: convertedCount,
          conversionRate,
          totalRevenue,
          avgDealSize
        });
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    // Implement refresh logic
  };

  // Filter leads based on selected filters
  const filteredLeads = leads.filter(lead => {
    const matchesTimeRange = true; // Implement time range filtering logic
    const matchesSource = selectedSource === "All" || lead.leadSource === selectedSource;
    const matchesService = selectedService === "All" || lead.service === selectedService;
    const matchesSearch = searchTerm === "" || 
      lead.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTimeRange && matchesSource && matchesService && matchesSearch;
  });

  // Prepare data for charts
  const getConversionData = () => {
    const statusCounts = {
      "closed-won": 0,
      "closed-lost": 0,
      "new": 0,
      "contacted": 0,
      "proposal-sent": 0,
      "negotiation": 0
    };

    filteredLeads.forEach(lead => {
      if (statusCounts.hasOwnProperty(lead.status)) {
        statusCounts[lead.status]++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  };

  const getSourceData = () => {
    const sourceMap = {};
    
    sources.forEach(source => {
      sourceMap[source] = filteredLeads.filter(lead => lead.leadSource === source).length;
    });
    
    return Object.entries(sourceMap).map(([name, value]) => ({ name, value }));
  };

  const getRevenueByService = () => {
    const serviceRevenue = {};
    
    services.forEach(service => {
      const serviceLeads = filteredLeads.filter(lead => 
        lead.service === service && lead.status === "closed-won"
      );
      serviceRevenue[service] = serviceLeads.reduce(
        (sum, lead) => sum + (parseInt(lead.budget) || 0), 
        0 // Initial value
      );
    });
    
    return Object.entries(serviceRevenue).map(([name, value]) => ({ name, value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const conversionData = getConversionData();
  const sourceData = getSourceData();
  const revenueData = getRevenueByService();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Conversion Metrics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FiDownload />}
            sx={{
              textTransform: 'none',
              color: '#64748b',
              borderColor: '#e2e8f0',
              '&:hover': { borderColor: '#cbd5e1' }
            }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw />}
            onClick={handleRefresh}
            sx={{
              textTransform: 'none',
              color: '#64748b',
              borderColor: '#e2e8f0',
              '&:hover': { borderColor: '#cbd5e1' }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <TextField
          size="small"
          placeholder="Search leads..."
          InputProps={{
            startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
          }}
          sx={{
            width: 300,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            endIcon={<FiChevronDown />}
            onClick={handleFilterClick}
            sx={{
              textTransform: 'none',
              color: '#64748b',
              borderColor: '#e2e8f0',
              '&:hover': { borderColor: '#cbd5e1' }
            }}
          >
            Filters
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="90days">Last 90 Days</MenuItem>
                  <MenuItem value="year">This Year</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Lead Source</InputLabel>
                <Select
                  value={selectedSource}
                  label="Lead Source"
                  onChange={(e) => setSelectedSource(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="All">All Sources</MenuItem>
                  {sources.map(source => (
                    <MenuItem key={source} value={source}>{source}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Service</InputLabel>
                <Select
                  value={selectedService}
                  label="Service"
                  onChange={(e) => setSelectedService(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="All">All Services</MenuItem>
                  {services.map(service => (
                    <MenuItem key={service} value={service}>{service}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#E0F2FE', color: '#0EA5E9', mr: 2 }}>
                  <FiUsers size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Leads
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.totalLeads}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{
                  height: 4,
                  backgroundColor: '#E0F2FE',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#0EA5E9' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#D1FAE5', color: '#10B981', mr: 2 }}>
                  <FiTrendingUp size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Converted Leads
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.convertedLeads}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.convertedLeads / stats.totalLeads) * 100 || 0}
                sx={{
                  height: 4,
                  backgroundColor: '#D1FAE5',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10B981' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#FEF3C7', color: '#F59E0B', mr: 2 }}>
                  <FiPieChart size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Conversion Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.conversionRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.conversionRate}
                sx={{
                  height: 4,
                  backgroundColor: '#FEF3C7',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#F59E0B' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#EDE9FE', color: '#8B5CF6', mr: 2 }}>
                  <FaRupeeSign size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{
                  height: 4,
                  backgroundColor: '#EDE9FE',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#8B5CF6' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#DBEAFE', color: '#3B82F6', mr: 2 }}>
                  <FiBarChart2 size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Avg Deal Size
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatCurrency(stats.avgDealSize)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{
                  height: 4,
                  backgroundColor: '#DBEAFE',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#3B82F6' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Lead Status Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, name, props) => [`${value} leads`, name.replace(/-/g, ' ')]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Revenue by Service
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <RechartsTooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `Service: ${label}`}
                  />
                  <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Conversions */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Recent Conversions
          </Typography>
          <Button
            size="small"
            sx={{ textTransform: 'none', color: '#4F46E5' }}
          >
            View All
          </Button>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <StyledTableCell>Lead</StyledTableCell>
                <StyledTableCell>Company</StyledTableCell>
                <StyledTableCell>Service</StyledTableCell>
                <StyledTableCell>Source</StyledTableCell>
                <StyledTableCell>Value</StyledTableCell>
                <StyledTableCell>Converted On</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>Loading data...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.filter(lead => lead.status === "closed-won").slice(0, 5).map((lead) => (
                <TableRow key={lead.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ width: 36, height: 36, mr: 2, bgcolor: '#E0E7FF', color: '#4F46E5' }}
                      >
                        {lead.fullName?.charAt(0) || 'L'}
                      </Avatar>
                      <Box>
                        <Typography fontWeight="medium">{lead.fullName || 'No Name'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.email || 'No Email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{lead.company || 'N/A'}</TableCell>
                  <TableCell>{lead.service || 'N/A'}</TableCell>
                  <TableCell>{lead.leadSource || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {lead.budget ? formatCurrency(parseInt(lead.budget)) : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {lead.convertedDate ? new Date(lead.convertedDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={lead.status.replace(/-/g, ' ')} 
                      size="small"
                      color={statusColors[lead.status]}
                      sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ConversionMetrics;