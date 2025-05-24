import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Button, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl, 
  Divider, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  LinearProgress
} from '@mui/material';
import { 
  FiUsers, 
  FiPlus, 
  FiTrash2, 
  FiEdit2, 
  FiUserPlus,
  FiSearch,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiX,
  FiCheck
} from 'react-icons/fi';
import { db, auth } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const TeamAssignment = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [collaborationMode, setCollaborationMode] = useState('project');
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Collaborator',
    department: 'Design',
    projectRole: ''
  });
  const [newCollaboration, setNewCollaboration] = useState({
    title: '',
    mentorId: '',
    roles: []
  });
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [searchUserTerm, setSearchUserTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const projectsQuery = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = projectsQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);
        
        // Fetch users
        const usersQuery = await getDocs(collection(db, "users"));
        const usersData = usersQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData.filter(user => 
          user.role === 'Collaborator' || user.role === 'Intern' || user.role === 'Freelancer'
        ));
        
        // Fetch mentors (users with marketing role)
        setMentors(usersData.filter(user => user.role === 'marketing'));
        
        // Fetch marketing collaborations
        const collabQuery = await getDocs(collection(db, "marketing-collaboration"));
        const collabData = collabQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          mentorId: doc.data().MentorId 
        }));
        setCollaborations(collabData);
        
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]);
        }
      } catch (error) {
        alert(error)
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
  };

  const handleCollaborationChange = (collabId) => {
    const collab = collaborations.find(c => c.id === collabId);
    setSelectedCollaboration(collab);
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setOpenDialog(true);
    setSelectedUsers([]);
    setNewMember({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'Collaborator',
      department: 'Design',
      projectRole: ''
    });
    setShowAddOptions(true);
    setAddMode(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType('');
    setShowAddOptions(false);
    setAddMode(null);
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedProject) return;
    
    try {
      const updatedMembers = selectedProject.teamMembers.filter(member => member.id !== memberId);
      await updateDoc(doc(db, "dxd-magnate-projects", selectedProject.id), {
        teamMembers: updatedMembers
      });
      
      // Log activity
      const memberToRemove = selectedProject.teamMembers.find(member => member.id === memberId);
      await setDoc(doc(collection(db, 'project-activities')), {
        actionType: "team_member_removed",
        message: `Team member removed: ${memberToRemove.name}`,
        projectId: selectedProject.id,
        projectName: selectedProject.title,
        timestamp: serverTimestamp(),
        type: "team",
        userFullName: memberToRemove.name,
        userId: memberToRemove.id
      });

      // Send notification
      await setDoc(doc(collection(db, 'collaborator-notifications')), {
        userId: memberToRemove.id,
        projectId: selectedProject.id,
        projectName: selectedProject.title,
        message: `You've been removed from project: ${selectedProject.title}`,
        type: "project_removal",
        read: false,
        timestamp: serverTimestamp()
      });

      setSelectedProject(prev => ({
        ...prev,
        teamMembers: updatedMembers
      }));
    } catch (error) {
      console.error("Error removing team member:", error);
    }
  };

  const handleRemoveMarketingMember = async (memberId) => {
    if (!selectedCollaboration) return;
    
    try {
      const updatedMembers = selectedCollaboration.TeamMembers.filter(member => member.id !== memberId);
      await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
        TeamMembers: updatedMembers
      });
      
      // Send notification
      const memberToRemove = selectedCollaboration.TeamMembers.find(member => member.id === memberId);
      await setDoc(doc(collection(db, 'collaborator-notifications')), {
        userId: memberToRemove.id,
        collaborationId: selectedCollaboration.id,
        message: `You've been removed from marketing collaboration`,
        type: "marketing_removal",
        read: false,
        timestamp: serverTimestamp()
      });

      setSelectedCollaboration(prev => ({
        ...prev,
        TeamMembers: updatedMembers
      }));
    } catch (error) {
      console.error("Error removing marketing team member:", error);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.trim() || !selectedProject) return;
    
    const updatedRoles = [...(selectedProject.roles || []), newRole.trim()];
    
    try {
      await updateDoc(doc(db, "dxd-magnate-projects", selectedProject.id), {
        roles: updatedRoles
      });
      
      // Log activity
      await setDoc(doc(collection(db, 'project-activities')), {
        actionType: "role_added",
        message: `Project role added: ${newRole.trim()}`,
        projectId: selectedProject.id,
        projectName: selectedProject.title,
        timestamp: serverTimestamp(),
        type: "team",
        userFullName: "System",
        userId: "system"
      });

      setSelectedProject(prev => ({
        ...prev,
        roles: updatedRoles
      }));
      
      setNewRole('');
    } catch (error) {
      console.error("Error adding role:", error);
    }
  };

  const handleAddMarketingRole = async () => {
    if (!newRole.trim() || !selectedCollaboration) return;
    
    const updatedRoles = [...(selectedCollaboration.roles || []), newRole.trim()];
    
    try {
      await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
        roles: updatedRoles
      });
      
      setSelectedCollaboration(prev => ({
        ...prev,
        roles: updatedRoles
      }));
      
      setNewRole('');
    } catch (error) {
      console.error("Error adding marketing role:", error);
    }
  };

  const handleRemoveRole = async (roleToRemove) => {
    if (!selectedProject) return;
    
    const updatedRoles = (selectedProject.roles || []).filter(role => role !== roleToRemove);
    
    try {
      await updateDoc(doc(db, "dxd-magnate-projects", selectedProject.id), {
        roles: updatedRoles
      });
      
      // Log activity
      await setDoc(doc(collection(db, 'project-activities')), {
        actionType: "role_removed",
        message: `Project role removed: ${roleToRemove}`,
        projectId: selectedProject.id,
        projectName: selectedProject.title,
        timestamp: serverTimestamp(),
        type: "team",
        userFullName: "System",
        userId: "system"
      });

      setSelectedProject(prev => ({
        ...prev,
        roles: updatedRoles
      }));
    } catch (error) {
      console.error("Error removing role:", error);
    }
  };

  const handleRemoveMarketingRole = async (roleToRemove) => {
    if (!selectedCollaboration) return;
    
    const updatedRoles = (selectedCollaboration.roles || []).filter(role => role !== roleToRemove);
    
    try {
      await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
        roles: updatedRoles
      });
      
      setSelectedCollaboration(prev => ({
        ...prev,
        roles: updatedRoles
      }));
    } catch (error) {
      console.error("Error removing marketing role:", error);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleAddSelectedUsers = async () => {
    if (!selectedProject || selectedUsers.length === 0 || !newMember.projectRole) return;
    
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    const newTeamMembers = selectedUserData.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      department: user.department,
      allocation: '100%',
      projectRole: newMember.projectRole
    }));
    
    const updatedTeamMembers = [...(selectedProject.teamMembers || []), ...newTeamMembers];
    
    try {
      await updateDoc(doc(db, "dxd-magnate-projects", selectedProject.id), {
        teamMembers: updatedTeamMembers
      });
      
      // Log activities and create notifications
      for (const user of selectedUserData) {
        await setDoc(doc(collection(db, 'project-activities')), {
          actionType: "team_member_added",
          message: `Team member added: ${user.firstName} ${user.lastName}`,
          projectId: selectedProject.id,
          projectName: selectedProject.title,
          timestamp: serverTimestamp(),
          type: "team",
          userFullName: `${user.firstName} ${user.lastName}`,
          userId: user.id
        });

        await setDoc(doc(collection(db, 'collaborator-notifications')), {
          userId: user.id,
          projectId: selectedProject.id,
          projectName: selectedProject.title,
          message: `You've been added to project: ${selectedProject.title}`,
          type: "project_assignment",
          read: false,
          timestamp: serverTimestamp()
        });
      }

      setSelectedProject(prev => ({
        ...prev,
        teamMembers: updatedTeamMembers
      }));
      
      setSelectedUsers([]);
      setNewMember(prev => ({ ...prev, projectRole: '' }));
      setAddMode(null);
      setShowAddOptions(false);
    } catch (error) {
      console.error("Error adding team members:", error);
    }
  };

  const handleAddMarketingMembers = async () => {
    if (!selectedCollaboration || selectedUsers.length === 0 || !newMember.projectRole) return;
    
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    const newTeamMembers = selectedUserData.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: newMember.projectRole,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    }));
    
    const updatedTeamMembers = [...(selectedCollaboration.TeamMembers || []), ...newTeamMembers];
    
    try {
      await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
        TeamMembers: updatedTeamMembers
      });
      
      // Create notifications
      for (const user of selectedUserData) {
        await setDoc(doc(collection(db, 'collaborator-notifications')), {
          userId: user.id,
          collaborationId: selectedCollaboration.id,
          message: `You've been added to marketing collaboration`,
          type: "marketing_assignment",
          read: false,
          timestamp: serverTimestamp()
        });
      }

      setSelectedCollaboration(prev => ({
        ...prev,
        TeamMembers: updatedTeamMembers
      }));
      
      setSelectedUsers([]);
      setNewMember(prev => ({ ...prev, projectRole: '' }));
      setAddMode(null);
      setShowAddOptions(false);
    } catch (error) {
      console.error("Error adding marketing team members:", error);
    }
  };

  const handleAddNewMember = async () => {
    if (!newMember.projectRole) return;
    
    try {
      // Create user in Firebase Auth
      const tempPassword = "defaultPassword123";
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newMember.email,
        tempPassword
      );
      
      // Create user document in Firestore
      const userDoc = {
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        phone: newMember.phone,
        email: newMember.email,
        role: newMember.role,
        department: newMember.department,
        status: 'active',
        uid: userCredential.user.uid,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      
      // Add to team (project or collaboration)
      const newTeamMember = {
        id: userCredential.user.uid,
        name: `${newMember.firstName} ${newMember.lastName}`,
        role: newMember.role,
        department: newMember.department,
        allocation: '100%',
        projectRole: newMember.projectRole,
        isNew: true
      };
      
      if (collaborationMode === 'project' && selectedProject) {
        const updatedTeamMembers = [...(selectedProject.teamMembers || []), newTeamMember];
        await updateDoc(doc(db, "dxd-magnate-projects", selectedProject.id), {
          teamMembers: updatedTeamMembers
        });
        
        setSelectedProject(prev => ({
          ...prev,
          teamMembers: updatedTeamMembers
        }));
      } else if (collaborationMode === 'marketing' && selectedCollaboration) {
        const newMarketingMember = {
          id: userCredential.user.uid,
          name: `${newMember.firstName} ${newMember.lastName}`,
          role: newMember.projectRole,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        };
        
        const updatedTeamMembers = [...(selectedCollaboration.TeamMembers || []), newMarketingMember];
        await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
          TeamMembers: updatedTeamMembers
        });
        
        setSelectedCollaboration(prev => ({
          ...prev,
          TeamMembers: updatedTeamMembers
        }));
      }
      
      // Log activity and create notification
      const activityCollection = collaborationMode === 'project' ? 'project-activities' : 'marketing-activities';
      const targetId = collaborationMode === 'project' ? selectedProject.id : selectedCollaboration.id;
      const targetName = collaborationMode === 'project' ? selectedProject.title : selectedCollaboration.title;
      const actionType = collaborationMode === 'project' ? "team_member_added" : "marketing_member_added";
      const type = collaborationMode === 'project' ? "team" : "marketing";
      
      await setDoc(doc(collection(db, activityCollection)), {
        actionType,
        message: `New team member created and added: ${newMember.firstName} ${newMember.lastName}`,
        [collaborationMode === 'project' ? 'projectId' : 'collaborationId']: targetId,
        [collaborationMode === 'project' ? 'projectName' : 'collaborationName']: targetName,
        timestamp: serverTimestamp(),
        type,
        userFullName: `${newMember.firstName} ${newMember.lastName}`,
        userId: userCredential.user.uid
      });

      await setDoc(doc(collection(db, 'collaborator-notifications')), {
        userId: userCredential.user.uid,
        [collaborationMode === 'project' ? 'projectId' : 'collaborationId']: targetId,
        [collaborationMode === 'project' ? 'projectName' : 'collaborationName']: targetName,
        message: `You've been added to ${collaborationMode === 'project' ? 'project' : 'marketing collaboration'}: ${targetName}`,
        type: collaborationMode === 'project' ? "project_assignment" : "marketing_assignment",
        read: false,
        timestamp: serverTimestamp()
      });

      setNewMember({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'Collaborator',
        department: 'Design',
        projectRole: ''
      });
      setAddMode(null);
      setShowAddOptions(false);
    } catch (error) {
      console.error("Error adding new member:", error);
    }
  };

const handleCreateCollaboration = async () => {
  if (!newCollaboration.mentorId) return;
  
  try {
    const docRef = await addDoc(collection(db, "marketing-collaboration"), {
      title: newCollaboration.title,
      MentorId: newCollaboration.mentorId, // Use uppercase 'I' here to match database
      TeamMembers: [],
      roles: newCollaboration.roles,
      createdAt: serverTimestamp()
    });
    
    const newCollab = {
      id: docRef.id,
      title: newCollaboration.title,
      mentorId: newCollaboration.mentorId, // Use lowercase 'i' in the local state
      TeamMembers: [],
      roles: newCollaboration.roles
    };
    
    setCollaborations(prev => [...prev, newCollab]);
    setSelectedCollaboration(newCollab);
    setNewCollaboration({
      title: '',
      mentorId: '',
      roles: []
    });
    setOpenDialog(false);
    
    // Log activity
    await setDoc(doc(collection(db, 'marketing-activities')), {
      actionType: "collaboration_created",
      message: `New marketing collaboration created: ${newCollaboration.title}`,
      collaborationId: docRef.id,
      timestamp: serverTimestamp(),
      type: "marketing"
    });
  } catch (error) {
    alert(error)
    console.error("Error creating collaboration:", error);
  }
};

  const filteredProjects = projects.filter(project => 
    project?.title?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );
  
  const filteredCollaborations = collaborations.filter(collab => 
    collab?.title?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );
  
  const filteredUsers = users.filter(user => 
    `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
    user?.email?.toLowerCase()?.includes(searchUserTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography variant="h6">Loading data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 'bold', 
        mb: 3,
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Team Assignment Dashboard
      </Typography>

      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={collaborationMode === 'project' ? 'contained' : 'outlined'}
              onClick={() => setCollaborationMode('project')}
              startIcon={<FiUsers />}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: collaborationMode === 'project' ? '#4f46e5' : 'transparent',
                '&:hover': {
                  backgroundColor: collaborationMode === 'project' ? '#4338ca' : '#f1f5f9'
                }
              }}
            >
              Project Teams
            </Button>
            <Button
              variant={collaborationMode === 'marketing' ? 'contained' : 'outlined'}
              onClick={() => setCollaborationMode('marketing')}
              startIcon={<FiUsers />}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: collaborationMode === 'marketing' ? '#4f46e5' : 'transparent',
                '&:hover': {
                  backgroundColor: collaborationMode === 'marketing' ? '#4338ca' : '#f1f5f9'
                }
              }}
            >
              Marketing Collaborations
            </Button>
          </Box>

          {collaborationMode === 'project' ? (
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              onClick={() => handleOpenDialog('add')}
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                textTransform: 'none',
                borderRadius: '8px'
              }}
            >
              Add Team Member
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<FiPlus />}
              onClick={() => handleOpenDialog('new-collab')}
              sx={{
                backgroundColor: '#4f46e5',
                '&:hover': { backgroundColor: '#4338ca' },
                textTransform: 'none',
                borderRadius: '8px'
              }}
            >
              New Collaboration
            </Button>
          )}
        </Box>

        {collaborationMode === 'project' ? (
          <>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search projects..."
                InputProps={{
                  startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  maxWidth: 400,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              <FormControl sx={{ minWidth: 300 }} size="small">
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={selectedProject?.id || ''}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  label="Select Project"
                  IconComponent={FiChevronDown}
                  sx={{ borderRadius: '8px' }}
                >
                  {filteredProjects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedProject ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {selectedProject.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<FiEdit2 />}
                      onClick={() => handleOpenDialog('edit')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        borderColor: '#e2e8f0',
                        color: '#64748b'
                      }}
                    >
                      Edit Project
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<FiUserPlus />}
                      onClick={() => handleOpenDialog('add')}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#4f46e5',
                        '&:hover': { backgroundColor: '#4338ca' }
                      }}
                    >
                      Add Team Member
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 2, height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Project Overview
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <FiCalendar style={{ marginRight: 8, color: '#64748b' }} />
                          <Typography variant="body2">
                            <span style={{ fontWeight: '500' }}>Start Date:</span> {new Date(selectedProject.startDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <FiClock style={{ marginRight: 8, color: '#64748b' }} />
                          <Typography variant="body2">
                            <span style={{ fontWeight: '500' }}>Duration:</span> {selectedProject.duration}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <FiDollarSign style={{ marginRight: 8, color: '#64748b' }} />
                          <Typography variant="body2">
                            <span style={{ fontWeight: '500' }}>Budget:</span> ${parseInt(selectedProject.budget).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                            Project Manager:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', width: 36, height: 36 }}>
                              {selectedProject.projectManager?.charAt(0) || 'P'}
                            </Avatar>
                            <Typography variant="body2">
                              {selectedProject.projectManager || 'Not assigned'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                            Project Roles:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(selectedProject.roles || []).map((role) => (
                              <Chip
                                key={role}
                                label={role}
                                onDelete={() => handleRemoveRole(role)}
                                sx={{
                                  backgroundColor: '#e0e7ff',
                                  color: '#4f46e5',
                                  '& .MuiChip-deleteIcon': {
                                    color: '#4f46e5',
                                    '&:hover': {
                                      color: '#4338ca'
                                    }
                                  }
                                }}
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <TextField
                              size="small"
                              placeholder="Add new role"
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            <Button
                              variant="contained"
                              onClick={handleAddRole}
                              disabled={!newRole.trim()}
                              sx={{
                                minWidth: 'auto',
                                backgroundColor: '#4f46e5',
                                '&:hover': { backgroundColor: '#4338ca' }
                              }}
                            >
                              <FiPlus />
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Team Members ({selectedProject.teamMembers?.length || 0})
                        </Typography>
                        
                        {selectedProject.teamMembers?.length > 0 ? (
                          <Grid container spacing={2}>
                            {selectedProject.teamMembers.map((member) => (
                              <Grid item xs={12} sm={6} key={member.id}>
                                <Paper elevation={0} sx={{ 
                                  p: 2, 
                                  borderRadius: 2,
                                  border: '1px solid #e2e8f0',
                                  position: 'relative'
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar 
                                      sx={{ 
                                        width: 48, 
                                        height: 48, 
                                        bgcolor: '#e0e7ff', 
                                        color: '#4f46e5',
                                        fontSize: '1rem'
                                      }}
                                    >
                                      {member.name?.charAt(0) || 'U'}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {member.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        {member.role}
                                      </Typography>
                                      <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                          label={member.projectRole}
                                          size="small"
                                          sx={{
                                            backgroundColor: '#e0e7ff',
                                            color: '#4f46e5',
                                            fontSize: '0.65rem',
                                            height: '20px'
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  </Box>
                                  <Box sx={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    right: 8,
                                    display: 'flex',
                                    gap: 0.5
                                  }}>
                                    <Tooltip title="Remove from project">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveMember(member.id)}
                                        sx={{ color: '#ef4444' }}
                                      >
                                        <FiTrash2 size={16} />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 4,
                            border: '1px dashed #e2e8f0',
                            borderRadius: 2
                          }}>
                            <Typography variant="body2" sx={{ color: '#64748b' }}>
                              No team members assigned to this project
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                border: '1px dashed #e2e8f0',
                borderRadius: 2
              }}>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  No project selected or no projects available
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search collaborations..."
                InputProps={{
                  startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  maxWidth: 400,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              <FormControl sx={{ minWidth: 300 }} size="small">
                <InputLabel>Select Collaboration</InputLabel>
                <Select
                  value={selectedCollaboration?.id || ''}
                  onChange={(e) => handleCollaborationChange(e.target.value)}
                  label="Select Collaboration"
                  IconComponent={FiChevronDown}
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="" onClick={() => handleOpenDialog('new-collab')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FiPlus size={16} />
                      <span>Create New Collaboration</span>
                    </Box>
                  </MenuItem>
                  <Divider />
                  {filteredCollaborations.map((collab) => (
                    <MenuItem key={collab.id} value={collab.id}>
                      {collab.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<FiUserPlus />}
                onClick={() => handleOpenDialog('add-marketing')}
                disabled={!selectedCollaboration}
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' }
                }}
              >
                Add Team Member
              </Button>
            </Box>

            {selectedCollaboration ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Collaboration Overview
                      </Typography>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        {selectedCollaboration.title}
                      </Typography>
                      
                     <Box sx={{ mt: 2 }}>
  <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
    Mentor:
  </Typography>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', width: 36, height: 36 }}>
      {mentors.find(m => m.id === selectedCollaboration.mentorId)?.firstName?.charAt(0) || 'M'}
    </Avatar>
    <Typography variant="body2">
      {mentors.find(m => m.id === selectedCollaboration.mentorId)?.firstName + ' ' + 
       mentors.find(m => m.id === selectedCollaboration.mentorId)?.lastName || 'Not assigned'}
    </Typography>
  </Box>
</Box>
                      
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                          Marketing Roles:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {(selectedCollaboration.roles || []).map((role) => (
                            <Chip
                              key={role}
                              label={role}
                              onDelete={() => handleRemoveMarketingRole(role)}
                              sx={{
                                backgroundColor: '#e0e7ff',
                                color: '#4f46e5',
                                '& .MuiChip-deleteIcon': {
                                  color: '#4f46e5',
                                  '&:hover': {
                                    color: '#4338ca'
                                  }
                                }
                              }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <TextField
                            size="small"
                            placeholder="Add new role"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            sx={{ flex: 1 }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleAddMarketingRole}
                            disabled={!newRole.trim()}
                            sx={{
                              minWidth: 'auto',
                              backgroundColor: '#4f46e5',
                              '&:hover': { backgroundColor: '#4338ca' }
                            }}
                          >
                            <FiPlus />
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Team Members ({selectedCollaboration.TeamMembers?.length || 0})
                      </Typography>
                      
                      {selectedCollaboration.TeamMembers?.length > 0 ? (
                        <Grid container spacing={2}>
                          {selectedCollaboration.TeamMembers.map((member) => (
                            <Grid item xs={12} sm={6} key={member.id}>
                              <Paper elevation={0} sx={{ 
                                p: 2, 
                                borderRadius: 2,
                                border: '1px solid #e2e8f0',
                                position: 'relative'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar 
                                    sx={{ 
                                      width: 48, 
                                      height: 48, 
                                      bgcolor: '#e0e7ff', 
                                      color: '#4f46e5',
                                      fontSize: '1rem'
                                    }}
                                  >
                                    {member.name?.charAt(0) || 'U'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                      {member.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                      {member.role}
                                    </Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        Joined: {new Date(member.createdAt?.toDate()).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                                <Box sx={{ 
                                  position: 'absolute', 
                                  top: 8, 
                                  right: 8,
                                  display: 'flex',
                                  gap: 0.5
                                }}>
                                  <Tooltip title="Remove from collaboration">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveMarketingMember(member.id)}
                                      sx={{ color: '#ef4444' }}
                                    >
                                      <FiTrash2 size={16} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 4,
                          border: '1px dashed #e2e8f0',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            No team members assigned to this collaboration
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                border: '1px dashed #e2e8f0',
                borderRadius: 2
              }}>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  {collaborations.length === 0 ? 'No marketing collaborations available' : 'No collaboration selected'}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Enhanced Dialog for adding team members and creating collaborations */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {dialogType === 'add' ? 'Add Team Member' : 
           dialogType === 'edit' ? 'Edit Project' : 
           dialogType === 'new-collab' ? 'New Marketing Collaboration' :
           dialogType === 'add-marketing' ? 'Add Marketing Team Member' : 
           'Create New Collaboration'}
        </DialogTitle>
        <DialogContent dividers>
          {dialogType === 'add' ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
                Add new team members to {selectedProject?.title}
              </Typography>
              
              {showAddOptions ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Add Team Member Options
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<FiUser />}
                      onClick={() => setAddMode('existing')}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#4f46e5',
                        '&:hover': { backgroundColor: '#4338ca' }
                      }}
                    >
                      Select from Existing Users
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<FiUserPlus />}
                      onClick={() => setAddMode('new')}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#10b981',
                        '&:hover': { backgroundColor: '#0d9f6e' }
                      }}
                    >
                      Onboard New Collaborator
                    </Button>
                  </Box>
                  <Button
                    variant="text"
                    onClick={() => setShowAddOptions(false)}
                    sx={{ color: '#64748b' }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : null}

              {addMode === 'existing' && (
                <Box>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search users..."
                    value={searchUserTerm}
                    onChange={(e) => setSearchUserTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    select
                    label="Project Role"
                    fullWidth
                    value={newMember.projectRole}
                    onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="" disabled>Select project role</MenuItem>
                    {(selectedProject?.roles || []).map((role) => (
                      <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                  </TextField>
                  
                  <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                    {filteredUsers.map((user) => (
                      <ListItem
                        key={user.id}
                        secondaryAction={
                          <Checkbox
                            edge="end"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                          />
                        }
                      >
                        <ListItemAvatar>
                          <Avatar alt={`${user.firstName} ${user.lastName}`} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {user.role}
                              </Typography>
                              <Chip
                                label={user.department}
                                size="small"
                                sx={{
                                  ml: 1,
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  fontSize: '0.65rem'
                                }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  {selectedUsers.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedUsers([]);
                          setAddMode(null);
                          setNewMember(prev => ({ ...prev, projectRole: '' }));
                        }}
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
                        variant="contained"
                        onClick={handleAddSelectedUsers}
                        disabled={!newMember.projectRole}
                        sx={{
                          textTransform: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#4f46e5',
                          '&:hover': { backgroundColor: '#4338ca' }
                        }}
                      >
                        Add Selected Members
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {addMode === 'new' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Onboard New Collaborator
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="First Name"
                      fullWidth
                      value={newMember.firstName}
                      onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Last Name"
                      fullWidth
                      value={newMember.lastName}
                      onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Phone"
                    fullWidth
                    value={newMember.phone}
                    onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      select
                      label="Role"
                      fullWidth
                      value={newMember.role}
                      onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value="Collaborator">Collaborator</MenuItem>
                      <MenuItem value="Intern">Intern</MenuItem>
                      <MenuItem value="Freelancer">Freelancer</MenuItem>
                    </TextField>
                    <TextField
                      select
                      label="Department"
                      fullWidth
                      value={newMember.department}
                      onChange={(e) => setNewMember({...newMember, department: e.target.value})}
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value="Design">Design</MenuItem>
                      <MenuItem value="Development">Development</MenuItem>
                      <MenuItem value="Marketing">Marketing</MenuItem>
                      <MenuItem value="Content">Content</MenuItem>
                    </TextField>
                  </Box>
                  <TextField
                    select
                    label="Project Role"
                    fullWidth
                    value={newMember.projectRole}
                    onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="" disabled>Select project role</MenuItem>
                    {(selectedProject?.roles || []).map((role) => (
                      <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setAddMode(null)}
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
                      variant="contained"
                      onClick={handleAddNewMember}
                      disabled={!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.projectRole}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#10b981',
                        '&:hover': { backgroundColor: '#0d9f6e' }
                      }}
                    >
                      Onboard & Add to Team
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          ) : dialogType === 'new-collab' ? (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Create New Marketing Collaboration
              </Typography>
              <TextField
                label="Collaboration Title"
                fullWidth
                value={newCollaboration.title}
                onChange={(e) => setNewCollaboration({...newCollaboration, title: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                select
                label="Select Mentor"
                fullWidth
                value={newCollaboration.mentorId}
                onChange={(e) => setNewCollaboration({...newCollaboration, mentorId: e.target.value})}
                sx={{ mb: 2 }}
              >
                <MenuItem value="" disabled>Select a mentor</MenuItem>
                {mentors.map(mentor => (
                  <MenuItem key={mentor.id} value={mentor.id}>
                    {mentor.firstName} {mentor.lastName}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: '500' }}>
                  Initial Roles:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {newCollaboration.roles.map((role, index) => (
                    <Chip
                      key={index}
                      label={role}
                      onDelete={() => setNewCollaboration({
                        ...newCollaboration,
                        roles: newCollaboration.roles.filter((_, i) => i !== index)
                      })}
                      sx={{
                        backgroundColor: '#e0e7ff',
                        color: '#4f46e5'
                      }}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Add role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (newRole.trim()) {
                        setNewCollaboration({
                          ...newCollaboration,
                          roles: [...newCollaboration.roles, newRole.trim()]
                        });
                        setNewRole('');
                      }
                    }}
                    sx={{
                      minWidth: 'auto',
                      backgroundColor: '#4f46e5',
                      '&:hover': { backgroundColor: '#4338ca' }
                    }}
                  >
                    <FiPlus />
                  </Button>
                </Box>
              </Box>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCloseDialog}
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
                  variant="contained"
                  onClick={handleCreateCollaboration}
                  disabled={!newCollaboration.mentorId}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#10b981',
                    '&:hover': { backgroundColor: '#0d9f6e' }
                  }}
                >
                  Create Collaboration
                </Button>
              </Box>
            </Box>
          ) : dialogType === 'add-marketing' ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
                Add new team members to {selectedCollaboration?.title}
              </Typography>
              
              {showAddOptions ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Add Team Member Options
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<FiUser />}
                      onClick={() => setAddMode('existing')}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#4f46e5',
                        '&:hover': { backgroundColor: '#4338ca' }
                      }}
                    >
                      Select from Existing Users
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<FiUserPlus />}
                      onClick={() => setAddMode('new')}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#10b981',
                        '&:hover': { backgroundColor: '#0d9f6e' }
                      }}
                    >
                      Onboard New Collaborator
                    </Button>
                  </Box>
                  <Button
                    variant="text"
                    onClick={() => setShowAddOptions(false)}
                    sx={{ color: '#64748b' }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : null}

              {addMode === 'existing' && (
                <Box>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search users..."
                    value={searchUserTerm}
                    onChange={(e) => setSearchUserTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <FiSearch style={{ marginRight: 8, color: '#64748b' }} />,
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    select
                    label="Marketing Role"
                    fullWidth
                    value={newMember.projectRole}
                    onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="" disabled>Select marketing role</MenuItem>
                    {(selectedCollaboration?.roles || []).map((role) => (
                      <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                  </TextField>
                  
                  <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
                    {filteredUsers.map((user) => (
                      <ListItem
                        key={user.id}
                        secondaryAction={
                          <Checkbox
                            edge="end"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                          />
                        }
                      >
                        <ListItemAvatar>
                          <Avatar alt={`${user.firstName} ${user.lastName}`} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${user.firstName} ${user.lastName}`}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {user.role}
                              </Typography>
                              <Chip
                                label={user.department}
                                size="small"
                                sx={{
                                  ml: 1,
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  fontSize: '0.65rem'
                                }}
                              />
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                  {selectedUsers.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedUsers([]);
                          setAddMode(null);
                          setNewMember(prev => ({ ...prev, projectRole: '' }));
                        }}
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
                        variant="contained"
                        onClick={handleAddMarketingMembers}
                        disabled={!newMember.projectRole}
                        sx={{
                          textTransform: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#4f46e5',
                          '&:hover': { backgroundColor: '#4338ca' }
                        }}
                      >
                        Add Selected Members
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              {addMode === 'new' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Onboard New Marketing Team Member
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="First Name"
                      fullWidth
                      value={newMember.firstName}
                      onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Last Name"
                      fullWidth
                      value={newMember.lastName}
                      onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  <TextField
                    label="Email"
                    fullWidth
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    label="Phone"
                    fullWidth
                    value={newMember.phone}
                    onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    select
                    label="Marketing Role"
                    fullWidth
                    value={newMember.projectRole}
                    onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="" disabled>Select marketing role</MenuItem>
                    {(selectedCollaboration?.roles || []).map((role) => (
                      <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setAddMode(null)}
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
                      variant="contained"
                      onClick={handleAddNewMember}
                      disabled={!newMember.firstName || !newMember.lastName || !newMember.email || !newMember.projectRole}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#10b981',
                        '&:hover': { backgroundColor: '#0d9f6e' }
                      }}
                    >
                      Onboard & Add to Team
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          ) : dialogType === 'edit' ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
                Edit project details for {selectedProject?.title}
              </Typography>
              {/* Edit project form would go here */}
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
                Create a new marketing collaboration
              </Typography>
              {/* New collaboration form would go here */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: '#64748b',
              '&:hover': { backgroundColor: 'transparent' }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamAssignment;