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
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import { 
  FiCalendar, 
  FiCheckCircle, 
  FiClock,
  FiSearch,
  FiChevronDown,
  FiPlus,
  FiFilter,
  FiMoreVertical,
  FiMapPin,
  FiUser,
  FiUsers,
  FiChevronRight,
  FiAlertCircle
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled, useTheme } from "@mui/material/styles";

// Helper functions for date formatting
const formatDate = (date) => {
  if (!date) return "No date specified";
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
};

const formatFullDate = (date) => {
  if (!date) return "No date specified";
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
};

const formatRelativeTime = (date) => {
  if (!date) return "No date specified";
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const StyledMilestoneCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: '600',
  backgroundColor: 
    status === 'completed' ? theme.palette.success.light + '40' :
    status === 'in-progress' ? theme.palette.warning.light + '40' :
    theme.palette.info.light + '40',
  color: 
    status === 'completed' ? theme.palette.success.dark :
    status === 'in-progress' ? theme.palette.warning.dark :
    theme.palette.info.dark,
  border: `1px solid ${
    status === 'completed' ? theme.palette.success.main :
    status === 'in-progress' ? theme.palette.warning.main :
    theme.palette.info.main
  }`
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

const Milestones = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState('all');
  const [selectedMilestone, setSelectedMilestone] = useState(null);

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
    const fetchMilestones = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const milestonesQuery = query(
          collection(db, "project-timeline"),
          where("projectId", "==", selectedProject),
          where("type", "==", "milestone")
        );
        
        const milestonesSnapshot = await getDocs(milestonesQuery);
        const milestonesData = milestonesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? new Date(doc.data().date) : null
        }));

        // Sort milestones by date
        milestonesData.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date - b.date;
        });

        setMilestones(milestonesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching milestones:", error);
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [selectedProject]);

  const filteredMilestones = milestones.filter(milestone => {
    const matchesSearch = 
      milestone.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      milestone.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      milestone.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      tabValue === 'all' ||
      (tabValue === 'upcoming' && milestone.status === 'upcoming') ||
      (tabValue === 'in-progress' && milestone.status === 'in-progress') ||
      (tabValue === 'completed' && milestone.status === 'completed');
    
    return matchesSearch && matchesTab;
  });

  const handleMilestoneClick = (milestone) => {
    setSelectedMilestone(milestone);
  };

  const handleCloseDetail = () => {
    setSelectedMilestone(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in-progress':
        return theme.palette.warning.main;
      case 'upcoming':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
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
            <FiCalendar size={26} /> Project Milestones
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            mt: 0.5
          }}>
            Track important milestones and deadlines for your projects
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
            placeholder="Search milestones..."
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
              <Badge badgeContent={milestones.length} color="primary" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                All Milestones
              </Badge>
            }
            icon={<FiCalendar size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="upcoming" 
            label="Upcoming"
            icon={<FiClock size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="in-progress" 
            label="In Progress"
            icon={<FiAlertCircle size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="completed" 
            label="Completed"
            icon={<FiCheckCircle size={16} />}
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
            <FiCalendar size={36} color={theme.palette.text.secondary} />
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
            You don't have any projects yet. Create your first project to view milestones.
          </Typography>
        </Card>
      ) : filteredMilestones.length === 0 ? (
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
            <FiClock size={36} color={theme.palette.text.secondary} />
          </Box>
          <Typography variant="h6" sx={{ 
            fontWeight: '600', 
            mb: 1,
            color: theme.palette.text.primary
          }}>
            No milestones found
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            {searchTerm ? 'No milestones match your search criteria' : 'This project has no milestones defined yet'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredMilestones.map((milestone) => (
            <Grid item xs={12} sm={6} md={4} key={milestone.id}>
              <StyledMilestoneCard sx={{ 
                borderLeft: `4px solid ${milestone.color || '#8b5cf6'}`,
                backgroundColor: milestone.status === 'completed' ? 
                  theme.palette.action.selected : 
                  theme.palette.background.paper
              }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 2
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: '600',
                      mb: 1
                    }}>
                      {milestone.title}
                    </Typography>
                    <StatusChip 
                      label={milestone.status || "upcoming"} 
                      size="small" 
                      status={milestone.status || "upcoming"}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 2
                  }}>
                    {milestone.description && milestone.description.length > 100 
                      ? `${milestone.description.substring(0, 100)}...` 
                      : milestone.description}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ 
                    color: theme.palette.text.secondary,
                    fontWeight: '500',
                    display: 'block',
                    mb: 1
                  }}>
                    SCHEDULE
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <FiCalendar size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {formatDate(milestone.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <FiClock size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {formatRelativeTime(milestone.date)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {milestone.participants && milestone.participants.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: '500',
                        display: 'block',
                        mb: 1
                      }}>
                        PARTICIPANTS ({milestone.participants.length})
                      </Typography>
                      <List dense sx={{ py: 0 }}>
                        {milestone.participants.slice(0, 3).map((participant, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                width: 32, 
                                height: 32,
                                fontSize: 14,
                                bgcolor: getStatusColor(participant.type === 'client' ? 'completed' : 
                                                      participant.type === 'pm' ? 'in-progress' : 'upcoming')
                              }}>
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={participant.name}
                              secondary={participant.role}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                        {milestone.participants.length > 3 && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary={`+${milestone.participants.length - 3} more`}
                              primaryTypographyProps={{ 
                                variant: 'caption',
                                color: 'text.secondary'
                              }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  </>
                )}

                <Box sx={{ mt: 'auto', pt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => handleMilestoneClick(milestone)}
                    sx={{ 
                      mt: 1,
                      borderColor: theme.palette.divider,
                      '&:hover': {
                        borderColor: milestone.color || '#8b5cf6',
                        backgroundColor: (milestone.color || '#8b5cf6') + '10'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </StyledMilestoneCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Milestone Detail Dialog */}
      {selectedMilestone && (
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
            maxWidth: 800, 
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
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: '700', mb: 1 }}>
                    {selectedMilestone.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <StatusChip 
                      label={selectedMilestone.status || "upcoming"} 
                      size="medium" 
                      status={selectedMilestone.status || "upcoming"}
                    />
                    <Typography variant="body1" color="text.secondary">
                      {selectedMilestone.project}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={handleCloseDetail}>
                  <FiMoreVertical />
                </IconButton>
              </Box>

              <Box sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 4,
                mb: 3
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: '600',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FiCalendar size={20} /> Details
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      DESCRIPTION
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {selectedMilestone.description || "No description provided"}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        SCHEDULED DATE
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {formatFullDate(selectedMilestone.date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        STATUS
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {selectedMilestone.status ? 
                          selectedMilestone.status.charAt(0).toUpperCase() + 
                          selectedMilestone.status.slice(1) : 
                          "Upcoming"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        CREATED
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {formatDate(selectedMilestone.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        LAST UPDATED
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {formatDate(selectedMilestone.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ 
                  width: { xs: '100%', md: 300 },
                  flexShrink: 0
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: '600',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <FiUsers size={20} /> Participants
                  </Typography>
                  
                  {selectedMilestone.participants && selectedMilestone.participants.length > 0 ? (
                    <List dense>
                      {selectedMilestone.participants.map((participant, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              width: 40, 
                              height: 40,
                              fontSize: 16,
                              bgcolor: getStatusColor(participant.type === 'client' ? 'completed' : 
                                                    participant.type === 'pm' ? 'in-progress' : 'upcoming')
                            }}>
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={participant.name}
                            secondary={
                              <React.Fragment>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {participant.role}
                                </Typography>
                                {` • ${participant.type === 'client' ? 'Client' : 
                                   participant.type === 'pm' ? 'Project Manager' : 'Team Member'}`}
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No participants specified
                    </Typography>
                  )}
                </Box>
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
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default Milestones;