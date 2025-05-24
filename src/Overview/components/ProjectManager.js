import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  Grid,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  LinearProgress,
  CircularProgress,
  Button,
  Tab,
  Tabs
} from '@mui/material';
import {
  FiMail,
  FiPhone,
  FiUser,
  FiCalendar,
  FiUsers,
  FiAward,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiFolder,
  FiTrendingUp
} from 'react-icons/fi';

const ProjectManagerOverview = () => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState([
    { title: "Total Projects", value: 0, icon: <FiFolder size={24} /> },
    { title: "Team Members", value: 0, icon: <FiUsers size={24} /> },
    { title: "Active Projects", value: 0, icon: <FiActivity size={24} /> },
    { title: "Completion Rate", value: "0%", icon: <FiTrendingUp size={24} /> }
  ]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          throw new Error('User not found');
        }
        
        const userData = userSnap.data();
        setProfileData(userData);
        
        // Verify this is a project manager
        if (userData.role !== 'Project Manager') {
          throw new Error('This user is not a project manager');
        }
        
        // Fetch projects managed by this PM
        const projectsQuery = query(
          collection(db, 'dxd-magnate-projects'),
          where('projectManagerId', '==', userId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProjects(projectsData);
        
        // Calculate stats
        const totalProjects = projectsData.length;
        const activeProjects = projectsData.filter(p => 
          p.status === 'In Progress' || p.status === 'Not started yet'
        ).length;
        
        // Calculate unique team members across all projects
        const allTeamMembers = new Set();
        projectsData.forEach(project => {
          if (project.teamMembers) {
            project.teamMembers.forEach(member => {
              allTeamMembers.add(member.id);
            });
          }
        });
        
        // Calculate completion rate
        const completedProjects = projectsData.filter(p => 
          p.status === 'Completed'
        ).length;
        const completionRate = totalProjects > 0 ? 
          Math.round((completedProjects / totalProjects) * 100) : 0;
        
        setStats([
          { title: "Total Projects", value: totalProjects, icon: <FiFolder size={24} /> },
          { title: "Team Members", value: allTeamMembers.size, icon: <FiUsers size={24} /> },
          { title: "Active Projects", value: activeProjects, icon: <FiActivity size={24} /> },
          { title: "Completion Rate", value: `${completionRate}%`, icon: <FiTrendingUp size={24} /> }
        ]);
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography>No profile data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', marginTop:'50px', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            src={profileData.photoURL}
            sx={{ 
              width: 120, 
              height: 120,
              mb: 2,
              fontSize: '2.5rem',
              bgcolor: '#e0e7ff',
              color: '#4f46e5'
            }}
          >
            {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
          </Avatar>
          
          <Chip
            label={profileData.profileStatus || 'offline'}
            color={profileData.profileStatus === 'online' ? 'success' : 'default'}
            size="small"
            sx={{ mb: 1 }}
          />
          
          <Typography variant="body2" color="text.secondary">
            Last active: {new Date(profileData.lastLogin?.toDate() || profileData.lastActive?.toDate()).toLocaleString()}
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            {profileData.firstName} {profileData.lastName}
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
            Project Manager • {profileData.company || 'DXD Magnate'}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Chip
              icon={<FiMail size={16} />}
              label={profileData.email}
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<FiPhone size={16} />}
              label={profileData.phone || 'Phone not provided'}
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<FiUser size={16} />}
              label={`@${profileData.username}`}
              variant="outlined"
              size="small"
            />
          </Box>
          
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Member since: {new Date(profileData.createdAt).toLocaleDateString()}
          </Typography>
        </Box>
      </Box>
      
      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <Typography variant="subtitle2" color="text.secondary">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stat.value}
                  </Typography>
                </div>
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#e0e7ff',
                  color: '#4f46e5'
                }}>
                  {stat.icon}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Projects" />
          <Tab label="Skills" />
          <Tab label="Activity" />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      <Box sx={{ pt: 2 }}>
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    About
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {profileData.bio || 'No bio provided'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Details
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', width: 32, height: 32 }}>
                          <FiUser size={16} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Role"
                        secondary={profileData.role}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', width: 32, height: 32 }}>
                          <FiCalendar size={16} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Member Since"
                        secondary={new Date(profileData.createdAt).toLocaleDateString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', width: 32, height: 32 }}>
                          <FiClock size={16} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Last Active"
                        secondary={new Date(profileData.lastLogin?.toDate() || profileData.lastActive?.toDate()).toLocaleString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', width: 32, height: 32 }}>
                          <FiCheckCircle size={16} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip 
                            label={profileData.status} 
                            size="small" 
                            color={profileData.status === 'active' ? 'success' : 'default'}
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Current Projects
                  </Typography>
                  
                  {projects.filter(p => p.status !== 'Completed').length > 0 ? (
                    <List dense>
                      {projects
                        .filter(p => p.status !== 'Completed')
                        .slice(0, 3)
                        .map(project => (
                          <ListItem key={project.id} sx={{ px: 0 }}>
                            <Paper sx={{ p: 2, width: '100%' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {project.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.clientName}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Chip
                                  label={project.status}
                                  size="small"
                                  sx={{ 
                                    mr: 1,
                                    bgcolor: project.status === 'In Progress' ? '#e0f2fe' : '#fef3c7',
                                    color: project.status === 'In Progress' ? '#0369a1' : '#92400e'
                                  }}
                                />
                                <Typography variant="caption">
                                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Paper>
                          </ListItem>
                        ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No active projects
                    </Typography>
                  )}
                  
                  {projects.filter(p => p.status !== 'Completed').length > 3 && (
                    <Button fullWidth sx={{ mt: 2 }}>
                      View All Projects
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Managed Projects ({projects.length})
              </Typography>
              
              {projects.length > 0 ? (
                <List>
                  {projects.map(project => (
                    <ListItem key={project.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}>
                          {project.title.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={project.title}
                        secondary={
                          <>
                            <Typography variant="body2" component="span" display="block">
                              Client: {project.clientName}
                            </Typography>
                            <Typography variant="caption" component="span" display="block">
                              {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                            </Typography>
                          </>
                        }
                      />
                      <Chip
                        label={project.status}
                        size="small"
                        sx={{ 
                          bgcolor: project.status === 'Completed' ? '#dcfce7' : 
                                  project.status === 'In Progress' ? '#e0f2fe' : '#fef3c7',
                          color: project.status === 'Completed' ? '#166534' : 
                                 project.status === 'In Progress' ? '#0369a1' : '#92400e'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No projects found
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
        
        {activeTab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Skills & Expertise
              </Typography>
              
              {profileData.skills?.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profileData.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      sx={{ 
                        bgcolor: '#e0e7ff',
                        color: '#4f46e5'
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No skills listed
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
        
        {activeTab === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activity feed will be displayed here
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default ProjectManagerOverview;