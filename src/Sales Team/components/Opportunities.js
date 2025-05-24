import React, { useState, useEffect } from "react";
import { 
  Typography, Avatar, Box, Chip, 
  Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, 
  Paper, Button, LinearProgress,
  Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Menu, MenuItem,
  CircularProgress, Snackbar, Alert
} from "@mui/material";
import { 
  FiTrendingUp, FiDollarSign, FiCalendar, 
  FiCheckCircle, FiX, FiClock, FiStar,
  FiChevronDown, FiEdit2, FiTrash2,
  FiPlus, FiSearch, FiFilter
} from "react-icons/fi";
import { db, auth } from "../../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { FaRupeeSign } from "react-icons/fa";

const OpportunitiesDashboard = () => {
  // State for opportunities data
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for UI controls
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [stageFilter, setStageFilter] = useState("all");
  const [addOpportunityOpen, setAddOpportunityOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentOpportunity, setCurrentOpportunity] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    budget: "",
    expectedCloseDate: "",
    status: "contacted",
    priority: "medium",
    industry: "",
    service: "",
    leadSource: "",
    notes: ""
  });

  // Stage definitions
  const stages = [
    { value: "new", label: "New", color: "gray" },
    { value: "contacted", label: "Contacted", color: "blue" },
    { value: "qualified", label: "Qualified", color: "indigo" },
    { value: "proposal-sent", label: "Proposal Sent", color: "purple" },
    { value: "negotiation", label: "Negotiation", color: "yellow" },
    { value: "closed-won", label: "Closed Won", color: "green" },
    { value: "closed-lost", label: "Closed Lost", color: "red" },
  ];

  // Fetch opportunities from Firestore
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const q = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const opportunitiesData = [];
          querySnapshot.forEach((doc) => {
            opportunitiesData.push({
              id: doc.id,
              ...doc.data()
            });
          });
          setOpportunities(opportunitiesData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error fetching opportunities:", err);
        setError("Failed to load opportunities");
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  // Filter opportunities based on selected stage
  const filteredOpportunities = stageFilter === "all" 
    ? opportunities 
    : opportunities.filter(opp => opp.status === stageFilter);

  // Calculate pipeline metrics
 // Calculate pipeline metrics
const totalValue = opportunities.reduce((sum, opp) => sum + parseInt(opp.budget || 0), 0);
const probabilityMap = {
  "new": 10,
  "contacted": 30,
  "qualified": 50,
  "proposal-sent": 70,
  "negotiation": 80,
  "closed-won": 100,
  "closed-lost": 0
};
const weightedValue = opportunities.reduce(
  (sum, opp) => sum + (parseInt(opp.budget || 0) * (probabilityMap[opp.status] || 0) / 100),
  0
);
  // Handlers
  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleStageFilterSelect = (stage) => {
    setStageFilter(stage);
    handleFilterMenuClose();
  };

  const handleEditClick = (opportunity) => {
    setCurrentOpportunity(opportunity);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (opportunity) => {
    setOpportunityToDelete(opportunity);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, 'leads', opportunityToDelete.id));
      setSnackbarMessage("Opportunity deleted successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error deleting opportunity:", err);
      setSnackbarMessage("Failed to delete opportunity");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
    setDeleteDialogOpen(false);
  };

  const handleAddOpportunity = () => {
    setAddOpportunityOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSave = async () => {
    try {
      await updateDoc(doc(db, 'leads', currentOpportunity.id), currentOpportunity);
      setSnackbarMessage("Opportunity updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating opportunity:", err);
      setSnackbarMessage("Failed to update opportunity");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleAddSave = async () => {
    try {
      // You'll need to implement your add document function here
      // await addDoc(collection(db, 'leads'), {
      //   ...formData,
      //   assignedTo: auth.currentUser.uid,
      //   createdAt: new Date(),
      //   lastUpdated: new Date()
      // });
      setSnackbarMessage("Opportunity added successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setAddOpportunityOpen(false);
      setFormData({
        fullName: "",
        company: "",
        email: "",
        phone: "",
        budget: "",
        expectedCloseDate: "",
        status: "contacted",
        priority: "medium",
        industry: "",
        service: "",
        leadSource: "",
        notes: ""
      });
    } catch (err) {
      console.error("Error adding opportunity:", err);
      setSnackbarMessage("Failed to add opportunity");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStageColor = (stage) => {
    const stageObj = stages.find(s => s.value === stage);
    return stageObj ? stageObj.color : 'gray';
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const daysUntilClose = (dateString) => {
    if (!dateString) return "N/A";
    const diffDays = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : "Expired";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <Alert severity="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Sales Opportunities
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Track and manage your potential deals
          </Typography>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outlined"
            startIcon={<FiFilter size={16} />}
            endIcon={<FiChevronDown size={16} />}
            onClick={handleFilterMenuOpen}
            sx={{ textTransform: 'none', color: '#4b5563' }}
          >
            {stageFilter === 'all' ? 'All Stages' : stages.find(s => s.value === stageFilter)?.label}
          </Button>
          
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={handleFilterMenuClose}
          >
            <MenuItem onClick={() => handleStageFilterSelect("all")}>
              All Stages
            </MenuItem>
            {stages.map((stage) => (
              <MenuItem key={stage.value} onClick={() => handleStageFilterSelect(stage.value)}>
                {stage.label}
              </MenuItem>
            ))}
          </Menu>
          
          <Button
            variant="contained"
            startIcon={<FiPlus size={16} />}
            onClick={handleAddOpportunity}
            sx={{ 
              textTransform: 'none',
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Total Pipeline
            </Typography>
            <FaRupeeSign className="text-indigo-500" size={18} />
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
          ₹{totalValue.toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Across {opportunities.length} opportunities
          </Typography>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Weighted Value
            </Typography>
            <FiTrendingUp className="text-green-500" size={18} />
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
            ₹{Math.round(weightedValue).toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Based on probability
          </Typography>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Avg. Probability
            </Typography>
            <FiCheckCircle className="text-blue-500" size={18} />
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
            {opportunities.length > 0 
              ? Math.round(opportunities.reduce((sum, opp) => sum + (probabilityMap[opp.status] || 0), 0) / opportunities.length)
              : 0}%
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Across all stages
          </Typography>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f9fafb' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Opportunity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Stage</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Probability</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Close Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOpportunities.map((opportunity) => {
                const probability = probabilityMap[opportunity.status] || 0;
                return (
                  <TableRow key={opportunity.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {opportunity.fullName || "Unnamed Lead"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {opportunity.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {opportunity.company || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      ₹{opportunity.budget ? parseInt(opportunity.budget).toLocaleString() : "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={stages.find(s => s.value === opportunity.status)?.label || opportunity.status}
                        size="small"
                        sx={{
                          backgroundColor: `${getStageColor(opportunity.status)}100`,
                          color: `${getStageColor(opportunity.status)}800`,
                          fontWeight: 'medium',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={probability}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: probability > 50 ? '#10b981' : '#f59e0b'
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 30 }}>
                          {probability}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(opportunity.expectedCloseDate)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {daysUntilClose(opportunity.expectedCloseDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={opportunity.priority}
                        size="small"
                        sx={{
                          backgroundColor: `${getPriorityColor(opportunity.priority)}100`,
                          color: `${getPriorityColor(opportunity.priority)}800`,
                          fontWeight: 'medium',
                          textTransform: 'capitalize'
                        }}
                        icon={<FiStar size={14} />}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="small"
                          startIcon={<FiEdit2 size={14} />}
                          onClick={() => handleEditClick(opportunity)}
                          sx={{
                            textTransform: 'none',
                            color: '#4b5563',
                            '&:hover': { backgroundColor: '#f3f4f6' }
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<FiTrash2 size={14} />}
                          onClick={() => handleDeleteClick(opportunity)}
                          sx={{
                            textTransform: 'none',
                            color: '#ef4444',
                            '&:hover': { backgroundColor: '#fee2e2' }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Add Opportunity Dialog */}
      <Dialog
        open={addOpportunityOpen}
        onClose={() => setAddOpportunityOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Opportunity</DialogTitle>
        <DialogContent>
          <div className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="Company"
              name="company"
              value={formData.company}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="Budget"
              name="budget"
              value={formData.budget}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
              type="number"
              InputProps={{ startAdornment: '$' }}
            />
            <TextField
              fullWidth
              label="Expected Close Date"
              name="expectedCloseDate"
              value={formData.expectedCloseDate}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            >
              {stages.map((stage) => (
                <MenuItem key={stage.value} value={stage.value}>
                  {stage.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="Service"
              name="service"
              value={formData.service}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="Lead Source"
              name="leadSource"
              value={formData.leadSource}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
            />
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              margin="dense"
              multiline
              rows={3}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAddOpportunityOpen(false)}
            sx={{ color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSave}
            sx={{ backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
          >
            Save Opportunity
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Opportunity Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Opportunity</DialogTitle>
        <DialogContent>
          {currentOpportunity && (
            <div className="space-y-4 mt-2">
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={currentOpportunity.fullName || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, fullName: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              />
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={currentOpportunity.company || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, company: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={currentOpportunity.email || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, email: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              />
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={currentOpportunity.phone || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, phone: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              />
              <TextField
                fullWidth
                label="Budget"
                name="budget"
                value={currentOpportunity.budget || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, budget: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
                type="number"
                InputProps={{ startAdornment: '$' }}
              />
              <TextField
                fullWidth
                label="Expected Close Date"
                name="expectedCloseDate"
                value={currentOpportunity.expectedCloseDate || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, expectedCloseDate: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={currentOpportunity.status || "contacted"}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, status: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              >
                {stages.map((stage) => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Priority"
                name="priority"
                value={currentOpportunity.priority || "medium"}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, priority: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Industry"
                name="industry"
                value={currentOpportunity.industry || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, industry: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              />
              <TextField
                fullWidth
                label="Service"
                name="service"
                value={currentOpportunity.service || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, service: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              />
              <TextField
                fullWidth
                label="Lead Source"
                name="leadSource"
                value={currentOpportunity.leadSource || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, leadSource: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
              />
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={currentOpportunity.notes || ""}
                onChange={(e) => setCurrentOpportunity({...currentOpportunity, notes: e.target.value})}
                variant="outlined"
                size="small"
                margin="dense"
                multiline
                rows={3}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            sx={{ backgroundColor: '#4f46e5', '&:hover': { backgroundColor: '#4338ca' } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>Delete Opportunity</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this opportunity? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            sx={{ backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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
    </div>
  );
};

export default OpportunitiesDashboard;