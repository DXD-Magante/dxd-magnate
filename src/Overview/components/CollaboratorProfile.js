import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Typography,
  Divider,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Box,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Rating,
  CircularProgress,
  Tooltip,
  Badge,
  Paper,
  IconButton,
  Stack
} from '@mui/material';
import {
  FiUser,
  FiCalendar,
  FiClock,
  FiAward,
  FiStar,
  FiBarChart2,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiExternalLink,
  FiUsers,
  FiLayers,
  FiFileText,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiHome,
  FiDollarSign,
  FiTag,
  FiClock as FiTime,
  FiPercent,
  FiDownload
} from 'react-icons/fi';
import { db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const statusColors = {
  'active': 'success',
  'suspended': 'warning',
  'deactivated': 'error'
};

const roleColors = {
  'Collaborator': 'primary',
  'Intern': 'secondary',
  'Project Manager': 'info',
  'Admin': 'error'
};

const projectStatusColors = {
  'Completed': 'success',
  'In Progress': 'primary',
  'On Hold': 'warning',
  'Cancelled': 'error',
  'Planning': 'info'
};

const ProfilePreviewModal = ({ open, onClose, userId }) => {
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [collabTasks, setCollabTasks] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch projects where user is a team member
        const projectsQuery = query(
          collection(db, 'dxd-magnate-projects'),
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === userId);
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Calculate progress if not available
            progress: doc.data().progress || (doc.data().status === 'Completed' ? 100 : 0)
          }));
        setProjects(projectsData);

        // For marketing department, fetch collaborations
        if (userDoc.data()?.department === 'Marketing') {
          const collabQuery = query(
            collection(db, 'marketing-collaboration'),
          );
          const collabSnapshot = await getDocs(collabQuery);
          const collabData = collabSnapshot.docs
            .filter(doc => {
              const teamMembers = doc.data().TeamMembers || [];
              return teamMembers.some(member => member.id === userId);
            })
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
            }));
          setCollaborations(collabData);
        }

        // Fetch performance data
        await fetchPerformanceData(userId, userDoc.data()?.department);

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPerformanceData = async (userId, department) => {
      try {
        // Fetch project tasks assigned to user
        const projectTasksQuery = query(
          collection(db, 'project-tasks'),
          where('assignee.id', '==', userId)
        );
        const projectTasksSnapshot = await getDocs(projectTasksQuery);
        const projectTasksData = projectTasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjectTasks(projectTasksData);

        // Fetch submissions for these tasks
        const projectSubmissions = await Promise.all(
          projectTasksData.map(async task => {
            const submissionsQuery = query(
              collection(db, 'project-submissions'),
              where('taskId', '==', task.id)
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);
            return submissionsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          })
        );

        // For marketing department, fetch collaboration tasks
        let collabTasksData = [];
        let collabSubmissions = [];
        if (department === 'Marketing') {
          const collabTasksQuery = query(
            collection(db, 'marketing-collaboration-tasks'),
            where('assignee.id', '==', userId)
          );
          const collabTasksSnapshot = await getDocs(collabTasksQuery);
          collabTasksData = collabTasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCollabTasks(collabTasksData);

          collabSubmissions = await Promise.all(
            collabTasksData.map(async task => {
              const submissionsQuery = query(
                collection(db, 'marketing-collaboration-submissions'),
                where('taskId', '==', task.id)
              );
              const submissionsSnapshot = await getDocs(submissionsQuery);
              return submissionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            })
          );
        }

        // Calculate performance stats
        calculatePerformanceStats(
          projectTasksData,
          projectSubmissions.flat(),
          collabTasksData,
          collabSubmissions.flat(),
          department
        );

      } catch (error) {
        console.error('Error fetching performance data:', error);
      }
    };

    const calculatePerformanceStats = (
      projTasks, projSubmissions, 
      collabTasks, collabSubmissions,
      department
    ) => {
      // Project task stats
      const completedProjTasks = projTasks.filter(t => t.status === 'Done').length;
      const projTasksWithRating = projSubmissions
        .filter(s => s.status === 'approved' && s.rating)
        .map(s => s.rating);
      const avgProjRating = projTasksWithRating.length > 0 
        ? (projTasksWithRating.reduce((a, b) => a + b, 0) / projTasksWithRating.length)
        : 0;

      // Collaboration task stats (for marketing)
      let completedCollabTasks = 0;
      let collabTasksWithRating = [];
      let avgCollabRating = 0;
      
      if (department === 'Marketing') {
        completedCollabTasks = collabTasks.filter(t => t.status === 'Done').length;
        collabTasksWithRating = collabSubmissions
          .filter(s => s.status === 'approved' && s.rating)
          .map(s => s.rating);
        avgCollabRating = collabTasksWithRating.length > 0 
          ? (collabTasksWithRating.reduce((a, b) => a + b, 0) / collabTasksWithRating.length)
          : 0;
      }

      const totalCompletedTasks = completedProjTasks + completedCollabTasks;
      const totalTasks = projTasks.length + (department === 'Marketing' ? collabTasks.length : 0);
      const completionRate = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;
      
      const overallRating = department === 'Marketing'
        ? ((avgProjRating * projTasksWithRating.length) + (avgCollabRating * collabTasksWithRating.length)) / 
          (projTasksWithRating.length + collabTasksWithRating.length) || 0
        : avgProjRating;

      setPerformanceStats({
        totalTasks,
        completedTasks: totalCompletedTasks,
        completionRate,
        avgProjRating,
        avgCollabRating,
        overallRating,
        projTasksWithRating: projTasksWithRating.length,
        collabTasksWithRating: collabTasksWithRating.length
      });
    };

    if (open && userId) {
      fetchUserData();
    }
  }, [open, userId]);


   // Format currency in rupees
   const formatCurrency = (value) => {
    if (!value) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('₹', '₹ ');
  };

  const exportProfileToPDF = async () => {
    if (!userData) return;
    
    // Create a temporary div to render the content for PDF
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.width = '800px';
    element.style.padding = '20px';
    element.style.backgroundColor = 'white';
    element.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
    
    // Generate the content
    element.innerHTML = `
      <div style="color: #1a1a1a;">
        <!-- Header with logo and title -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 600; margin: 0; color: #2d3748;">${userData.firstName} ${userData.lastName}</h1>
            <p style="font-size: 16px; color: #4a5568; margin: 5px 0 0;">${userData.role} at ${userData.department} Department</p>
          </div>
          <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; border: 3px solid #e2e8f0;">
            <img src="${userData.photoURL || ''}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=4f46e5&color=fff'"/>
          </div>
        </div>
        
        <!-- Two column layout -->
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <!-- Left column - Personal info -->
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 15px;">
            <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Personal Information</h3>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Email:</span>
              <span>${userData.email || 'N/A'}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Phone:</span>
              <span>${userData.phone || 'N/A'}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Member Since:</span>
              <span>${formatDate(userData.createdAt)}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Status:</span>
              <span style="background: ${statusColors[userData.status] ? 
                statusColors[userData.status] === 'success' ? '#10B981' : 
                statusColors[userData.status] === 'warning' ? '#F59E0B' : '#EF4444' : '#E2E8F0'}; 
                color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                ${userData.status}
              </span>
            </p>
          </div>
          
          <!-- Right column - Performance -->
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 15px;">
            <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Performance Summary</h3>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Total Tasks:</span>
              <span>${performanceStats?.totalTasks || 0}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Completed Tasks:</span>
              <span>${performanceStats?.completedTasks || 0}</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Completion Rate:</span>
              <span>${performanceStats?.completionRate || 0}%</span>
            </p>
            <p style="margin: 8px 0; display: flex; align-items: center;">
              <span style="margin-right: 10px; color: #718096;">Average Rating:</span>
              <span>${performanceStats?.overallRating ? performanceStats.overallRating.toFixed(1) : 0}/5</span>
            </p>
          </div>
        </div>
        
        <!-- Projects section -->
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 16px; color: #4a5568; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Project Contributions (${projects.length})</h3>
          
          ${projects.length > 0 ? projects.slice(0, 3).map(project => `
            <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid ${
              projectStatusColors[project.status] === 'success' ? '#10B981' :
              projectStatusColors[project.status] === 'primary' ? '#4F46E5' :
              projectStatusColors[project.status] === 'warning' ? '#F59E0B' :
              projectStatusColors[project.status] === 'error' ? '#EF4444' : '#94A3B8'
            };">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <h4 style="font-size: 15px; font-weight: 600; margin: 0;">${project.title}</h4>
                <span style="font-size: 12px; background: ${
                  projectStatusColors[project.status] === 'success' ? '#ECFDF5' :
                  projectStatusColors[project.status] === 'primary' ? '#EEF2FF' :
                  projectStatusColors[project.status] === 'warning' ? '#FEF3C7' :
                  projectStatusColors[project.status] === 'error' ? '#FEE2E2' : '#F1F5F9'
                }; color: ${
                  projectStatusColors[project.status] === 'success' ? '#065F46' :
                  projectStatusColors[project.status] === 'primary' ? '#3730A3' :
                  projectStatusColors[project.status] === 'warning' ? '#92400E' :
                  projectStatusColors[project.status] === 'error' ? '#991B1B' : '#334155'
                }; padding: 2px 8px; border-radius: 12px; font-weight: 500;">
                  ${project.status}
                </span>
              </div>
              <p style="font-size: 13px; color: #64748b; margin: 5px 0;">${project.description?.substring(0, 100) || 'No description'}${project.description?.length > 100 ? '...' : ''}</p>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b;">
                <span>${formatDate(project.startDate)} - ${formatDate(project.endDate)}</span>
                <span>${project.budget ? formatCurrency(parseInt(project.budget)) : 'Budget not set'}</span>
              </div>
              <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                  <span>Progress</span>
                  <span>${project.progress || 0}%</span>
                </div>
                <div style="height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
                  <div style="width: ${project.progress || 0}%; height: 100%; background: ${
                    project.status === 'Completed' ? '#10B981' : '#4F46E5'
                  };"></div>
                </div>
              </div>
            </div>
          `).join('') : `
            <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; color: #64748b;">
              No project contributions found
            </div>
          `}
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: right; color: #718096; font-size: 12px;">
          Generated on ${new Date().toLocaleDateString()} by DXD Magnate HR System
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
      
      // Add watermark
      pdf.setFontSize(40);
      pdf.setTextColor(240, 240, 240);
      pdf.setFont('helvetica', 'italic');
      pdf.text('DXD Magnate', pdfWidth / 2, pdfHeight / 2, { angle: 45, align: 'center' });
      
      // Add main content
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Add header on each page
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Profile of ${userData.firstName} ${userData.lastName} - Page ${i} of ${pageCount}`, pdfWidth / 2, 10, { align: 'center' });
      }
      
      pdf.save(`${userData.firstName}_${userData.lastName}_Profile.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(element);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDepartmentColor = (dept) => {
    switch(dept) {
      case 'Development': return 'primary';
      case 'Design': return 'secondary';
      case 'Marketing': return 'info';
      case 'Sales': return 'warning';
      case 'Management': return 'error';
      default: return 'default';
    }
  };

  const renderFeedbackItem = (submission) => {
    if (!submission.reviewedAt || !submission.feedback) return null;
    
    return (
      <ListItem sx={{ py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <ListItemAvatar>
          <Avatar sx={{ 
            bgcolor: submission.status === 'approved' ? '#ecfdf5' : '#fee2e2',
            color: submission.status === 'approved' ? '#10b981' : '#ef4444'
          }}>
            {submission.status === 'approved' ? <FiCheckCircle /> : <FiX />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {submission.taskTitle}
              </Typography>
              {submission.rating && (
                <Rating 
                  value={submission.rating} 
                  precision={0.5} 
                  readOnly 
                  size="small" 
                />
              )}
            </Box>
          }
          secondary={
            <>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {submission.feedback}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#94a3b8' }}>
                Reviewed on {formatDate(submission.reviewedAt)} by {submission.reviewedByName}
              </Typography>
            </>
          }
        />
      </ListItem>
    );
  };

  const renderProjectCard = (project) => {
    const userRole = project.teamMembers?.find(member => member.id === userId)?.projectRole || 'Member';
    
    return (
      <Card key={project.id} sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.08)',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {project.title}
            </Typography>
            <Chip
              label={project.status}
              size="small"
              color={projectStatusColors[project.status] || 'default'}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
          
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            {project.description?.substring(0, 120)}{project.description?.length > 120 ? '...' : ''}
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FiTag size={14} color="#64748b" />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {project.type}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FiDollarSign size={14} color="#64748b" />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {project.budget ? `$${parseInt(project.budget).toLocaleString()}` : 'N/A'}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FiCalendar size={14} color="#64748b" />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FiTime size={14} color="#64748b" />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {project.duration || 'N/A'}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Progress
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {project.progress || 0}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={project.progress || 0}
              sx={{
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: project.status === 'Completed' ? '#10b981' : '#4f46e5'
                }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mb: 0.5 }}>
                Your Role
              </Typography>
              <Chip
                label={userRole}
                size="small"
                color={getDepartmentColor(userData?.department)}
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Button
              size="small"
              endIcon={<FiExternalLink size={14} />}
              onClick={() => window.open(`/project/${project.id}`, '_blank')}
              sx={{
                color: '#4f46e5',
                '&:hover': {
                  backgroundColor: '#eef2ff'
                }
              }}
            >
              View
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCollaborationCard = (collab) => {
    const memberRole = collab.TeamMembers?.find(member => member.id === userId)?.role || 'Member';
    const taskCount = collabTasks.filter(t => t.collaborationId === collab.id).length;
    
    return (
      <Card key={collab.id} sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.08)',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {collab.title}
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            {collab.description?.substring(0, 120)}{collab.description?.length > 120 ? '...' : ''}
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FiUsers size={14} color="#64748b" />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {collab.TeamMembers?.length || 0} members
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FiCheckCircle size={14} color="#64748b" />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {taskCount} tasks
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <FiCalendar size={14} color="#64748b" />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Started on {formatDate(collab.createdAt)}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mb: 0.5 }}>
                Your Role
              </Typography>
              <Chip
                label={memberRole}
                size="small"
                color="info"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
            <Button
              size="small"
              endIcon={<FiExternalLink size={14} />}
              onClick={() => window.open(`/collaboration/${collab.id}`, '_blank')}
              sx={{
                color: '#4f46e5',
                '&:hover': {
                  backgroundColor: '#eef2ff'
                }
              }}
            >
              View
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '70vh',
          background: 'linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)'
        }
      }}
    >
      {loading ? (
        <DialogContent sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 400
        }}>
          <CircularProgress />
        </DialogContent>
      ) : userData ? (
        <>
          <DialogTitle sx={{ 
            p: 0,
            borderBottom: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              p: 3,
              pb: 2,
              background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)'
            }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                color={
                  userData.profileStatus === 'online' ? 'success' :
                  userData.profileStatus === 'away' ? 'warning' :
                  userData.profileStatus === 'busy' ? 'error' : 'default'
                }
                sx={{
                  '& .MuiBadge-dot': {
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid white'
                  }
                }}
              >
                <Avatar
                  src={userData.photoURL}
                  sx={{ 
                    width: 80, 
                    height: 80,
                    border: '3px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                </Avatar>
              </Badge>
              
              <Box sx={{ ml: 3, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {userData.firstName} {userData.lastName}
                  </Typography>
                  <Chip
                    label={userData.role}
                    size="small"
                    color={roleColors[userData.role] || 'default'}
                    sx={{ 
                      ml: 1.5,
                      fontWeight: 'bold',
                      fontSize: '0.65rem',
                      height: 20
                    }}
                  />
                  <Chip
                    label={userData.status}
                    size="small"
                    color={statusColors[userData.status] || 'default'}
                    sx={{ 
                      ml: 1,
                      fontWeight: 'bold',
                      fontSize: '0.65rem',
                      height: 20
                    }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {userData.department} Department
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FiAward size={16} className="text-amber-500 mr-1" />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Rank #{userData.allRank || 'N/A'}
                    </Typography>
                  </Box>
                  
                  {performanceStats?.overallRating > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FiStar size={16} className="text-amber-500 mr-1" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {performanceStats.overallRating.toFixed(1)}/5
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FiPercent size={16} className="text-blue-500 mr-1" />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {performanceStats?.completionRate || 0}% completion
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
                <FiX size={20} />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0 }}>
            <Tabs 
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ 
                px: 3,
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                '& .MuiTabs-indicator': {
                  height: 3,
                  backgroundColor: '#4f46e5'
                }
              }}
            >
              <Tab 
                label="Overview" 
                icon={<FiUser size={18} />} 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                label="Performance" 
                icon={<FiTrendingUp size={18} />} 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              <Tab 
                label="Projects" 
                icon={<FiLayers size={18} />} 
                iconPosition="start"
                sx={{ minHeight: 48 }}
              />
              {userData.department === 'Marketing' && (
                <Tab 
                  label="Collaborations" 
                  icon={<FiUsers size={18} />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
              )}
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <FiUser size={20} className="text-gray-500" />
                          Personal Details
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              color: '#64748b',
                              mb: 0.5
                            }}>
                              Username
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              @{userData.username || 'not_set'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              color: '#64748b',
                              mb: 0.5
                            }}>
                              Member Since
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {formatDate(userData.createdAt)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              color: '#64748b',
                              mb: 0.5
                            }}>
                              <FiMail size={14} className="inline mr-1" />
                              Email
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {userData.email}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              color: '#64748b',
                              mb: 0.5
                            }}>
                              <FiPhone size={14} className="inline mr-1" />
                              Phone
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {userData.phone || 'Not provided'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              color: '#64748b',
                              mb: 0.5
                            }}>
                              <FiBriefcase size={14} className="inline mr-1" />
                              Department
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {userData.department || 'Not assigned'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              color: '#64748b',
                              mb: 0.5
                            }}>
                              <FiHome size={14} className="inline mr-1" />
                              Status
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              <Chip
                                label={userData.status}
                                size="small"
                                color={statusColors[userData.status] || 'default'}
                                sx={{ 
                                  fontWeight: 'bold',
                                  fontSize: '0.65rem',
                                  height: 20
                                }}
                              />
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              color: '#64748b',
                              mb: 0.5
                            }}>
                              Last Active
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {userData.lastLogin ? formatDateTime(userData.lastLogin) : 'Never logged in'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      height: '100%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <FiBarChart2 size={20} className="text-gray-500" />
                          Quick Stats
                        </Typography>
                        
                        {performanceStats ? (
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Box sx={{ 
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                textAlign: 'center'
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                  {performanceStats.totalTasks}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Total Tasks
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ 
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                textAlign: 'center'
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                  {performanceStats.completedTasks}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Completed Tasks
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ 
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                textAlign: 'center'
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                  {performanceStats.completionRate}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Completion Rate
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ 
                                p: 2,
                                backgroundColor: '#f8fafc',
                                borderRadius: 2,
                                textAlign: 'center'
                              }}>
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                  {performanceStats.overallRating.toFixed(1)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  Avg. Rating
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        ) : (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            height: 120
                          }}>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              No performance data available
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
              
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <FiTrendingUp size={20} className="text-gray-500" />
                          Performance Metrics
                        </Typography>
                        
                        {performanceStats ? (
                          <Box>
                            <Box sx={{ mb: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                  Task Completion
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {performanceStats.completedTasks}/{performanceStats.totalTasks} ({performanceStats.completionRate}%)
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={performanceStats.completionRate}
                                sx={{
                                  height: 8,
                                  borderRadius: 4,
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: '#4f46e5'
                                  }
                                }}
                              />
                            </Box>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={userData.department === 'Marketing' ? 6 : 12}>
                                <Box sx={{ 
                                  p: 2,
                                  backgroundColor: '#f8fafc',
                                  borderRadius: 2,
                                  textAlign: 'center'
                                }}>
                                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    {performanceStats.avgProjRating.toFixed(1)}
                                  </Typography>
                                  <Rating 
                                    value={performanceStats.avgProjRating} 
                                    precision={0.1} 
                                    readOnly 
                                    size="small"
                                  />
                                  <Typography variant="caption" sx={{ 
                                    display: 'block',
                                    color: '#64748b',
                                    mt: 0.5
                                  }}>
                                    Project Tasks ({performanceStats.projTasksWithRating} rated)
                                  </Typography>
                                </Box>
                              </Grid>
                              {userData.department === 'Marketing' && (
                                <Grid item xs={12} md={6}>
                                  <Box sx={{ 
                                    p: 2,
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 2,
                                    textAlign: 'center'
                                  }}>
                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                      {performanceStats.avgCollabRating.toFixed(1)}
                                    </Typography>
                                    <Rating 
                                      value={performanceStats.avgCollabRating} 
                                      precision={0.1} 
                                      readOnly 
                                      size="small"
                                    />
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      color: '#64748b',
                                      mt: 0.5
                                    }}>
                                      Collaboration Tasks ({performanceStats.collabTasksWithRating} rated)
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            height: 120
                          }}>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              No performance data available
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card sx={{ 
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      height: '100%'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <FiFileText size={20} className="text-gray-500" />
                          Recent Tasks
                        </Typography>
                        
                        {projectTasks.length > 0 ? (
                          <Box sx={{ 
                            maxHeight: 300,
                            overflow: 'auto',
                            borderRadius: 2,
                            border: '1px solid rgba(0,0,0,0.08)'
                          }}>
                            <List sx={{ py: 0 }}>
                              {projectTasks.slice(0, 4).map(task => (
                                <ListItem key={task.id} sx={{ py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                                  <ListItemAvatar>
                                    <Avatar sx={{ 
                                      bgcolor: task.status === 'Done' ? '#ecfdf5' : '#fef3c7',
                                      color: task.status === 'Done' ? '#10b981' : '#f59e0b',
                                      width: 36,
                                      height: 36
                                    }}>
                                      {task.status === 'Done' ? <FiCheckCircle /> : <FiClock />}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                        {task.title}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                                        {task.projectTitle}
                                      </Typography>
                                    }
                                  />
                                  <Chip
                                    label={task.status}
                                    size="small"
                                    color={
                                      task.status === 'Done' ? 'success' :
                                      task.status === 'In Progress' ? 'primary' :
                                      task.status === 'Blocked' ? 'error' : 'default'
                                    }
                                    sx={{ 
                                      fontWeight: 'bold',
                                      fontSize: '0.65rem'
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            height: 120
                          }}>
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              No recent tasks found
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
              
              {activeTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <FiLayers size={20} className="text-gray-500" />
                      Project Contributions ({projects.length})
                    </Typography>
                    <Chip
                      label={`${projects.filter(p => p.status === 'Completed').length} completed`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                  
                  {projects.length > 0 ? (
                    <Grid container spacing={3}>
                      {projects.map(project => (
                        <Grid item xs={12} sm={6} key={project.id}>
                          {renderProjectCard(project)}
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Paper sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px dashed #e2e8f0'
                    }}>
                      <FiLayers size={48} className="text-gray-400 mx-auto mb-3" />
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        No Project Contributions
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        This user hasn't contributed to any projects yet
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
              
              {activeTab === 3 && userData.department === 'Marketing' && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <FiUsers size={20} className="text-gray-500" />
                      Marketing Collaborations ({collaborations.length})
                    </Typography>
                    <Chip
                      label={`${collabTasks.filter(t => t.status === 'Done').length} tasks completed`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                  
                  {collaborations.length > 0 ? (
                    <Grid container spacing={3}>
                      {collaborations.map(collab => (
                        <Grid item xs={12} sm={6} key={collab.id}>
                          {renderCollaborationCard(collab)}
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Paper sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      border: '1px dashed #e2e8f0'
                    }}>
                      <FiUsers size={48} className="text-gray-400 mx-auto mb-3" />
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        No Collaborations
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        This user hasn't joined any marketing collaborations yet
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 2,
            borderTop: '1px solid rgba(0,0,0,0.08)'
          }}>
             <Button 
          variant="outlined"
          startIcon={<FiDownload />}
          onClick={exportProfileToPDF}
          sx={{
            color: '#4f46e5',
            borderColor: '#4f46e5',
            '&:hover': {
              backgroundColor: '#eef2ff',
              borderColor: '#4f46e5'
            }
          }}
        >
          Export Profile
        </Button>
          </DialogActions>
        </>
      ) : (
        <DialogContent sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 200
        }}>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            User data not found
          </Typography>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ProfilePreviewModal;