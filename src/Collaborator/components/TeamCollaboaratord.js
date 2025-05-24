import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  Divider,
  Stack,
  Button,
  TextField,
  MenuItem,
  LinearProgress,
  Tooltip,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  FiUsers,
  FiMail,
  FiPhone,
  FiSearch,
  FiMoreVertical,
  FiExternalLink,
  FiMessageSquare,
  FiCalendar,
  FiAward,
  FiSlack,
  FiMapPin,
  FiGlobe,
  FiLinkedin,
  FiX,
  FiFilter,
  FiChevronDown
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { useNavigate } from "react-router-dom";
import { styled } from '@mui/material/styles';

const StyledMemberCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    borderColor: theme.palette.primary.main,
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const MemberAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  fontSize: 28,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  marginBottom: theme.spacing(2),
  border: `3px solid ${theme.palette.primary.light}`,
  [theme.breakpoints.down('sm')]: {
    width: 60,
    height: 60,
    fontSize: 22
  }
}));

const TeamCollaboration = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectManager, setProjectManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('team');
  const [selectedMember, setSelectedMember] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        
        // Get all projects where current user is a team member
        const allProjectsSnapshot = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = allProjectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === user.uid);
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

        setProjects(projectsData);
        
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]);
          await fetchTeamMembers(projectsData[0].id);
          if (projectsData[0].projectManagerId) {
            await fetchProjectManager(projectsData[0].projectManagerId);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const fetchTeamMembers = async (projectId) => {
    try {
      const projectDoc = await getDoc(doc(db, "dxd-magnate-projects", projectId));
      if (projectDoc.exists()) {
        const projectData = projectDoc.data();
        const members = projectData.teamMembers || [];
        
        // Fetch additional details for each team member
        const membersWithDetails = await Promise.all(
          members.map(async member => {
            try {
              const userDoc = await getDoc(doc(db, "users", member.id));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...member,
                  email: userData.email,
                  phone: userData.phone,
                  photoURL: userData.photoURL,
                  role: userData.role || "Team Member",
                  profileStatus: userData.profileStatus || "offline",
                  lastActive: userData.lastActive
                };
              }
              return member;
            } catch (error) {
              console.error("Error fetching user details:", error);
              return member;
            }
          })
        );
        
        setTeamMembers(membersWithDetails);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const fetchProjectManager = async (managerId) => {
    try {
      const managerDoc = await getDoc(doc(db, "users", managerId));
      if (managerDoc.exists()) {
        const managerData = managerDoc.data();
        setProjectManager({
          id: managerId,
          name: `${managerData.firstName} ${managerData.lastName}`,
          email: managerData.email,
          phone: managerData.phone,
          photoURL: managerData.photoURL,
          role: "Project Manager",
          profileStatus: managerData.profileStatus || "offline",
          lastActive: managerData.lastActive,
          bio: managerData.bio || "No bio available",
          skills: managerData.skills || []
        });
      }
    } catch (error) {
      console.error("Error fetching project manager:", error);
    }
  };

  const handleProjectChange = async (event) => {
    const projectId = event.target.value;
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      await fetchTeamMembers(project.id);
      if (project.projectManagerId) {
        await fetchProjectManager(project.projectManagerId);
      } else {
        setProjectManager(null);
      }
    }
  };

  const getAvatarLetters = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}` 
      : parts[0][0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'default';
      case 'away': return 'warning';
      default: return 'default';
    }
  };

  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Last seen: Unknown";
    
    if (typeof timestamp === 'string') {
      return `Last seen: ${new Date(timestamp).toLocaleString()}`;
    }
    
    return `Last seen: ${timestamp.toDate().toLocaleString()}`;
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  const handleCloseDetail = () => {
    setSelectedMember(null);
  };

  const handleStartChat = (memberId) => {
    navigate('/chats', { 
      state: { 
        contactId: memberId,
        contact: teamMembers.find(m => m.id === memberId)
      } 
    });
  };

  return (
    <Box>
      {/* Header with Project Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" fontWeight={600}>
                Team Collaboration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and communicate with your project team
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2}>
                {projects.length > 1 && (
                  <TextField
                    select
                    fullWidth
                    label="Select Project"
                    value={selectedProject?.id || ''}
                    onChange={handleProjectChange}
                    size="small"
                  >
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.title || "Untitled Project"}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
                <TextField
                  fullWidth
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <FiSearch style={{ marginRight: 8, color: 'text.secondary' }} />
                    ),
                  }}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <LinearProgress />
      ) : !selectedProject ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <FiUsers size={48} className="text-gray-400 mx-auto mb-3" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're not assigned to any projects yet
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project Info and Tabs */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={600}>
                  {selectedProject.title || "Untitled Project"}
                </Typography>
                <Chip 
                  label={selectedProject.status || "No status"} 
                  color={
                    selectedProject.status === "Completed" ? "success" :
                    selectedProject.status === "In Progress" ? "primary" :
                    selectedProject.status === "On Hold" ? "warning" : "default"
                  }
                />
              </Box>
              
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ mb: 2 }}
              >
                <Tab label="Team Members" value="team" />
                <Tab label="Project Manager" value="manager" />
                <Tab label="Project Details" value="details" />
              </Tabs>
            </CardContent>
          </Card>

          {/* Content based on active tab */}
          {activeTab === 'team' && (
            <Grid container spacing={3}>
              {filteredMembers.length === 0 ? (
                <Grid item xs={12}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <FiUsers size={48} className="text-gray-400 mx-auto mb-3" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        No team members found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm 
                          ? "No members match your search criteria"
                          : "This project doesn't have any team members yet"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ) : (
                filteredMembers.map((member) => (
                  <Grid item xs={12} sm={6} md={4} key={member.id}>
                    <StyledMemberCard onClick={() => handleMemberClick(member)}>
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color={getStatusColor(member.profileStatus)}
                        >
                          {member.photoURL ? (
                            <MemberAvatar src={member.photoURL} />
                          ) : (
                            <MemberAvatar>
                              {getAvatarLetters(member.name)}
                            </MemberAvatar>
                          )}
                        </Badge>
                        <Typography variant="h6" fontWeight={600} textAlign="center">
                          {member.name}
                        </Typography>
                        <Chip
                          label={member.role}
                          size="small"
                          sx={{
                            mt: 1,
                            mb: 2,
                            backgroundColor: 'primary.light',
                            color: 'primary.dark',
                          }}
                        />
                        <Stack direction="row" spacing={1} mb={2}>
                          <Tooltip title="Chat">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartChat(member.id);
                              }}
                            >
                              <FiMessageSquare />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Email">
                            <IconButton
                              size="small"
                              href={`mailto:${member.email}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FiMail />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box flexGrow={1}>
                        <Typography variant="body2" color="textSecondary">
                          <Box component="span" fontWeight={600}>
                            Status:
                          </Box>{' '}
                          {member.profileStatus === 'online' 
                            ? 'Online now' 
                            : formatLastActive(member.lastActive)}
                        </Typography>
                      </Box>
                    </StyledMemberCard>
                  </Grid>
                ))
              )}
            </Grid>
          )}

          {activeTab === 'manager' && projectManager && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        color={getStatusColor(projectManager.profileStatus)}
                      >
                        {projectManager.photoURL ? (
                          <Avatar 
                            src={projectManager.photoURL} 
                            sx={{ width: 120, height: 120, fontSize: 40 }}
                          />
                        ) : (
                          <Avatar sx={{ width: 120, height: 120, fontSize: 40 }}>
                            {getAvatarLetters(projectManager.name)}
                          </Avatar>
                        )}
                      </Badge>
                      <Typography variant="h5" mt={2} fontWeight={600}>
                        {projectManager.name}
                      </Typography>
                      <Chip
                        label={projectManager.role}
                        size="medium"
                        sx={{
                          mt: 2,
                          backgroundColor: 'primary.light',
                          color: 'primary.dark',
                        }}
                      />
                    </Box>

                    <Box mb={3}>
                      <Typography variant="h6" fontWeight={600} mb={2}>
                        Contact Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" alignItems="center">
                          <FiMail style={{ marginRight: 8, color: 'text.secondary' }} />
                          <Typography>
                            <Box component="span" fontWeight={500}>
                              Email:
                            </Box>{' '}
                            {projectManager.email || 'Not specified'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <FiPhone style={{ marginRight: 8, color: 'text.secondary' }} />
                          <Typography>
                            <Box component="span" fontWeight={500}>
                              Phone:
                            </Box>{' '}
                            {projectManager.phone || 'Not specified'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <FiSlack style={{ marginRight: 8, color: 'text.secondary' }} />
                          <Typography>
                            <Box component="span" fontWeight={500}>
                              Status:
                            </Box>{' '}
                            {projectManager.profileStatus === 'online' 
                              ? 'Online now' 
                              : formatLastActive(projectManager.lastActive)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="h6" fontWeight={600} mb={2}>
                        Quick Actions
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={<FiMessageSquare />}
                          onClick={() => handleStartChat(projectManager.id)}
                        >
                          Send Message
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<FiMail />}
                          href={`mailto:${projectManager.email}`}
                        >
                          Email
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                      About the Manager
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {projectManager.bio}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" fontWeight={600} mb={2}>
                      Skills & Expertise
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {projectManager.skills.map((skill, index) => (
                        <Chip key={index} label={skill} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 'manager' && !projectManager && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <FiUsers size={48} className="text-gray-400 mx-auto mb-3" />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  No Project Manager Assigned
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This project doesn't have a designated manager yet
                </Typography>
              </CardContent>
            </Card>
          )}

          {activeTab === 'details' && selectedProject && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} mb={3}>
                      Project Overview
                    </Typography>
                    
                    <Stack spacing={2} mb={3}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Project Name
                        </Typography>
                        <Typography variant="body1">
                          {selectedProject.title || "Untitled Project"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {selectedProject.description || "No description available"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Status
                        </Typography>
                        <Typography variant="body1">
                          {selectedProject.status || "Not specified"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" fontWeight={600} mb={3}>
                      Timeline
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Start Date
                        </Typography>
                        <Typography variant="body1">
                          {selectedProject.startDate 
                            ? new Date(selectedProject.startDate).toLocaleDateString() 
                            : "Not specified"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Estimated Duration
                        </Typography>
                        <Typography variant="body1">
                          {selectedProject.duration || "Not specified"}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} mb={3}>
                      Team Statistics
                    </Typography>
                    
                    <Box mb={3}>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        Team Members
                      </Typography>
                      <Typography variant="h4" fontWeight={600}>
                        {teamMembers.length}
                      </Typography>
                    </Box>

                    <Box mb={3}>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        Project Progress
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box flexGrow={1}>
                          <LinearProgress 
                            variant="determinate" 
                            value={selectedProject.progress || 0} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedProject.progress || 0}%
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" fontWeight={600} mb={2}>
                      Quick Links
                    </Typography>
                    <Stack spacing={1}>
                      <Button 
                        startIcon={<FiMessageSquare />} 
                        onClick={() => navigate('/chats')}
                      >
                        Project Chat
                      </Button>
                      <Button 
                        startIcon={<FiCalendar />}
                        onClick={() => navigate('/meetings')}
                      >
                        Meeting Schedule
                      </Button>
                      <Button 
                        startIcon={<FiUsers />}
                        onClick={() => setActiveTab('team')}
                      >
                        View Team Members
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Member Detail Dialog */}
      <Dialog
        open={Boolean(selectedMember)}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Team Member Details</Typography>
            <IconButton onClick={handleCloseDetail}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMember && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color={getStatusColor(selectedMember.profileStatus)}
                  >
                    {selectedMember.photoURL ? (
                      <Avatar
                        src={selectedMember.photoURL}
                        sx={{ width: 120, height: 120, fontSize: 40 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 120, height: 120, fontSize: 40 }}>
                        {getAvatarLetters(selectedMember.name)}
                      </Avatar>
                    )}
                  </Badge>
                  <Typography variant="h5" mt={2} fontWeight={600}>
                    {selectedMember.name}
                  </Typography>
                  <Chip
                    label={selectedMember.role}
                    size="medium"
                    sx={{
                      mt: 2,
                      backgroundColor: 'primary.light',
                      color: 'primary.dark',
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {selectedMember.profileStatus === 'online' 
                      ? 'Online now' 
                      : formatLastActive(selectedMember.lastActive)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box mb={3}>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Contact Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <FiMail style={{ marginRight: 8, color: 'text.secondary' }} />
                        <Typography>
                          <Box component="span" fontWeight={500}>
                            Email:
                          </Box>{' '}
                          {selectedMember.email || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <FiPhone style={{ marginRight: 8, color: 'text.secondary' }} />
                        <Typography>
                          <Box component="span" fontWeight={500}>
                            Phone:
                          </Box>{' '}
                          {selectedMember.phone || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Quick Actions
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<FiMessageSquare />}
                      onClick={() => {
                        handleStartChat(selectedMember.id);
                        handleCloseDetail();
                      }}
                    >
                      Start Chat
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FiMail />}
                      href={`mailto:${selectedMember.email}`}
                    >
                      Send Email
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamCollaboration;