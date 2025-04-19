import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Pagination,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  FiSearch,
  FiDownload,
  FiChevronDown,
  FiEye,
  FiDollarSign,
  FiUser,
  FiInfo,
  FiLayers,
  FiPieChart
} from "react-icons/fi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../services/firebase";

const statusColors = {
  'Not started yet': 'default',
  'In progress': 'primary',
  'On hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'error'
};

const priorityColors = {
  'low': 'success',
  'medium': 'warning',
  'high': 'error'
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const ClientProjects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const rowsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects
        const projectsQuery = query(collection(db, "dxd-magnate-projects"), where("projectManagerId", "==", auth.currentUser.uid));
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch clients
        const clientsQuery = query(collection(db, "users"), where("role", "==", "client"));
        const clientsSnapshot = await getDocs(clientsQuery);
        const clientsData = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsData);
        setClients(clientsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesClient = clientFilter === "all" || project.clientId === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const paginatedProjects = filteredProjects.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getClientDetails = (clientId) => {
    return clients.find(client => client.uid === clientId) || {};
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Client Projects
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Manage and track all client projects in one place
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Not started yet">Not Started</MenuItem>
              <MenuItem value="In progress">In Progress</MenuItem>
              <MenuItem value="On hold">On Hold</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} md={3}>
            <Select
              fullWidth
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              displayEmpty
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Clients</MenuItem>
              {clients.map(client => (
                <MenuItem key={client.uid} value={client.uid}>
                  {client.firstName} {client.lastName}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FiDownload />}
              sx={{ height: '56px' }}
            >
              Export
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Projects Table */}
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Budget</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map((project) => {
                    const client = getClientDetails(project.clientId);
                    return (
                      <TableRow key={project.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: '#4f46e5', mr: 2 }}>
                              {project.title?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: '500' }}>{project.title}</Typography>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {project.type}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: '#10b981', mr: 2 }}>
                              {client?.firstName?.charAt(0)}{client?.lastName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography>{client?.firstName} {client?.lastName}</Typography>
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {project.company}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.status}
                            color={statusColors[project.status] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.priority}
                            color={priorityColors[project.priority] || 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FiDollarSign style={{ marginRight: 8 }} />
                            {project.budget}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {formatDate(project.startDate)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FiEye />}
                            onClick={() => handleViewDetails(project)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No projects found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredProjects.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredProjects.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* Project Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedProject && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <Avatar sx={{ bgcolor: '#4f46e5', mr: 2 }}>
                  {selectedProject.title?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedProject.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedProject.type} • {selectedProject.company}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={selectedProject.status}
                color={statusColors[selectedProject.status] || 'default'}
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              <Grid container spacing={4}>
                {/* Left Column */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <FiInfo style={{ marginRight: 8 }} /> Project Details
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Description:</Typography>
                        <Typography variant="body2">{selectedProject.description}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Start Date:</Typography>
                        <Typography variant="body2">
                          {formatDate(selectedProject.startDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Duration:</Typography>
                        <Typography variant="body2">{selectedProject.duration}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Budget:</Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiDollarSign style={{ marginRight: 4 }} /> {selectedProject.budget}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Priority:</Typography>
                        <Chip
                          label={selectedProject.priority}
                          color={priorityColors[selectedProject.priority] || 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <FiUser style={{ marginRight: 8 }} /> Client Information
                    </Typography>
                    {selectedProject.clientId && (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, pl: 2 }}>
                          <Avatar sx={{ bgcolor: '#10b981', mr: 2 }}>
                            {selectedProject.firstName?.charAt(0)}{selectedProject.lastName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography>{selectedProject.clientName}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {selectedProject.company}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ pl: 2 }}>
                          <Box sx={{ display: 'flex', mb: 1 }}>
                            <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Email:</Typography>
                            <Typography variant="body2">
                              {getClientDetails(selectedProject.clientId)?.email || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', mb: 1 }}>
                            <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Phone:</Typography>
                            <Typography variant="body2">
                              {getClientDetails(selectedProject.clientId)?.phone || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', mb: 1 }}>
                            <Typography variant="body2" sx={{ minWidth: 120, color: '#64748b' }}>Preferred Contact:</Typography>
                            <Typography variant="body2">
                              {getClientDetails(selectedProject.clientId)?.communicationChannel || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <FiLayers style={{ marginRight: 8 }} /> Team Members
                    </Typography>
                    {selectedProject.teamMembers?.length > 0 ? (
                      <Box sx={{ pl: 2 }}>
                        {selectedProject.teamMembers.map((member, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: '#3b82f6', mr: 2, width: 40, height: 40 }}>
                              {member.name?.charAt(0)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography>{member.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                {member.projectRole} • {member.department}
                              </Typography>
                            </Box>
                            <Chip label={member.allocation} size="small" />
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ pl: 2 }}>
                        No team members assigned yet
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                      <FiPieChart style={{ marginRight: 8 }} /> Project Stats
                    </Typography>
                    <Grid container spacing={2} sx={{ pl: 2 }}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            Required Roles
                          </Typography>
                          <Typography variant="h6">
                            {selectedProject.roles?.length || 0}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            Team Members
                          </Typography>
                          <Typography variant="h6">
                            {selectedProject.teamMembers?.length || 0}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #e2e8f0', p: 2 }}>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button variant="contained" color="primary">
                Edit Project
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ClientProjects;