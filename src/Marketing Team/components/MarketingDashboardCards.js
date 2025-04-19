import React from "react";
import { 
  Box, Typography, Avatar, LinearProgress, Divider, Chip 
} from "@mui/material";
import { 
  FiDollarSign, FiUsers, FiTrendingUp, 
  FiBarChart2, FiCalendar, FiMail, FiAward 
} from "react-icons/fi";
import { MdOutlineCampaign } from "react-icons/md";

const MarketingDashboardCards = () => {
  const campaignData = [
    { name: "Summer Sale", progress: 75, budget: "$5,000", spent: "$3,750" },
    { name: "Product Launch", progress: 45, budget: "$8,000", spent: "$3,600" },
    { name: "Holiday Special", progress: 30, budget: "$10,000", spent: "$3,000" }
  ];

  const topPerformers = [
    { name: "Alex Johnson", role: "SEO Specialist", points: 1240, badge: "gold" },
    { name: "Sarah Miller", role: "Content Creator", points: 1120, badge: "silver" },
    { name: "David Kim", role: "PPC Expert", points: 980, badge: "bronze" }
  ];

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
            $24,780
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>12% increase</span>
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
            8
          </Typography>
          <div className="flex items-center text-sm text-blue-600">
            <span>3 launching soon</span>
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
            324
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>18% increase</span>
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
            4.8%
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>1.2% increase</span>
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
          {campaignData.map((campaign, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {campaign.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {campaign.spent} / {campaign.budget}
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
          ))}
        </div>
      </Box>

      {/* Bottom Row */}
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
                    {performer.role}
                  </Typography>
                </div>
                <Chip 
                  label={`${performer.points} pts`}
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