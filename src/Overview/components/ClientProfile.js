import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Typography, Button, Divider, Chip,
  Box, Grid, Paper, Rating, Badge, CircularProgress, IconButton,
  LinearProgress, Tabs, Tab
} from '@mui/material';
import {
  FiUser, FiBriefcase, FiMail, FiPhone, FiClock,
  FiDollarSign, FiCalendar, FiDownload, FiX, FiExternalLink,
  FiMessageSquare, FiMapPin, FiActivity, FiPercent, FiTarget,
  FiLayers, FiCheckCircle, FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ClientProfileModal = ({ 
  open, 
  onClose, 
  clientId 
}) => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalSpend: 0,
    avgProjectValue: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (!clientId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch client profile
        const profileDoc = await getDoc(doc(db, 'users', clientId));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
        }

        // Fetch projects for this client
        const projectsQuery = query(
          collection(db, 'dxd-magnate-projects'),
          where('clientId', '==', clientId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Calculate stats
        const totalProjects = projectsData.length;
        const activeProjects = projectsData.filter(project => 
          project.status?.toLowerCase() === 'in progress').length;
        const completedProjects = projectsData.filter(project => 
          project.status?.toLowerCase() === 'completed').length;
        
        const totalSpend = projectsData.reduce((sum, project) => 
          sum + parseInt(project.budget || 0), 0);
        const avgProjectValue = totalProjects > 0 ? 
          totalSpend / totalProjects : 0;

        setStats({
          totalProjects,
          activeProjects,
          completedProjects,
          totalSpend,
          avgProjectValue
        });

        // Fetch recent activities
        const activitiesQuery = query(
          collection(db, 'project-activities'),
          where('userId', '==', clientId),
          limit(5)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentActivities(activitiesData);

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleStartChat = () => {
    navigate('/chats', { 
      state: { 
        contactId: clientId,
        contact: profile
      } 
    });
  };

  const exportProfileToPDF = async () => {
    if (!profile) return;
    
    // Create a temporary div to render the content for PDF
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.width = '800px';
    element.style.padding = '20px';
    element.style.backgroundColor = 'white';
    
    // Generate the content
    element.innerHTML = `
      <div style="font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #2d3748;">${profile.firstName} ${profile.lastName}</h1>
            <p style="font-size: 16px; color: #4a5568; margin: 5px 0 0;">Client at ${profile.company || 'DXD Magnate'}</p>
          </div>
          <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 3px solid #e2e8f0;">
            <img src="${profile.profilePicture || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=4f46e5&color=fff'"/>
          </div>
        </div>
        
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 15px;">
            <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Contact Information</h3>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Email:</span>
              <span>${profile.email || 'N/A'}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Phone:</span>
              <span>${profile.phone || 'N/A'}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Member Since:</span>
              <span>${formatDate(profile.createdAt)}</span>
            </p>
          </div>
          
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 15px;">
            <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Engagement Summary</h3>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Total Projects:</span>
              <span>${stats.totalProjects}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Active Projects:</span>
              <span>${stats.activeProjects}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Completed Projects:</span>
              <span>${stats.completedProjects}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Total Spend:</span>
              <span>${formatCurrency(stats.totalSpend)}</span>
            </p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Recent Projects</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 10px; font-size: 14px; color: #4a5568;">Project</th>
                <th style="text-align: left; padding: 10px; font-size: 14px; color: #4a5568;">Type</th>
                <th style="text-align: right; padding: 10px; font-size: 14px; color: #4a5568;">Value</th>
                <th style="text-align: right; padding: 10px; font-size: 14px; color: #4a5568;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${projects.slice(0, 5).map(project => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px; font-size: 14px;">${project.title || 'N/A'}</td>
                  <td style="padding: 10px; font-size: 14px;">${project.type || 'N/A'}</td>
                  <td style="padding: 10px; font-size: 14px; text-align: right;">${formatCurrency(parseInt(project.budget || 0))}</td>
                  <td style="padding: 10px; font-size: 14px; text-align: right;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; 
                      background-color: ${project.status === 'Completed' ? '#D1FAE5' : 
                                        project.status === 'In Progress' ? '#DBEAFE' : '#FEE2E2'};
                      color: ${project.status === 'Completed' ? '#065F46' : 
                              project.status === 'In Progress' ? '#1E40AF' : '#991B1B'};">
                      ${project.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              `).join('') || `
                <tr>
                  <td colspan="4" style="padding: 20px; text-align: center; color: #718096; font-size: 14px;">
                    No projects found
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: right; color: #718096; font-size: 12px;">
          Generated on ${new Date().toLocaleDateString()} by DXD Magnate CRM
        </div>
      </div>
    `;
    
    document.body.appendChild(element);
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${profile.firstName}_${profile.lastName}_Client_Profile.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(element);
    }
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'on hold': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          {/* Profile Picture with Status */}
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
              {profile.profilePicture ? (
                <Avatar
                  className="w-12 h-12 border border-gray-200"
                  src={profile.profilePicture}
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
            <p className="text-gray-500 text-sm">Client at {profile.company || 'DXD Magnate'}</p>
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
                      Client at {profile.company || 'DXD Magnate'}
                    </Typography>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      onClick={handleStartChat}
                    >
                      <FiMessageSquare /> Message
                    </button>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                      <FiLayers />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Projects</div>
                      <div className="font-semibold">{stats.totalProjects}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                      <FiCheckCircle />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Completed</div>
                      <div className="font-semibold">{stats.completedProjects}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                      <FiTrendingUp />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Active</div>
                      <div className="font-semibold">{stats.activeProjects}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                      <FiDollarSign />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Spend</div>
                      <div className="font-semibold">{formatCurrency(stats.totalSpend)}</div>
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
                      <FiClock />
                    </div>
                    <span className="text-gray-700">
                      Member since {formatDate(profile.createdAt)}
                    </span>
                  </div>

                  {profile.company && (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 rounded-full text-indigo-600">
                        <FiBriefcase />
                      </div>
                      <span className="text-gray-700">
                        {profile.company}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Picture */}
              <div className="hidden md:block">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    {profile.profilePicture ? (
                      <img 
                        src={profile.profilePicture} 
                        alt={`${profile.firstName} ${profile.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-4xl font-medium">
                        {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#4f46e5',
                height: 3
              }
            }}
          >
            <Tab 
              value="overview" 
              label="Overview" 
              icon={<FiActivity size={16} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              value="projects" 
              label={`Projects (${projects.length})`}
              icon={<FiLayers size={16} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab 
              value="activity" 
              label="Recent Activity"
              icon={<FiClock size={16} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Paper className="p-6 rounded-xl shadow-sm mb-6">
                  <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                    Client Information
                  </Typography>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Typography variant="body2" className="text-gray-500 mb-1">
                        First Name
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {profile.firstName || 'N/A'}
                      </Typography>
                    </div>
                    
                    <div>
                      <Typography variant="body2" className="text-gray-500 mb-1">
                        Last Name
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {profile.lastName || 'N/A'}
                      </Typography>
                    </div>
                    
                    <div>
                      <Typography variant="body2" className="text-gray-500 mb-1">
                        Username
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {profile.username || 'N/A'}
                      </Typography>
                    </div>
                    
                    <div>
                      <Typography variant="body2" className="text-gray-500 mb-1">
                        Member Since
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {formatDate(profile.createdAt)}
                      </Typography>
                    </div>
                    
                    <div className="col-span-2">
                      <Typography variant="body2" className="text-gray-500 mb-1">
                        Company
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {profile.company || 'N/A'}
                      </Typography>
                    </div>
                    
                    <div>
                      <Typography variant="body2" className="text-gray-500 mb-1">
                        Last Login
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {profile.lastLogin ? formatDate(profile.lastLogin) : 'N/A'}
                      </Typography>
                    </div>
                    
                    <div>
                      <Typography variant="body2" className="text-gray-500 mb-1">
                        Status
                      </Typography>
                      <Chip
                        label={profile.status?.charAt(0).toUpperCase() + profile.status?.slice(1) || 'Unknown'}
                        size="small"
                        className={`rounded-full ${
                          profile.status === 'active' ? 'bg-green-100 text-green-800' :
                          profile.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      />
                    </div>
                  </div>
                </Paper>
                
                <Paper className="p-6 rounded-xl shadow-sm">
                  <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                    Engagement Statistics
                  </Typography>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Typography variant="body2" className="text-gray-600">
                          Project Completion Rate
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {stats.totalProjects > 0 ? Math.round((stats.completedProjects / stats.totalProjects) * 100) : 0}%
                        </Typography>
                      </div>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.totalProjects > 0 ? (stats.completedProjects / stats.totalProjects) * 100 : 0} 
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e7ff',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#3B82F6'
                          }
                        }}
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Typography variant="body2" className="text-gray-600">
                          Average Project Value
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {formatCurrency(stats.avgProjectValue)}
                        </Typography>
                      </div>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.avgProjectValue > 0 ? Math.min((stats.avgProjectValue / 50000) * 100, 100) : 0} 
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#e0e7ff',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#8B5CF6'
                          }
                        }}
                      />
                    </div>
                  </div>
                </Paper>
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Paper className="p-6 rounded-xl shadow-sm mb-6">
                  <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                    Project Status Distribution
                  </Typography>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <FiLayers size={24} className="mx-auto text-blue-600 mb-2" />
                      <Typography variant="h6" className="font-bold text-blue-800">
                        {stats.totalProjects}
                      </Typography>
                      <Typography variant="caption" className="text-blue-600">
                        Total Projects
                      </Typography>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <FiCheckCircle size={24} className="mx-auto text-green-600 mb-2" />
                      <Typography variant="h6" className="font-bold text-green-800">
                        {stats.completedProjects}
                      </Typography>
                      <Typography variant="caption" className="text-green-600">
                        Completed
                      </Typography>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <FiTrendingUp size={24} className="mx-auto text-indigo-600 mb-2" />
                      <Typography variant="h6" className="font-bold text-indigo-800">
                        {stats.activeProjects}
                      </Typography>
                      <Typography variant="caption" className="text-indigo-600">
                        Active
                      </Typography>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <FiDollarSign size={24} className="mx-auto text-purple-600 mb-2" />
                      <Typography variant="h6" className="font-bold text-purple-800">
                        {formatCurrency(stats.totalSpend)}
                      </Typography>
                      <Typography variant="caption" className="text-purple-600">
                        Total Spend
                      </Typography>
                    </div>
                  </div>
                </Paper>
                
                <Paper className="p-6 rounded-xl shadow-sm">
                  <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                    Recent Projects
                  </Typography>
                  
                  {projects.slice(0, 3).length > 0 ? (
                    <div className="space-y-4">
                      {projects.slice(0, 3).map((project) => (
                        <div 
                          key={project.id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <Typography variant="subtitle1" className="font-semibold">
                              {project.title || 'Untitled Project'}
                            </Typography>
                            <Chip 
                              label={project.status || 'N/A'} 
                              size="small"
                              className={getStatusColor(project.status)}
                            />
                          </div>
                          
                          <Typography variant="body2" className="text-gray-600 mt-1 mb-2">
                            {project.type || 'No type specified'}
                          </Typography>
                          
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>
                              {formatDate(project.startDate)}
                            </span>
                            <div className="flex items-center gap-1">
                              <FiDollarSign size={14} />
                              <span>{formatCurrency(parseInt(project.budget || 0))}</span>
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
              </Grid>
            </Grid>
          )}
          
          {activeTab === 'projects' && (
            <Paper className="p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  All Projects ({projects.length})
                </Typography>
                <Button 
                  variant="text" 
                  size="small"
                  endIcon={<FiExternalLink size={14} />}
                  className="text-blue-600"
                >
                  View All in Projects
                </Button>
              </div>
              
              {projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography variant="subtitle2" className="font-medium">
                              {project.title || 'Untitled Project'}
                            </Typography>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-500">
                              {project.type || 'N/A'}
                            </Typography>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography variant="body2" className="font-medium">
                              {formatCurrency(parseInt(project.budget || 0))}
                            </Typography>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Chip 
                              label={project.status || 'N/A'} 
                              size="small"
                              className={getStatusColor(project.status)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Typography variant="body2" className="text-gray-500">
                              {formatDate(project.startDate)}
                            </Typography>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No projects found
                </Typography>
              )}
            </Paper>
          )}
          
          {activeTab === 'activity' && (
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Recent Activity
              </Typography>
              
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <Typography variant="subtitle2" className="font-semibold">
                          {activity.message || 'No message'}
                        </Typography>
                        <Typography variant="caption" className="text-gray-400">
                          {formatDate(activity.timestamp)}
                        </Typography>
                      </div>
                      <Typography variant="body2" className="text-gray-600 mb-1">
                        {activity.projectName || 'No project name'}
                      </Typography>
                      <Chip 
                        label={activity.type?.replace(/_/g, ' ') || 'activity'} 
                        size="small"
                        className="bg-blue-100 text-blue-800"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No recent activity found
                </Typography>
              )}
            </Paper>
          )}
        </div>
      </DialogContent>
      
      <DialogActions className="p-4 border-t border-gray-200">
        <Button 
          variant="outlined" 
          startIcon={<FiDownload />}
          onClick={exportProfileToPDF}
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

export default ClientProfileModal;