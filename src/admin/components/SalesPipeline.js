import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  useTheme
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiMessageSquare,
  FiCreditCard,
  FiActivity,
  FiEye,
  FiUsers,
  FiDollarSign,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiTrendingDown
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import { styled } from '@mui/material/styles';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from "recharts";

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const statusColors = {
  "new": "primary",
  "contacted": "secondary",
  "proposal-sent": "info",
  "negotiation": "warning",
  "closed-won": "success",
  "closed-lost": "error"
};

const priorityColors = {
  "high": "error",
  "medium": "warning",
  "low": "success"
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const SalesPipeline = () => {
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30days");
  const [selectedLead, setSelectedLead] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    proposalSent: 0,
    negotiation: 0,
    closedWon: 0,
    closedLost: 0,
    totalValue: 0,
    avgDealSize: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch leads
        const leadsQuery = query(collection(db, "leads"));
        const leadsSnapshot = await getDocs(leadsQuery);
        
        // Fetch projects
        const projectsQuery = query(collection(db, "dxd-magnate-projects"));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const leadsData = [];
        const projectsData = [];
        const statsData = {
          total: 0,
          new: 0,
          contacted: 0,
          proposalSent: 0,
          negotiation: 0,
          closedWon: 0,
          closedLost: 0,
          totalValue: 0,
          avgDealSize: 0
        };

        leadsSnapshot.forEach(doc => {
          const lead = { id: doc.id, ...doc.data() };
          leadsData.push(lead);
          statsData.total++;
          statsData[lead.status] = (statsData[lead.status] || 0) + 1;
          
          if (lead.status === "closed-won" && lead.budget) {
            statsData.totalValue += parseInt(lead.budget) || 0;
            statsData.closedWon++;
          }
        });

        projectsSnapshot.forEach(doc => {
          projectsData.push({ id: doc.id, ...doc.data() });
        });

        setLeads(leadsData);
        setProjects(projectsData);
        
        // Calculate average deal size
        statsData.avgDealSize = statsData.closedWon > 0 
          ? Math.round(statsData.totalValue / statsData.closedWon) 
          : 0;
        
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || lead.status === selectedStatus;
    const matchesPriority = selectedPriority === "All" || lead.priority === selectedPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Prepare data for charts
  const getPipelineData = () => {
    const stages = {
      "new": 0,
      "contacted": 0,
      "proposal-sent": 0,
      "negotiation": 0,
      "closed-won": 0,
      "closed-lost": 0
    };

    filteredLeads.forEach(lead => {
      if (stages.hasOwnProperty(lead.status)) {
        stages[lead.status]++;
      }
    });

    return Object.entries(stages).map(([name, value]) => ({ name, value }));
  };

  const getRevenueByStage = () => {
    const revenueStages = {
      "new": 0,
      "contacted": 0,
      "proposal-sent": 0,
      "negotiation": 0,
      "closed-won": 0,
      "closed-lost": 0
    };

    filteredLeads.forEach(lead => {
      if (revenueStages.hasOwnProperty(lead.status) && lead.budget) {
        revenueStages[lead.status] += parseInt(lead.budget) || 0;
      }
    });

    return Object.entries(revenueStages).map(([name, value]) => ({ 
      name, 
      value: value / 100000 // Convert to lakhs for better display
    }));
  };

  const pipelineData = getPipelineData();
  const revenueData = getRevenueByStage();

  const theme = useTheme();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Sales Pipeline
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
            onClick={() => window.location.reload()}
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
                {stats.total}
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
                  Closed Won
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.closedWon}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.closedWon / stats.total) * 100 || 0}
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
                  Win Rate
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.total > 0 ? Math.round((stats.closedWon / stats.total) * 100) : 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={stats.total > 0 ? Math.round((stats.closedWon / stats.total) * 100) : 0}
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
                  Total Value
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {formatCurrency(stats.totalValue)}
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

      {/* Pipeline Visualization */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Pipeline Stages
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pipelineData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B"
                    tickFormatter={(value) => value.replace(/-/g, ' ')}
                  />
                  <YAxis stroke="#64748B" />
                  <RechartsTooltip 
                    formatter={(value) => [`${value} leads`, 'Count']}
                    labelFormatter={(label) => `Stage: ${label.replace(/-/g, ' ')}`}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#4F46E5" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Revenue Potential by Stage (in Lakhs)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name.replace(/-/g, ' ')}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`₹${(value * 100000).toLocaleString()}`, 'Potential Revenue']}
                    labelFormatter={(label) => `Stage: ${label.replace(/-/g, ' ')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Pipeline Stages Stepper */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 3 }}>
          Sales Pipeline Stages
        </Typography>
        <Stepper alternativeLabel activeStep={4} sx={{ width: '100%' }}>
          <Step>
            <StepLabel>New Lead</StepLabel>
          </Step>
          <Step>
            <StepLabel>Contacted</StepLabel>
          </Step>
          <Step>
            <StepLabel>Proposal Sent</StepLabel>
          </Step>
          <Step>
            <StepLabel>Negotiation</StepLabel>
          </Step>
          <Step>
            <StepLabel>Closed Won</StepLabel>
          </Step>
        </Stepper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {stats.new} New Leads
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.contacted} Contacted
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.proposalSent} Proposals Sent
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.negotiation} In Negotiation
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.closedWon} Closed Won
          </Typography>
        </Box>
      </Card>

      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
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
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="contacted">Contacted</MenuItem>
              <MenuItem value="proposal-sent">Proposal Sent</MenuItem>
              <MenuItem value="negotiation">Negotiation</MenuItem>
              <MenuItem value="closed-won">Closed Won</MenuItem>
              <MenuItem value="closed-lost">Closed Lost</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={selectedPriority}
              label="Priority"
              onChange={(e) => setSelectedPriority(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="All">All Priorities</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={selectedTimeframe}
              label="Timeframe"
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Leads Table */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: '1px solid #e2e8f0', px: 3 }}
        >
          <Tab label="All Leads" icon={<FiUsers size={16} />} iconPosition="start" />
          <Tab label="Hot Leads" icon={<FiTrendingUp size={16} />} iconPosition="start" />
          <Tab label="Closed Won" icon={<FiCheckCircle size={16} />} iconPosition="start" />
        </Tabs>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <StyledTableCell>Lead</StyledTableCell>
                <StyledTableCell>Company</StyledTableCell>
                <StyledTableCell>Contact</StyledTableCell>
                <StyledTableCell>Value</StyledTableCell>
                <StyledTableCell>Expected Close</StyledTableCell>
                <StyledTableCell>Stage</StyledTableCell>
                <StyledTableCell>Priority</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>Loading leads...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ width: 36, height: 36, mr: 2, bgcolor: '#E0E7FF', color: '#4F46E5' }}
                        >
                          {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">
                            {lead.fullName || `${lead.firstName} ${lead.lastName}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lead.title || 'No Title'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{lead.company || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <FiMail style={{ marginRight: 8, color: '#64748b' }} size={14} />
                          <Typography variant="body2">{lead.email || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiPhone style={{ marginRight: 8, color: '#64748b' }} size={14} />
                          <Typography variant="body2">{lead.phone || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {lead.budget ? formatCurrency(parseInt(lead.budget)) : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(lead.expectedCloseDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={lead.status.replace(/-/g, ' ')} 
                        size="small"
                        color={statusColors[lead.status]}
                        sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={lead.priority} 
                        size="small"
                        color={priorityColors[lead.priority]}
                        sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLead(lead);
                              setOpenDialog(true);
                            }}
                            sx={{ 
                              color: '#64748b',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <FiEye size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            sx={{ 
                              color: '#64748b',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <FiEdit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Convert to Project">
                          <IconButton
                            size="small"
                            sx={{ 
                              color: '#10B981',
                              '&:hover': { backgroundColor: '#D1FAE5' }
                            }}
                          >
                            <FiCheckCircle size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <FiUsers style={{ color: '#94a3b8', fontSize: 48 }} />
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 'medium', mt: 2 }}>
                        No leads found
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
                        Try adjusting your search or filters
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Lead Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        {selectedLead && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f0',
              py: 2,
              px: 3
            }}>
              <Box sx={{ 
                width: 8, 
                height: 40, 
                backgroundColor: '#4f46e5', 
                borderRadius: 1, 
                mr: 2 
              }} />
              <Typography variant="h6" fontWeight="bold">
                {selectedLead.fullName || `${selectedLead.firstName} ${selectedLead.lastName}`}
              </Typography>
              <Box sx={{ ml: 'auto' }}>
                <Chip 
                  label={selectedLead.status.replace(/-/g, ' ')} 
                  size="small"
                  color={statusColors[selectedLead.status]}
                  sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Lead Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography>
                      {selectedLead.fullName || `${selectedLead.firstName} ${selectedLead.lastName}`}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Company
                    </Typography>
                    <Typography>{selectedLead.company || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Title
                    </Typography>
                    <Typography>{selectedLead.title || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Industry
                    </Typography>
                    <Typography>{selectedLead.industry || 'N/A'}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Contact Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography>{selectedLead.email || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography>{selectedLead.phone || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Lead Source
                    </Typography>
                    <Typography>{selectedLead.leadSource || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Service Interest
                    </Typography>
                    <Typography>{selectedLead.service || 'N/A'}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Sales Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography fontWeight="medium">
                      {selectedLead.budget ? formatCurrency(parseInt(selectedLead.budget)) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Expected Close Date
                    </Typography>
                    <Typography>{formatDate(selectedLead.expectedCloseDate)}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Priority
                    </Typography>
                    <Chip 
                      label={selectedLead.priority} 
                      size="small"
                      color={priorityColors[selectedLead.priority]}
                      sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Project Information
                  </Typography>
                  {projects.filter(p => p.leadId === selectedLead.id).length > 0 ? (
                    projects.filter(p => p.leadId === selectedLead.id).map(project => (
                      <Box key={project.id} sx={{ mb: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                          Project Title
                        </Typography>
                        <Typography fontWeight="medium">{project.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Typography>{project.status}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography>{project.duration}</Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No project created from this lead yet
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Notes
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <Typography>
                      {selectedLead.notes || 'No notes available for this lead.'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
              <Button 
                onClick={() => setOpenDialog(false)}
                sx={{ 
                  color: '#64748b',
                  '&:hover': { backgroundColor: 'transparent' }
                }}
              >
                Close
              </Button>
              <Button 
                variant="contained"
                sx={{ 
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' },
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SalesPipeline;