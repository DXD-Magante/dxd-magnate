import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Typography, Button, Divider, Chip,
  Box, Grid, Paper, Rating, Badge, CircularProgress, IconButton,
  LinearProgress
} from '@mui/material';
import {
  FiUser, FiBriefcase, FiMail, FiPhone, FiClock,
  FiAward, FiUsers, FiTrendingUp, FiStar, FiCheckCircle,
  FiCalendar, FiDownload, FiX, FiExternalLink, FiGlobe,
  FiLinkedin, FiGithub, FiTwitter, FiDollarSign, FiBarChart2,
  FiMessageSquare, FiMapPin, FiActivity, FiPercent, FiTarget
} from 'react-icons/fi';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const SalesProfileModal = ({ 
  open, 
  onClose, 
  salesId 
}) => {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    closedWon: 0,
    closedLost: 0,
    conversionRate: 0,
    totalRevenue: 0,
    averageDealSize: 0
  });

  useEffect(() => {
    if (!salesId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch sales profile
        const profileDoc = await getDoc(doc(db, 'users', salesId));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
        }

        // Fetch leads assigned to this sales rep
        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', salesId)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsData = leadsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeads(leadsData);

        // Calculate stats
        const totalLeads = leadsData.length;
        const closedWon = leadsData.filter(lead => lead.status === 'closed-won').length;
        const closedLost = leadsData.filter(lead => lead.status === 'closed-lost').length;
        const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0;
        
        const wonLeads = leadsData.filter(lead => lead.status === 'closed-won');
        const totalRevenue = wonLeads.reduce((sum, lead) => sum + parseInt(lead.budget || 0), 0);
        const averageDealSize = wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0;

        setStats({
          totalLeads,
          closedWon,
          closedLost,
          conversionRate,
          totalRevenue,
          averageDealSize
        });

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [salesId]);

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
        contactId: salesId,
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
            <p style="font-size: 16px; color: #4a5568; margin: 5px 0 0;">Sales Representative at ${profile.company || 'DXD Magnate'}</p>
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
            <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Performance Summary</h3>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Total Leads:</span>
              <span>${stats.totalLeads}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Closed Won:</span>
              <span>${stats.closedWon}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Conversion Rate:</span>
              <span>${stats.conversionRate.toFixed(1)}%</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Total Revenue:</span>
              <span>${formatCurrency(stats.totalRevenue)}</span>
            </p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Skills</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${profile.skills?.map(skill => `
              <span style="background: #e2e8f0; color: #4a5568; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                ${skill}
              </span>
            `).join('') || 'No skills listed'}
          </div>
        </div>
        
        <div>
          <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Recent Closed Deals</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 10px; font-size: 14px; color: #4a5568;">Client</th>
                <th style="text-align: left; padding: 10px; font-size: 14px; color: #4a5568;">Company</th>
                <th style="text-align: right; padding: 10px; font-size: 14px; color: #4a5568;">Value</th>
                <th style="text-align: right; padding: 10px; font-size: 14px; color: #4a5568;">Closed Date</th>
              </tr>
            </thead>
            <tbody>
              ${leads.filter(l => l.status === 'closed-won').slice(0, 5).map(lead => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px; font-size: 14px;">${lead.fullName || 'N/A'}</td>
                  <td style="padding: 10px; font-size: 14px;">${lead.company || 'N/A'}</td>
                  <td style="padding: 10px; font-size: 14px; text-align: right;">${formatCurrency(parseInt(lead.budget || 0))}</td>
                  <td style="padding: 10px; font-size: 14px; text-align: right;">${formatDate(lead.convertedDate)}</td>
                </tr>
              `).join('') || `
                <tr>
                  <td colspan="4" style="padding: 20px; text-align: center; color: #718096; font-size: 14px;">
                    No closed deals found
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
      pdf.save(`${profile.firstName}_${profile.lastName}_Sales_Profile.pdf`);
      
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
            <p className="text-gray-500 text-sm">Sales Representative</p>
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
                      Sales Representative at {profile.company || 'DXD Magnate'}
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
                      <FiAward />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Rank</div>
                      <div className="font-semibold">#{profile.rank || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                      <FiDollarSign />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Revenue</div>
                      <div className="font-semibold">{formatCurrency(stats.totalRevenue)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                      <FiCheckCircle />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Closed Won</div>
                      <div className="font-semibold">{stats.closedWon}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                      <FiPercent />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Conversion</div>
                      <div className="font-semibold">{stats.conversionRate.toFixed(1)}%</div>
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
                  {profile.rank && profile.rank <= 3 && (
                    <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      profile.rank === 1 ? 'bg-yellow-500' :
                      profile.rank === 2 ? 'bg-gray-400' :
                      'bg-amber-700'
                    } shadow-md`}>
                      {profile.rank}
                    </div>
                  )}
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

            {/* Performance Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Performance Metrics
              </Typography>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Typography variant="body2" className="text-gray-600">
                      Conversion Rate
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {stats.conversionRate.toFixed(1)}%
                    </Typography>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.conversionRate} 
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e7ff',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: stats.conversionRate > 50 ? '#10B981' : '#F59E0B'
                      }
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Typography variant="body2" className="text-gray-600">
                      Closed Won Rate
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {stats.totalLeads > 0 ? Math.round((stats.closedWon / stats.totalLeads) * 100) : 0}%
                    </Typography>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.totalLeads > 0 ? (stats.closedWon / stats.totalLeads) * 100 : 0} 
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
                      Average Deal Size
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      {formatCurrency(stats.averageDealSize)}
                    </Typography>
                  </div>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.averageDealSize > 0 ? Math.min((stats.averageDealSize / 50000) * 100, 100) : 0} 
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
          </div>
          
          {/* Middle Column - Recent Deals */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Deals Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Recent Closed Deals
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
              
              {leads.filter(l => l.status === 'closed-won').length > 0 ? (
                <div className="space-y-4">
                  {leads.filter(l => l.status === 'closed-won').slice(0, 3).map((lead, index) => (
                    <div 
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <Typography variant="subtitle1" className="font-semibold">
                          {lead.company || 'No company'}
                        </Typography>
                        <Chip 
                          label={formatCurrency(parseInt(lead.budget || 0))} 
                          size="small"
                          className="bg-green-100 text-green-800"
                        />
                      </div>
                      
                      <Typography variant="body2" className="text-gray-600 mt-1 mb-2">
                        {lead.fullName || 'No contact name'}
                      </Typography>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>
                          {formatDate(lead.convertedDate)}
                        </span>
                        <div className="flex items-center gap-1">
                          <FiTarget size={14} />
                          <span>{lead.projectType || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Typography variant="body2" className="text-gray-500">
                  No closed deals found
                </Typography>
              )}
            </Paper>
            
            {/* Activity Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Recent Activity
              </Typography>
              
              <div className="space-y-4">
                {leads.slice(0, 3).map((lead, index) => (
                  <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <Typography variant="subtitle2" className="font-semibold">
                        {lead.company || 'No company'}
                      </Typography>
                      <Chip 
                        label={lead.status.replace(/-/g, ' ')} 
                        size="small"
                        className={
                          lead.status === 'closed-won' ? 'bg-green-100 text-green-800' :
                          lead.status === 'closed-lost' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }
                      />
                    </div>
                    <Typography variant="body2" className="text-gray-600 mb-1">
                      {lead.fullName || 'No contact name'}
                    </Typography>
                    <Typography variant="caption" className="text-gray-400">
                      {formatDate(lead.lastUpdated || lead.createdAt)} • {formatCurrency(parseInt(lead.budget || 0))}
                    </Typography>
                  </div>
                ))}
              </div>
            </Paper>
          </div>
          
          {/* Right Column - Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Performance Stats Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Sales Performance
              </Typography>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <FiDollarSign size={24} className="mx-auto text-blue-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-blue-800">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Typography variant="caption" className="text-blue-600">
                    Total Revenue
                  </Typography>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <FiCheckCircle size={24} className="mx-auto text-green-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-green-800">
                    {stats.closedWon}
                  </Typography>
                  <Typography variant="caption" className="text-green-600">
                    Closed Won
                  </Typography>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <FiBarChart2 size={24} className="mx-auto text-purple-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-purple-800">
                    {stats.totalLeads}
                  </Typography>
                  <Typography variant="caption" className="text-purple-600">
                    Total Leads
                  </Typography>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <FiPercent size={24} className="mx-auto text-amber-600 mb-2" />
                  <Typography variant="h6" className="font-bold text-amber-800">
                    {stats.conversionRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" className="text-amber-600">
                    Conversion Rate
                  </Typography>
                </div>
              </div>
            </Paper>
            
            {/* Revenue Breakdown Card */}
            <Paper className="p-6 rounded-xl shadow-sm">
              <Typography variant="h6" className="font-bold mb-4 text-gray-800">
                Revenue Breakdown
              </Typography>
              
              <div className="space-y-3">
                {leads.filter(l => l.status === 'closed-won').slice(0, 3).map((lead, index) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <Typography variant="subtitle2" className="font-medium">
                        {lead.company || 'No company'}
                      </Typography>
                      <Typography variant="body2" className="font-medium text-green-600">
                        {formatCurrency(parseInt(lead.budget || 0))}
                      </Typography>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>{lead.projectType || 'N/A'}</span>
                      <span>{formatDate(lead.convertedDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Paper>
          </div>
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

export default SalesProfileModal;