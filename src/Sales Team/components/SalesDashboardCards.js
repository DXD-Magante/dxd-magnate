import React, { useState, useEffect } from "react";
import { 
  Typography, Avatar, LinearProgress, 
  Box, Chip, Table, TableBody, 
  TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Badge,
  CircularProgress, Menu, MenuItem, 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Snackbar, Alert
} from "@mui/material";
import { 
  FiDollarSign, FiUsers, FiTrendingUp, 
  FiCalendar, FiCheckCircle, FiPieChart, 
  FiMessageSquare, FiHome, FiFlag, 
  FiEdit2, FiTrash2, FiPlus, 
  FiChevronDown, FiX, FiCheck,
  FiUser, FiPhone, FiMail,
  FiBriefcase, FiGlobe, FiDroplet,
  FiChevronRight,
  FiTrendingDown
} from "react-icons/fi";

import { db, auth } from "../../services/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot, addDoc , getDoc} from "firebase/firestore";
import AddNewLeadModal from "./AddLead";
import LeadManagement from "./LeadManagement";
import OpportunitiesDashboard from "./Opportunities";
import { FaRupeeSign } from "react-icons/fa";
import DealsDashboard from "./Deals";
import ForecastDashboard from "./Forecast";
import SalesMetrics from "./SalesMetrics";
import CreateProposalModal from "./CreateProposal";
import ScheduleMeetingModal from "./ScheduleMeeting";
import MyAccounts from "./MyAccounts";
import NewLeads from "./NewLeads";
import ProfileSettings from "./ProfileSettings";
import ActivityLogModal from "./Activity-Logs";
import ActivityReports from "./Activirty";


const SalesDashboardCards = ({ activeSection, activeSubSection }) => {
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [leadStats, setLeadStats] = useState({
    new: 0,
    contacted: 0,
    qualified: 0,
    'closed-won': 0,
    'closed-lost': 0,
    converted: 0,
    total: 0
  });
  const leadStatusCount = {
    new: 0,
    contacted: 0,
    qualified: 0,
    'closed-won': 0,
    'closed-lost': 0,
    converted: 0,
    total: 0
  };
  const [createProposalOpen, setCreateProposalOpen] = useState(false);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [currentLeadId, setCurrentLeadId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [dealsData, setDealsData] = useState({
    quota: { current: 0, target: 75000 },
    deals: { won: 0, pending: 0, lost: 0 },
    activities: []
  });
  
  const [activities, setActivities] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    revenue: 0,
    winRate: 0,
    avgDealSize: 0,
    salesCycle: 0,
    trends: []
  });

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

           // Fetch current month's target
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long' });
    const currentYear = now.getFullYear().toString();

    const targetQuery = query(
      collection(db, 'monthly-target'),
      where('department', '==', 'sales'),
      where('month', '==', currentMonth),
      where('year', '==', currentYear)
    );
    
    const targetSnapshot = await getDocs(targetQuery);
    let monthlyTarget = 50000; // Default value if no target is found
    
    if (!targetSnapshot.empty) {
      targetSnapshot.forEach(doc => {
        monthlyTarget = parseInt(doc.data().target || 50000);
      });
    }

  
        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
  
        let totalRevenue = 0;
        let wonDeals = 0;
        let lostDeals = 0;
        let totalDeals = 0;
        let totalBudget = 0;
        let totalSalesCycleDays = 0;
        let dealCount = 0;
        const monthlyTrends = Array(12).fill(0);
  
        leadsSnapshot.forEach((doc) => {
          const lead = doc.data();
          leadStatusCount.total++;
          const budget = parseInt(lead.budget || 0);
          
          if (lead.status) {
            leadStatusCount[lead.status] = (leadStatusCount[lead.status] || 0) + 1;
          }

          if (lead.converted) {
            leadStatusCount.converted = (leadStatusCount.converted || 0) + 1;
          }

          // Calculate revenue from won deals
          if (lead.status === 'closed-won') {
            totalRevenue += budget;
            wonDeals++;
            totalBudget += budget;
            dealCount++;
          } else if (lead.status === 'closed-lost') {
            lostDeals++;
          }
  
          // Calculate sales cycle (if we have created and expected close dates)
          if (lead.createdAt && lead.expectedCloseDate) {
            const createdDate = lead.createdAt.toDate();
            const closeDate = new Date(lead.expectedCloseDate);
            const days = Math.ceil((closeDate - createdDate) / (1000 * 60 * 60 * 24));
            totalSalesCycleDays += days;
          }
  
          // Group by month for trends
          if (lead.createdAt) {
            const month = lead.createdAt.toDate().getMonth();
            monthlyTrends[month] += budget;
          }
        });
  
        totalDeals = wonDeals + lostDeals;
        const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
        const avgDealSize = dealCount > 0 ? totalBudget / dealCount : 0;
        const avgSalesCycle = dealCount > 0 ? totalSalesCycleDays / dealCount : 0;
  
        setPerformanceData({
          revenue: totalRevenue,
          winRate,
          avgDealSize,
          salesCycle: avgSalesCycle,
          trends: monthlyTrends
        });
  
      } catch (err) {
        console.error('Error fetching performance data:', err);
      }
    };
  
    if (activeSection === "Dashboard") {
      fetchPerformanceData();
    }
  }, [activeSection]);
// Add this useEffect to fetch and format activities based on leads
useEffect(() => {
  const fetchActivities = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Fetch leads
      const leadsQuery = query(
        collection(db, 'leads'),
        where('assignedTo', '==', currentUser.uid)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      
      const formattedActivities = [];
      
      leadsSnapshot.forEach((doc) => {
        const lead = doc.data();
        let activity = null;
        
        // Create activity based on lead status
        switch(lead.status) {
          case 'new':
            activity = {
              id: doc.id,
              client: lead.company || lead.fullName || 'Unknown',
              type: 'Follow-up',
              status: 'pending',
              leadId: doc.id,
              createdAt: new Date().toISOString(),
              dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              assignedTo: currentUser.uid
            };
            break;
          case 'contacted':
            activity = {
              id: doc.id,
              client: lead.company || lead.fullName || 'Unknown',
              type: 'Send Proposal',
              status: 'pending',
              leadId: doc.id,
              createdAt: new Date().toISOString(),
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
              assignedTo: currentUser.uid
            };
            break;
          case 'proposal-sent':
            activity = {
              id: doc.id,
              client: lead.company || lead.fullName || 'Unknown',
              type: 'Follow-up on Proposal',
              status: 'pending',
              leadId: doc.id,
              createdAt: new Date().toISOString(),
              dueDate: lead.expectedCloseDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              assignedTo: currentUser.uid
            };
            break;
          case 'negotiation':
            activity = {
              id: doc.id,
              client: lead.company || lead.fullName || 'Unknown',
              type: 'Negotiation Meeting',
              status: 'pending',
              leadId: doc.id,
              createdAt: new Date().toISOString(),
              dueDate: lead.expectedCloseDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              assignedTo: currentUser.uid
            };
            break;
        }
        
        if (activity) {
          formattedActivities.push(activity);
        }
      });
      
      // Sort activities by due date
      formattedActivities.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      
      setActivities(formattedActivities);
      
      // Save activities to firestore if they don't exist
      const activitiesCollection = collection(db, 'sales-activities');
      for (const activity of formattedActivities) {
        const activityQuery = query(
          activitiesCollection,
          where('leadId', '==', activity.leadId),
          where('type', '==', activity.type)
        );
        const existingActivity = await getDocs(activityQuery);
        
        if (existingActivity.empty) {
          await addDoc(activitiesCollection, activity);
        }
      }
      
    } catch (err) {
      console.error('Error fetching activities:', err);
      alert(err)
    }
  };
  
  if (activeSection === "Dashboard") {
    fetchActivities();
  }
}, [activeSection, leads]);



const updateActivityStatus = async (leadId, newStatus) => {
  try {
    // Find all pending activities for this lead
    const activitiesQuery = query(
      collection(db, 'sales-activities'),
      where('leadId', '==', leadId),
      where('status', '==', 'pending')
    );
    
    const activitiesSnapshot = await getDocs(activitiesQuery);
    
    // Update all found activities to 'completed'
    const updatePromises = [];
    activitiesSnapshot.forEach((doc) => {
      updatePromises.push(updateDoc(doc.ref, {
        status: 'completed',
        completedAt: new Date().toISOString()
      }));
    });
    
    await Promise.all(updatePromises);
    
    // Create a new activity based on the new status
    const leadDoc = await getDoc(doc(db, 'leads', leadId));
    const lead = leadDoc.data();
    
    let newActivity = null;
    switch(newStatus) {
      case 'contacted':
        newActivity = {
          client: lead.company || lead.fullName || 'Unknown',
          type: 'Send Proposal',
          status: 'pending',
          leadId: leadId,
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: auth.currentUser.uid
        };
        break;
      case 'proposal-sent':
        newActivity = {
          client: lead.company || lead.fullName || 'Unknown',
          type: 'Follow-up on Proposal',
          status: 'pending',
          leadId: leadId,
          createdAt: new Date().toISOString(),
          dueDate: lead.expectedCloseDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: auth.currentUser.uid
        };
        break;
      case 'negotiation':
        newActivity = {
          client: lead.company || lead.fullName || 'Unknown',
          type: 'Negotiation Meeting',
          status: 'pending',
          leadId: leadId,
          createdAt: new Date().toISOString(),
          dueDate: lead.expectedCloseDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignedTo: auth.currentUser.uid
        };
        break;
    }
    
    if (newActivity) {
      await addDoc(collection(db, 'sales-activities'), newActivity);
    }
    
  } catch (err) {
    console.error('Error updating activities:', err);
  }
};





  
  // Add this useEffect to fetch and calculate deals data
  useEffect(() => {
    const fetchDealsData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const now = new Date();
        const currentMonth = now.toLocaleString('default', { month: 'long' });
        const currentYear = now.getFullYear().toString();
        
        const targetQuery = query(
          collection(db, 'monthly-target'),
          where('department', '==', 'sales'),
          where('month', '==', currentMonth),
          where('year', '==', currentYear)
        );
        
        const targetSnapshot = await getDocs(targetQuery);
        let monthlyTarget = 50000; // Default value if no target is found
        
        if (!targetSnapshot.empty) {
          targetSnapshot.forEach(doc => {
            monthlyTarget = parseInt(doc.data().target || 50000);
          });
        }
  
        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        
        let won = 0;
        let pending = 0;
        let lost = 0;
        let currentQuota = 0;
        const recentActivities = [];
        
        leadsSnapshot.forEach((doc) => {
          const lead = doc.data();
          
          // Calculate deal status counts
          if (lead.status === 'closed-won') {
            won++;
            currentQuota += parseInt(lead.budget || 0);
          } else if (lead.status === 'closed-lost') {
            lost++;
          } else if (['contacted', 'proposal-sent', 'negotiation'].includes(lead.status)) {
            pending++;
          }
          
          // Add to recent activities if it has an expectedCloseDate
          if (lead.expectedCloseDate) {
            recentActivities.push({
              id: doc.id,
              client: lead.fullName || lead.company || 'Unknown',
              type: 'Follow-up',
              date: formatDate(lead.expectedCloseDate)
            });
          }
        });
        
        setDealsData({
          quota: { current: currentQuota, target: monthlyTarget },
          deals: { won, pending, lost },
          activities: recentActivities.slice(0, 3) // Get only the 3 most recent
        });
        
      } catch (err) {
        console.error('Error fetching deals data:', err);
      }
    };
  
    if (activeSection === "Dashboard") {
      fetchDealsData();
    }
  }, [activeSection]);
  
  // Add this helper function for date formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };
   // Fetch all analytics data
   useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
    
        // Fetch leads data
        const leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid)
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        
        // Calculate lead stats
        const leadStatusCount = {
          new: 0,
          contacted: 0,
          qualified: 0,
          'closed-won': 0,
          'closed-lost': 0,
          converted: 0,
          total: 0
        };
        
        leadsSnapshot.forEach((doc) => {
          const lead = doc.data();
          leadStatusCount.total++;
          if (lead.status) {
            leadStatusCount[lead.status] = (leadStatusCount[lead.status] || 0) + 1;
          }
          if (lead.converted) {
            leadStatusCount.converted++;
          }
        });
        setLeadStats(leadStatusCount);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeSection === "Dashboard") {
      fetchAnalytics();
    }
  }, [activeSection]);

// Real-time leads data fetching
useEffect(() => {
  let unsubscribe;
  
  if (activeSection === "Sales Pipeline" && activeSubSection === "Leads") {
    const fetchLeadsRealtime = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const q = query(
          collection(db, 'leads'),
          where('assignedTo', '==', currentUser.uid)
        );
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const leadsData = [];
          const leadStatusCount = {
            new: 0,
            contacted: 0,
            qualified: 0,
            total: 0
          };
          
          querySnapshot.forEach((doc) => {
            const lead = {
              id: doc.id,
              ...doc.data()
            };
            leadsData.push(lead);
            
            // Update stats
            leadStatusCount.total++;
            if (lead.status) {
              const statusKey = lead.status.replace(/\s+/g, '-');
              if (leadStatusCount.hasOwnProperty(statusKey)) {
                leadStatusCount[statusKey]++;
              }
            }
          });
          
          setLeads(leadsData);
          setLeadStats(leadStatusCount);
          
          // Show notification if new leads are added
          if (leadsData.length > leads.length && leads.length > 0) {
            const newLeads = leadsData.length - leads.length;
            setSnackbarMessage(`${newLeads} new lead${newLeads > 1 ? 's' : ''} added`);
            setSnackbarSeverity("info");
            setSnackbarOpen(true);
          }
        });
      } catch (err) {
        console.error('Error setting up real-time leads:', err);
        setSnackbarMessage("Error loading leads");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeadsRealtime();
  }
  
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [activeSection, activeSubSection]);



const handleStatusMenuOpen = (event, leadId) => {
  setStatusMenuAnchor(event.currentTarget);
  setCurrentLeadId(leadId);
};

const handleStatusMenuClose = () => {
  setStatusMenuAnchor(null);
  setCurrentLeadId(null);
};
 // Add these handler functions
 const handleStatusChange = async (leadId, newStatus) => {
  try {
    await updateDoc(doc(db, 'leads', leadId), {
      status: newStatus
    });

    await updateActivityStatus(leadId, newStatus);
    
    setSnackbarMessage("Lead status updated successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Error updating lead status:', err);
    setSnackbarMessage("Failed to update lead status");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

const handleDeleteLead = async (lead) => {
  try {
    await deleteDoc(doc(db, 'leads', lead.id));
    
    setSnackbarMessage("Lead deleted successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Error deleting lead:', err);
    setSnackbarMessage("Failed to delete lead");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

const handleEditLead = async (lead) => {
  try {
    await updateDoc(doc(db, 'leads', lead.id), lead);
    
    setSnackbarMessage("Lead updated successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Error updating lead:', err);
    setSnackbarMessage("Failed to update lead");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

const handleDeleteClick = (lead) => {
  setLeadToDelete(lead);
  setDeleteDialogOpen(true);
};

const handleDeleteConfirm = async () => {
  try {
    await deleteDoc(doc(db, 'leads', leadToDelete.id));
    
    setSnackbarMessage("Lead deleted successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (err) {
    console.error('Error deleting lead:', err);
    setSnackbarMessage("Failed to delete lead");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
  
  setDeleteDialogOpen(false);
  setLeadToDelete(null);
};

const handleEditClick = (lead) => {
  setCurrentLead(lead);
  setEditDialogOpen(true);
};

const handleEditSave = async () => {
  try {
    await updateDoc(doc(db, 'leads', currentLead.id), currentLead);
    
    setSnackbarMessage("Lead updated successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
    setEditDialogOpen(false);
  } catch (err) {
    console.error('Error updating lead:', err);
    setSnackbarMessage("Failed to update lead");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setCurrentLead(prev => ({
    ...prev,
    [name]: value
  }));
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'default';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'new': return 'primary';
    case 'contacted': return 'secondary';
    case 'proposal-sent': return 'info';
    case 'negotiation': return 'warning';
    case 'closed-won': return 'success';
    case 'closed-lost': return 'error';
    default: return 'default';
  }
};

const statusOptions = [
  { value: 'new', label: 'New', color: 'primary', icon: <FiDroplet size={14} /> },
  { value: 'contacted', label: 'Contacted', color: 'secondary', icon: <FiPhone size={14} /> },
  { value: 'proposal-sent', label: 'Proposal Sent', color: 'info', icon: <FiMail size={14} /> },
  { value: 'negotiation', label: 'Negotiation', color: 'warning', icon: <FiDollarSign size={14} /> },
  { value: 'closed-won', label: 'Closed Won', color: 'success', icon: <FiCheckCircle size={14} /> },
  { value: 'closed-lost', label: 'Closed Lost', color: 'error', icon: <FiX size={14} /> }
];

const priorityOptions = [
  { value: 'high', label: 'High', color: 'error' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'low', label: 'Low', color: 'success' }
];

  const salesData = {
    quota: { current: 48750, target: 75000 },
    deals: { won: 12, pending: 8, lost: 4 },
    leads: { new: 24, contacted: 18, qualified: 10 },
    activities: [
      { id: 1, client: "Acme Corp", type: "Meeting", date: "Today, 2:30 PM" },
      { id: 2, client: "Globex", type: "Proposal", date: "Tomorrow, 10:00 AM" },
      { id: 3, client: "Initech", type: "Follow-up", date: "Yesterday" }
    ]
  };

  const progressValue = Math.min((dealsData.quota.current / dealsData.quota.target) * 100, 100);

 
  

  if (activeSection === "Dashboard") {
    return (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quota Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Sales Quota
            </Typography>
            <div className="p-2 rounded-lg bg-indigo-50">
              <FaRupeeSign className="text-indigo-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
          ₹{dealsData.quota.current.toLocaleString()}
            <span className="text-sm text-gray-500 ml-1">/ ₹{dealsData.quota.target.toLocaleString()}</span>
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progressValue} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              mb: 1,
              backgroundColor: '#e0e7ff',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#4f46e5'
              }
            }} 
          />
          <div className="flex items-center justify-between">
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {progressValue.toFixed(1)}% of target
            </Typography>
            <Chip 
              label={`${(dealsData.quota.current / salesData.quota.target * 100).toFixed(1)}%`} 
              size="small" 
              sx={{ 
                backgroundColor: progressValue > 75 ? '#dcfce7' : progressValue > 50 ? '#fef9c3' : '#fee2e2',
                color: progressValue > 75 ? '#166534' : progressValue > 50 ? '#854d0e' : '#991b1b',
                fontWeight: 'bold'
              }} 
            />
          </div>
        </div>

        {/* Deals Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Deals Summary
            </Typography>
            <div className="p-2 rounded-lg bg-green-50">
              <FiCheckCircle className="text-green-600" size={18} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {dealsData.deals.won}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Won
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {dealsData.deals.pending}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Pending
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {dealsData.deals.lost}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Lost
              </Typography>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Win Rate
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {dealsData.deals.won + dealsData.deals.lost === 0 
  ? '0%' 
  : `${((dealsData.deals.won / (dealsData.deals.won + dealsData.deals.lost)) * 100).toFixed(1)}%`}

              </Typography>
            </div>
          </div>
        </div>
 {/* Leads Card */}
<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
  <div className="flex items-center justify-between mb-4">
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
      Leads Status
    </Typography>
    <div className="p-2 rounded-lg bg-blue-50">
      <FiUsers className="text-blue-600" size={18} />
    </div>
  </div>
  <div className="space-y-4">
    <div>
      <div className="flex items-center justify-between mb-1">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          New Leads
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {leadStats.new}
        </Typography>
      </div>
      <LinearProgress 
        variant="determinate" 
        value={leadStats.total > 0 ? (leadStats.new / leadStats.total) * 100 : 0} 
        sx={{ 
          height: 4, 
          borderRadius: 4,
          backgroundColor: '#e0e7ff',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#3b82f6'
          }
        }} 
      />
    </div>
    <div>
      <div className="flex items-center justify-between mb-1">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Contacted
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {leadStats.contacted}
        </Typography>
      </div>
      <LinearProgress 
        variant="determinate" 
        value={leadStats.total > 0 ? (leadStats.contacted / leadStats.total) * 100 : 0} 
        sx={{ 
          height: 4, 
          borderRadius: 4,
          backgroundColor: '#e0e7ff',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#3b82f6'
          }
        }} 
      />
    </div>
    <div>
      <div className="flex items-center justify-between mb-1">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Qualified
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {leadStats.qualified}
        </Typography>
      </div>
      <LinearProgress 
        variant="determinate" 
        value={leadStats.total > 0 ? (leadStats.qualified / leadStats.total) * 100 : 0} 
        sx={{ 
          height: 4, 
          borderRadius: 4,
          backgroundColor: '#e0e7ff',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#3b82f6'
          }
        }} 
      />
    </div>
    {/* Add Won, Lost, and Converted sections */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Won Leads
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {leadStats['closed-won'] || 0}
        </Typography>
      </div>
      <LinearProgress 
        variant="determinate" 
        value={leadStats.total > 0 ? ((leadStats['closed-won'] || 0)) / leadStats.total * 100 : 0} 
        sx={{ 
          height: 4, 
          borderRadius: 4,
          backgroundColor: '#e0e7ff',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#10b981' // Green for won
          }
        }} 
      />
    </div>
    <div>
      <div className="flex items-center justify-between mb-1">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Lost Leads
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {leadStats['closed-lost'] || 0}
        </Typography>
      </div>
      <LinearProgress 
        variant="determinate" 
        value={leadStats.total > 0 ? ((leadStats['closed-lost'] || 0)) / leadStats.total * 100 : 0} 
        sx={{ 
          height: 4, 
          borderRadius: 4,
          backgroundColor: '#e0e7ff',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#ef4444' // Red for lost
          }
        }} 
      />
    </div>
    <div>
      <div className="flex items-center justify-between mb-1">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Converted
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {leadStats.converted || 0}
        </Typography>
      </div>
      <LinearProgress 
        variant="determinate" 
        value={leadStats.total > 0 ? ((leadStats.converted || 0)) / leadStats.total * 100 : 0} 
        sx={{ 
          height: 4, 
          borderRadius: 4,
          backgroundColor: '#e0e7ff',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#8b5cf6' // Purple for converted
          }
        }} 
      />
    </div>
    <div className="pt-2 mt-2 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          Total Leads
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {leadStats.total}
        </Typography>
      </div>
    </div>
  </div>
</div>

        {/* Activities Card */}
<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-3">
  <div className="flex items-center justify-between mb-4">
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
      Upcoming Activities
    </Typography>
    <div className="p-2 rounded-lg bg-purple-50">
      <FiCalendar className="text-purple-600" size={18} />
    </div>
  </div>
  <div className="space-y-4">
    {activities.length > 0 ? (
      activities.slice(0, 3).map((activity) => (
        <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
          <div className="p-2 rounded-lg bg-indigo-50 mr-3">
            <FiMessageSquare className="text-indigo-600" size={16} />
          </div>
          <div className="flex-1">
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {activity.type} with {activity.client}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Due: {formatDate(activity.dueDate)}
            </Typography>
          </div>
          <Chip 
            label={activity.status} 
            size="small" 
            sx={{ 
              backgroundColor: activity.status === 'completed' ? '#dcfce7' : '#fee2e2',
              color: activity.status === 'completed' ? '#166534' : '#991b1b',
              fontWeight: 'bold',
              textTransform: 'capitalize'
            }} 
          />
        </div>
      ))
    ) : (
      <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>
        No upcoming activities found
      </Typography>
    )}
  </div>
</div>

<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-2">
  <div className="flex items-center justify-between mb-4">
    <div>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
        Performance Trends
      </Typography>
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        Last 30 days • <span className="text-green-600">↑12%</span> from last period
      </Typography>
    </div>
    <div className="flex space-x-2">
      <button className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200">
        Weekly
      </button>
      <button className="text-xs px-2 py-1 bg-indigo-600 rounded-md text-white">
        Monthly
      </button>
      <button className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200">
        Quarterly
      </button>
    </div>
  </div>

  <div className="grid grid-cols-4 gap-4 mb-6">
    <div className="bg-indigo-50 p-3 rounded-lg">
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        Revenue
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        ₹{performanceData.revenue.toLocaleString()}
      </Typography>
      <div className="flex items-center">
        <FiTrendingUp className="text-green-500 mr-1" size={14} />
        <Typography variant="caption" sx={{ color: '#16a34a' }}>
          {Math.floor(Math.random() * 15 + 5)}%
        </Typography>
      </div>
    </div>
    
    <div className="bg-green-50 p-3 rounded-lg">
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        Win Rate
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {performanceData.winRate.toFixed(1)}%
      </Typography>
      <div className="flex items-center">
        <FiTrendingUp className="text-green-500 mr-1" size={14} />
        <Typography variant="caption" sx={{ color: '#16a34a' }}>
          {Math.floor(Math.random() * 10 + 2)}%
        </Typography>
      </div>
    </div>
    
    <div className="bg-blue-50 p-3 rounded-lg">
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        Avg. Deal Size
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        ₹{performanceData.avgDealSize.toLocaleString(undefined, {maximumFractionDigits: 0})}
      </Typography>
      <div className="flex items-center">
        <FiTrendingUp className="text-green-500 mr-1" size={14} />
        <Typography variant="caption" sx={{ color: '#16a34a' }}>
          {Math.floor(Math.random() * 15 + 5)}%
        </Typography>
      </div>
    </div>
    
    <div className="bg-purple-50 p-3 rounded-lg">
      <Typography variant="caption" sx={{ color: '#64748b' }}>
        Sales Cycle
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {performanceData.salesCycle.toFixed(0)} days
      </Typography>
      <div className="flex items-center">
        <FiTrendingDown className="text-red-500 mr-1" size={14} />
        <Typography variant="caption" sx={{ color: '#dc2626' }}>
          {Math.floor(Math.random() * 5 + 1)}%
        </Typography>
      </div>
    </div>
  </div>

  {/* Chart with real data */}
  <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
    <div className="flex justify-between items-center mb-4">
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
        Revenue Trend
      </Typography>
      <div className="flex space-x-2">
        <Chip label="Revenue" size="small" sx={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }} />
        <Chip label="Target" size="small" sx={{ backgroundColor: '#f1f5f9', color: '#64748b' }} />
      </div>
    </div>
    
    {/* Chart with real data */}
    <div className="relative h-full w-full">
      {/* X-axis */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
        <span>₹{Math.max(...performanceData.trends).toLocaleString()}</span>
        <span>₹{(Math.max(...performanceData.trends) * 0.75).toLocaleString()}</span>
        <span>₹{(Math.max(...performanceData.trends) * 0.5).toLocaleString()}</span>
        <span>₹{(Math.max(...performanceData.trends) * 0.25).toLocaleString()}</span>
        <span>₹0</span>
      </div>
      
      {/* Chart content */}
      <div className="absolute left-8 right-0 top-0 bottom-8 flex items-end space-x-1">
        {performanceData.trends.map((value, i) => {
          const height = (value / Math.max(...performanceData.trends)) * 100 || 0;
          const targetHeight = Math.min(height + 20, 100); // Just for visualization
          return (
            <div key={i} className="flex-1 flex flex-col justify-end items-center">
              <div 
                className="w-full bg-indigo-100 rounded-t-sm"
                style={{ height: `${targetHeight}%` }}
              ></div>
              <div 
                className="w-full bg-indigo-600 rounded-t-sm"
                style={{ height: `${height}%` }}
              ></div>
              <span className="text-xs text-gray-400 mt-1">
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-0 left-8 right-0 flex justify-center space-x-4 pt-2">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-600 rounded-full mr-1"></div>
          <span className="text-xs text-gray-500">Actual</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-100 rounded-full mr-1"></div>
          <span className="text-xs text-gray-500">Target</span>
        </div>
      </div>
    </div>
  </div>
  
  <div className="mt-4 flex justify-between items-center">
    <Typography variant="caption" sx={{ color: '#64748b' }}>
      Updated just now
    </Typography>
    <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
      View Full Report <FiChevronRight className="ml-1" size={16} />
    </button>
  </div>
</div>
        {/* Quick Actions Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <div className="p-2 rounded-lg bg-green-50">
              <FiCheckCircle className="text-green-600" size={18} />
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full py-2 px-4 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
              onClick={() => setAddLeadOpen(true)}>
              Add New Lead
            </button>
            <button 
  className="w-full py-2 px-4 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
  onClick={() => setActivityLogOpen(true)}
>
  View Activity Logs
</button>
            <button 
      className="w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
      onClick={() => setCreateProposalOpen(true)}
    >
      Create Proposal
    </button>
    <button 
  className="w-full py-2 px-4 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
  onClick={() => setScheduleMeetingOpen(true)}
>
  Schedule Meeting
</button>
          </div>
        </div>
      </div>
      <AddNewLeadModal 
        open={addLeadOpen} 
        onClose={() => setAddLeadOpen(false)} 
      />

<CreateProposalModal 
  open={createProposalOpen} 
  onClose={() => setCreateProposalOpen(false)} 
/>

<ScheduleMeetingModal 
  open={scheduleMeetingOpen} 
  onClose={() => setScheduleMeetingOpen(false)}
/>

<ActivityLogModal 
  open={activityLogOpen} 
  onClose={() => setActivityLogOpen(false)} 
/>
      </>
    );
  }

  if (activeSection === "Reports") {
  if (activeSubSection === "Sales Metrics") {
    return <SalesMetrics />;
  }

  if (activeSubSection === "Activity") {
    return <ActivityReports />;
  }
}

  if (activeSection === "Sales Pipeline") {
    if (activeSubSection === "Leads") {
      return (
        <LeadManagement 
          leads={leads}
          loading={loading}
          leadStats={leadStats}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          addLeadOpen={addLeadOpen}
          setAddLeadOpen={setAddLeadOpen}
          onStatusChange={handleStatusChange}
          onDeleteLead={handleDeleteLead}
          onEditLead={handleEditLead}
          snackbarOpen={snackbarOpen}
          snackbarMessage={snackbarMessage}
          snackbarSeverity={snackbarSeverity}
          setSnackbarOpen={setSnackbarOpen}
        />
      );
    }
    if (activeSubSection === "Opportunities") {
      return <OpportunitiesDashboard />;
    }
    if (activeSubSection === "Deals") {
      return <DealsDashboard />;
    }

    if (activeSubSection === "Forecast") {
      return <ForecastDashboard />;
    }
  }

  // Clients sub-sections
  if (activeSection === "Clients") {
    if (activeSubSection === "My Accounts") {
      return <MyAccounts />;
    }

    if (activeSubSection === "New Leads") {
      return <NewLeads />;
    }
    
  }

  if (activeSection === "Settings") {
    if(activeSubSection === "Profile") {
      return <ProfileSettings/>
    }
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-3 h-64 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
          {activeSection === "Dashboard" ? <FiHome /> : null}
        </div>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          {activeSubSection || activeSection} Content
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          This section would display detailed information about {activeSubSection ? `${activeSubSection.toLowerCase()} in ${activeSection.toLowerCase()}` : activeSection.toLowerCase()}
        </Typography>
      </div>
    </div>
  );
};

export default SalesDashboardCards;