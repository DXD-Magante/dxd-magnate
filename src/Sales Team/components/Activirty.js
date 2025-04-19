import React, { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, 
  LinearProgress, Divider, Chip,
  Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableHead, TableRow,
  Paper, TableContainer, Button, CircularProgress,
  Tabs, Tab, Avatar, Badge, IconButton
} from "@mui/material";
import { Tooltip as MuiTooltip } from "@mui/material"; // Renamed MUI Tooltip
import {
  FiCalendar, FiFilter, FiRefreshCw, FiDownload,
  FiTrendingUp, FiTrendingDown, FiClock, FiBarChart2,
  FiCheckCircle, FiAlertCircle, FiUser, FiMail,
  FiPhone, FiActivity, FiChevronRight, FiDollarSign
} from "react-icons/fi";
import { db } from "../../services/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useTheme } from "@mui/material/styles";
import { auth } from "../../services/firebase";

const ActivityReports = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState({
    summary: {
      total: 0,
      completed: 0,
      overdue: 0,
      scheduled: 0
    },
    types: [],
    performance: [],
    recentActivities: [],
    teamPerformance: []
  });
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    fetchActivityData();
  }, [timeRange]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Fetch activities data
      const activitiesQuery = query(
        collection(db, 'sales-activities'),
        where('assignedTo', '==', userId),
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      
      let totalActivities = 0;
      let completedActivities = 0;
      let overdueActivities = 0;
      let scheduledActivities = 0;
      const activityTypes = {};
      const performanceData = Array(7).fill(0).map((_, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        completed: 0,
        scheduled: 0
      }));
      const recentActivities = [];
      const now = new Date();

      activitiesSnapshot.forEach(doc => {
        const activity = doc.data();
        totalActivities++;
        
        // Categorize by status
        if (activity.status === 'completed') {
          completedActivities++;
        } else {
          scheduledActivities++;
          const dueDate = new Date(activity.dueDate);
          if (dueDate < now) {
            overdueActivities++;
          }
        }

        // Count by type
        if (!activityTypes[activity.type]) {
          activityTypes[activity.type] = 0;
        }
        activityTypes[activity.type]++;

        // Performance by day of week
        if (activity.completedAt) {
          const completedDay = new Date(activity.completedAt).getDay();
          performanceData[completedDay].completed++;
        } else if (activity.dueDate) {
          const scheduledDay = new Date(activity.dueDate).getDay();
          performanceData[scheduledDay].scheduled++;
        }

        // Collect recent activities
        if (recentActivities.length < 10) {
          recentActivities.push({
            id: doc.id,
            ...activity,
            dueDate: activity.dueDate,
            status: activity.status || 'scheduled'
          });
        }
      });

      // Format activity types for chart
      const formattedTypes = Object.keys(activityTypes).map(type => ({
        name: type,
        count: activityTypes[type]
      }));

      setActivityData({
        summary: {
          total: totalActivities,
          completed: completedActivities,
          overdue: overdueActivities,
          scheduled: scheduledActivities
        },
        types: formattedTypes,
        performance: performanceData,
        recentActivities,
        teamPerformance: [] // Would be populated in a team context
      });

    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActivityData();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getCompletionRate = () => {
    return activityData.summary.total > 0 
      ? (activityData.summary.completed / activityData.summary.total) * 100 
      : 0;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Chip 
            label="Completed" 
            size="small" 
            sx={{ 
              backgroundColor: '#dcfce7',
              color: '#166534',
              fontWeight: 'bold'
            }} 
          />
        );
      case 'overdue':
        return (
          <Chip 
            label="Overdue" 
            size="small" 
            sx={{ 
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontWeight: 'bold'
            }} 
          />
        );
      default:
        return (
          <Chip 
            label="Scheduled" 
            size="small" 
            sx={{ 
              backgroundColor: '#e0e7ff',
              color: '#4338ca',
              fontWeight: 'bold'
            }} 
          />
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <Typography variant="h5" className="font-bold text-gray-800">
          Activity Reports
        </Typography>
        <div className="flex items-center space-x-4">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              startAdornment={<FiCalendar className="mr-2" />}
            >
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <button 
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={handleRefresh}
            >
              <FiRefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<FiDownload />}
            sx={{
              textTransform: 'none',
              borderColor: '#4f46e5',
              color: '#4f46e5',
              '&:hover': {
                backgroundColor: '#eef2ff',
                borderColor: '#4f46e5'
              }
            }}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        {/* Total Activities */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="h-full shadow-sm rounded-xl border border-gray-100">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="subtitle1" className="font-medium text-gray-600">
                  Total Activities
                </Typography>
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <FiActivity size={18} />
                </div>
              </div>
              <Typography variant="h4" className="font-bold mb-2">
                {activityData.summary.total}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#e0e7ff',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4f46e5'
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Activities */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="h-full shadow-sm rounded-xl border border-gray-100">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="subtitle1" className="font-medium text-gray-600">
                  Completed
                </Typography>
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <FiCheckCircle size={18} />
                </div>
              </div>
              <Typography variant="h4" className="font-bold mb-2">
                {activityData.summary.completed}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getCompletionRate()} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#e0e7ff',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#10b981'
                  }
                }} 
              />
              <Typography variant="caption" className="text-gray-500 mt-1">
                {getCompletionRate().toFixed(1)}% completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Scheduled Activities */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="h-full shadow-sm rounded-xl border border-gray-100">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="subtitle1" className="font-medium text-gray-600">
                  Scheduled
                </Typography>
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FiClock size={18} />
                </div>
              </div>
              <Typography variant="h4" className="font-bold mb-2">
                {activityData.summary.scheduled}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(activityData.summary.scheduled / activityData.summary.total) * 100 || 0} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#e0e7ff',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#3b82f6'
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Activities */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="h-full shadow-sm rounded-xl border border-gray-100">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="subtitle1" className="font-medium text-gray-600">
                  Overdue
                </Typography>
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <FiAlertCircle size={18} />
                </div>
              </div>
              <Typography variant="h4" className="font-bold mb-2">
                {activityData.summary.overdue}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(activityData.summary.overdue / activityData.summary.total) * 100 || 0} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: '#fee2e2',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#ef4444'
                  }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Card className="shadow-sm rounded-xl border border-gray-100">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48
            }
          }}
        >
          <Tab label="Overview" />
          <Tab label="Activity Types" />
          <Tab label="Performance" />
          <Tab label="Recent Activities" />
        </Tabs>

        <CardContent>
          {/* Overview Tab */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" className="font-bold mb-4">
                  Activity Types Distribution
                </Typography>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activityData.types}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        fill="#4f46e5" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" className="font-bold mb-4">
                  Weekly Performance
                </Typography>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activityData.performance}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="completed" 
                        fill="#10b981" 
                        radius={[4, 4, 0, 0]} 
                        name="Completed" 
                      />
                      <Bar 
                        dataKey="scheduled" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]} 
                        name="Scheduled" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Grid>
            </Grid>
          )}

          {/* Activity Types Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="subtitle1" className="font-bold mb-4">
                Activity Types Breakdown
              </Typography>
              <Grid container spacing={2}>
                {activityData.types.map((type, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined" className="h-full">
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Typography variant="body1" className="font-medium">
                            {type.name}
                          </Typography>
                          <Chip 
                            label={type.count} 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#eef2ff',
                              color: '#4f46e5',
                              fontWeight: 'bold'
                            }} 
                          />
                        </div>
                        <LinearProgress 
                          variant="determinate" 
                          value={(type.count / activityData.summary.total) * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            mt: 2,
                            backgroundColor: '#e0e7ff',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#4f46e5'
                            }
                          }} 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Performance Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="subtitle1" className="font-bold mb-4">
                Your Activity Performance
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card className="h-full shadow-sm rounded-xl border border-gray-100">
                    <CardContent>
                      <Typography variant="subtitle2" className="font-bold mb-4">
                        Completion Rate Trend
                      </Typography>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={activityData.performance}
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar 
                              dataKey="completed" 
                              fill="#10b981" 
                              radius={[4, 4, 0, 0]} 
                              name="Completed" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card className="h-full shadow-sm rounded-xl border border-gray-100">
                    <CardContent>
                      <Typography variant="subtitle2" className="font-bold mb-4">
                        Activity Metrics
                      </Typography>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Typography variant="body2" className="text-gray-600">
                              Avg. Activities per Day
                            </Typography>
                            <Typography variant="body2" className="font-bold">
                              {activityData.summary.total > 0 
                                ? (activityData.summary.total / 7).toFixed(1) 
                                : 0}
                            </Typography>
                          </div>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min((activityData.summary.total / 7) * 10, 100)} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: '#e0e7ff',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#4f46e5'
                              }
                            }} 
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Typography variant="body2" className="text-gray-600">
                              Completion Rate
                            </Typography>
                            <Typography variant="body2" className="font-bold">
                              {getCompletionRate().toFixed(1)}%
                            </Typography>
                          </div>
                          <LinearProgress 
                            variant="determinate" 
                            value={getCompletionRate()} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: '#e0e7ff',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#10b981'
                              }
                            }} 
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <Typography variant="body2" className="text-gray-600">
                              Overdue Rate
                            </Typography>
                            <Typography variant="body2" className="font-bold">
                              {activityData.summary.total > 0 
                                ? ((activityData.summary.overdue / activityData.summary.total) * 100).toFixed(1)
                                : 0}%
                            </Typography>
                          </div>
                          <LinearProgress 
                            variant="determinate" 
                            value={(activityData.summary.overdue / activityData.summary.total) * 100 || 0} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: '#fee2e2',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#ef4444'
                              }
                            }} 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Recent Activities Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="subtitle1" className="font-bold mb-4">
                Recent Activities
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityData.recentActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {activity.type === 'Meeting' && (
                              <FiCalendar className="mr-2 text-indigo-600" />
                            )}
                            {activity.type === 'Follow-up' && (
                              <FiPhone className="mr-2 text-blue-600" />
                            )}
                            {activity.type === 'Proposal' && (
                              <FiMail className="mr-2 text-green-600" />
                            )}
                            {activity.type === 'Negotiation' && (
                              <FiDollarSign className="mr-2 text-purple-600" />
                            )}
                            {activity.type}
                          </div>
                        </TableCell>
                        <TableCell>{activity.client}</TableCell>
                        <TableCell>
                          {getStatusBadge(activity.status)}
                        </TableCell>
                        <TableCell>
                          {formatDate(activity.dueDate)}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small">
                            <FiChevronRight className="text-gray-500" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ActivityReports;