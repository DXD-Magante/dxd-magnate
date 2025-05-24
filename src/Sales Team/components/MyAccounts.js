import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  MenuItem,
  FormControl,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  LinearProgress
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiEdit2,
  FiMessageSquare,
  FiPlus,
  FiX,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight
} from "react-icons/fi";
import { db, auth } from "../../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import AddClientModal from "./AddClientModal";
import ClientProfileModal from "./ClientProfileModal";
import { useNavigate } from "react-router-dom";

const MyAccounts = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    industry: "all",
    lastContacted: "all"
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Fetch clients from Firestore
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Query clients assigned to the current sales rep
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'client'),
          where('salesRep', '==', currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const clientsData = [];
        
        querySnapshot.forEach((doc) => {
          clientsData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setClients(clientsData);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setSnackbarMessage("Failed to load clients");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filter clients based on search and filters
  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = 
      client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = 
      filters.status === "all" || client.status === filters.status;

    // Industry filter (assuming we have industry field)
    const matchesIndustry = 
      filters.industry === "all" || 
      (client.industry && client.industry === filters.industry);

    // Last contacted filter (simplified)
    const matchesLastContacted = true; // Implement actual date filtering if needed

    return matchesSearch && matchesStatus && matchesIndustry && matchesLastContacted;
  });

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Update client status
  const updateClientStatus = async (clientId, newStatus) => {
    try {
      await updateDoc(doc(db, 'users', clientId), {
        status: newStatus
      });
      
      // Update local state
      setClients(clients.map(client => 
        client.id === clientId ? { ...client, status: newStatus } : client
      ));
      
      setSnackbarMessage("Client status updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error updating client status:", err);
      setSnackbarMessage("Failed to update client status");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Handle client added
  const handleClientAdded = (newClient) => {
    setClients([...clients, newClient]);
    setSnackbarMessage("Client added successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // Handle client updated
  const handleClientUpdated = (updatedClient) => {
    setClients(clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
    setSnackbarMessage("Client updated successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header and Actions */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          My Client Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={() => setAddClientOpen(true)}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' }
          }}
        >
          Add Client
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <TextField
          placeholder="Search clients..."
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch />
              </InputAdornment>
            ),
          }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            backgroundColor: 'white',
            borderRadius: 1
          }}
        />

        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          minWidth: { sm: 'fit-content' }
        }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <FiFilter size={16} />
                </InputAdornment>
              }
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filters.industry}
              onChange={(e) => setFilters({...filters, industry: e.target.value})}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Industries</MenuItem>
              <MenuItem value="Technology">Technology</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="Retail">Retail</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Client Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Contacted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#4f46e5' }}>
                              {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {client.firstName} {client.lastName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {client.role}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {client.company || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiMail size={14} /> {client.email}
                              </Box>
                            </Typography>
                            <Typography variant="body2">
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiPhone size={14} /> {client.phone || 'N/A'}
                              </Box>
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={client.status || 'active'} 
                            size="small"
                            color={client.status === 'active' ? 'success' : 'error'}
                            sx={{ 
                              textTransform: 'capitalize',
                              fontWeight: 'medium'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiCalendar size={14} />
                            {client.lastLogin ? 
                              new Date(client.lastLogin).toLocaleDateString() : 
                              'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setSelectedClient(client);
                                setProfileOpen(true);
                              }}
                              sx={{ 
                                backgroundColor: '#e0e7ff',
                                '&:hover': { backgroundColor: '#c7d2fe' }
                              }}
                            >
                              <FiUser size={16} color="#4f46e5" />
                            </IconButton>
                            <IconButton 
  size="small"
  onClick={() => {
    navigate('/chats', { 
      state: { 
        contactId: client.id,
        contact: {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          photoURL: client.photoURL,
          role: client.role || 'Client'
        }
      }
    });
  }}
  sx={{ 
    backgroundColor: '#e0f2fe',
    '&:hover': { backgroundColor: '#bae6fd' }
  }}
>
  <FiMessageSquare size={16} color="#0ea5e9" />
</IconButton>
                            <IconButton 
                              size="small"
                              sx={{ 
                                backgroundColor: '#ecfdf5',
                                '&:hover': { backgroundColor: '#d1fae5' }
                              }}
                            >
                              <FiEdit2 size={16} color="#10b981" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#64748b' }}>
                        No clients found. Try adjusting your search or filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredClients.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredClients.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ 
                borderTop: '1px solid #e2e8f0',
                '& .MuiTablePagination-toolbar': {
                  paddingLeft: 2,
                  paddingRight: 2
                }
              }}
            />
          )}
        </Paper>
      )}

      {/* Add Client Modal */}
      <AddClientModal 
        open={addClientOpen} 
        onClose={() => setAddClientOpen(false)} 
        onClientAdded={handleClientAdded}
      />

      {/* Client Profile Modal */}
      {selectedClient && (
        <ClientProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          client={selectedClient}
          onClientUpdated={handleClientUpdated}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyAccounts;