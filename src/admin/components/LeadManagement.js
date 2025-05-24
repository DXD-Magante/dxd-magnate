import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Avatar, AvatarGroup, 
  Button, Chip, Divider, TextField,
  Menu, MenuItem, Badge, Tooltip,
  LinearProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Dialog,
  DialogTitle, DialogContent, DialogActions,
  InputLabel, Select, FormControl, Card,
  CardContent, Grid, Stack, IconButton,
  Snackbar, Alert,
  CircularProgress
} from "@mui/material";
import { 
  FiEdit2, FiEye, FiPlus, FiFilter, 
  FiCalendar, FiUser, FiClock, FiAlertTriangle,
  FiCheckCircle, FiPieChart, FiUsers, FiSearch,
  FiDollarSign, FiTrendingUp, FiTrendingDown,
  FiTrash2, FiChevronDown, FiMail, FiPhone,
  FiBriefcase, FiX, FiCheck
} from "react-icons/fi";
import { styled } from '@mui/material/styles';
import { db, auth } from "../../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

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

const AdminLeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedSalesRep, setSelectedSalesRep] = useState("All");
  const [salesReps, setSalesReps] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    proposalSent: 0,
    negotiation: 0,
    closedWon: 0,
    closedLost: 0
  });

  // Fetch all leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const leadsQuery = query(collection(db, "leads"));
        const leadsSnapshot = await getDocs(leadsQuery);
        
        const leadsData = [];
        const statsData = {
          total: 0,
          new: 0,
          contacted: 0,
          proposalSent: 0,
          negotiation: 0,
          closedWon: 0,
          closedLost: 0
        };

        leadsSnapshot.forEach(doc => {
          const lead = { id: doc.id, ...doc.data() };
          leadsData.push(lead);
          statsData.total++;
          statsData[lead.status] = (statsData[lead.status] || 0) + 1;
        });

        setLeads(leadsData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching leads:", error);
        setSnackbarMessage("Failed to load leads");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    // Fetch sales reps
    const fetchSalesReps = async () => {
      try {
        const usersQuery = query(collection(db, "users"), where("role", "==", "sales"));
        const usersSnapshot = await getDocs(usersQuery);
        
        const reps = [];
        usersSnapshot.forEach(doc => {
          reps.push({ id: doc.id, ...doc.data() });
        });
        
        setSalesReps(reps);
      } catch (error) {
        console.error("Error fetching sales reps:", error);
      }
    };

    fetchLeads();
    fetchSalesReps();
  }, []);

  // Handle filter menu
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle lead status update
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await updateDoc(doc(db, "leads", leadId), {
        status: newStatus
      });
      
      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      setSnackbarMessage("Lead status updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating lead status:", error);
      setSnackbarMessage("Failed to update lead status");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Handle lead deletion
  const handleDeleteLead = async (leadId) => {
    try {
      await deleteDoc(doc(db, "leads", leadId));
      
      // Update local state
      setLeads(leads.filter(lead => lead.id !== leadId));
      
      setSnackbarMessage("Lead deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error deleting lead:", error);
      setSnackbarMessage("Failed to delete lead");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || lead.status === selectedStatus;
    const matchesPriority = selectedPriority === "All" || lead.priority === selectedPriority;
    const matchesSalesRep = selectedSalesRep === "All" || lead.assignedTo === selectedSalesRep;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesSalesRep;
  });

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredLeads.length - page * rowsPerPage);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          Lead Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<FiPlus />}
          sx={{ 
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            textTransform: 'none',
            fontWeight: 'medium'
          }}
        >
          Add New Lead
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Leads
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ 
                  height: 4, 
                  mt: 1,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#64748b' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                New Leads
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.new}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.new / stats.total) * 100 || 0} 
                sx={{ 
                  height: 4, 
                  mt: 1,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#3b82f6' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Contacted
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.contacted}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.contacted / stats.total) * 100 || 0} 
                sx={{ 
                  height: 4, 
                  mt: 1,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Proposal Sent
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.proposalSent}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.proposalSent / stats.total) * 100 || 0} 
                sx={{ 
                  height: 4, 
                  mt: 1,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#0ea5e9' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Closed Won
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.closedWon}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.closedWon / stats.total) * 100 || 0} 
                sx={{ 
                  height: 4, 
                  mt: 1,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10b981' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Closed Lost
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {stats.closedLost}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(stats.closedLost / stats.total) * 100 || 0} 
                sx={{ 
                  height: 4, 
                  mt: 1,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#ef4444' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
        <Box>
          <Button
            variant="outlined"
            startIcon={<FiFilter />}
            onClick={handleFilterClick}
            sx={{ 
              textTransform: 'none',
              color: '#64748b',
              borderColor: '#e2e8f0',
              '&:hover': { borderColor: '#cbd5e1' },
              mr: 2
            }}
          >
            Filters
          </Button>
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{ minWidth: 120 }}
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
            </MenuItem>
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={selectedPriority}
                  label="Priority"
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="All">All Priorities</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem>
              <FormControl fullWidth size="small">
                <InputLabel>Sales Rep</InputLabel>
                <Select
                  value={selectedSalesRep}
                  label="Sales Rep"
                  onChange={(e) => setSelectedSalesRep(e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="All">All Reps</MenuItem>
                  {salesReps.map(rep => (
                    <MenuItem key={rep.id} value={rep.id}>
                      {rep.displayName || rep.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Leads Table */}
      <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <StyledTableCell>Lead</StyledTableCell>
                <StyledTableCell>Company</StyledTableCell>
                <StyledTableCell>Contact</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Priority</StyledTableCell>
                <StyledTableCell>Value</StyledTableCell>
                <StyledTableCell>Assigned To</StyledTableCell>
                <StyledTableCell>Created</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((lead) => (
                  <TableRow key={lead.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ width: 36, height: 36, mr: 2, bgcolor: '#e0e7ff', color: '#4f46e5' }}
                          src={lead.photoURL}
                        >
                          {lead.fullName?.charAt(0) || 'L'}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">{lead.fullName || 'No Name'}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {lead.title || 'No Title'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography>{lead.company || 'N/A'}</Typography>
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
                      <Chip 
                        label={lead.status.replace(/-/g, ' ')} 
                        size="small"
                        color={statusColors[lead.status] || "default"}
                        sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={lead.priority} 
                        size="small"
                        color={priorityColors[lead.priority] || "default"}
                        sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium" color="success.main">
                        {lead.budget ? `$${parseInt(lead.budget).toLocaleString()}` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {lead.assignedTo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ width: 28, height: 28, mr: 1, fontSize: '0.75rem' }}
                            src={salesReps.find(r => r.id === lead.assignedTo)?.photoURL}
                          >
                            {salesReps.find(r => r.id === lead.assignedTo)?.firstName?.charAt(0) || 'S'}
                            {salesReps.find(r => r.id === lead.assignedTo)?.lastName?.charAt(0) || 'R'}
                          </Avatar>
                          <Typography variant="body2">
                            {salesReps.find(r => r.id === lead.assignedTo)?.firstName || 'Sales'}
                            {salesReps.find(r => r.id === lead.assignedTo)?.lastName || 'Rep'}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(lead.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
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
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLead(lead.id)}
                            sx={{ 
                              color: '#ef4444',
                              '&:hover': { backgroundColor: '#fee2e2' }
                            }}
                          >
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
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
              {emptyRows > 0 && (
                <TableRow style={{ height: 73 * emptyRows }}>
                  <TableCell colSpan={9} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLeads.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
      </Paper>

      {/* Lead Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
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
            {selectedLead?.fullName || 'Lead Details'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedLead && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Basic Information
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography>{selectedLead.fullName || 'N/A'}</Typography>
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
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Lead Details
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip 
                      label={selectedLead.status.replace(/-/g, ' ')} 
                      color={statusColors[selectedLead.status] || "default"}
                      sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Priority
                  </Typography>
                  <Box>
                    <Chip 
                      label={selectedLead.priority} 
                      color={priorityColors[selectedLead.priority] || "default"}
                      sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                    />
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Budget
                  </Typography>
                  <Typography fontWeight="medium">
                    {selectedLead.budget ? `$${parseInt(selectedLead.budget).toLocaleString()}` : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Assigned To
                  </Typography>
                  {selectedLead.assignedTo ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Avatar 
                        sx={{ width: 32, height: 32, mr: 1.5, fontSize: '0.875rem' }}
                        src={salesReps.find(r => r.id === selectedLead.assignedTo)?.photoURL}
                      >
                        {salesReps.find(r => r.id === selectedLead.assignedTo)?.displayName?.charAt(0) || 'R'}
                      </Avatar>
                      <Typography>
                        {salesReps.find(r => r.id === selectedLead.assignedTo)?.displayName || 'Sales Rep'}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Unassigned
                    </Typography>
                  )}
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography>{formatDate(selectedLead.createdAt)}</Typography>
                </Box>
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
          )}
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
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>  
);
};

export default AdminLeadManagement;