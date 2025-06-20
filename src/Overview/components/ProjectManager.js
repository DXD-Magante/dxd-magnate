import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Typography, Button, Divider, Chip,
  Box, Grid, Paper, Rating, Badge, CircularProgress, IconButton
} from '@mui/material';
import {
  FiUser, FiBriefcase, FiMail, FiPhone, FiClock,
  FiAward, FiUsers, FiTrendingUp, FiStar, FiCheckCircle,
  FiCalendar, FiDownload, FiX, FiExternalLink, FiGlobe,
  FiLinkedin, FiGithub, FiTwitter, FiFigma, FiCode, FiDatabase,
  FiUserPlus,
  FiCamera,
  FiMessageSquare,
  FiMapPin
} from 'react-icons/fi';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

const ProjectManagerProfileModal = ({ 
  open, 
  onClose, 
  managerId 
}) => {
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [managerRatings, setManagerRatings] = useState([]);
  const [projectFeedbacks, setProjectFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    currentTeamSize: 0,
    averageRating: 0,
    completedTasks: 0,
    totalTasks: 0
  });

  useEffect(() => {
    if (!managerId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch manager profile
        const profileDoc = await getDoc(doc(db, 'users', managerId));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
        }

        // Fetch projects managed by this manager
        const projectsQuery = query(
          collection(db, 'dxd-magnate-projects'),
          where('projectManagerId', '==', managerId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Calculate team members (unique across all projects)
        const allTeamMembers = [];
        projectsData.forEach(project => {
          if (project.teamMembers) {
            project.teamMembers.forEach(member => {
              if (!allTeamMembers.some(m => m.id === member.id)) {
                allTeamMembers.push(member);
              }
            });
          }
        });
        setTeamMembers(allTeamMembers);

        // Fetch manager ratings
        const ratingsQuery = query(
          collection(db, 'projectManagerRatings'),
          where('managerId', '==', managerId)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsData = ratingsSnapshot.docs.map(doc => doc.data());
        setManagerRatings(ratingsData);

        // Fetch project feedbacks for projects managed by this manager
        const projectIds = projectsData.map(p => p.id);
        let feedbacksData = [];
        
        if (projectIds.length > 0) {
          const feedbacksQuery = query(
            collection(db, 'project-feedback'),
            where('projectId', 'in', projectIds)
          );
          const feedbacksSnapshot = await getDocs(feedbacksQuery);
          feedbacksData = feedbacksSnapshot.docs.map(doc => doc.data());
        }
        setProjectFeedbacks(feedbacksData);

        // Calculate stats
        const totalProjects = projectsData.length;
        const currentTeamSize = allTeamMembers.length;
        
        // Calculate average rating
        const avgRating = ratingsData.length > 0 
          ? ratingsData.reduce((sum, rating) => sum + rating.rating, 0) / ratingsData.length 
          : 0;
        
        // Calculate tasks (would need to fetch tasks for each project)
        const completedTasks = projectsData.reduce((sum, project) => {
          return sum + (project.status === 'Completed' ? 1 : 0);
        }, 0);
        const totalTasks = projectsData.length;

        setStats({
          totalProjects,
          currentTeamSize,
          averageRating: avgRating,
          completedTasks,
          totalTasks
        });

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [managerId]);

  const getProgressPercentage = () => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const handleStartChat = (memberId) => {
    navigate('/chats', { 
      state: { 
        contactId: memberId,
        contact: teamMembers.find(m => m.id === memberId)
      } 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const exportProfile = () => {
    if (!profile) return;
    
    const profileData = {
      name: `${profile.firstName} ${profile.lastName}`,
      role: profile.role,
      company: profile.company,
      email: profile.email,
      phone: profile.phone,
      skills: profile.skills?.join(', ') || 'None',
      stats: {
        totalProjects: stats.totalProjects,
        averageRating: stats.averageRating.toFixed(1),
        teamSize: stats.currentTeamSize,
        completionRate: `${getProgressPercentage()}%`
      },
      lastUpdated: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(profileData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    
    saveAs(blob, `${profile.firstName}_${profile.lastName}_profile.json`);
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <div className="flex justify-center items-center min-h-[400px]">
          <CircularProgress />
        </div>
      </Dialog>
    );
  }

  if (!profile) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Profile Not Found</DialogTitle>
        <DialogContent>
          <Typography>The requested profile could not be loaded.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #f9fafb, #ffffff)'
        }
      }}
    >
      {/* Header with close button */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100">
  <div className="flex items-center gap-4">
    {/* Compact Profile Picture with Status */}
    <div className="relative">
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <div className="w-3 h-3 rounded-full border border-white bg-white flex items-center justify-center">
            <span className={`w-2 h-2 rounded-full ${
              profile.profileStatus === 'online' ? 'bg-green-500' :
              profile.profileStatus === 'away' ? 'bg-yellow-500' :
              profile.profileStatus === 'busy' ? 'bg-red-500' : 'bg-gray-400'
            }`}></span>
          </div>
        }
      >
        {profile.photoURL || profile.profilePicture ? (
          <Avatar
            className="w-12 h-12 border border-gray-200"
            src={profile.photoURL || profile.profilePicture}
            alt={`${profile.firstName} ${profile.lastName}`}
          />
        ) : (
          <Avatar
            className="w-12 h-12 border border-gray-200"
            sx={{
              backgroundColor: '#4f46e5',
              fontSize: '20px',
              fontWeight: 500
            }}
          >
            {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
          </Avatar>
        )}
      </Badge>
    </div>

    {/* Name and Title */}
    <div>
      <h3 className="font-medium text-gray-900 text-lg leading-tight">
        {profile.firstName} {profile.lastName}
      </h3>
      <p className="text-gray-500 text-sm">Project Manager</p>
    </div>
  </div>

  {/* Close Button */}
  <button 
    onClick={onClose}
    className="text-gray-400 hover:text-gray-500 transition-colors"
  >
    <FiX size={20} />
  </button>
</div>

      <DialogContent className="p-0">
        {/* Profile Header Section */}
        <div className="relative bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
  {/* Background with subtle pattern */}
  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-95">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlNWU1ZTUiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00em0tMjQgMGMwLTIuMiAxLjgtNCA0LTRzNCAxLjggNCA0LTEuOCA0LTQgNC00LTEuOC00LTR6TTAgMGg2MHY2MEgweiIvPjwvZz48L2c+PC9zdmc+')]"></div>
  </div>
  
  <div className="relative z-10 p-6 md:p-8">
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
      
      {/* Profile info */}
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <Typography variant="h3" className="font-bold text-gray-900 mb-1">
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="subtitle1" className="text-indigo-600 font-medium">
              {profile.role} at {profile.company}
            </Typography>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"      onClick={(e) => {
                                e.stopPropagation();
                                handleStartChat(managerId);
                              }}>
              <FiMessageSquare /> Message
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <FiStar />
            </div>
            <div>
              <div className="text-sm text-gray-500">Rating</div>
              <div className="font-semibold">{stats.averageRating.toFixed(1)}/5</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <FiBriefcase />
            </div>
            <div>
              <div className="text-sm text-gray-500">Projects</div>
              <div className="font-semibold">{stats.totalProjects}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <FiUsers />
            </div>
            <div>
              <div className="text-sm text-gray-500">Team</div>
              <div className="font-semibold">{stats.currentTeamSize}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <FiClock />
            </div>
            <div>
              <div className="text-sm text-gray-500">Member since</div>
              <div className="font-semibold">{formatDate(profile.createdAt)}</div>
            </div>
          </div>
        </div>
        
        {/* Contact info */}
        <div className="flex flex-wrap gap-6 text-sm border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-full text-indigo-600">
              <FiMail />
            </div>
            <a href={`mailto:${profile.email}`} className="text-gray-700 hover:text-indigo-600 hover:underline">
              {profile.email || 'Not provided'}
            </a>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-full text-indigo-600">
              <FiPhone />
            </div>
            <a href={`tel:${profile.phone}`} className="text-gray-700 hover:text-indigo-600 hover:underline">
              {profile.phone || 'Not provided'}
            </a>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-full text-indigo-600">
              <FiMapPin />
            </div>
            <span className="text-gray-700">
              {profile.location || 'Location not specified'}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-1 space-y-6">
            
            {/* Skills Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Skills & Expertise
              </Typography>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      className="bg-blue-50 text-blue-700 font-medium"
                    />
                  ))
                ) : (
                  <Typography variant="body2" className="text-gray-500">
                    No skills listed
                  </Typography>
                )}
              </div>
              
            </Paper>

       {/* Team Members Card */}
       <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Current Team ({teamMembers.length || 0})
              </Typography>
              
              {teamMembers.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {teamMembers.slice(0, 6).map((member, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <Avatar className="w-10 h-10 bg-indigo-100 text-indigo-600">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <div>
                        <Typography variant="body2" className="font-medium">
                          {member.name}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          {member.projectRole}
                        </Typography>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No team members assigned
                </Typography>
              )}
            </Paper>
          </div>
          
          {/* Middle Column - Projects */}
          <div className="lg:col-span-1 space-y-6">
            {/* Projects Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Recent Projects
                </Typography>
                <Button 
                  variant="text" 
                  size="small"
                  endIcon={<FiExternalLink size={14} />}
                  className="text-blue-600"
                >
                  View All
                </Button>
              </div>
              
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 3).map((project, index) => (
                    <div 
                      key={index}
                      className="border-l-4 p-4 rounded-r-lg"
                      style={{
                        borderLeftColor: 
                          project.status === 'Completed' ? '#10B981' :
                          project.status === 'In Progress' ? '#F59E0B' : '#64748B',
                        backgroundColor: 
                          project.status === 'Completed' ? '#F3F4F6' :
                          project.status === 'In Progress' ? '#FEF3C7' : '#F1F5F9'
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <Typography variant="subtitle1" className="font-semibold">
                          {project.title}
                        </Typography>
                        <Chip 
                          label={project.status} 
                          size="small"
                          className={
                            project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }
                        />
                      </div>
                      
                      <Typography variant="body2" className="text-gray-600 mt-1 mb-2 line-clamp-2">
                        {project.description || 'No description provided'}
                      </Typography>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>
                          {formatDate(project.startDate)} - {formatDate(project.endDate)}
                        </span>
                        <div className="flex items-center gap-1">
                          <FiUsers size={14} />
                          <span>{project.teamMembers?.length || 0} members</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No projects found
                </Typography>
              )}
            </Paper>
            
           
          </div>
          
          {/* Right Column - Stats & Feedback */}
          <div className="lg:col-span-1 space-y-6">
            {/* Performance Stats Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Performance Metrics
              </Typography>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <FiAward size={24} className="mx-auto text-blue-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-blue-800">
                    {stats.totalProjects}
                  </Typography>
                  <Typography variant="caption" className="text-blue-600">
                    Total Projects
                  </Typography>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <FiTrendingUp size={24} className="mx-auto text-green-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-green-800">
                    {getProgressPercentage()}%
                  </Typography>
                  <Typography variant="caption" className="text-green-600">
                    Completion Rate
                  </Typography>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <FiUsers size={24} className="mx-auto text-purple-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-purple-800">
                    {stats.currentTeamSize}
                  </Typography>
                  <Typography variant="caption" className="text-purple-600">
                    Team Members
                  </Typography>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <FiStar size={24} className="mx-auto text-amber-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-amber-800">
                    {stats.averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" className="text-amber-600">
                    Avg. Rating
                  </Typography>
                </div>
              </div>
            </Paper>
            
            {/* Feedback Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Client Feedback
              </Typography>
              
              {(managerRatings.length > 0 || projectFeedbacks.length > 0) ? (
                <div className="space-y-4">
                  {[...managerRatings, ...projectFeedbacks].slice(0, 3).map((item, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <Typography variant="subtitle2" className="font-semibold">
                          {item.clientName || 'Anonymous'}
                        </Typography>
                        <Rating 
                          value={item.rating} 
                          readOnly 
                          size="small"
                          precision={0.5}
                        />
                      </div>
                      <Typography variant="body2" className="text-gray-600 italic mb-2">
                        "{item.feedback}"
                      </Typography>
                      <Typography variant="caption" className="text-gray-400">
                        {formatDate(item.submittedAt)} • {item.projectTitle || 'General Feedback'}
                      </Typography>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No feedback available yet
                </Typography>
              )}
            </Paper>
          </div>
        </div>
      </DialogContent>
      
      <DialogActions className="p-4 border-t border-gray-200">
        <Button 
          variant="outlined" 
          startIcon={<FiDownload />}
          onClick={exportProfile}
          className="text-gray-700 border-gray-300 hover:bg-gray-50"
        >
          Export Profile
        </Button>
        <Button 
          variant="contained" 
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectManagerProfileModal;