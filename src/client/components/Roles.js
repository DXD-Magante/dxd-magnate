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
  CardContent
} from "@mui/material";
import { 
  FiUsers, 
  FiAward, 
  FiList, 
  FiUser, 
  FiSearch,
  FiPlus,
  FiFilter,
  FiChevronDown,
  FiMoreVertical,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiPhone
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled, useTheme } from "@mui/material/styles";

const StyledRoleCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
  },
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.primary.main,
  }
}));

const MemberAvatar = styled(Avatar)(({ theme }) => ({
  width: 40,
  height: 40,
  fontSize: 14,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const RoleBadge = styled(Badge)(({ theme }) => ({
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

const RolesResponsibilities = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teamRoles, setTeamRoles] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  

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
          setTeamRoles(projectData.roles || []);
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

  const getRoleMembers = (role) => {
    return teamMembers.filter(member => member.projectRole === role);
  };

  const getAvatarLetters = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}` 
      : parts[0][0];
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.projectRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <FiUsers size={26} /> Team Roles & Responsibilities
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            mt: 0.5
          }}>
            Manage your team members and their project responsibilities
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
          
     
        </Box>
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
            You don't have any projects yet. Create your first project to start managing team roles.
          </Typography>
        </Card>
      ) : teamRoles.length === 0 ? (
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
            <FiList size={36} color={theme.palette.text.secondary} />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
            color: theme.palette.text.primary
          }}>
            No roles defined
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            This project doesn't have any roles defined yet. Add roles to organize your team.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3} >
          <Grid item xs={12} md={5} lg={4} >
            <Card sx={{ 
              height: '100%',
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FiAward size={20} /> Project Roles
                  </Typography>
                  <Chip 
                    label={`${teamRoles.length} roles`} 
                    size="small" 
                    color="primary"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
                
                <Stack spacing={2}>
                  {teamRoles.map((role) => {
                    const members = getRoleMembers(role);
                    return (
                      <StyledRoleCard key={role}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          mb: 1 
                        }}>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: '600',
                            color: theme.palette.text.primary
                          }}>
                            {role}
                          </Typography>
                          <RoleBadge badgeContent={members.length} />
                        </Box>
                        
                        <Typography variant="body2" sx={{ 
                          color: theme.palette.text.secondary,
                          mb: 2,
                          fontSize: '0.85rem'
                        }}>
                          Responsible for {role.toLowerCase()} tasks and deliverables
                        </Typography>
                        
                        {members.length > 0 && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: '500',
                              display: 'block',
                              mb: 1
                            }}>
                              ASSIGNED TEAM MEMBERS
                            </Typography>
                            <Stack spacing={1.5} sx={{ mt: 1 }}>
                              {members.slice(0, 3).map((member) => (
                                <Box key={member.id} sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: 1.5
                                }}>
                                  <MemberAvatar>
                                    {getAvatarLetters(member.name)}
                                  </MemberAvatar>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ 
                                      fontWeight: '500',
                                      lineHeight: 1.2
                                    }}>
                                      {member.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.7rem'
                                    }}>
                                      {member.department}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                              {members.length > 3 && (
                                <Typography variant="caption" sx={{ 
                                  color: theme.palette.primary.main,
                                  fontWeight: '500',
                                  textAlign: 'center',
                                  display: 'block',
                                  mt: 1
                                }}>
                                  +{members.length - 3} more
                                </Typography>
                              )}
                            </Stack>
                          </>
                        )}
                      </StyledRoleCard>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={7} lg={8}>
            <Card sx={{ 
              height: '100%',
              boxShadow: 'none',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FiUser size={20} /> Team Members
                    <Chip 
                      label={`${teamMembers.length} members`} 
                      size="small" 
                      sx={{ 
                        backgroundColor: theme.palette.action.selected,
                        fontWeight: 500,
                        ml: 1
                      }}
                    />
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.5,
                    flexWrap: 'wrap'
                  }}>
                    <StyledTextField
                      size="small"
                      placeholder="Search members..."
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
                    <IconButton sx={{ 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px'
                    }}>
                      <FiFilter size={18} />
                    </IconButton>
                  </Box>
                </Box>
                
                {filteredMembers.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: '8px'
                  }}>
                    <FiUsers size={48} style={{ 
                      color: theme.palette.text.secondary,
                      margin: '0 auto 16px',
                      opacity: 0.5
                    }} />
                    <Typography variant="body1" sx={{ 
                      color: theme.palette.text.secondary,
                      mb: 1
                    }}>
                      No team members found
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.secondary,
                      maxWidth: '300px',
                      margin: '0 auto',
                      opacity: 0.7
                    }}>
                      {searchTerm ? 'Try a different search term' : 'Add your first team member'}
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {filteredMembers.map((member) => (
                      <Grid item xs={12} sm={6} lg={4} key={member.id}>
                        <Paper sx={{ 
                          p: 2.5, 
                          borderRadius: '12px',
                          height: '100%',
                          border: `1px solid ${theme.palette.divider}`,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 4px 12px ${theme.palette.primary.light}20`
                          }
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 2, 
                            mb: 2,
                            position: 'relative'
                          }}>
                            <Avatar sx={{ 
                              width: 48, 
                              height: 48, 
                              bgcolor: theme.palette.primary.main, 
                              fontSize: 16,
                              fontWeight: '500'
                            }}>
                              {getAvatarLetters(member.name)}
                            </Avatar>
                            
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ 
                                fontWeight: '600',
                                mb: 0.5
                              }}>
                                {member.name}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                color: theme.palette.text.secondary,
                                display: 'block',
                                mb: 0.5
                              }}>
                                {member.department} • {member.allocation}
                              </Typography>
                              
                              <Chip 
                                label={member.projectRole || "Not specified"} 
                                size="small" 
                                color="primary"
                                sx={{ 
                                  height: '20px',
                                  fontSize: '0.65rem',
                                  fontWeight: '600'
                                }}
                              />
                            </Box>
                            
                            <IconButton size="small" sx={{ 
                              color: theme.palette.text.secondary
                            }}>
                              <FiMoreVertical size={16} />
                            </IconButton>
                          </Box>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" sx={{ 
                              color: theme.palette.text.secondary,
                              fontWeight: '500',
                              display: 'block',
                              mb: 1
                            }}>
                              Responsibilities
                            </Typography>
                            <Typography variant="body2" sx={{ 
                              fontSize: '0.85rem',
                              color: theme.palette.text.primary
                            }}>
                              {member.projectRole ? 
                                `Responsible for all ${member.projectRole.toLowerCase()} tasks and deliverables` : 
                                "No specific responsibilities defined"}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1.5,
                            mt: 2
                          }}>
                            <Tooltip title="Send message">
                              <IconButton size="small" sx={{ 
                                backgroundColor: theme.palette.action.hover,
                                borderRadius: '6px'
                              }}>
                                <FiMail size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Call">
                              <IconButton size="small" sx={{ 
                                backgroundColor: theme.palette.action.hover,
                                borderRadius: '6px'
                              }}>
                                <FiPhone size={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View availability">
                              <IconButton size="small" sx={{ 
                                backgroundColor: theme.palette.action.hover,
                                borderRadius: '6px'
                              }}>
                                <FiClock size={14} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default RolesResponsibilities;