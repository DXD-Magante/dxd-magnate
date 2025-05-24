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
  Tab
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
  FiUsers
} from "react-icons/fi";
import { styled } from '@mui/material/styles';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const statusColors = {
  "active": "success",
  "inactive": "error",
  "pending": "warning"
};

const roleColors = {
  "client": "primary",
  "admin": "secondary",
  "sales": "info"
};

const ClientOverview = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedClient, setSelectedClient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const clientsQuery = query(collection(db, "users"), where("role", "==", "client"));
        const clientsSnapshot = await getDocs(clientsQuery);
        
        const clientsData = [];
        const statsData = {
          total: 0,
          active: 0,
          inactive: 0,
          pending: 0
        };

        clientsSnapshot.forEach(doc => {
          const client = { id: doc.id, ...doc.data() };
          clientsData.push(client);
          statsData.total++;
          statsData[client.status] = (statsData[client.status] || 0) + 1;
        });

        setClients(clientsData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      await updateDoc(doc(db, "users", clientId), {
        status: newStatus
      });
      
      // Update local state
      setClients(clients.map(client => 
        client.id === clientId ? { ...client, status: newStatus } : client
      ));
    } catch (error) {
      console.error("Error updating client status:", error);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "All" || client.status === selectedStatus;
    const matchesRole = selectedRole === "All" || client.role === selectedRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

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
          Client Overview
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
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#E0F2FE', color: '#0EA5E9', mr: 2 }}>
                  <FiUser size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Clients
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
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#D1FAE5', color: '#10B981', mr: 2 }}>
                  <FiCheckCircle size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Active Clients
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.active}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.active / stats.total) * 100 || 0}
                sx={{
                  height: 4,
                  backgroundColor: '#D1FAE5',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#10B981' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#FEF3C7', color: '#F59E0B', mr: 2 }}>
                  <FiAlertCircle size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Pending Clients
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.pending}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.pending / stats.total) * 100 || 0}
                sx={{
                  height: 4,
                  backgroundColor: '#FEF3C7',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#F59E0B' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#FEE2E2', color: '#EF4444', mr: 2 }}>
                  <FiUser size={20} />
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary">
                  Inactive Clients
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {stats.inactive}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(stats.inactive / stats.total) * 100 || 0}
                sx={{
                  height: 4,
                  backgroundColor: '#FEE2E2',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#EF4444' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <TextField
          size="small"
          placeholder="Search clients..."
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
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value)}
              sx={{ borderRadius: '8px' }}
            >
              <MenuItem value="All">All Roles</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Clients Table */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: '1px solid #e2e8f0', px: 3 }}
        >
          <Tab label="All Clients" icon={<FiUser size={16} />} iconPosition="start" />
          <Tab label="Active" icon={<FiCheckCircle size={16} />} iconPosition="start" />
          <Tab label="Pending" icon={<FiAlertCircle size={16} />} iconPosition="start" />
        </Tabs>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
              <TableRow>
                <StyledTableCell>Client</StyledTableCell>
                <StyledTableCell>Company</StyledTableCell>
                <StyledTableCell>Contact</StyledTableCell>
                <StyledTableCell>Onboarded</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Communication</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography>Loading clients...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ width: 36, height: 36, mr: 2, bgcolor: '#E0E7FF', color: '#4F46E5' }}
                        >
                          {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">
                            {client.firstName} {client.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {client.role}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="medium">{client.company || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <FiMail style={{ marginRight: 8, color: '#64748b' }} size={14} />
                          <Typography variant="body2">{client.email || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiPhone style={{ marginRight: 8, color: '#64748b' }} size={14} />
                          <Typography variant="body2">{client.phone || 'N/A'}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(client.onboardedDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={client.status} 
                        size="small"
                        color={statusColors[client.status]}
                        sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={client.communicationChannel || 'N/A'} 
                        size="small"
                        sx={{ 
                          textTransform: 'capitalize', 
                          fontWeight: 'medium',
                          backgroundColor: '#E0E7FF',
                          color: '#4F46E5'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedClient(client);
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
                        <Tooltip title="Change Status">
                          <IconButton
                            size="small"
                            onClick={() => handleStatusChange(
                              client.id, 
                              client.status === 'active' ? 'inactive' : 'active'
                            )}
                            sx={{ 
                              color: client.status === 'active' ? '#EF4444' : '#10B981',
                              '&:hover': { 
                                backgroundColor: client.status === 'active' ? '#FEE2E2' : '#D1FAE5' 
                              }
                            }}
                          >
                            {client.status === 'active' ? (
                              <FiAlertCircle size={16} />
                            ) : (
                              <FiCheckCircle size={16} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <FiUsers style={{ color: '#94a3b8', fontSize: 48 }} />
                      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 'medium', mt: 2 }}>
                        No clients found
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

      {/* Client Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        {selectedClient && (
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
                {selectedClient.firstName} {selectedClient.lastName}
              </Typography>
              <Box sx={{ ml: 'auto' }}>
                <Chip 
                  label={selectedClient.status} 
                  size="small"
                  color={statusColors[selectedClient.status]}
                  sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Personal Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography>
                      {selectedClient.firstName} {selectedClient.lastName}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography>{selectedClient.email}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography>{selectedClient.phone || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Role
                    </Typography>
                    <Chip 
                      label={selectedClient.role} 
                      size="small"
                      color={roleColors[selectedClient.role]}
                      sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Company Information
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Company Name
                    </Typography>
                    <Typography>{selectedClient.company || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Communication Channel
                    </Typography>
                    <Typography>{selectedClient.communicationChannel || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Onboarded Date
                    </Typography>
                    <Typography>{formatDate(selectedClient.onboardedDate)}</Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Last Login
                    </Typography>
                    <Typography>
                      {selectedClient.lastLogin ? formatDate(selectedClient.lastLogin) : 'Never logged in'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Additional Information
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <Typography>
                      {selectedClient.notes || 'No additional information available for this client.'}
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

export default ClientOverview;