import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Avatar, Chip, 
  List, ListItem, ListItemText, ListItemAvatar, 
  Divider, Badge, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, TextField,
  Select, InputLabel, FormControl, Tooltip
} from '@mui/material';
import { 
  FiCalendar, FiPlus, FiMoreVertical, FiClock,
  FiMapPin, FiUsers, FiFileText, FiBell,
  FiCheckCircle, FiXCircle, FiRefreshCw,
  FiDownload, FiFilter, FiGrid, FiList
} from 'react-icons/fi';
import { MdOutlineWeb, MdOutlineMeetingRoom } from 'react-icons/md';
import { auth, db } from '../../services/firebase';
import { getDoc, updateDoc, setDoc, addDoc, collection, doc, getDocs, deleteDoc } from 'firebase/firestore';


// Sample data - replace with your actual data source
const eventsData = [
  {
    id: 1,
    title: "Quarterly Marketing Review",
    type: "Meeting",
    date: "2025-04-15",
    time: "14:00",
    createdBy: "Alex Johnson",
    participants: ["Marketing Team", "Sarah Lee"],
    platform: "Conference Room A",
    status: "Scheduled",
    description: "Review Q1 marketing performance and plan Q2 initiatives",
    attachments: ["marketing_q1_report.pdf"],
    reminders: ["1 day before", "1 hour before"]
  },
  {
    id: 2,
    title: "Product Launch Webinar",
    type: "Webinar",
    date: "2025-04-20",
    time: "10:30",
    createdBy: "Maria Garcia",
    participants: ["Sales Team", "All Employees"],
    platform: "Zoom",
    status: "Scheduled",
    description: "Launch of new product line with demo and Q&A",
    attachments: ["product_specs.pdf", "presentation.pptx"],
    reminders: ["1 week before", "1 day before"]
  },
  {
    id: 3,
    title: "Client Proposal Deadline",
    type: "Deadline",
    date: "2025-04-12",
    time: "17:00",
    createdBy: "James Wilson",
    participants: ["Project Team"],
    platform: "Internal",
    status: "Pending",
    description: "Final submission for client project proposal",
    attachments: [],
    reminders: ["1 day before"]
  }
];

const eventTypes = ["Meeting", "Webinar", "Training", "Deadline", "Kickoff"];
const statusOptions = ["Scheduled", "Pending", "Rescheduled", "Cancelled", "Completed"];

const EventItem = ({ event, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getEventIcon = () => {
    switch(event.type) {
      case "Webinar": return <MdOutlineWeb className="text-blue-500" />;
      case "Meeting": return <MdOutlineMeetingRoom className="text-green-500" />;
      case "Training": return <FiUsers className="text-purple-500" />;
      default: return <FiCalendar className="text-orange-500" />;
    }
  };

  const getStatusColor = () => {
    switch(event.status) {
      case "Scheduled": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      case "Rescheduled": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <ListItem 
        className="hover:bg-gray-50 rounded-lg transition-colors cursor-pointer mb-2"
        onClick={() => setOpenDetails(true)}
      >
        <ListItemAvatar>
          <Avatar className="bg-gray-100">
            {getEventIcon()}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <div className="flex items-center justify-between">
              <Typography variant="subtitle1" className="font-medium">
                {event.title}
              </Typography>
              <Chip 
                label={event.status} 
                size="small" 
                className={`${getStatusColor()} text-xs`}
              />
            </div>
          }
          secondary={
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
              <div className="flex items-center text-sm text-gray-600">
                <FiClock className="mr-1" />
                {event.date} at {event.time}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiMapPin className="mr-1" />
                {event.platform}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiUsers className="mr-1" />
                {event.participants.length > 1 ? `${event.participants[0]} +${event.participants.length - 1}` : event.participants[0]}
              </div>
            </div>
          }
        />
        <IconButton onClick={handleMenuOpen}>
          <FiMoreVertical />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onEdit(event); handleMenuClose(); }}>
            Edit
          </MenuItem>
          <MenuItem onClick={() => { onDelete(event.id); handleMenuClose(); }}>
            Delete
          </MenuItem>
        </Menu>
      </ListItem>

      {/* Event Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {getEventIcon()}
            <span className="ml-2">{event.title}</span>
          </div>
          <Chip 
            label={event.status} 
            size="small" 
            className={`${getStatusColor()} text-xs`}
          />
        </DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <FiCalendar className="mr-2 text-gray-500" />
              <span>{event.date} at {event.time}</span>
            </div>
            <div className="flex items-center">
              <FiMapPin className="mr-2 text-gray-500" />
              <span>{event.platform}</span>
            </div>
            <div className="flex items-center">
              <FiUsers className="mr-2 text-gray-500" />
              <div>
                {event.participants.map((p, i) => (
                  <Chip key={i} label={p} size="small" className="mr-1 mb-1" />
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <FiBell className="mr-2 text-gray-500" />
              <div>
                {event.reminders.map((r, i) => (
                  <Chip key={i} label={r} size="small" className="mr-1 mb-1" />
                ))}
              </div>
            </div>
          </div>

          <Divider className="my-4" />

          <Typography variant="subtitle2" className="mb-2">Description</Typography>
          <Typography variant="body2" className="mb-4">{event.description}</Typography>

          {event.attachments.length > 0 && (
            <>
              <Typography variant="subtitle2" className="mb-2">Attachments</Typography>
              <div className="flex flex-wrap gap-2 mb-4">
                {event.attachments.map((file, i) => (
                  <Chip 
                    key={i}
                    icon={<FiFileText />}
                    label={file}
                    variant="outlined"
                    onClick={() => {/* Handle download */}}
                  />
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outlined" 
              color="primary"
              onClick={() => { onEdit(event); setOpenDetails(false); }}
            >
              Edit
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setOpenDetails(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const EventForm = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState(event || {
    title: "",
    type: "Meeting",
    date: "",
    time: "",
    description: "",
    participants: [],
    platform: "",
    status: "Scheduled",
    reminders: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Event Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormControl fullWidth margin="normal">
              <InputLabel>Event Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Event Type"
                required
              >
                {eventTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
                required
              >
                {statusOptions.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              fullWidth
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              required
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <TextField
            fullWidth
            label="Platform/Location"
            name="platform"
            value={formData.platform}
            onChange={handleChange}
            required
            margin="normal"
          />

          <TextField
            fullWidth
            label="Participants (comma separated)"
            name="participants"
            value={formData.participants.join(", ")}
            onChange={(e) => {
              const participants = e.target.value.split(",").map(p => p.trim());
              setFormData(prev => ({ ...prev, participants }));
            }}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Description/Agenda"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Reminders (comma separated)"
            name="reminders"
            value={formData.reminders.join(", ")}
            onChange={(e) => {
              const reminders = e.target.value.split(",").map(r => r.trim());
              setFormData(prev => ({ ...prev, reminders }));
            }}
            margin="normal"
            placeholder="e.g., 1 day before, 1 hour before"
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" type="submit">
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UpcomingBusinessEvents = () => {
  const [events, setEvents] = useState(eventsData);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
  const [openForm, setOpenForm] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };

    fetchEvents();
  }, []);

  const handleAddEvent = () => {
    setCurrentEvent(null);
    setOpenForm(true);
  };

  const handleEditEvent = (event) => {
    setCurrentEvent(event);
    setOpenForm(true);
  };

  const handleDeleteEvent = async (id) => {
    try {
      await deleteDoc(doc(db, "events", id));
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (error) {
      console.error("Error deleting event: ", error);
    }
  };

  const handleSaveEvent = async (eventData) => {
    try {
      if (currentEvent) {
        // Update existing event in Firestore
        await updateDoc(doc(db, "events", currentEvent.id), eventData);
        // Update local state
        setEvents(prev => prev.map(e => e.id === currentEvent.id ? { ...e, ...eventData } : e));
      } else {
        // Add new event to Firestore
        const docRef = await addDoc(collection(db, "events"), {
          ...eventData,
          createdAt: new Date(),
          createdBy: auth.currentUser.uid,
          attachments: []
        });
        // Update local state with the new event (including the auto-generated ID)
        const newEvent = {
          ...eventData,
          id: docRef.id,
          attachments: [],
          createdAt: new Date(),
          createdBy: auth.currentUser.uid
        };
        setEvents(prev => [...prev, newEvent]);
      }
      setOpenForm(false);
    } catch (error) {
      console.error("Error saving event: ", error);
    }
  };

  const filteredEvents = filter === "all" 
    ? events 
    : events.filter(event => event.type === filter);

  return (
    <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <Typography variant="h5" className="font-bold text-gray-800 mb-2 md:mb-0">
          Upcoming Business Events
        </Typography>
        
        <div className="flex items-center space-x-2">
          <Tooltip title="List View">
            <IconButton 
              color={viewMode === "list" ? "primary" : "default"}
              onClick={() => setViewMode("list")}
            >
              <FiList />
            </IconButton>
          </Tooltip>
          <Tooltip title="Calendar View">
            <IconButton 
              color={viewMode === "calendar" ? "primary" : "default"}
              onClick={() => setViewMode("calendar")}
            >
              <FiGrid />
            </IconButton>
          </Tooltip>
          
          <FormControl size="small" className="min-w-[120px]">
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filter"
            >
              <MenuItem value="all">All Types</MenuItem>
              {eventTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<FiPlus />}
            onClick={handleAddEvent}
            className="whitespace-nowrap"
          >
            New Event
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <List className="divide-y divide-gray-200">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <EventItem 
                key={event.id}
                event={event}
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            ))
          ) : (
            <Typography className="text-center py-8 text-gray-500">
              No events found. Create a new event to get started.
            </Typography>
          )}
        </List>
      ) : (
        <div className="text-center py-8">
          <Typography variant="h6" className="mb-2">
            Calendar View
          </Typography>
          <Typography color="textSecondary">
            Calendar view would be implemented here with drag & drop functionality
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            className="mt-4"
            onClick={() => setViewMode("list")}
          >
            Switch to List View
          </Button>
        </div>
      )}

      {openForm && (
        <EventForm
          event={currentEvent}
          onSave={handleSaveEvent}
          onCancel={() => setOpenForm(false)}
        />
      )}
    </Box>
  );
};

export default UpcomingBusinessEvents;