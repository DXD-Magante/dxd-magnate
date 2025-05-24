import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar, Chip, Button,
  TextField, InputAdornment, MenuItem, Select,
  Pagination, Stack, LinearProgress,
  IconButton, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemAvatar, ListItemText,
  Divider, Tooltip, Checkbox
} from "@mui/material";
import { collection, getDocs, updateDoc, doc, getDoc, setDoc,  } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from "../../services/firebase";
import { 
  FiSearch, FiFilter, FiDownload, FiPlus,
  FiEye, FiEdit2, FiTrash2, FiChevronDown,
  FiUsers, FiUserPlus, FiUser, FiXCircle, 
} from "react-icons/fi";
import { 
  FaRegDotCircle, 
  FaRegClock,
  FaCheckCircle
} from "react-icons/fa";
import { statusStyles, priorityStyles } from "./Constants";
import TeamManagementDialog from "./TeamManagement";

const AllProjects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openTeamDialog, setOpenTeamDialog] = useState(false);
  
    const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Collaborator',
    department: 'Design',
    projectRole: ''
  });
  const rowsPerPage = 8;
  const [showAddRole, setShowAddRole] = useState(false);
  const [projectRoles, setProjectRoles] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
     const fetchProjects = async () => {
          try {
            const user = auth.currentUser;
            if (!user) return;
    
            const querySnapshot = await getDocs(collection(db, "dxd-magnate-projects"));
            const projectsData = querySnapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              .filter(project => project.projectManagerId === user.uid);
              
            setProjects(projectsData);
            setLoading(false);
          } catch (error) {
            console.error("Error fetching projects:", error);
            setLoading(false);
          }
        };

        fetchProjects()
  }, [])

  const handleStatusUpdate = async (projectId, newStatus) => {
    try {
      // First update the project status in Firestore
      const projectRef = doc(db, 'dxd-magnate-projects', projectId);
      const updateData = { status: newStatus };
      
      // Add completedAt timestamp if status is being changed to Completed
      if (newStatus === "Completed") {
        updateData.completedAt = new Date().toISOString();
      }
      
      await updateDoc(projectRef, updateData);
  
      // Then update local state if setProjects is available
      if (typeof setProjects === 'function') {
        setProjects(prevProjects => 
          prevProjects.map(project => 
            project.id === projectId ? { 
              ...project, 
              status: newStatus,
              ...(newStatus === "Completed" && { completedAt: new Date().toISOString() })
            } : project
          )
        );
      }
  
      // Only proceed with additional updates if status is "Completed"
      if (newStatus === "Completed") {
        const projectSnap = await getDoc(projectRef);
        const projectData = projectSnap.data();
        const currentUser = auth.currentUser;
        const timestamp = new Date().toISOString();
  
        // Create client notification if client exists
        if (projectData.clientId) {
          const notificationRef = doc(collection(db, 'client-notifications'));
          await setDoc(notificationRef, {
            message: `Project "${projectData.title}" has been completed`,
            userId: projectData.clientId,
            viewed: false,
            timestamp,
            projectId,
            projectName: projectData.title,
            type: "project-completion"
          });
        }
  
        // Create project manager activity if user is logged in
        if (currentUser) {
          const activityRef = doc(collection(db, 'project-manager-activities'));
          await setDoc(activityRef, {
            activity: "project",
            action: "marked project as completed",
            timestamp,
            userId: currentUser.uid,
            projectId,
            projectName: projectData.title,
            clientId: projectData.clientId,
            newStatus: "Completed"
          });
        }
  
        // Create project activity log
        const activityLogRef = doc(collection(db, 'project-activities'));
        await setDoc(activityLogRef, {
          message: `Status changed to Completed`,
          timestamp,
          type: "status-update",
          projectId,
          projectName: projectData.title,
          userId: currentUser?.uid,
          previousStatus: projectData.status,
          newStatus: "Completed"
        });
      }
    } catch (error) {
      console.error("Status update failed:", error);
      alert(`Status update failed: ${error.message}`);
    }
  };

  const handleAddRole = async () => {
    if (newRole.trim() && !projectRoles.includes(newRole.trim())) {
      const updatedRoles = [...projectRoles, newRole.trim()];
      setProjectRoles(updatedRoles);
      setNewRole('');
      
      try {
        await updateDoc(doc(db, 'dxd-magnate-projects', selectedProject.id), {
          roles: updatedRoles
        });
      } catch (error) {
        console.error('Error updating project roles:', error);
      }
    }
  };
  
  const handleRemoveRole = async (roleToRemove) => {
    const updatedRoles = projectRoles.filter(role => role !== roleToRemove);
    setProjectRoles(updatedRoles);
    
    try {
      await updateDoc(doc(db, 'dxd-magnate-projects', selectedProject.id), {
        roles: updatedRoles
      });
    } catch (error) {
      console.error('Error removing project role:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.role === 'Collaborator' || user.role === 'Intern' || user.role === 'Freelancer') &&
    (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUserTerm.toLowerCase())
    )
  );

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleAddSelectedUsers = () => {
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    const newTeamMembers = selectedUserData.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      department: user.department,
      allocation: '100%',
      avatar: user.photoURL || null
    }));
    
    setSelectedProject(prev => ({
      ...prev,
      teamMembers: [...(prev.teamMembers || []), ...newTeamMembers]
    }));
    
    setSelectedUsers([]);
    setAddMode(null);
    setShowAddOptions(false);
  };

  const handleAddNewMember = async () => {
    try {
      const tempPassword = "defaultPassword123";
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newMember.email,
        tempPassword
      );
      
      const userDoc = {
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        phone: newMember.phone,
        email: newMember.email,
        role: newMember.role,
        department: newMember.department,
        status: 'active',
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      
      const newTeamMember = {
        id: userCredential.user.uid,
        name: `${newMember.firstName} ${newMember.lastName}`,
        role: newMember.role,
        projectRole: newMember.projectRole,
        department: newMember.department,
        allocation: '100%',
        isNew: true
      };
      
      setSelectedProject(prev => ({
        ...prev,
        teamMembers: [...(prev.teamMembers || []), newTeamMember]
      }));
      
      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        phone:'',
        role: 'Collaborator',
        department: 'Design'
      });
      setAddMode(null);
      setShowAddOptions(false);
    } catch (error) {
      console.error('Error adding new member:', error);
    }
  };

  const handleRemoveMember = (memberId) => {
    setSelectedProject(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter(member => member.id !== memberId)
    }));
  };

  const handleSaveTeam = async () => {
    try {
      await updateDoc(doc(db, 'dxd-magnate-projects', selectedProject.id), {
        teamMembers: selectedProject.teamMembers.map(member => ({
          id: member.id,
          name: member.name,
          role: member.role,
          projectRole: member.projectRole,
          department: member.department,
          allocation: member.allocation,
          ...(member.avatar && { avatar: member.avatar }),
          ...(member.isNew && { isNew: member.isNew })
        }))
      });
      handleCloseTeamDialog();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesType = typeFilter === "all" || project.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedProjects = filteredProjects.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleViewTeam = async (project) => {
    try {
      const projectRef = doc(db, 'dxd-magnate-projects', project.id);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        setSelectedProject({
          ...project,
          roles: projectData.roles || [],
          teamMembers: projectData.teamMembers || []
        });
        setProjectRoles(projectData.roles || []);
      } else {
        setSelectedProject(project);
        setProjectRoles(project.roles || []);
      }
      
      setOpenTeamDialog(true);
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };
  
  const handleCloseTeamDialog = () => {
    setOpenTeamDialog(false);
    setSelectedProject(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
            All Projects
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            View and manage all projects in the system
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="contained" 
            startIcon={<FiDownload size={18} />}
            sx={{
              backgroundColor: 'white',
              color: '#4f46e5',
              border: '1px solid #e2e8f0',
              '&:hover': {
                backgroundColor: '#f8fafc',
              }
            }}
          >
            Export
          </Button>
          <Button 
            variant="contained" 
            startIcon={<FiPlus size={18} />}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4338ca',
              }
            }}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch color="#94a3b8" />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: 'white',
              }
            }}
          />
          <Select
            fullWidth
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            inputProps={{ 'aria-label': 'Status filter' }}
            sx={{ backgroundColor: 'white' }}
            IconComponent={FiChevronDown}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="Not started yet">Not Started</MenuItem>
            <MenuItem value="In progress">In Progress</MenuItem>
            <MenuItem value="On hold">On Hold</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
          <Select
            fullWidth
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            displayEmpty
            inputProps={{ 'aria-label': 'Type filter' }}
            sx={{ backgroundColor: 'white' }}
            IconComponent={FiChevronDown}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="Marketing">Marketing</MenuItem>
            <MenuItem value="Development">Development</MenuItem>
            <MenuItem value="Design">Design</MenuItem>
            <MenuItem value="Content">Content</MenuItem>
            <MenuItem value="Sales">Sales</MenuItem>
          </Select>
          <Button 
            variant="outlined" 
            startIcon={<FiFilter size={18} />}
            fullWidth
            sx={{
              borderColor: '#e2e8f0',
              color: '#64748b',
              backgroundColor: 'white',
              '&:hover': {
                borderColor: '#cbd5e1',
                backgroundColor: '#f8fafc',
              }
            }}
          >
            More Filters
          </Button>
        </div>
      </Paper>

      {/* Projects Table */}
      <Paper sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="projects table">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Client</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Budget</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar 
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              bgcolor: '#e0e7ff',
                              color: '#4f46e5',
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                              mr: 2
                            }}
                          >
                            {project.title.charAt(0)}
                          </Avatar>
                          <div>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {project.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {project.type}
                            </Typography>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{project.clientName}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {project.company}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          ${parseInt(project.budget).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={project.status}
                          onChange={(e) => handleStatusUpdate(project.id, e.target.value)}
                          sx={{
                            fontSize: '0.8125rem',
                            height: '32px',
                            '& .MuiSelect-select': {
                              padding: '6px 32px 6px 12px',
                              display: 'flex',
                              alignItems: 'center'
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              border: 'none'
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              border: 'none'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              border: 'none'
                            }
                          }}
                          IconComponent={FiChevronDown}
                        >
                          <MenuItem value="Not started yet">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FaRegDotCircle style={{ color: statusStyles['Not started yet'].color, marginRight: 8, fontSize: 14 }} />
                              <span>Not Started</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="In progress">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FaRegClock style={{ color: statusStyles['In progress'].color, marginRight: 8, fontSize: 14 }} />
                              <span>In Progress</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="On hold">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FaRegClock style={{ color: statusStyles['On hold'].color, marginRight: 8, fontSize: 14 }} />
                              <span>On Hold</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="Completed">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FaCheckCircle style={{ color: statusStyles['Completed'].color, marginRight: 8, fontSize: 14 }} />
                              <span>Completed</span>
                            </Box>
                          </MenuItem>
                          <MenuItem value="Cancelled">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FiXCircle style={{ color: statusStyles['Cancelled'].color, marginRight: 8, fontSize: 14 }} />
                              <span>Cancelled</span>
                            </Box>
                          </MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={project.priority}
                          sx={{
                            color: priorityStyles[project.priority]?.color || '#64748b',
                            backgroundColor: priorityStyles[project.priority]?.bgcolor || '#f8fafc',
                            fontWeight: 'medium',
                            textTransform: 'capitalize'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {new Date(project.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip title="View Team">
                            <IconButton 
                              size="small" 
                              sx={{ color: '#64748b' }}
                              onClick={() => handleViewTeam(project)}
                            >
                              <FiUsers size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton size="small" sx={{ color: '#64748b' }}>
                              <FiEye size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" sx={{ color: '#64748b' }}>
                              <FiEdit2 size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" sx={{ color: '#ef4444' }}>
                              <FiTrash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        No projects found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Pagination */}
        {filteredProjects.length > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filteredProjects.length)} of {filteredProjects.length} projects
              </Typography>
              <Pagination
                count={Math.ceil(filteredProjects.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                shape="rounded"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#64748b',
                    '&.Mui-selected': {
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#4338ca',
                      }
                    }
                  }
                }}
              />
            </Stack>
          </Box>
        )}
      </Paper>

      <TeamManagementDialog
        open={openTeamDialog}
        onClose={handleCloseTeamDialog}
        project={selectedProject}
        onSave={handleSaveTeam}
        users={users}
      />
    </div>
  );
};

export default AllProjects;