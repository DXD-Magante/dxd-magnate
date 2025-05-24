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
  AccordionDetails,
  Link
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
  FiAlertCircle,
  FiVideo,
  FiExternalLink,
  FiX
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

const formatTime = (time) => {
  if (!time) return "";
  return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

const StyledMeetingCard = styled(Paper)(({ theme }) => ({
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

const Meetings = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState('all');
  const [selectedMeeting, setSelectedMeeting] = useState(null);

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
    const fetchMeetings = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const meetingsQuery = query(
          collection(db, "project-timeline"),
          where("projectId", "==", selectedProject),
          where("type", "==", "meeting")
        );
        
        const meetingsSnapshot = await getDocs(meetingsQuery);
        const meetingsData = meetingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? new Date(doc.data().date) : null,
          createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : null,
          updatedAt: doc.data().updatedAt ? new Date(doc.data().updatedAt) : null
        }));

        // Sort meetings by date (most recent first)
        meetingsData.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return b.date - a.date;
        });

        setMeetings(meetingsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [selectedProject]);

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = 
      meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      tabValue === 'all' ||
      (tabValue === 'upcoming' && meeting.status === 'upcoming') ||
      (tabValue === 'completed' && meeting.status === 'completed');
    
    return matchesSearch && matchesTab;
  });

  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleCloseDetail = () => {
    setSelectedMeeting(null);
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
            <FiVideo size={26} /> Project Meetings
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            mt: 0.5
          }}>
            Schedule, join, and review project meetings
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
            placeholder="Search meetings..."
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
              <Badge badgeContent={meetings.length} color="primary" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                All Meetings
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
            <FiVideo size={36} color={theme.palette.text.secondary} />
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
            You don't have any projects yet. Create your first project to view meetings.
          </Typography>
        </Card>
      ) : filteredMeetings.length === 0 ? (
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
            No meetings found
          </Typography>
          <Typography variant="body2" sx={{ 
            color: theme.palette.text.secondary,
            maxWidth: '400px',
            margin: '0 auto',
            mb: 3
          }}>
            {searchTerm ? 'No meetings match your search criteria' : 'This project has no meetings scheduled yet'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredMeetings.map((meeting) => (
            <Grid item xs={12} sm={6} md={4} key={meeting.id}>
              <StyledMeetingCard sx={{ 
                borderLeft: `4px solid ${meeting.color || '#f59e0b'}`,
                backgroundColor: meeting.status === 'completed' ? 
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
                      {meeting.title}
                    </Typography>
                    <StatusChip 
                      label={meeting.status || "upcoming"} 
                      size="small" 
                      status={meeting.status || "upcoming"}
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.text.secondary,
                    mb: 2
                  }}>
                    {meeting.description && meeting.description.length > 100 
                      ? `${meeting.description.substring(0, 100)}...` 
                      : meeting.description}
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
                        {formatDate(meeting.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1.5
                    }}>
                      <FiClock size={16} color={theme.palette.text.secondary} />
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {meeting.time ? formatTime(meeting.time) : "Time not specified"}
                      </Typography>
                    </Box>
                    {meeting.meetingLink && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1.5
                      }}>
                        <FiVideo size={16} color={theme.palette.text.secondary} />
                        <Link 
                          href={meeting.meetingLink} 
                          target="_blank" 
                          rel="noopener"
                          sx={{ 
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}
                        >
                          Join Meeting <FiExternalLink size={12} />
                        </Link>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {meeting.participants && meeting.participants.length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ 
                        color: theme.palette.text.secondary,
                        fontWeight: '500',
                        display: 'block',
                        mb: 1
                      }}>
                        PARTICIPANTS ({meeting.participants.length})
                      </Typography>
                      <List dense sx={{ py: 0 }}>
                        {meeting.participants.slice(0, 3).map((participant, index) => (
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
                        {meeting.participants.length > 3 && (
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary={`+${meeting.participants.length - 3} more`}
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
                    onClick={() => handleMeetingClick(meeting)}
                    sx={{ 
                      mt: 1,
                      borderColor: theme.palette.divider,
                      '&:hover': {
                        borderColor: meeting.color || '#f59e0b',
                        backgroundColor: (meeting.color || '#f59e0b') + '10'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </StyledMeetingCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Meeting Detail Dialog */}
      {selectedMeeting && (
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
                    {selectedMeeting.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <StatusChip 
                      label={selectedMeeting.status || "upcoming"} 
                      size="medium" 
                      status={selectedMeeting.status || "upcoming"}
                    />
                    <Typography variant="body1" color="text.secondary">
                      {selectedMeeting.project}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={handleCloseDetail}>
                  <FiX />
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
                    <FiCalendar size={20} /> Meeting Details
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      DESCRIPTION
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {selectedMeeting.description || "No description provided"}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        SCHEDULED DATE
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {formatFullDate(selectedMeeting.date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        TIME
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {selectedMeeting.time ? formatTime(selectedMeeting.time) : "Time not specified"}
                      </Typography>
                    </Grid>
                    {selectedMeeting.meetingLink && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          MEETING LINK
                        </Typography>
                        <Link 
                          href={selectedMeeting.meetingLink} 
                          target="_blank" 
                          rel="noopener"
                          sx={{ 
                            mt: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <FiVideo /> Join Meeting <FiExternalLink size={14} />
                        </Link>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        STATUS
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {selectedMeeting.status ? 
                          selectedMeeting.status.charAt(0).toUpperCase() + 
                          selectedMeeting.status.slice(1) : 
                          "Upcoming"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        CREATED
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {formatDate(selectedMeeting.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        LAST UPDATED
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {formatDate(selectedMeeting.updatedAt)}
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
                  
                  {selectedMeeting.participants && selectedMeeting.participants.length > 0 ? (
                    <List dense>
                      {selectedMeeting.participants.map((participant, index) => (
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
                {selectedMeeting.meetingLink && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FiVideo />}
                    href={selectedMeeting.meetingLink}
                    target="_blank"
                    rel="noopener"
                  >
                    Join Meeting
                  </Button>
                )}
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

export default Meetings;