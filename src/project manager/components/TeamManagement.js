import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Checkbox,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Avatar
} from "@mui/material";
import {
  FiUsers,
  FiUser,
  FiUserPlus,
  FiPlus,
  FiSearch,
  FiTrash2
} from "react-icons/fi";
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from "../../services/firebase";

const TeamManagementDialog = ({
  open,
  onClose,
  project,
  onSave,
  users
}) => {
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [newMember, setNewMember] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'Collaborator',
    department: 'Design',
    projectRole: ''
  });
  const [showAddRole, setShowAddRole] = useState(false);
  const [projectRoles, setProjectRoles] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [currentProject, setCurrentProject] = useState(project);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
      setProjectRoles(project.roles || []);
    }
  }, [project]);

  const filteredUsers = users.filter(user =>
    (user.role === 'Collaborator' || user.role === 'Intern' || user.role === 'Freelancer') &&
    (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUserTerm.toLowerCase())
    )
  );

  const handleAddRole = async () => {
    if (newRole.trim() && !projectRoles.includes(newRole.trim())) {
      const updatedRoles = [...projectRoles, newRole.trim()];
      setProjectRoles(updatedRoles);
      setNewRole('');
      
      // Update the project document in Firestore
      try {
        await updateDoc(doc(db, 'dxd-magnate-projects', currentProject.id), {
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
      await updateDoc(doc(db, 'dxd-magnate-projects', currentProject.id), {
        roles: updatedRoles
      });
    } catch (error) {
      console.error('Error removing project role:', error);
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
    if (!newMember.projectRole) {
      alert('Please select a project role for the team members');
      return;
    }
  
    const selectedUserData = users.filter(user => selectedUsers.includes(user.id));
    const newTeamMembers = selectedUserData.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      department: user.department,
      allocation: '100%',
      avatar: user.photoURL || null,
      projectRole: newMember.projectRole
    }));
    
    const updatedTeamMembers = [...(currentProject.teamMembers || []), ...newTeamMembers];
    
    setCurrentProject(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
    
    // Update Firestore project document
    try {
      await updateDoc(doc(db, 'dxd-magnate-projects', currentProject.id), {
        teamMembers: updatedTeamMembers
      });
    } catch (error) {
      console.error('Error updating project team:', error);
    }
    
    setSelectedUsers([]);
    setNewMember(prev => ({ ...prev, projectRole: '' })); // Reset project role
    setAddMode(null);
    setShowAddOptions(false);
  };

  const handleAddNewMember = async () => {
    try {
      // Create new user in your authentication system
      const tempPassword = "defaultPassword123";
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newMember.email,
        tempPassword
      );
      
      // Create user document with additional info
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
      
      // Add to project team
      const newTeamMember = {
        id: userCredential.user.uid,
        name: `${newMember.firstName} ${newMember.lastName}`,
        role: newMember.role,
        projectRole: newMember.projectRole,
        department: newMember.department,
        allocation: '100%',
        isNew: true
      };
      
      // Update both local state and Firestore
      const updatedTeamMembers = [...(currentProject.teamMembers || []), newTeamMember];
      
      setCurrentProject(prev => ({
        ...prev,
        teamMembers: updatedTeamMembers
      }));
      
      // Update Firestore project document
      await updateDoc(doc(db, 'dxd-magnate-projects', currentProject.id), {
        teamMembers: updatedTeamMembers
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
      console.error('Error adding new member:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    const updatedTeamMembers = currentProject.teamMembers.filter(member => member.id !== memberId);
    
    setCurrentProject(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
    
    // Update Firestore project document
    try {
      await updateDoc(doc(db, 'dxd-magnate-projects', currentProject.id), {
        teamMembers: updatedTeamMembers
      });
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleSave = () => {
    onSave(currentProject);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiUsers size={20} />
        <span>Team Members - {currentProject?.title}</span>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Current Team
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              startIcon={<FiPlus size={16} />}
              onClick={() => setShowAddOptions(true)}
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#c7d2fe',
                  backgroundColor: '#eef2ff'
                }
              }}
            >
              Add Team Member
            </Button>
          </div>
        </Box>

        <Box sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Project Roles
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FiPlus size={16} />}
              onClick={() => setShowAddRole(!showAddRole)}
              sx={{
                textTransform: 'none',
                borderRadius: '6px',
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#c7d2fe',
                  backgroundColor: '#eef2ff'
                }
              }}
            >
              {showAddRole ? 'Cancel' : 'Add Role'}
            </Button>
          </Box>

          {showAddRole && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter role name (e.g. Frontend Developer)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                size="small"
              />
              <Button
                variant="contained"
                onClick={handleAddRole}
                disabled={!newRole.trim()}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#4f46e5',
                  '&:hover': { backgroundColor: '#4338ca' }
                }}
              >
                Add Role
              </Button>
            </Box>
          )}

          {projectRoles.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {projectRoles.map((role) => (
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
          ) : (
            <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic' }}>
              No custom roles defined for this project
            </Typography>
          )}
        </Box>

        {showAddOptions ? (
          <Box sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Add Team Member Options
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="contained"
                startIcon={<FiUser size={16} />}
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
                startIcon={<FiUserPlus size={16} />}
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
            </div>
            <Button
              variant="text"
              onClick={() => {
                setShowAddOptions(false);
                setAddMode(null);
              }}
              sx={{ mt: 2, color: '#64748b' }}
            >
              Cancel
            </Button>
          </Box>
        ) : null}

{addMode === 'existing' && (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
      Select Team Members
    </Typography>
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Search users..."
      value={searchUserTerm}
      onChange={(e) => setSearchUserTerm(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FiSearch color="#94a3b8" />
          </InputAdornment>
        )
      }}
      sx={{ mb: 2 }}
    />
    
    {/* Add Project Role Selection */}
    <TextField
      select
      label="Project Role"
      fullWidth
      margin="normal"
      variant="outlined"
      value={newMember.projectRole}
      onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
      required
      sx={{ mb: 2 }}
    >
      <MenuItem value="" disabled>Select project role</MenuItem>
      {projectRoles.map((role) => (
        <MenuItem key={role} value={role}>{role}</MenuItem>
      ))}
    </TextField>
    
    <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
      {filteredUsers.length > 0 ? (
        <List>
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
                <Avatar alt={user.name} src={user.photoURL} />
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
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No users found
          </Typography>
        </Box>
      )}
    </Box>
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
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Onboard New Collaborator
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                fullWidth
                margin="normal"
                variant="outlined"
                value={newMember.firstName}
                onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                required
              />
              <TextField
                label="Last Name"
                fullWidth
                margin="normal"
                variant="outlined"
                value={newMember.lastName}
                onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                required
              />
            </Box>
            <Box sx={{display:'flex', gap:2}}>
              <TextField
                label="Email"
                fullWidth
                margin="normal"
                variant="outlined"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              />
              <TextField
                label="Phone Number"
                fullWidth
                margin="normal"
                variant="outlined"
                value={newMember.phone}
                onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                type="tel"
              />
            </Box>
            <TextField
              select
              label="Role"
              fullWidth
              margin="normal"
              variant="outlined"
              value={newMember.role}
              onChange={(e) => setNewMember({...newMember, role: e.target.value})}
            >
              <MenuItem value="Collaborator">Collaborator</MenuItem>
              <MenuItem value="Intern">Intern</MenuItem>
              <MenuItem value="Freelancer">Freelancer</MenuItem>
            </TextField>
            <TextField
              select
              label="Department"
              fullWidth
              margin="normal"
              variant="outlined"
              value={newMember.department}
              onChange={(e) => setNewMember({...newMember, department: e.target.value})}
            >
              <MenuItem value="Design">Design</MenuItem>
              <MenuItem value="Development">Development</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
              <MenuItem value="Content">Content</MenuItem>
            </TextField>

            <TextField
              select
              label="Project Role"
              fullWidth
              margin="normal"
              variant="outlined"
              value={newMember.projectRole}
              onChange={(e) => setNewMember({...newMember, projectRole: e.target.value})}
              required
            >
              <MenuItem value="" disabled>Select project role</MenuItem>
              {projectRoles.map((role) => (
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

        {currentProject?.teamMembers && currentProject.teamMembers.length > 0 ? (
          <List sx={{ width: '100%' }}>
            {currentProject.teamMembers.map((member, index) => (
              <React.Fragment key={member.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar
                      alt={member.name}
                      src={member.avatar}
                      sx={{ bgcolor: member.avatar ? 'transparent' : '#e0e7ff' }}
                    >
                      {member.avatar ? '' : member.name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{member.name}</span>
                        {member.isNew && (
                          <Chip
                            label="New"
                            size="small"
                            sx={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '0.65rem'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block' }}
                        >
                          {member.role}
                        </Typography>
                        <Chip
                          label={member.department}
                          size="small"
                          sx={{
                            mt: 0.5,
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            fontSize: '0.65rem'
                          }}
                        />
                        {member.projectRole && (
                          <Chip
                            label={member.projectRole}
                            size="small"
                            sx={{
                              mt: 0.5,
                              ml: 0.5,
                              backgroundColor: '#e0e7ff',
                              color: '#4f46e5',
                              fontSize: '0.65rem'
                            }}
                          />
                        )}
                      </>
                    }
                  />
                  <Chip
                    label={member.allocation}
                    size="small"
                    sx={{
                      backgroundColor: '#e0e7ff',
                      color: '#4f46e5',
                      fontWeight: 'medium'
                    }}
                  />
                  <IconButton
                    edge="end"
                    aria-label="remove"
                    onClick={() => handleRemoveMember(member.id)}
                    sx={{ ml: 1, color: '#ef4444' }}
                  >
                    <FiTrash2 size={16} />
                  </IconButton>
                </ListItem>
                {index < currentProject.teamMembers.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No team members assigned to this project
            </Typography>
          </Box>
        )}
      </DialogContent>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          onClick={onClose}
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
          onClick={handleSave}
          variant="contained"
          sx={{
            textTransform: 'none',
            borderRadius: '6px',
            backgroundColor: '#4f46e5',
            '&:hover': {
              backgroundColor: '#4338ca',
            }
          }}
        >
          Save Changes
        </Button>
      </Box>
    </Dialog>
  );
};

export default TeamManagementDialog;