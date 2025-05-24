import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Avatar, LinearProgress, Divider, Chip 
} from "@mui/material";
import { 
  FiDollarSign, FiUsers, FiTrendingUp, 
  FiBarChart2, FiCalendar, FiMail, FiAward 
} from "react-icons/fi";
import { MdCampaign, MdOutlineCampaign } from "react-icons/md";
import { db } from "../../services/firebase";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { auth } from "../../services/firebase";
import { motion } from 'framer-motion';

const MarketingDashboardCards = () => {
  const [campaignData, setCampaignData] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    monthlyBudget: 0,
    activeCampaigns: 0,
    newLeads: 0,
    conversionRate: 0
  });

  // Fetch campaign data from Firestore
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const campaignsRef = collection(db, "campaigns");
        const q = query(campaignsRef, where("status", "==", "active"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const campaigns = [];
          let totalBudget = 0;
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            campaigns.push({
              id: doc.id,
              name: data.name,
              budget: data.budget,
              spent: data.spent || 0,
              progress: data.budget ? Math.min(100, Math.round(((data.spent || 0) / data.budget) * 100)) : 0
            });
            totalBudget += data.budget || 0;
          });

          setCampaignData(campaigns);
          setMetrics(prev => ({
            ...prev,
            monthlyBudget: totalBudget,
            activeCampaigns: campaigns.length
          }));
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchCampaigns();
  }, []);

  // Fetch leads data for new leads count
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const leadsRef = collection(db, "leads");
        const q = query(leadsRef, where("createdAt", ">", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          setMetrics(prev => ({
            ...prev,
            newLeads: querySnapshot.size,
            conversionRate: calculateConversionRate(querySnapshot)
          }));
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching leads:", error);
      }
    };

    fetchLeads();
  }, []);

  const calculateConversionRate = (leadsSnapshot) => {
    let convertedCount = 0;
    leadsSnapshot.forEach(doc => {
      if (doc.data().status === "converted") {
        convertedCount++;
      }
    });
    return leadsSnapshot.size > 0 ? ((convertedCount / leadsSnapshot.size) * 100).toFixed(1) : 0;
  };

  // Keep your existing fetchTeamMembers useEffect
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get the first collaboration where current user is mentor
        const collabQuery = query(
          collection(db, "marketing-collaboration"),
          where("MentorId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(collabQuery);
        if (querySnapshot.empty) {
          setTopPerformers([]);
          return;
        }

        const collaboration = querySnapshot.docs[0].data();
        const collaborationTitle = collaboration.title;

        // Fetch tasks for this collaboration
        const tasksQuery = query(
          collection(db, "marketing-collaboration-tasks"),
          where("collaborationId", "==", querySnapshot.docs[0].id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch submissions for this collaboration
        const submissionsQuery = query(
          collection(db, "marketing-collaboration-submissions"),
          where("collaborationId", "==", querySnapshot.docs[0].id)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const submissionsData = submissionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate performance for each member
        const performers = (collaboration.TeamMembers || []).map(member => {
          const memberTasks = tasksData.filter(task => task.assignee?.id === member.id);
          const completedTasks = memberTasks.filter(task => task.status === 'Done').length;
          
          // Calculate completion rate
          const completionRate = memberTasks.length > 0 
            ? (completedTasks / memberTasks.length) * 100 
            : 0;
          
          // Calculate on-time rate
          const lateTasks = memberTasks.filter(task => {
            if (task.status === 'Done' && task.dueDate && task.updatedAt) {
              const dueDate = new Date(task.dueDate);
              const completedDate = new Date(task.updatedAt);
              return completedDate > dueDate;
            }
            return false;
          }).length;
          
          const onTimeRate = completedTasks > 0
            ? ((completedTasks - lateTasks) / completedTasks) * 100
            : 0;
          
          // Calculate quality score (from submissions)
          const memberSubmissions = submissionsData.filter(sub => sub.userId === member.id);
          const ratedSubmissions = memberSubmissions.filter(sub => sub.rating > 0);
          const avgQualityScore = ratedSubmissions.length > 0
            ? (ratedSubmissions.reduce((sum, sub) => sum + sub.rating, 0) / ratedSubmissions.length) * 20
            : 0;
          
          // Calculate overall score with weights
          const overallScore = 
            (completionRate * 0.4) + 
            (onTimeRate * 0.3) + 
            (avgQualityScore * 0.3);

          return {
            id: member.id,
            name: member.name,
            role: member.role,
            collaborationTitle: collaborationTitle,
            performancePercentage: Math.round(overallScore),
            badge: overallScore >= 80 ? "gold" : 
                  overallScore >= 60 ? "silver" : "bronze"
          };
        });

        // Sort by performance percentage and take top 3
        setTopPerformers(
          performers
            .sort((a, b) => b.performancePercentage - a.performancePercentage)
            .slice(0, 3)
        );
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Monthly Budget
            </Typography>
            <div className="p-2 rounded-lg bg-pink-50">
              <FiDollarSign className="text-pink-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            ${metrics.monthlyBudget.toLocaleString()}
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>Real-time data</span>
          </div>
        </Box>
        
        <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Active Campaigns
            </Typography>
            <div className="p-2 rounded-lg bg-purple-50">
              <MdOutlineCampaign className="text-purple-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {metrics.activeCampaigns}
          </Typography>
          <div className="flex items-center text-sm text-blue-600">
            <span>Real-time data</span>
          </div>
        </Box>
        
        <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              New Leads
            </Typography>
            <div className="p-2 rounded-lg bg-green-50">
              <FiUsers className="text-green-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {metrics.newLeads}
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>Last 30 days</span>
          </div>
        </Box>
        
        <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Conversion Rate
            </Typography>
            <div className="p-2 rounded-lg bg-indigo-50">
              <FiBarChart2 className="text-indigo-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {metrics.conversionRate}%
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>Last 30 days</span>
          </div>
        </Box>
      </div>

      {/* Campaign Progress */}
      <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Campaign Progress
          </Typography>
          <div className="p-2 rounded-lg bg-blue-50">
            <MdOutlineCampaign className="text-blue-600" size={18} />
          </div>
        </div>
        <div className="space-y-4">
  {campaignData.length > 0 ? (
    campaignData.map((campaign, index) => (
      <div key={index}>
        <div className="flex justify-between items-center mb-1">
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {campaign.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
            ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
          </Typography>
        </div>
        <LinearProgress 
          variant="determinate" 
          value={campaign.progress} 
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#e2e8f0',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: '#4f46e5'
            }
          }}
        />
      </div>
    ))
  ) : (
    <Box
    component={motion.div}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 5,
      backgroundColor: '#f8fafc',
      borderRadius: 4,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.05)',
      maxWidth: 400,
      mx: 'auto',
    }}
  >
    <Box
      sx={{
        fontSize: 48,
        color: '#64748b',
        mb: 1,
      }}
    >
      <MdCampaign />
    </Box>
    <Typography
      variant="h6"
      sx={{
        color: '#1e293b',
        fontWeight: 600,
        mb: 1,
      }}
    >
      No Campaigns Available
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: '#64748b',
        textAlign: 'center',
        maxWidth: 300,
      }}
    >
      You haven’t created any campaigns yet. Start by clicking the “New Campaign” button.
    </Typography>
  </Box>
  )}
</div>

      </Box>

      {/* Rest of your component remains the same */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Top Performers
            </Typography>
            <div className="p-2 rounded-lg bg-yellow-50">
              <FiAward className="text-yellow-600" size={18} />
            </div>
          </div>
          
          {loading ? (
            <LinearProgress />
          ) : topPerformers.length > 0 ? (
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center">
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: 
                        performer.badge === 'gold' ? '#f59e0b' : 
                        performer.badge === 'silver' ? '#94a3b8' : '#b45309',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      mr: 2
                    }}
                  >
                    {performer.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <div className="flex-1">
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {performer.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {performer.role} • {performer.collaborationTitle}
                    </Typography>
                  </div>
                  <Chip 
                    label={`${performer.performancePercentage}%`}
                    size="small"
                    sx={{
                      backgroundColor: 
                        performer.badge === 'gold' ? 'rgba(245, 158, 11, 0.1)' : 
                        performer.badge === 'silver' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(180, 83, 9, 0.1)',
                      color: 
                        performer.badge === 'gold' ? '#b45309' : 
                        performer.badge === 'silver' ? '#475569' : '#854d0e',
                      fontWeight: 'bold'
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>
              No team members found
            </Typography>
          )}
        </Box>

        {/* Recent Activity */}
        <Box className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Upcoming Events
            </Typography>
            <div className="p-2 rounded-lg bg-green-50">
              <FiCalendar className="text-green-600" size={18} />
            </div>
          </div>
          <div className="space-y-4">
            {[
              { title: "Q3 Strategy Meeting", date: "Tomorrow, 10:00 AM", type: "meeting" },
              { title: "Campaign Review", date: "Jul 15, 2:00 PM", type: "review" },
              { title: "Webinar: SEO Trends", date: "Jul 18, 11:00 AM", type: "webinar" }
            ].map((event, index) => (
              <div key={index} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`p-2 rounded-lg mr-3 ${
                  event.type === 'meeting' ? 'bg-blue-50 text-blue-600' : 
                  event.type === 'review' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'
                }`}>
                  <FiCalendar size={16} />
                </div>
                <div>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {event.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {event.date}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </Box>
      </div>
    </div>
  );
};

export default MarketingDashboardCards;