import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { FiUsers, FiPlus } from 'react-icons/fi';
import { db, auth } from '../../../services/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import ProjectTeams from './components/ProjectTeams';
import MarketingCollaborations from './components/MarketingCollaborations';
import TeamMemberDialog from './components/TeamMemberDialog';
import CollaborationDialog from './components/CollaborationDialog';

const TeamAssignment = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
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
      createdAt: new Date().toISOString(), // Use client-side timestamp instead
      lastUpdated: new Date().toISOString()
    }));
    
    try {
      // First update Firestore
      await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
        TeamMembers: [...(selectedCollaboration.TeamMembers || []), ...newTeamMembers]
      });
      
      // Then update local state
      const updatedTeamMembers = [...(selectedCollaboration.TeamMembers || []), ...newTeamMembers];
      
      setCollaborations(prev => prev.map(collab => 
        collab.id === selectedCollaboration.id 
          ? { ...collab, TeamMembers: updatedTeamMembers }
          : collab
      ));
      
      setSelectedCollaboration(prev => ({
        ...prev,
        TeamMembers: updatedTeamMembers
      }));
      
      // Create notifications
      for (const user of selectedUserData) {
        await setDoc(doc(collection(db, 'collaborator-notifications')), {
          userId: user.id,
          collaborationId: selectedCollaboration.id,
          message: `You've been added to marketing collaboration: ${selectedCollaboration.title}`,
          type: "marketing_assignment",
          read: false,
          timestamp: serverTimestamp() // This is fine here - not in an array
        });
      }
  
      // Reset form
      setSelectedUsers([]);
      setNewMember(prev => ({ ...prev, projectRole: '' }));
      setAddMode(null);
      setShowAddOptions(false);
      setOpenDialog(false); // Also close the dialog
    } catch (error) {
      console.error("Error adding marketing team members:", error);
      alert(error);
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
        MentorId: newCollaboration.mentorId,
        TeamMembers: [],
        roles: newCollaboration.roles,
        createdAt: serverTimestamp()
      });
      
      const newCollab = {
        id: docRef.id,
        title: newCollaboration.title,
        mentorId: newCollaboration.mentorId,
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
        <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Typography variant="h4" sx={{ 
        fontWeight: 700, 
        mb: 3,
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: isMobile ? '1.75rem' : '2.125rem'
      }}>
        Team Assignment Dashboard
      </Typography>

      <Paper elevation={0} sx={{ 
        p: isMobile ? 2 : 3, 
        mb: 3, 
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          mb: 3,
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Button
              variant={collaborationMode === 'project' ? 'contained' : 'outlined'}
              onClick={() => setCollaborationMode('project')}
              startIcon={<FiUsers />}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: collaborationMode === 'project' ? '#4f46e5' : 'transparent',
                color: collaborationMode === 'project' ? '#ffffff' : '#4f46e5',
                borderColor: '#e2e8f0',
                '&:hover': {
                  backgroundColor: collaborationMode === 'project' ? '#4338ca' : '#f8fafc'
                },
                flex: isMobile ? 1 : 'none',
                height: '40px'
              }}
              fullWidth={isMobile}
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
                color: collaborationMode === 'marketing' ? '#ffffff' : '#4f46e5',
                borderColor: '#e2e8f0',
                '&:hover': {
                  backgroundColor: collaborationMode === 'marketing' ? '#4338ca' : '#f8fafc'
                },
                flex: isMobile ? 1 : 'none',
                height: '40px'
              }}
              fullWidth={isMobile}
            >
              Marketing
            </Button>
          </Box>

          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => handleOpenDialog(collaborationMode === 'project' ? 'add' : 'new-collab')}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              textTransform: 'none',
              borderRadius: '8px',
              height: '40px',
              mt: isMobile ? 0 : 0,
              width: isMobile ? '100%' : 'auto',
              minWidth: isMobile ? '100%' : '200px'
            }}
            fullWidth={isMobile}
          >
            {collaborationMode === 'project' ? 'Add Member' : 'New Collaboration'}
          </Button>
        </Box>

        {collaborationMode === 'project' ? (
          <ProjectTeams
            projects={projects}
            selectedProject={selectedProject}
            handleProjectChange={handleProjectChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleOpenDialog={handleOpenDialog}
            filteredProjects={filteredProjects}
            handleAddRole={handleAddRole}
            handleRemoveRole={handleRemoveRole}
            newRole={newRole}
            setNewRole={setNewRole}
            handleRemoveMember={handleRemoveMember}
          />
        ) : (
          <MarketingCollaborations
            collaborations={collaborations}
            selectedCollaboration={selectedCollaboration}
            handleCollaborationChange={handleCollaborationChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleOpenDialog={handleOpenDialog}
            filteredCollaborations={filteredCollaborations}
            mentors={mentors}
            handleAddMarketingRole={handleAddMarketingRole}
            handleRemoveMarketingRole={handleRemoveMarketingRole}
            newRole={newRole}
            setNewRole={setNewRole}
            handleRemoveMarketingMember={handleRemoveMarketingMember}
          />
        )}
      </Paper>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          py: 2
        }}>
          {dialogType === 'add' ? 'Add Team Member' : 
           dialogType === 'edit' ? 'Edit Project' : 
           dialogType === 'new-collab' ? 'New Marketing Collaboration' :
           dialogType === 'add-marketing' ? 'Add Marketing Team Member' : 
           'Create New Collaboration'}
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {dialogType === 'add' || dialogType === 'add-marketing' ? (
            <TeamMemberDialog
              dialogType={dialogType}
              selectedProject={selectedProject}
              selectedCollaboration={selectedCollaboration}
              addMode={addMode}
              showAddOptions={showAddOptions}
              setAddMode={setAddMode}
              setShowAddOptions={setShowAddOptions}
              newMember={newMember}
              setNewMember={setNewMember}
              searchUserTerm={searchUserTerm}
              setSearchUserTerm={setSearchUserTerm}
              filteredUsers={filteredUsers}
              selectedUsers={selectedUsers}
              setSelectedUsers = {setSelectedUsers}
              handleUserSelect={handleUserSelect}
              handleAddSelectedUsers={handleAddSelectedUsers}
              handleAddNewMember={handleAddNewMember}
              handleAddMarketingMembers={handleAddMarketingMembers}
              isMarketing={dialogType === 'add-marketing'}
            />
          ) : dialogType === 'new-collab' ? (
            <CollaborationDialog
              newCollaboration={newCollaboration}
              setNewCollaboration={setNewCollaboration}
              mentors={mentors}
              newRole={newRole}
              setNewRole={setNewRole}
              handleCreateCollaboration={handleCreateCollaboration}
            />
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
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: '1px solid rgba(0,0,0,0.08)'
        }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: '#64748b',
              '&:hover': { 
                backgroundColor: 'rgba(0,0,0,0.04)',
                color: '#1e293b'
              },
              mr: 1
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={
              dialogType === 'new-collab' ? handleCreateCollaboration :
              dialogType === 'add-marketing' ? handleAddMarketingMembers :
              dialogType === 'add' ? handleAddSelectedUsers : 
              () => {}
            }
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              textTransform: 'none',
              borderRadius: '6px'
            }}
            disabled={
              (dialogType === 'new-collab' && !newCollaboration.mentorId) ||
              (dialogType === 'add-marketing' && selectedUsers.length === 0) ||
              (dialogType === 'add' && selectedUsers.length === 0)
            }
          >
            {dialogType === 'new-collab' ? 'Create' : 
             dialogType === 'add-marketing' ? 'Add Members' : 
             dialogType === 'add' ? 'Add Members' : 
             'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamAssignment;