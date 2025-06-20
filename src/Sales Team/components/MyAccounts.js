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
  LinearProgress,
  Tooltip,
  CircularProgress
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
  FiChevronsRight,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiCheckCircle
} from "react-icons/fi";
import { db, auth } from "../../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, setDoc } from "firebase/firestore";
import AddClientModal from "./AddClientModal";
import ClientProfileModal from "./ClientProfileModal";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";

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
  const [projects, setProjects] = useState({});
  const [followUpLoading, setFollowUpLoading] = useState({});
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init("yCz1x3bWkjQXBkJTA");
  }, []);

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

        // Fetch projects for each client
        const projectsData = {};
        for (const client of clientsData) {
          const projectsQuery = query(
            collection(db, 'dxd-magnate-projects'),
            where('clientId', '==', client.id)
          );
          const projectsSnapshot = await getDocs(projectsQuery);
          projectsData[client.id] = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        setProjects(projectsData);
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

  // Get the most recent project for a client
  const getRecentProject = (clientId) => {
    if (!projects[clientId] || projects[clientId].length === 0) return null;
    return projects[clientId][0]; // Assuming the first one is the most recent
  };

  // Check if follow-up is allowed for a project
  const canFollowUp = (project) => {
    if (!project) return false;
    const lastFollowUp = project.lastPaymentFollowUp;
    if (!lastFollowUp) return true;
    
    const coolDownPeriod = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
    const now = new Date();
    const lastFollowUpDate = new Date(lastFollowUp);
    return now - lastFollowUpDate >= coolDownPeriod;
  };

  // Send payment follow-up
  const sendPaymentFollowUp = async (client, project) => {
    setFollowUpLoading(prev => ({ ...prev, [project.id]: true }));
    
    try {
      // 1. Create notification
      const notificationData = {
        message: `Project "${project.title}" has been completed`,
        projectId: project.id,
        projectName: project.title,
        read: false,
        timestamp: serverTimestamp(),
        type: "project-completion",
        userId: client.id,
        viewed: false
      };
      
      await addDoc(collection(db, 'client-notifications'), notificationData);

      // 2. Record payment follow-up
      const followUpData = {
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        projectId: project.id,
        projectName: project.title,
        initiatedBy: auth.currentUser.uid,
        initiatedByName: auth.currentUser.displayName || "Sales Representative",
        action: "Follow-up Sent",
        timestamp: serverTimestamp(),
        status: "pending",
        message: "Payment follow-up reminder sent to client"
      };
      
      await addDoc(collection(db, 'payment-followups'), followUpData);

      // 3. Update project with last follow-up time
      await updateDoc(doc(db, 'dxd-magnate-projects', project.id), {
        lastPaymentFollowUp: new Date().toISOString()
      });

      // 4. Update payment follow-up settings
      const settingsData = {
        coolDownPeriod: 12, // hours
        defaultMessage: "Follow-up Sent",
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser.uid
      };
      
      await setDoc(doc(db, 'paymentFollowupSettings', 'default'), settingsData, { merge: true });

      // 5. Send email to client
      const emailParams = {
        to_email: client.email,
        to_name: `${client.firstName} ${client.lastName}`,
        from_name: "DXD Magnate",
        project_name: project.title,
        amount_due: project.budget,
        due_date: project.endDate ? new Date(project.endDate).toLocaleDateString() : "ASAP",
        payment_link: "https://dxdmagnate.com/payments", // Replace with actual payment link
        contact_email: auth.currentUser.email,
        contact_name: auth.currentUser.displayName || "Your Account Manager"
      };

      await emailjs.send(
        'service_t3r4nqe',
        'template_i8v9cwi', // You'll need to create this template in EmailJS
        emailParams
      );

      setSnackbarMessage("Payment follow-up sent successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Update local state
      setProjects(prev => ({
        ...prev,
        [client.id]: prev[client.id].map(p => 
          p.id === project.id ? { ...p, lastPaymentFollowUp: new Date().toISOString() } : p
        )
      }));
    } catch (err) {
      console.error("Error sending payment follow-up:", err);
      setSnackbarMessage("Failed to send payment follow-up");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setFollowUpLoading(prev => ({ ...prev, [project.id]: false }));
    }
  };

  // Request payment release
  const requestPaymentRelease = (project) => {
    setSelectedProject(project);
    setPaymentDialogOpen(true);
  };

  // Handle payment release confirmation
  const handlePaymentReleaseConfirm = async () => {
    if (!selectedProject) return;
    
    try {
      // Update project status to "Payment Requested"
      await updateDoc(doc(db, 'dxd-magnate-projects', selectedProject.id), {
        paymentStatus: "payment_requested"
      });

      // Create notification for client
      const notificationData = {
        message: `Payment requested for project "${selectedProject.title}"`,
        projectId: selectedProject.id,
        projectName: selectedProject.title,
        read: false,
        timestamp: serverTimestamp(),
        type: "payment-request",
        userId: selectedProject.clientId,
        viewed: false
      };
      
      await addDoc(collection(db, 'client-notifications'), notificationData);

      // Send email to client
      const client = clients.find(c => c.id === selectedProject.clientId);
      if (client) {
        const emailParams = {
          to_email: client.email,
          to_name: `${client.firstName} ${client.lastName}`,
          from_name: "DXD Magnate",
          project_name: selectedProject.title,
          amount_due: selectedProject.budget,
          payment_link: "https://dxdmagnate.com/payments", // Replace with actual payment link
          contact_email: auth.currentUser.email,
          contact_name: auth.currentUser.displayName || "Your Account Manager"
        };

        await emailjs.send(
          'service_t3r4nqe',
          'template_payment_request', // You'll need to create this template in EmailJS
          emailParams
        );
      }

      setSnackbarMessage("Payment release requested successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setPaymentDialogOpen(false);
    } catch (err) {
      alert(err)
      console.error("Error requesting payment release:", err);
      setSnackbarMessage("Failed to request payment release");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Get payment status chip
  const getPaymentStatusChip = (status) => {
    switch (status) {
      case 'paid':
        return (
          <Chip
            label="Paid"
            size="small"
            color="success"
            icon={<FiCheckCircle size={14} />}
            sx={{ fontWeight: 'medium' }}
          />
        );
      case 'partially_paid':
        return (
          <Chip
            label="Partially Paid"
            size="small"
            color="warning"
            icon={<FiDollarSign size={14} />}
            sx={{ fontWeight: 'medium' }}
          />
        );
      case 'payment_requested':
        return (
          <Chip
            label="Payment Requested"
            size="small"
            color="info"
            icon={<FiClock size={14} />}
            sx={{ fontWeight: 'medium' }}
          />
        );
      default:
        return (
          <Chip
            label="Not Paid"
            size="small"
            color="error"
            icon={<FiAlertCircle size={14} />}
            sx={{ fontWeight: 'medium' }}
          />
        );
    }
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
                  <TableCell>Payment Status</TableCell>
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
                    .map((client) => {
                      const project = getRecentProject(client.id);
                      return (
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
                            {project && (
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                                Project: {project.title}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {project ? (
                              <Box sx={{  alignItems: 'center', gap: 1 }}>
                                {getPaymentStatusChip(project.paymentStatus)}
                                {project.paymentStatus !== 'paid' && (
                                  <Tooltip 
                                    title={canFollowUp(project) ? 
                                      "Send payment follow-up" : 
                                      `Follow-up already sent. Next available in ${12 - Math.floor((new Date() - new Date(project.lastPaymentFollowUp)) / (1000 * 60 * 60))} hours`}
                                  >
                                    <span>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => sendPaymentFollowUp(client, project)}
                                        disabled={!canFollowUp(project) || followUpLoading[project.id]}
                                       
                                         sx={{
                                            ml: 1,
                                            marginTop:'10px',
                                            textTransform: 'none',
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',  // Reduced padding
                                            minWidth: '0',       // Remove minimum width constraint
                                            lineHeight: '1.2',   // Adjust line height for compactness
                                          }}
                                                                            >
                                        {followUpLoading[project.id] ? 'Sending...' : 'Follow Up'}
                                      </Button>
                                    </span>
                                  </Tooltip>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                No active project
                              </Typography>
                            )}
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
                              {project && project.paymentStatus !== 'paid' && (
                                <Tooltip title="Request Payment Release">
                                  <IconButton 
                                    size="small"
                                    onClick={() => requestPaymentRelease(project)}
                                    sx={{ 
                                      backgroundColor: '#fce7f3',
                                      '&:hover': { backgroundColor: '#fbcfe8' }
                                    }}
                                  >
                                    <FiDollarSign size={16} color="#db2777" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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

      {/* Payment Release Confirmation Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiDollarSign size={20} />
          Request Payment Release
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to request payment release for project:
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                {selectedProject.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                This will notify the client and update the payment status.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPaymentDialogOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              borderColor: '#e2e8f0',
              color: '#64748b'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentReleaseConfirm}
            variant="contained"
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            Confirm Request
          </Button>
        </DialogActions>
      </Dialog>

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