import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  InputAdornment
} from "@mui/material";
import {
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiUser,
  FiChevronDown,
  FiX,
  FiGlobe,
  FiLinkedin,
  FiGithub,
  FiCalendar,
  FiClock,
  FiInfo,
  FiSearch
} from "react-icons/fi";
import { FaLinkedin, FaGithub, FaWhatsapp } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebase";

const Communication = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "dxd-magnate-projects"));
        const querySnapshot = await getDocs(q);
        const projectsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchTeamAndClients = async () => {
      if (!selectedProject) return;

      try {
        setLoading(true);
        
        // Fetch team members from the project
        const team = selectedProject.teamMembers || [];
        
        // Fetch detailed info for each team member
        const teamMembersWithDetails = await Promise.all(
          team.map(async member => {
            const userDoc = await getDoc(doc(db, "users", member.id));
            return {
              ...member,
              ...userDoc.data(),
              isTeamMember: true
            };
          })
        );
        
        // Fetch client details
        let clientDetails = {};
        if (selectedProject.clientId) {
          const clientDoc = await getDoc(doc(db, "users", selectedProject.clientId));
          if (clientDoc.exists()) {
            clientDetails = {
              ...clientDoc.data(),
              id: selectedProject.clientId,
              name: selectedProject.clientName,
              isClient: true
            };
          }
        }
        
        setTeamMembers(teamMembersWithDetails);
        setClients(clientDetails.id ? [clientDetails] : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching team and clients:", error);
        setLoading(false);
      }
    };

    fetchTeamAndClients();
  }, [selectedProject]);

  const filteredContacts = [...teamMembers, ...clients].filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const getAvailabilityStatus = (user) => {
    if (user.availability === "available") {
      return { text: "Available", color: "success" };
    } else if (user.availability === "busy") {
      return { text: "Busy", color: "warning" };
    } else if (user.availability === "offline") {
      return { text: "Offline", color: "default" };
    }
    return { text: "Unknown", color: "default" };
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Team Communication
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Contact your team members and clients directly
        </Typography>
      </Box>

      {/* Project Selector and Search */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Select
              fullWidth
              value={selectedProject?.id || ""}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project || null);
              }}
              displayEmpty
              IconComponent={FiChevronDown}
              sx={{ backgroundColor: 'white' }}
            >
              <MenuItem value="" disabled>
                Select a project
              </MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' }
              }}
              onClick={() => setSearchTerm("")}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LinearProgress />
      ) : selectedProject ? (
        <>
          {/* Contacts Grid */}
          <Grid container spacing={3}>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Paper sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderLeft: `4px solid ${user.isClient ? '#10b981' : '#3b82f6'}`
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={getAvailabilityStatus(user).color}
                      >
                        <Avatar
                          src={user.photoURL}
                          sx={{
                            width: 56,
                            height: 56,
                            bgcolor: user.isClient ? '#10b981' : '#3b82f6',
                            mr: 2
                          }}
                        >
                          {user.name?.charAt(0)}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {user.isClient ? 'Client' : user.role || 'Team Member'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IoMdMail style={{ marginRight: 8, color: '#64748b' }} />
                        {user.email || 'No email provided'}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <FiPhone style={{ marginRight: 8, color: '#64748b' }} />
                        {user.phone || 'No phone provided'}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Send Email">
                          <IconButton
                            sx={{
                              backgroundColor: '#e2e8f0',
                              '&:hover': { backgroundColor: '#cbd5e1' }
                            }}
                            href={`mailto:${user.email}`}
                          >
                            <FiMail size={18} color="#4f46e5" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Start Chat">
                          <IconButton
                            sx={{
                              backgroundColor: '#e2e8f0',
                              '&:hover': { backgroundColor: '#cbd5e1' }
                            }}
                          >
                            <FiMessageSquare size={18} color="#4f46e5" />
                          </IconButton>
                        </Tooltip>
                        {user.phone && (
                          <Tooltip title="Call">
                            <IconButton
                              sx={{
                                backgroundColor: '#e2e8f0',
                                '&:hover': { backgroundColor: '#cbd5e1' }
                              }}
                              href={`tel:${user.phone}`}
                            >
                              <FiPhone size={18} color="#4f46e5" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FiUser size={14} />}
                        onClick={() => handleUserSelect(user)}
                        sx={{
                          textTransform: 'none',
                          borderRadius: '6px',
                          borderColor: '#e2e8f0',
                          color: '#64748b'
                        }}
                      >
                        Details
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    No contacts found matching your criteria
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Please select a project to view team members and clients
          </Typography>
        </Paper>
      )}

      {/* User Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {selectedUser.name}'s Profile
              </Typography>
              <IconButton onClick={handleCloseDialog}>
                <FiX />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={selectedUser.photoURL}
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 2,
                    bgcolor: selectedUser.isClient ? '#10b981' : '#3b82f6'
                  }}
                >
                  {selectedUser.name?.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedUser.name}
                </Typography>
                <Chip
                  label={getAvailabilityStatus(selectedUser).text}
                  color={getAvailabilityStatus(selectedUser).color}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Role
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser.isClient ? 'Client' : selectedUser.role || 'Team Member'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Department
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser.department || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <IoMdMail style={{ marginRight: 8 }} />
                    {selectedUser.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Phone
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <FiPhone style={{ marginRight: 8 }} />
                    {selectedUser.phone || 'N/A'}
                  </Typography>
                </Grid>
                {selectedUser.linkedIn && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      LinkedIn
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <FaLinkedin style={{ marginRight: 8, color: '#0077b5' }} />
                      <a href={selectedUser.linkedIn} target="_blank" rel="noopener noreferrer">
                        View Profile
                      </a>
                    </Typography>
                  </Grid>
                )}
                {selectedUser.website && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      Website
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <FiGlobe style={{ marginRight: 8 }} />
                      <a href={selectedUser.website} target="_blank" rel="noopener noreferrer">
                        Visit Site
                      </a>
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                Project Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Project Role
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser.projectRole || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    Allocation
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser.allocation || '100%'}
                  </Typography>
                </Grid>
                {selectedUser.timezone && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      Timezone
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <FiClock style={{ marginRight: 8 }} />
                      {selectedUser.timezone}
                    </Typography>
                  </Grid>
                )}
                {selectedUser.workingHours && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                      Working Hours
                    </Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                      <FiCalendar style={{ marginRight: 8 }} />
                      {selectedUser.workingHours}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedUser.bio && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    About
                  </Typography>
                  <Typography variant="body1">
                    {selectedUser.bio}
                  </Typography>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  borderColor: '#e2e8f0',
                  color: '#64748b'
                }}
              >
                Close
              </Button>
              <Button
                variant="contained"
                href={`mailto:${selectedUser.email}`}
                startIcon={<FiMail />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' }
                }}
              >
                Send Message
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Communication;