import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  Stack,
  Button,
  TextField,
  InputAdornment,
  LinearProgress,
  Tooltip,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiLink,
  FiUsers,
  FiMail,
  FiVideo,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiSearch,
  FiChevronRight,
  FiChevronLeft
} from "react-icons/fi";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { format, parseISO, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { styled } from '@mui/material/styles';

const StyledMeetingCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4],
    borderLeft: `4px solid ${theme.palette.primary.main}`
  },
  cursor: 'pointer',
  borderLeft: '4px solid transparent'
}));

const MeetingAvatar = styled(Avatar)(({ theme, color }) => ({
  backgroundColor: color ? `${color}20` : theme.palette.primary.light,
  color: color || theme.palette.primary.main,
  width: 48,
  height: 48
}));

const UpcomingMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDateRange, setCurrentDateRange] = useState(new Date());
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming', 'today', 'week'

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        
        // Get projects where user is a team member
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("teamMembers", "array-contains-any", [{ id: user.uid }])
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectIds = projectsSnapshot.docs.map(doc => doc.id);

        if (projectIds.length === 0) {
          setMeetings([]);
          setLoading(false);
          return;
        }

        // Get upcoming meetings for these projects
        const meetingsQuery = query(
          collection(db, "project-timeline"),
          where("projectId", "in", projectIds),
          where("type", "==", "meeting"),
          where("status", "==", "upcoming"),
        );

        const meetingsSnapshot = await getDocs(meetingsQuery);
        const meetingsData = meetingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMeetings(meetingsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const formatMeetingDate = (dateString) => {
    const date = parseISO(dateString);
    return format(date, "EEE, MMM d • h:mm a");
  };

  const formatTimeOnly = (dateString) => {
    const date = parseISO(dateString);
    return format(date, "h:mm a");
  };

  const getDayMeetings = (date) => {
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.date);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDateRange);
    const end = endOfWeek(currentDateRange);
    return eachDayOfInterval({ start, end });
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = 
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (viewMode === 'today') {
      const meetingDate = parseISO(meeting.date);
      return matchesSearch && isToday(meetingDate);
    }
    
    if (viewMode === 'week') {
      const meetingDate = parseISO(meeting.date);
      const start = startOfWeek(currentDateRange);
      const end = endOfWeek(currentDateRange);
      return matchesSearch && meetingDate >= start && meetingDate <= end;
    }
    
    return matchesSearch;
  });

  const handlePrevWeek = () => {
    setCurrentDateRange(addDays(currentDateRange, -7));
  };

  const handleNextWeek = () => {
    setCurrentDateRange(addDays(currentDateRange, 7));
  };

  const handleToday = () => {
    setCurrentDateRange(new Date());
  };

  const getStatusBadge = (meeting) => {
    const meetingDate = parseISO(meeting.date);
    const now = new Date();
    
    if (isToday(meetingDate)) {
      return (
        <Chip
          label="Today"
          size="small"
          icon={<FiAlertCircle size={14} />}
          color="warning"
          sx={{ ml: 1 }}
        />
      );
    }
    
    if (isTomorrow(meetingDate)) {
      return (
        <Chip
          label="Tomorrow"
          size="small"
          icon={<FiAlertCircle size={14} />}
          color="info"
          sx={{ ml: 1 }}
        />
      );
    }
    
    return null;
  };

  const getParticipantInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}` 
      : parts[0][0];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={2}>
            <Typography variant="h5" fontWeight={600}>
              Upcoming Meetings
            </Typography>
            
            <Box display="flex" gap={2} width={{ xs: '100%', sm: 'auto' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiSearch className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                variant={viewMode === 'upcoming' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('upcoming')}
                size="small"
              >
                All Upcoming
              </Button>
              <Button
                variant={viewMode === 'today' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('today')}
                size="small"
              >
                Today
              </Button>
              <Button
                variant={viewMode === 'week' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('week')}
                size="small"
              >
                This Week
              </Button>
            </Box>
          </Box>
          
          {viewMode === 'week' && (
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <IconButton onClick={handlePrevWeek}>
                <FiChevronLeft />
              </IconButton>
              
              <Typography variant="body1" fontWeight={500}>
                {format(startOfWeek(currentDateRange), "MMM d")} - {format(endOfWeek(currentDateRange), "MMM d, yyyy")}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1}>
                <Button size="small" onClick={handleToday}>
                  Today
                </Button>
                <IconButton onClick={handleNextWeek}>
                  <FiChevronRight />
                </IconButton>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Week View */}
      {viewMode === 'week' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={1}>
              {getWeekDays().map((day, index) => {
                const dayMeetings = getDayMeetings(day);
                return (
                  <Box key={index} border={1} borderColor="divider" borderRadius={1}>
                    <Box 
                      p={1} 
                      textAlign="center" 
                      bgcolor={isToday(day) ? 'primary.light' : 'transparent'}
                      color={isToday(day) ? 'primary.contrastText' : 'text.primary'}
                    >
                      <Typography variant="subtitle2" fontWeight={isToday(day) ? 600 : 500}>
                        {format(day, "EEE")}
                      </Typography>
                      <Typography variant="body2">
                        {format(day, "d")}
                      </Typography>
                    </Box>
                    <Box p={1} minHeight={120}>
                      {dayMeetings.length > 0 ? (
                        dayMeetings.map(meeting => (
                          <Box
                            key={meeting.id}
                            p={1}
                            mb={1}
                            borderRadius={1}
                            bgcolor="background.paper"
                            onClick={() => setSelectedMeeting(meeting)}
                            sx={{
                              borderLeft: `3px solid ${meeting.color || '#f59e0b'}`,
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'action.hover'
                              }
                            }}
                          >
                            <Typography variant="caption" fontWeight={500} display="block">
                              {formatTimeOnly(meeting.date)}
                            </Typography>
                            <Typography variant="caption" display="block" noWrap>
                              {meeting.title}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" p={1}>
                          No meetings
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <FiCalendar size={48} className="text-gray-400 mx-auto mb-3" />
            <Typography variant="h6" fontWeight={600} mb={1}>
              No upcoming meetings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? "No meetings match your search criteria"
                : viewMode === 'today' 
                  ? "You have no meetings scheduled for today"
                  : viewMode === 'week'
                    ? "You have no meetings scheduled this week"
                    : "You have no upcoming meetings scheduled"}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredMeetings.map((meeting) => (
            <StyledMeetingCard 
              key={meeting.id} 
              onClick={() => setSelectedMeeting(meeting)}
              sx={{ borderLeftColor: meeting.color || 'primary.main' }}
            >
              <CardContent>
                <Box display="flex" alignItems="flex-start" gap={2}>
                  <MeetingAvatar color={meeting.color}>
                    <FiCalendar size={20} />
                  </MeetingAvatar>
                  
                  <Box flexGrow={1}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {meeting.title}
                      </Typography>
                      {getStatusBadge(meeting)}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {formatMeetingDate(meeting.date)}
                    </Typography>
                    
                    <Typography variant="body2" mb={2}>
                      {meeting.description.length > 150 
                        ? `${meeting.description.substring(0, 150)}...` 
                        : meeting.description}
                    </Typography>
                    
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      <Chip 
                        label={meeting.project}
                        size="small"
                        variant="outlined"
                      />
                      {meeting.meetingLink && (
                        <Chip
                          icon={<FiVideo size={14} />}
                          label="Virtual Meeting"
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {meeting.location && (
                        <Chip
                          icon={<FiMapPin size={14} />}
                          label={meeting.location}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    {meeting.participants && meeting.participants.length > 0 && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <FiUsers className="text-gray-400" size={16} />
                        <Stack direction="row" spacing={-1}>
                          {meeting.participants.slice(0, 5).map((participant, index) => (
                            <Tooltip key={index} title={`${participant.name} (${participant.role})`}>
                              <Avatar 
                                sx={{ 
                                  width: 28, 
                                  height: 28, 
                                  fontSize: '0.75rem',
                                  border: '2px solid white'
                                }}
                              >
                                {getParticipantInitials(participant.name)}
                              </Avatar>
                            </Tooltip>
                          ))}
                          {meeting.participants.length > 5 && (
                            <Avatar 
                              sx={{ 
                                width: 28, 
                                height: 28, 
                                fontSize: '0.75rem',
                                bgcolor: 'grey.100',
                                color: 'grey.600',
                                border: '2px solid white'
                              }}
                            >
                              +{meeting.participants.length - 5}
                            </Avatar>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </StyledMeetingCard>
          ))}
        </Stack>
      )}

      {/* Meeting Detail Dialog */}
      <Dialog
        open={Boolean(selectedMeeting)}
        onClose={() => setSelectedMeeting(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Meeting Details</Typography>
            <IconButton onClick={() => setSelectedMeeting(null)}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedMeeting && (
            <Stack spacing={3} mt={1}>
              <Box display="flex" alignItems="center" gap={2}>
                <MeetingAvatar color={selectedMeeting.color}>
                  <FiCalendar size={20} />
                </MeetingAvatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedMeeting.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMeeting.project}
                  </Typography>
                </Box>
              </Box>
              
              <Divider />
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Date & Time
                </Typography>
                <Typography variant="body1">
                  {formatMeetingDate(selectedMeeting.date)}
                </Typography>
                {getStatusBadge(selectedMeeting)}
              </Box>
              
              {selectedMeeting.location && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Location
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FiMapPin className="text-gray-400" />
                    <Typography variant="body1">
                      {selectedMeeting.location}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {selectedMeeting.meetingLink && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Meeting Link
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FiLink className="text-gray-400" />
                    <Typography 
                      variant="body1" 
                      component="a" 
                      href={selectedMeeting.meetingLink} 
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Join Meeting
                    </Typography>
                  </Box>
                </Box>
              )}
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Description
                </Typography>
                <Typography variant="body1" whiteSpace="pre-wrap">
                  {selectedMeeting.description}
                </Typography>
              </Box>
              
              {selectedMeeting.participants && selectedMeeting.participants.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    Participants ({selectedMeeting.participants.length})
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedMeeting.participants.map((participant, index) => (
                      <Chip
                        key={index}
                        avatar={
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {getParticipantInitials(participant.name)}
                          </Avatar>
                        }
                        label={`${participant.name} (${participant.role})`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMeeting(null)}>Close</Button>
          {selectedMeeting?.meetingLink && (
            <Button 
              variant="contained" 
              startIcon={<FiVideo />}
              href={selectedMeeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Meeting
            </Button>
          )}
          <Button 
            variant="outlined" 
            startIcon={<FiMail />}
            href={`mailto:?subject=Meeting: ${selectedMeeting?.title}&body=You are invited to attend: ${selectedMeeting?.title}%0D%0A%0D%0ADate: ${selectedMeeting ? formatMeetingDate(selectedMeeting.date) : ''}%0D%0A%0D%0ADescription: ${selectedMeeting?.description}%0D%0A%0D%0A${selectedMeeting?.meetingLink ? 'Meeting Link: ' + selectedMeeting.meetingLink : ''}`}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpcomingMeetings;