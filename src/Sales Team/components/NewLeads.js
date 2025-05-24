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
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiClock,
  FiDollarSign,
  FiSend,
  FiBookmark
} from "react-icons/fi";
import { db, auth } from "../../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import AddLeadModal from "./AddLead";
import LeadDetailsModal from "./LeadDetailsModal";
import OnboardClient from "./OnboardClient";
import ScheduleMeetingModal from "./ScheduleMeeting";

const NewLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    source: "all",
    stage: "all"
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Lead stages and statuses
  const leadStages = [
    { value: "new", label: "New", color: "primary" },
    { value: "contacted", label: "Contacted", color: "secondary" },
    { value: "needs-analysis", label: "Needs Analysis", color: "info" },
    { value: "proposal-sent", label: "Proposal Sent", color: "warning" },
    { value: "negotiation", label: "Negotiation", color: "default" },
    { value: "closed-won", label: "Closed Won", color: "success" },
    { value: "closed-lost", label: "Closed Lost", color: "error" }
  ];

  const leadSources = [
    "Website",
    "Referral",
    "Social Media",
    "Event",
    "Cold Call",
    "Email Campaign",
    "Other"
  ];

  // Fetch leads from Firestore
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Query leads assigned to the current sales rep
        const q = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const leadsData = [];
        
        querySnapshot.forEach((doc) => {
          leadsData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        setLeads(leadsData);
      } catch (err) {
        console.error("Error fetching leads:", err);
        setSnackbarMessage("Failed to load leads");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    // Search filter
    const matchesSearch = 
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = 
      filters.status === "all" || lead.status === filters.status;

    // Source filter
    const matchesSource = 
      filters.source === "all" || lead.source === filters.source;

    // Stage filter
    const matchesStage = 
      filters.stage === "all" || lead.stage === filters.stage;

    return matchesSearch && matchesStatus && matchesSource && matchesStage;
  });

  // Pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Update lead stage
  const updateLeadStage = async (leadId, newStage) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        stage: newStage
      });
      
      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, stage: newStage } : lead
      ));
      
      setSnackbarMessage("Lead stage updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error updating lead stage:", err);
      setSnackbarMessage("Failed to update lead stage");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Handle lead added
  const handleLeadAdded = (newLead) => {
    setLeads([...leads, newLead]);
    setSnackbarMessage("Lead added successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // Handle lead updated
  const handleLeadUpdated = (updatedLead) => {
    setLeads(leads.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    ));
    setSnackbarMessage("Lead updated successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          New Leads
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={() => setAddLeadOpen(true)}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' }
          }}
        >
          Add Lead
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
          placeholder="Search leads..."
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
              value={filters.source}
              onChange={(e) => setFilters({...filters, source: e.target.value})}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Sources</MenuItem>
              {leadSources.map(source => (
                <MenuItem key={source} value={source}>{source}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={filters.stage}
              onChange={(e) => setFilters({...filters, stage: e.target.value})}
              displayEmpty
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="all">All Stages</MenuItem>
              {leadStages.map(stage => (
                <MenuItem key={stage.value} value={stage.value}>
                  {stage.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Leads Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell>Lead</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Added On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeads.length > 0 ? (
                  filteredLeads
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((lead) => (
                      <TableRow key={lead.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#4f46e5' }}>
                              {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {lead.firstName} {lead.lastName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748b' }}>
                                {lead.company || 'No company'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiMail size={14} /> {lead.email}
                              </Box>
                            </Typography>
                            <Typography variant="body2">
                              <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FiPhone size={14} /> {lead.phone || 'N/A'}
                              </Box>
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={lead.source || 'Unknown'} 
                            size="small"
                            sx={{ 
                              textTransform: 'capitalize',
                              fontWeight: 'medium',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={lead.stage || 'new'}
                              onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                              sx={{
                                height: 32,
                                '& .MuiSelect-select': {
                                  padding: '6px 32px 6px 12px'
                                }
                              }}
                            >
                              {leadStages.map(stage => (
                                <MenuItem 
                                  key={stage.value} 
                                  value={stage.value}
                                  sx={{ color: `${stage.color}.main` }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {stage.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FiCalendar size={14} />
                            {formatDate(lead.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setSelectedLead(lead);
                                setDetailsOpen(true);
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
                                setSelectedLead(lead);
                                setMeetingOpen(true);
                              }}
                              sx={{ 
                                backgroundColor: '#e0f2fe',
                                '&:hover': { backgroundColor: '#bae6fd' }
                              }}
                            >
                              <FiClock size={16} color="#0ea5e9" />
                            </IconButton>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedLead(lead);
                                setOnboardOpen(true);
                              }}
                              sx={{ 
                                backgroundColor: '#ecfdf5',
                                '&:hover': { backgroundColor: '#d1fae5' }
                              }}
                            >
                              <FiCheck size={16} color="#10b981" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#64748b' }}>
                        No leads found. Try adjusting your search or filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredLeads.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredLeads.length}
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

      {/* Add Lead Modal */}
      <AddLeadModal 
        open={addLeadOpen} 
        onClose={() => setAddLeadOpen(false)} 
        onLeadAdded={handleLeadAdded}
      />

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          lead={selectedLead}
          onLeadUpdated={handleLeadUpdated}
        />
      )}

      {/* Onboard Client Modal */}
      {selectedLead && (
        <OnboardClient
          open={onboardOpen}
          onClose={() => setOnboardOpen(false)}
          lead={selectedLead}
        />
      )}

      {/* Schedule Meeting Modal */}
      {selectedLead && (
        <ScheduleMeetingModal
          open={meetingOpen}
          onClose={() => setMeetingOpen(false)}
          lead={selectedLead}
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

export default NewLeads;