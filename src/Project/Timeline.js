import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, Button, 
  List, ListItem, ListItemAvatar, ListItemText,
  Divider, Avatar, Chip, LinearProgress, CircularProgress
} from "@mui/material";
import {
  FiCalendar, FiClock, FiCheckCircle, FiAlertCircle,
  FiRefreshCw, FiLink, FiPlus
} from "react-icons/fi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { format } from "date-fns";

const statusStyles = {
  'completed': { color: '#059669', bgcolor: '#d1fae5' },
  'in-progress': { color: '#2563eb', bgcolor: '#dbeafe' },
  'upcoming': { color: '#64748b', bgcolor: '#f1f5f9' },
  'delayed': { color: '#dc2626', bgcolor: '#fee2e2' }
};

const typeStyles = {
  'meeting': { color: '#4f46e5', bgcolor: '#e0e7ff' },
  'milestone': { color: '#059669', bgcolor: '#d1fae5' },
  'sprint': { color: '#d97706', bgcolor: '#fef3c7' },
  'review': { color: '#2563eb', bgcolor: '#dbeafe' },
  'testing': { color: '#7c3aed', bgcolor: '#ede9fe' }
};

const TimelineComponent = ({ projectId }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimelineEvents = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "project-timeline"),
          where("projectId", "==", projectId)
        );
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTimelineEvents(events);
      } catch (error) {
        console.error("Error fetching timeline events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineEvents();
  }, [projectId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "MMM dd, yyyy 'at' hh:mm a");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <FiCheckCircle />;
      case "in-progress": return <FiRefreshCw />;
      case "upcoming": return <FiClock />;
      case "delayed": return <FiAlertCircle />;
      default: return <FiClock />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper className="p-4 rounded-lg shadow-sm">
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h6" className="font-bold">
          Timeline Events ({timelineEvents.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlus size={18} />}
          size="small"
        >
          Add Event
        </Button>
      </Box>

      {timelineEvents.length === 0 ? (
        <Box className="text-center py-8">
          <FiCalendar className="mx-auto text-gray-400" size={48} />
          <Typography variant="h6" className="mt-4 text-gray-600">
            No timeline events found
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-2">
            Add events to track important project milestones
          </Typography>
        </Box>
      ) : (
        <List>
          {timelineEvents.map((event, index) => (
            <React.Fragment key={event.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={typeStyles[event.type]}>
                    <FiCalendar />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box className="flex items-center gap-2">
                      <Typography variant="subtitle1" className="font-medium">
                        {event.title}
                      </Typography>
                      <Chip
                        label={event.type}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          ...typeStyles[event.type]
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" className="text-gray-600">
                        {event.description}
                      </Typography>
                      <Box className="flex items-center gap-2 mt-1">
                        <Typography variant="caption" className="text-gray-500">
                          {formatDate(event.date)}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(event.status)}
                          label={event.status}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            ...statusStyles[event.status]
                          }}
                        />
                        {event.type === 'link' && event.url && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FiLink />}
                            onClick={() => window.open(event.url, '_blank')}
                          >
                            Visit Link
                          </Button>
                        )}
                      </Box>
                    </>
                  }
                />
              </ListItem>
              {index < timelineEvents.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default TimelineComponent;