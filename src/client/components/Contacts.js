import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Divider,
  Chip,
  Avatar,
  Stack,
  TextField,
  MenuItem,
  Grid,
  Paper,
  LinearProgress,
  Badge,
  IconButton,
  Tooltip,
  CardContent,
  Tabs,
  Tab,
  Button
} from "@mui/material";
import { 
  FiUsers, 
  FiMail, 
  FiPhone, 
  FiSearch,
  FiPlus,
  FiFilter,
  FiChevronDown,
  FiMoreVertical,
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiLinkedin,
  FiGlobe,
  FiSlack,
  FiUser,
  FiAward
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled, useTheme } from "@mui/material/styles";

const StyledContactCard = styled(Paper)(({ theme }) => ({
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

const ContactAvatar = styled(Avatar)(({ theme }) => ({
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

const ContactBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -10,
    top: 15,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px',
    },
  },
}));

const Contacts = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("clientId", "==", user.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const projectDoc = doc(db, "dxd-magnate-projects", selectedProject);
        const projectSnapshot = await getDoc(projectDoc);
        
        if (projectSnapshot.exists()) {
          const projectData = projectSnapshot.data();
          setTeamMembers(projectData.teamMembers || []);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching project details:", error);
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [selectedProject]);

  const getAvatarLetters = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}` 
      : parts[0][0];
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.projectRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      tabValue === 'all' ||
      (tabValue === 'project' && member.projectRole) ||
      (tabValue === 'management' && member.isManagement) ||
      (tabValue === 'external' && member.isExternal);
    
    return matchesSearch && matchesTab;
  });

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  const handleCloseDetail = () => {
    setSelectedMember(null);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h5" sx={{ 
            fontWeight: '700', 
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <FiUsers size={26} /> Team Contacts
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            mt: 0.5
          }}>
            Contact information for your project team members
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {projects.length > 0 && (
            <StyledTextField
              select
              size="small"
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <FiChevronDown style={{ 
                    marginRight: 8, 
                    color: theme.palette.text.secondary 
                  }} />
                ),
              }}
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title || "Untitled Project"}
                </MenuItem>
              ))}
            </StyledTextField>
          )}
          
          <StyledTextField
            size="small"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <FiSearch style={{ 
                  marginRight: 8, 
                  color: theme.palette.text.secondary 
                }} />
              ),
            }}
            sx={{ width: 220 }}
          />
        </Box>
      </Box>

      {/* Tabs for filtering */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3
            }
          }}
        >
          <Tab 
            value="all" 
            label={
              <Badge badgeContent={teamMembers.length} color="primary" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                All Contacts
              </Badge>
            }
            icon={<FiUsers size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="project" 
            label="Project Team"
            icon={<FiAward size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="management" 
            label="Management"
            icon={<FiUser size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="external" 
            label="External"
            icon={<FiGlobe size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : projects.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          p: 6,
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px'
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.action.hover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiUsers size={36} color={theme.palette.text.secondary} />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
            color: theme.palette.text.primary
          }}>
            No projects found
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            You don't have any projects yet. Create your first project to view team contacts.
          </Typography>
        </Card>
      ) : filteredMembers.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          p: 6,
          boxShadow: 'none',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px'
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: theme.palette.action.hover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiUser size={36} color={theme.palette.text.secondary} />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
            color: theme.palette.text.primary
          }}>
            No contacts found
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            {searchTerm ? 'No contacts match your search criteria' : 'This project has no team members assigned yet'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredMembers.map((member) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
              <StyledContactCard>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  mb: 2
                }}>
                  <ContactAvatar>
                    {getAvatarLetters(member.name)}
                  </ContactAvatar>
                  <Typography variant="h6" sx={{ 
                    fontWeight: '600',
                    mb: 0.5
                  }}>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 1
                  }}>
                    {member.projectRole || "Team Member"}
                  </Typography>
                  <Chip 
                    label={member.department || "No department"} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: '500',
                    display: 'block',
                    mb: 1
                  }}>
                    CONTACT INFORMATION
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <FiMail size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2" sx={{ 
                        fontSize: '0.85rem',
                        wordBreak: 'break-word'
                      }}>
                        {member.email || "No email"}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <FiPhone size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {member.phone || "No phone"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ mt: 'auto', pt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => handleMemberClick(member)}
                    sx={{ 
                      mt: 1,
                      borderColor: theme.palette.divider,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.primary.light + '10'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </StyledContactCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Member Detail Dialog */}
      {selectedMember && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}>
          <Card sx={{ 
            maxWidth: 600, 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    fontSize: 28,
                    bgcolor: theme.palette.primary.main
                  }}>
                    {getAvatarLetters(selectedMember.name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: '700' }}>
                      {selectedMember.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {selectedMember.projectRole || "Team Member"}
                    </Typography>
                    <Chip 
                      label={selectedMember.department || "No department"} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
                <IconButton onClick={handleCloseDetail}>
                  <FiMoreVertical />
                </IconButton>
              </Box>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: '600',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FiUser size={18} /> Personal Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email Address
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.5
                      }}>
                        <FiMail size={16} color={theme.palette.text.secondary} />
                        {selectedMember.email || "No email"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.5
                      }}>
                        <FiPhone size={16} color={theme.palette.text.secondary} />
                        {selectedMember.phone || "No phone"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.5
                      }}>
                        <FiMapPin size={16} color={theme.palette.text.secondary} />
                        {selectedMember.location || "No location specified"}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: '600',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FiAward size={18} /> Professional Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Role
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedMember.projectRole || "Not specified"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedMember.department || "Not specified"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Allocation
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedMember.allocation || "Not specified"}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" sx={{ 
                fontWeight: '600',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <FiGlobe size={18} /> Social & Links
              </Typography>
              <Box sx={{ 
                display: 'flex',
                gap: 1.5,
                flexWrap: 'wrap'
              }}>
                {selectedMember.linkedin && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FiLinkedin />}
                    href={selectedMember.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </Button>
                )}
                {selectedMember.website && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FiGlobe />}
                    href={selectedMember.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website
                  </Button>
                )}
                {selectedMember.slack && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FiSlack />}
                    href={selectedMember.slack}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Slack
                  </Button>
                )}
                {(!selectedMember.linkedin && !selectedMember.website && !selectedMember.slack) && (
                  <Typography variant="body2" color="text.secondary">
                    No social links provided
                  </Typography>
                )}
              </Box>

              <Box sx={{ 
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 2,
                mt: 4
              }}>
                <Button
                  variant="outlined"
                  onClick={handleCloseDetail}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FiMail />}
                  href={`mailto:${selectedMember.email}`}
                  disabled={!selectedMember.email}
                >
                  Send Message
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Contacts;