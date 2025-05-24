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
  FiAward,
  FiX,
  FiMessageCircle,
  FiMessageSquare
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, getDoc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { styled, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState('all');
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);

        // 1. Fetch client's projects
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

        // 2. Fetch all contacts (project managers and sales reps)
        const contactsMap = new Map();

        // 2a. Fetch project managers from projects
        for (const project of projectsData) {
          if (project.projectManagerId && !contactsMap.has(`manager_${project.projectManagerId}`)) {
            try {
              const userDoc = doc(db, "users", project.projectManagerId);
              const userSnapshot = await getDoc(userDoc);
              
              if (userSnapshot.exists()) {
                const managerData = userSnapshot.data();
                contactsMap.set(`manager_${project.projectManagerId}`, {
                  id: project.projectManagerId,
                  name: project.projectManager || `${managerData.firstName} ${managerData.lastName}`,
                  email: managerData.email,
                  phone: managerData.phone,
                  projects: [project.title || "Untitled Project"],
                  photoURL: managerData.photoURL,
                  company: managerData.company || "DXD Magnate",
                  role: "Project Manager",
                  type: "management",
                  profileStatus: managerData.profileStatus || "offline",
                  lastActive: managerData.lastActive
                });
              } else {
                contactsMap.set(`manager_${project.projectManagerId}`, {
                  id: project.projectManagerId,
                  name: project.projectManager,
                  email: "",
                  phone: "",
                  projects: [project.title || "Untitled Project"],
                  role: "Project Manager",
                  type: "management",
                  company: "DXD Magnate",
                  profileStatus: "offline"
                });
              }
            } catch (error) {
              console.error("Error fetching manager details:", error);
            }
          } else if (project.projectManagerId) {
            // Add project to existing manager's projects list
            const existingManager = contactsMap.get(`manager_${project.projectManagerId}`);
            if (existingManager) {
              existingManager.projects.push(project.title || "Untitled Project");
            }
          }
        }

        // 2b. Fetch sales rep who onboarded this client
        try {
          const clientDoc = doc(db, "users", user.uid);
          const clientSnapshot = await getDoc(clientDoc);
          
          if (clientSnapshot.exists()) {
            const clientData = clientSnapshot.data();
            if (clientData.salesRep) {
              const salesRepDoc = doc(db, "users", clientData.salesRep);
              const salesRepSnapshot = await getDoc(salesRepDoc);
              
              if (salesRepSnapshot.exists()) {
                const salesRepData = salesRepSnapshot.data();
                contactsMap.set(`salesrep_${salesRepData.uid}`, {
                  id: salesRepData.uid,
                  name: `${salesRepData.firstName} ${salesRepData.lastName}`,
                  email: salesRepData.email,
                  phone: salesRepData.phone,
                  photoURL: salesRepData.photoURL,
                  company: salesRepData.company || "DXD Magnate",
                  role: "Sales Representative",
                  type: "external",
                  profileStatus: salesRepData.profileStatus || "offline",
                  lastActive: salesRepData.lastActive,
                  communicationChannel: salesRepData.communicationChannel || "Email"
                });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching sales rep details:", error);
        }

        setContacts(Array.from(contactsMap.values()));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getAvatarLetters = (name) => {
    if (!name) return "?";
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[parts.length - 1][0]}` 
      : parts[0][0];
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.projects && contact.projects.some(project => 
        project.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesTab = 
      tabValue === 'all' ||
      (tabValue === 'management' && contact.type === 'management') ||
      (tabValue === 'external' && contact.type === 'external');
    
    return matchesSearch && matchesTab;
  });


  const cleanContactData = (contact) => {
    const cleaned = { ...contact };
    
    // Convert undefined fields to null
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key] === undefined) {
        cleaned[key] = null;
      }
    });
  
    // Ensure required fields exist
    cleaned.name = cleaned.name || null;
    cleaned.email = cleaned.email || null;
    cleaned.phone = cleaned.phone || null;
    cleaned.role = cleaned.role || null;
    cleaned.type = cleaned.type || null;
    
    return cleaned;
  };

  const saveContact = async (contact) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      const contactRef = doc(db, "client-contacts", `${user.uid}_${contact.id}`);
      const cleanedContact = cleanContactData(contact);
      
      await setDoc(contactRef, {
        ...cleanedContact,
        savedBy: user.uid,
        savedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      }, { merge: true }); // Using merge to prevent overwriting existing data
  
      // Update UI state
      setContacts(prevContacts => 
        prevContacts.map(c => 
          c.id === contact.id ? { ...c, isSaved: true } : c
        )
      );
  
      if (selectedContact) {
        setSelectedContact({ ...selectedContact, isSaved: true });
      }
  
      console.log("Contact saved successfully!");
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };


  const handleContactClick = (contact) => {
    setSelectedContact(contact);
  };

  const handleCloseDetail = () => {
    setSelectedContact(null);
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

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={3}>
        My Contacts
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <FiSearch style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" justifyContent="flex-end">
                <Tabs
                  value={tabValue}
                  onChange={(e, newValue) => setTabValue(newValue)}
                  sx={{
                    '& .MuiTabs-indicator': {
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Tab label="All Contacts" value="all" />
                  <Tab label="Project Team" value="management" />
                  <Tab label="Sales Team" value="external" />
                </Tabs>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {filteredContacts.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  No contacts found
                </Typography>
              </Paper>
            </Grid>
          ) : (
            filteredContacts.map((contact) => (
              <Grid item xs={12} sm={6} md={4} key={contact.id}>
                <StyledContactCard onClick={() => handleContactClick(contact)}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <ContactBadge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      color={getStatusColor(contact.profileStatus)}
                    >
                      {contact.photoURL ? (
                        <ContactAvatar src={contact.photoURL} />
                      ) : (
                        <ContactAvatar>
                          {getAvatarLetters(contact.name)}
                        </ContactAvatar>
                      )}
                    </ContactBadge>
                    <Typography variant="h6" fontWeight={600} textAlign="center">
                      {contact.name}
                    </Typography>
                    <Chip
                      label={contact.role}
                      size="small"
                      sx={{
                        mt: 1,
                        mb: 2,
                        backgroundColor:
                          contact.role === 'Project Manager'
                            ? theme.palette.primary.light
                            : theme.palette.secondary.light,
                        color:
                          contact.role === 'Project Manager'
                            ? theme.palette.primary.dark
                            : theme.palette.secondary.dark,
                      }}
                    />
                    <Stack direction="row" spacing={1} mb={2}>
                      <Tooltip title="Chat">
                      <IconButton
    size="small"
    onClick={(e) => {
      e.stopPropagation();
      // Navigate to chat page with this contact's data
      navigate('/chats', { 
        state: { 
          contactId: contact.id,
          contact: {
            id: contact.id,
            name: contact.name,
            photoURL: contact.photoURL,
            role: contact.role
          }
        } 
      });
    }}
  >
    <FiMessageSquare />
  </IconButton>
                        <IconButton
                          size="small"
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiMail />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Phone">
                        <IconButton
                          size="small"
                          href={`tel:${contact.phone}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiPhone />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box flexGrow={1}>
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      <Box component="span" fontWeight={600}>
                        Company:
                      </Box>{' '}
                      {contact.company || 'Not specified'}
                    </Typography>
                    {contact.projects && (
                      <Typography variant="body2" color="textSecondary">
                        <Box component="span" fontWeight={600}>
                          Projects:
                        </Box>{' '}
                        {contact.projects.slice(0, 2).join(', ')}
                        {contact.projects.length > 2 && '...'}
                      </Typography>
                    )}
                  </Box>
                </StyledContactCard>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Contact Detail Dialog */}
      <Dialog
        open={Boolean(selectedContact)}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">Contact Details</Typography>
            <IconButton onClick={handleCloseDetail}>
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedContact && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <ContactBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color={getStatusColor(selectedContact.profileStatus)}
                  >
                    {selectedContact.photoURL ? (
                      <Avatar
                        src={selectedContact.photoURL}
                        sx={{ width: 120, height: 120, fontSize: 40 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 120, height: 120, fontSize: 40 }}>
                        {getAvatarLetters(selectedContact.name)}
                      </Avatar>
                    )}
                  </ContactBadge>
                  <Typography variant="h5" mt={2} fontWeight={600}>
                    {selectedContact.name}
                  </Typography>
                  <Chip
                    label={selectedContact.role}
                    size="medium"
                    sx={{
                      mt: 2,
                      backgroundColor:
                        selectedContact.role === 'Project Manager'
                          ? theme.palette.primary.light
                          : theme.palette.secondary.light,
                      color:
                        selectedContact.role === 'Project Manager'
                          ? theme.palette.primary.dark
                          : theme.palette.secondary.dark,
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {selectedContact.company || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    {selectedContact.profileStatus === 'online' 
                      ? 'Online now' 
                      : formatLastActive(selectedContact.lastActive)}
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
                        <FiMail style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                        <Typography>
                          <Box component="span" fontWeight={500}>
                            Email:
                          </Box>{' '}
                          {selectedContact.email || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <FiPhone style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                        <Typography>
                          <Box component="span" fontWeight={500}>
                            Phone:
                          </Box>{' '}
                          {selectedContact.phone || 'Not specified'}
                        </Typography>
                      </Box>
                    </Grid>
                    {selectedContact.communicationChannel && (
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" mb={2}>
                          <FiSlack style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                          <Typography>
                            <Box component="span" fontWeight={500}>
                              Preferred Channel:
                            </Box>{' '}
                            {selectedContact.communicationChannel}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {selectedContact.projects && (
                  <Box mb={3}>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                      Associated Projects
                    </Typography>
                    <Stack spacing={1}>
                      {selectedContact.projects.map((project, index) => (
                        <Box key={index} display="flex" alignItems="center">
                          <FiCheckCircle
                            style={{
                              marginRight: 8,
                              color: theme.palette.success.main,
                            }}
                          />
                          <Typography>{project}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Box>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Quick Actions
                  </Typography>
                  <Stack direction="row" spacing={2}>
                  <Button
  variant={selectedContact?.isSaved ? "contained" : "outlined"}
  color={selectedContact?.isSaved ? "success" : "primary"}
  startIcon={selectedContact?.isSaved ? <FiCheckCircle /> : <FiUser />}
  onClick={() => saveContact(selectedContact)}
  disabled={selectedContact?.isSaved}
>
  {selectedContact?.isSaved ? "Saved to Contacts" : "Save Contact"}
</Button>
                    <Button
                      variant="contained"
                      startIcon={<FiMail />}
                      href={`mailto:${selectedContact.email}`}
                    >
                      Send Email
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FiPhone />}
                      href={`tel:${selectedContact.phone}`}
                    >
                      Call Now
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

export default Contacts;