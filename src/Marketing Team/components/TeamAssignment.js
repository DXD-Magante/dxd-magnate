import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  useMediaQuery,
  useTheme,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  FiUsers, 
  FiPlus, 
  FiSearch, 
  FiUserPlus,
  FiTrash2,
  FiEdit2,
  FiPhone,
  FiMail,
  FiCalendar
} from 'react-icons/fi';
import { db } from '../../services/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import TeamMemberDialog from './TeamMemberDialog';

const TeamAssignment = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [collaborations, setCollaborations] = useState([]);
  const [mentorCollaborations, setMentorCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all marketing collaborations
        const collabQuery = await getDocs(collection(db, "marketing-collaboration"));
        const allCollaborations = collabQuery.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          mentorId: doc.data().MentorId,
          TeamMembers: doc.data().TeamMembers || [],
          roles: doc.data().roles || []
        }));

        // Filter collaborations where current user is mentor
        const user = auth.currentUser;
        const filteredCollabs = allCollaborations.filter(collab => 
          collab.mentorId === user.uid
        );

        setCollaborations(allCollaborations);
        setMentorCollaborations(filteredCollabs);
        
        // Set initial selected collaboration
        if (filteredCollabs.length > 0) {
          // Prefer mentor's collaborations first
          setSelectedCollaboration(filteredCollabs[0]);
        } else if (allCollaborations.length > 0) {
          // Fall back to any collaboration if user isn't a mentor
          setSelectedCollaboration(allCollaborations[0]);
        } else {
          // No collaborations available
          setSelectedCollaboration(null);
        }
        
        // Fetch users with case-insensitive role matching
        const usersQuery = await getDocs(collection(db, "users"));
        const usersData = usersQuery.docs.map(doc => ({
          id: doc.id,
          uid: doc.data().uid || doc.id,
          ...doc.data()
        }));
        
        const filteredUsers = usersData.filter(user => {
          const userRole = user.role?.toLowerCase();
          return ['collaborator', 'intern', 'freelancer'].includes(userRole);
        });
        
        setUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      
      // Add to marketing collaboration
      const newMarketingMember = {
        id: userCredential.user.uid,
        name: `${newMember.firstName} ${newMember.lastName}`,
        role: newMember.projectRole,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      const updatedTeamMembers = [...(selectedCollaboration.TeamMembers || []), newMarketingMember];
      await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
        TeamMembers: updatedTeamMembers
      });
      
      setSelectedCollaboration(prev => ({
        ...prev,
        TeamMembers: updatedTeamMembers
      }));
      
      // Create notification
      await setDoc(doc(collection(db, 'collaborator-notifications')), {
        userId: userCredential.user.uid,
        collaborationId: selectedCollaboration.id,
        message: `You've been added to marketing collaboration: ${selectedCollaboration.title}`,
        type: "marketing_assignment",
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
      setOpenDialog(false);
    } catch (error) {
      console.error("Error adding new member:", error);
    }
  };

  const handleCollaborationChange = (collabId) => {
    const collab = collaborations.find(c => c.id === collabId);
    setSelectedCollaboration(collab);
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedCollaboration) return;
    
    try {
      const updatedMembers = selectedCollaboration.TeamMembers.filter(member => member.id !== memberId);
      await updateDoc(doc(db, "marketing-collaboration", selectedCollaboration.id), {
        TeamMembers: updatedMembers
      });
      
      setSelectedCollaboration(prev => ({
        ...prev,
        TeamMembers: updatedMembers
      }));
    } catch (error) {
      console.error("Error removing team member:", error);
    }
  };

  const handleAddRole = async () => {
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
      console.error("Error adding role:", error);
    }
  };

  const handleRemoveRole = async (roleToRemove) => {
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
      console.error("Error removing role:", error);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const filteredCollaborations = collaborations.filter(collab => 
    collab?.title?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  const renderCollaborationSelector = () => {
    if (collaborations.length === 0) return null;

    return (
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="collaboration-select-label">Select Collaboration</InputLabel>
        <Select
          labelId="collaboration-select-label"
          value={selectedCollaboration?.id || ''}
          onChange={(e) => handleCollaborationChange(e.target.value)}
          label="Select Collaboration"
        >
          {collaborations.map((collab) => (
            <MenuItem 
              key={collab.id} 
              value={collab.id}
              sx={{
                fontWeight: mentorCollaborations.some(mc => mc.id === collab.id) 
                  ? '600' 
                  : '400'
              }}
            >
              {collab.title}
              {mentorCollaborations.some(mc => mc.id === collab.id) && (
                <Chip 
                  label="Your Collaboration" 
                  size="small" 
                  sx={{ 
                    ml: 1,
                    fontSize: '0.65rem',
                    height: '20px'
                  }} 
                />
              )}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const renderMemberDetails = (member) => {
    const userDetails = users.find(user => user.uid === member.id || user.id === member.id);
    
    if (!userDetails) {
      return (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {member.name || 'Unknown Member'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {member.role}
          </Typography>
        </>
      );
    }

    return (
      <>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          {userDetails.firstName} {userDetails.lastName}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          {member.role}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
          {userDetails.role} • {userDetails.department}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Joined: {new Date(member.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </>
    );
  };

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
        Team Collaboration
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
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
              maxWidth: isMobile ? '100%' : 400
            }}
            size={isMobile ? 'small' : 'medium'}
          />
          
          <Button
            variant="contained"
            startIcon={<FiUserPlus />}
            onClick={() => setOpenDialog(true)}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              textTransform: 'none',
              borderRadius: '8px',
              height: '40px',
              width: isMobile ? '100%' : 'auto',
              minWidth: isMobile ? '100%' : '200px'
            }}
            fullWidth={isMobile}
          >
            Add Team Member
          </Button>
        </Box>

        {renderCollaborationSelector()}

        {selectedCollaboration ? (
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {selectedCollaboration.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Created: {new Date(selectedCollaboration.createdAt?.toDate?.() || selectedCollaboration.createdAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Collaboration Roles
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {(selectedCollaboration.roles || []).map((role) => (
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add new role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  sx={{ flex: 1 }}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleAddRole}
                  disabled={!newRole.trim()}
                  sx={{
                    minWidth: '40px',
                    width: '40px',
                    backgroundColor: '#4f46e5',
                    '&:hover': { backgroundColor: '#4338ca' }
                  }}
                >
                  <FiPlus />
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Team Members ({selectedCollaboration.TeamMembers?.length || 0})
              </Typography>
              
              {selectedCollaboration.TeamMembers?.length > 0 ? (
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: 2 
                }}>
                  {selectedCollaboration.TeamMembers.map((member) => {
                    const userDetails = users.find(user => user.uid === member.id || user.id === member.id);
                    const memberInitials = userDetails ?
                      `${userDetails.firstName?.charAt(0) || ''}${userDetails.lastName?.charAt(0) || ''}` :
                      member.name?.split(' ').map(n => n.charAt(0)).join('') || 'U';
                    
                    return (
                      <Paper key={member.id} elevation={0} sx={{ 
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
                            {memberInitials}
                          </Avatar>
                          <Box>
                            {renderMemberDetails(member)}
                          </Box>
                        </Box>
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 8, 
                          right: 8,
                          display: 'flex',
                          gap: 0.5
                        }}>
                          <Button
                            size="small"
                            onClick={() => handleRemoveMember(member.id)}
                            sx={{ 
                              color: '#ef4444',
                              minWidth: 0,
                              p: 0.5
                            }}
                          >
                            <FiTrash2 size={16} />
                          </Button>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
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
                  <Button
                    variant="text"
                    onClick={() => setOpenDialog(true)}
                    sx={{
                      mt: 2,
                      textTransform: 'none',
                      color: '#4f46e5'
                    }}
                  >
                    Add your first member
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            border: '1px dashed #e2e8f0',
            borderRadius: 2
          }}>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 2 }}>
              No collaboration selected
            </Typography>
          </Box>
        )}
      </Paper>

      <TeamMemberDialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedUsers([]);
        }}
        selectedCollaboration={selectedCollaboration}
        users={users}
        selectedUsers={selectedUsers}
        handleUserSelect={handleUserSelect}
        newMember={newMember}
        setNewMember={setNewMember}
        handleAddNewMember={handleAddNewMember}
      />
    </Box>
  );
};

export default TeamAssignment;