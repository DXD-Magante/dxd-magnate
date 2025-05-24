import React from "react";
import { 
  Grid, Card, CardContent, Typography, Box, Divider, 
  Chip, Paper, LinearProgress, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Button, IconButton, Tooltip
} from "@mui/material";
import { 
  FiMail, FiPhone, FiUser, FiCalendar, FiHome, 
  FiUsers, FiBriefcase, FiRefreshCw, FiPlus, 
  FiFileText, FiMessageSquare, FiShare2, FiChevronRight,
  FiCheckCircle, FiTrendingUp, FiDollarSign, FiAward, FiTarget
} from "react-icons/fi";


const OverviewTab = ({ userData, performanceData, recentActivities }) => {
  const progressValue = performanceData.monthlyTarget > 0 ? 
    Math.min((performanceData.monthlyAchieved / performanceData.monthlyTarget) * 100, 100) : 0;

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-purple-100 text-purple-800';
      case 'proposal-sent': return 'bg-yellow-100 text-yellow-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Left Column */}
      <Grid item xs={12} md={4}>
        {/* Profile Card */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold text-gray-800">
                Profile Information
              </Typography>
              <Tooltip title="Refresh">
                <IconButton size="small" className="text-gray-500 hover:bg-gray-100">
                  <FiRefreshCw size={16} />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box className="space-y-4">
              <div className="flex items-center">
                <FiMail className="text-gray-500 mr-3 w-5 h-5" />
                <Typography className="text-gray-700">
                  {userData.email}
                </Typography>
              </div>
              <div className="flex items-center">
                <FiPhone className="text-gray-500 mr-3 w-5 h-5" />
                <Typography className="text-gray-700">
                  {userData.phone || "Not provided"}
                </Typography>
              </div>
              <div className="flex items-center">
                <FiBriefcase className="text-gray-500 mr-3 w-5 h-5" />
                <Typography className="text-gray-700">
                  {userData.designation || "Sales Executive"}
                </Typography>
              </div>
              <div className="flex items-center">
                <FiCalendar className="text-gray-500 mr-3 w-5 h-5" />
                <Typography className="text-gray-700">
                  Joined {userData.joinDate || "N/A"}
                </Typography>
              </div>
              <div className="flex items-center">
                <FiHome className="text-gray-500 mr-3 w-5 h-5" />
                <Typography className="text-gray-700">
                  {userData.location || "N/A"}
                </Typography>
              </div>
              <div className="flex items-center">
                <FiUsers className="text-gray-500 mr-3 w-5 h-5" />
                <Typography className="text-gray-700">
                  Reports to {userData.manager || "N/A"}
                </Typography>
              </div>
            </Box>
            
            <Divider className="my-4" />
            
            <Box>
              <Typography variant="subtitle2" className="text-gray-600 mb-2">
                Skills & Expertise
              </Typography>
              <Box className="flex flex-wrap gap-2">
                <Chip label="Consultative Selling" className="bg-blue-50 text-blue-700" />
                <Chip label="CRM Software" className="bg-purple-50 text-purple-700" />
                <Chip label="Negotiation" className="bg-green-50 text-green-700" />
                <Chip label="Lead Generation" className="bg-yellow-50 text-yellow-700" />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="shadow-lg rounded-xl border border-gray-200 mt-4">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Quick Stats
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper className="p-3 rounded-lg bg-indigo-50">
                  <Typography variant="subtitle2" className="text-indigo-600">
                    Total Leads
                  </Typography>
                  <Typography variant="h4" className="font-bold text-indigo-900">
                    {performanceData.totalLeads}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper className="p-3 rounded-lg bg-green-50">
                  <Typography variant="subtitle2" className="text-green-600">
                    Converted
                  </Typography>
                  <Typography variant="h4" className="font-bold text-green-900">
                    {performanceData.convertedLeads}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper className="p-3 rounded-lg bg-purple-50">
                  <Typography variant="subtitle2" className="text-purple-600">
                    Conversion Rate
                  </Typography>
                  <Typography variant="h4" className="font-bold text-purple-900">
                    {performanceData.conversionRate.toFixed(1)}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper className="p-3 rounded-lg bg-amber-50">
                  <Typography variant="subtitle2" className="text-amber-600">
                    Avg. Deal Size
                  </Typography>
                  <Typography variant="h4" className="font-bold text-amber-900">
                    ₹{(performanceData.monthlyAchieved / (performanceData.convertedLeads || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Middle Column */}
      <Grid item xs={12} md={5}>
        {/* Performance Card */}
        <Card className="shadow-lg rounded-xl border border-gray-200 h-full">
          <CardContent className="p-6">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold text-gray-800">
                Monthly Performance
              </Typography>
              <Box className="flex items-center">
                <FiTarget className="text-gray-500 mr-2" />
                <Typography variant="body2" className="text-gray-600">
                  {progressValue.toFixed(1)}% achieved
                </Typography>
              </Box>
            </Box>
            
            <Box className="mb-4">
              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#e0e7ff',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 6,
                    background: 'linear-gradient(90deg, #4f46e5, #8b5cf6)'
                  }
                }}
              />
              <Box className="flex justify-between mt-1">
                <Typography variant="caption" className="text-gray-500">
                  ₹0
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  Target: ₹{performanceData.monthlyTarget.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  ₹{performanceData.monthlyAchieved.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
            
            <Divider className="my-4" />
            
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Lead Pipeline
            </Typography>
            
            <Box className="grid grid-cols-2 gap-4">
              <Box className="space-y-2">
                <Box className="flex items-center">
                  <Box className="w-3 h-3 rounded-full bg-blue-500 mr-2"></Box>
                  <Typography variant="body2">New</Typography>
                  <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                    {performanceData.leadStatus.new}
                  </Typography>
                </Box>
                <Box className="flex items-center">
                  <Box className="w-3 h-3 rounded-full bg-purple-500 mr-2"></Box>
                  <Typography variant="body2">Contacted </Typography>
                  <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                    {performanceData.leadStatus.contacted}
                  </Typography>
                </Box>
                <Box className="flex items-center">
                  <Box className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></Box>
                  <Typography variant="body2">Proposal Sent</Typography>
                  <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                    {performanceData.leadStatus.proposalSent}
                  </Typography>
                </Box>
              </Box>
              <Box className="space-y-2">
                <Box className="flex items-center">
                  <Box className="w-3 h-3 rounded-full bg-orange-500 mr-2"></Box>
                  <Typography variant="body2">Negotiation</Typography>
                  <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                    {performanceData.leadStatus.negotiation}
                  </Typography>
                </Box>
                <Box className="flex items-center">
                  <Box className="w-3 h-3 rounded-full bg-green-500 mr-2"></Box>
                  <Typography variant="body2">Closed Won</Typography>
                  <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                    {performanceData.leadStatus.closedWon}
                  </Typography>
                </Box>
                <Box className="flex items-center">
                  <Box className="w-3 h-3 rounded-full bg-red-500 mr-2"></Box>
                  <Typography variant="body2">Closed Lost</Typography>
                  <Typography variant="body2" className="ml-auto font-medium" sx={{marginLeft:'10px'}}>
                    {performanceData.leadStatus.closedLost}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Divider className="my-4" />
            
            <Box className="flex justify-between items-center">
              <Typography variant="subtitle2" className="text-gray-600">
                Conversion Funnel
              </Typography>
              <Button size="small" endIcon={<FiChevronRight />}>
                View Details
              </Button>
            </Box>
            
            <Box className="mt-3">
              <Box className="flex items-center justify-between mb-1">
                <Typography variant="caption">New Leads</Typography>
                <Typography variant="caption" className="font-medium">
                  {performanceData.leadStatus.new}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
              />
              
              <Box className="flex items-center justify-between mb-1 mt-3">
                <Typography variant="caption">Contacted</Typography>
                <Typography variant="caption" className="font-medium">
                  {performanceData.leadStatus.contacted}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(performanceData.leadStatus.contacted / performanceData.leadStatus.new) * 100 || 0}
                sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
              />
              
              <Box className="flex items-center justify-between mb-1 mt-3">
                <Typography variant="caption">Proposals Sent</Typography>
                <Typography variant="caption" className="font-medium">
                  {performanceData.leadStatus.proposalSent}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(performanceData.leadStatus.proposalSent / performanceData.leadStatus.contacted) * 100 || 0}
                sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
              />
              
              <Box className="flex items-center justify-between mb-1 mt-3">
                <Typography variant="caption">Closed Won</Typography>
                <Typography variant="caption" className="font-medium">
                  {performanceData.leadStatus.closedWon}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(performanceData.leadStatus.closedWon / performanceData.leadStatus.proposalSent) * 100 || 0}
                sx={{ height: 8, borderRadius: 4, backgroundColor: '#e0e7ff' }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Right Column */}
      <Grid item xs={12} md={3}>
        {/* Quick Actions */}
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Quick Actions
            </Typography>
            
            <Box className="space-y-3">
              <Button
                fullWidth
                variant="contained"
                startIcon={<FiPlus />}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
                size="large"
              >
                Add New Lead
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FiFileText />}
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                size="large"
              >
                Create Proposal
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FiMessageSquare />}
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                size="large"
              >
                Send Message
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FiCalendar />}
                className="border-green-600 text-green-600 hover:bg-green-50"
                size="large"
              >
                Schedule Meeting
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FiShare2 />}
                className="border-gray-600 text-gray-600 hover:bg-gray-50"
                size="large"
              >
                Share Profile
              </Button>
            </Box>
            
            <Divider className="my-4" />
            
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Upcoming Tasks
            </Typography>
            
            <List className="space-y-2">
              <ListItem className="bg-blue-50 rounded-lg p-3">
                <ListItemAvatar>
                  <Avatar className="bg-blue-100 text-blue-600">
                    <FiCalendar size={18} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Client Meeting"
                  secondary="Today, 2:00 PM"
                />
              </ListItem>
              <ListItem className="bg-purple-50 rounded-lg p-3">
                <ListItemAvatar>
                  <Avatar className="bg-purple-100 text-purple-600">
                    <FiFileText size={18} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Proposal Deadline"
                  secondary="Tomorrow, 10:00 AM"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-lg rounded-xl border border-gray-200 mt-4">
          <CardContent className="p-6">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold text-gray-800">
                Recent Activities
              </Typography>
              <Button size="small" endIcon={<FiChevronRight />}>
                View All
              </Button>
            </Box>
            
            <List className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <ListItem key={index} className="p-0">
                    <Box className={`flex items-start w-full p-3 rounded-lg hover:bg-gray-50 ${getStatusColor(activity.status)}`}>
                      <Box className="mr-3 mt-1">
                        {activity.type === "Added new lead" ? (
                          <FiUser className="text-indigo-500" />
                        ) : activity.type === "Sent Proposal" ? (
                          <FiFileText className="text-purple-500" />
                        ) : (
                          <FiCheckCircle className="text-green-500" />
                        )}
                      </Box>
                      <Box className="flex-1">
                        <Typography variant="body2" className="font-medium">
                          {activity.type}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600">
                          {activity.name}
                        </Typography>
                        <Typography variant="caption" className="block text-gray-500">
                          {activity.date}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                ))
              ) : (
                <Typography className="text-gray-500 text-center py-4">
                  No recent activities found
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OverviewTab;