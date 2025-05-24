import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Chip,
  Divider,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  InputAdornment,
  TextField
} from "@mui/material";
import {
  FiAward,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiTrendingUp,
  FiStar,
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiBarChart2,
  FiChevronDown
} from "react-icons/fi";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";

const Leaderboard = () => {
  const [timeRange, setTimeRange] = useState("weekly");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);


  const updateUserRanks = async (rankedUsers, isAllTime = false) => {
    try {
      const batchUpdates = rankedUsers.map((user, index) => {
        const userRef = doc(db, "users", user.id);
        const updateData = {
          lastRankUpdate: new Date()
        };
        
        if (isAllTime) {
          updateData.allTimeRank = index + 1;
        } else {
          // For time-filtered ranks, we store them with the time range as suffix
          updateData[`${timeRange}Rank`] = index + 1;
        }
        
        return updateDoc(userRef, updateData);
      });
      
      await Promise.all(batchUpdates);
    } catch (error) {
      console.error("Error updating user ranks:", error);
    }
  };

  const calculateRanks = (data, key = "points") => {
    if (data.length === 0) return data;
    
    // Sort the data by the specified key
    const sorted = [...data].sort((a, b) => b[key] - a[key] || 
      new Date(b.lastCompleted) - new Date(a.lastCompleted));
    
    // Assign ranks with tie handling
    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i][key] < sorted[i - 1][key]) {
        currentRank = i + 1;
      }
      sorted[i].rank = currentRank;
    }
    
    return sorted;
  };

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        
        // Get all completed tasks
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("status", "==", "Done")
        );
        
        const querySnapshot = await getDocs(tasksQuery);
        const tasksData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          completedAt: doc.data().updatedAt
        }));

        // Process all-time data first
        const allTimeUserStats = processUserStats(tasksData);
        const allTimeRanked = calculateRanks(allTimeUserStats);
        setAllTimeLeaderboard(allTimeRanked);
        
        // Update all-time ranks in Firestore
        await updateUserRanks(allTimeRanked, true);

        // Process time-filtered data
        const now = new Date();
        let startDate;
        
        switch(timeRange) {
          case "daily": startDate = new Date(now.setDate(now.getDate() - 1)); break;
          case "weekly": startDate = new Date(now.setDate(now.getDate() - 7)); break;
          case "monthly": startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
          case "yearly": startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
          default: startDate = new Date(0); // All time
        }

        const filteredTasks = tasksData.filter(task => 
          new Date(task.completedAt) >= startDate
        );

        const timeFilteredUserStats = processUserStats(filteredTasks);
        const timeFilteredRanked = calculateRanks(timeFilteredUserStats);
        setLeaderboardData(timeFilteredRanked);
        
        // Update time-filtered ranks in Firestore
        await updateUserRanks(timeFilteredRanked);

      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Helper function to process user stats from tasks
    const processUserStats = (tasks) => {
      const userStats = {};
      
      tasks.forEach(task => {
        if (!task.assignee) return;
        
        const userId = task.assignee.id;
        if (!userStats[userId]) {
          userStats[userId] = {
            id: userId,
            name: task.assignee.name,
            avatar: task.assignee.avatar,
            completedTasks: 0,
            points: 0,
            lastCompleted: task.completedAt,
            tasks: []
          };
        }
        
        userStats[userId].completedTasks++;
        userStats[userId].points += calculatePoints(task.priority);
        userStats[userId].tasks.push(task);
        
        if (new Date(task.completedAt) > new Date(userStats[userId].lastCompleted)) {
          userStats[userId].lastCompleted = task.completedAt;
        }
      });
      
      return Object.values(userStats);
    };

    fetchLeaderboardData();
  }, [timeRange]);

  const calculatePoints = (priority) => {
    switch(priority) {
      case "Critical": return 5;
      case "High": return 4;
      case "Medium": return 3;
      case "Low": return 2;
      default: return 1;
    }
  };

  const filteredData = leaderboardData.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      case "yearly": return "This Year";
      default: return "All Time";
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Performance Leaderboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track team performance based on completed tasks and contributions
        </Typography>
      </Box>

      {/* Filters and Controls */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch className="text-gray-400" />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: '#f8fafc',
                  borderRadius: 1
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Select
              fullWidth
              size="small"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{
                backgroundColor: '#f8fafc',
                borderRadius: 1
              }}
              IconComponent={FiChevronDown}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={4}>
            <Tabs 
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4f46e5',
                  height: 3
                }
              }}
            >
              <Tab label="Leaderboard" icon={<FiAward size={18} />} iconPosition="start" />
              <Tab label="Statistics" icon={<FiBarChart2 size={18} />} iconPosition="start" />
              <Tab label="Activity" icon={<FiClock size={18} />} iconPosition="start" />
            </Tabs>
          </Grid>
        </Grid>
      </Card>

      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : (
        <>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Top Performers */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <FiTrendingUp size={24} className="text-indigo-600 mr-2" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Top Performers - {getTimeRangeLabel()}
                      </Typography>
                    </Box>

                    {filteredData.slice(0, 3).map((user, index) => (
                      <Box key={user.id} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              mr: 2,
                              bgcolor: '#e0e7ff',
                              color: '#4f46e5',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              border: '2px solid',
                              borderColor: 
                                index === 0 ? '#f59e0b' : 
                                index === 1 ? '#94a3b8' : 
                                index === 2 ? '#b45309' : '#e2e8f0'
                            }}
                          >
                            {user.avatar}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.completedTasks} tasks • {user.points} pts
                            </Typography>
                          </Box>
                          <Chip
                            label={`#${index + 1}`}
                            size="small"
                            sx={{
                              backgroundColor: 
                                index === 0 ? '#fef3c7' : 
                                index === 1 ? '#e2e8f0' : 
                                index === 2 ? '#fef3c7' : '#f1f5f9',
                              color: 
                                index === 0 ? '#b45309' : 
                                index === 1 ? '#64748b' : 
                                index === 2 ? '#b45309' : '#4b5563',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(user.points / (filteredData[0]?.points || 1)) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: 
                                index === 0 ? '#f59e0b' : 
                                index === 1 ? '#94a3b8' : 
                                index === 2 ? '#b45309' : '#4f46e5',
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Full Leaderboard */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <FiUsers size={24} className="text-indigo-600 mr-2" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Team Leaderboard
                      </Typography>
                    </Box>

                    <TableContainer>
                      <Table>
                        <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Completed Tasks</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Points</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredData.map((user, index) => (
                            <TableRow hover key={user.id}>
                              <TableCell>
                                <Chip
                                  label={index + 1}
                                  size="small"
                                  sx={{
                                    backgroundColor: 
                                      index === 0 ? '#fef3c7' : 
                                      index === 1 ? '#e2e8f0' : 
                                      index === 2 ? '#fef3c7' : '#f1f5f9',
                                    color: 
                                      index === 0 ? '#b45309' : 
                                      index === 1 ? '#64748b' : 
                                      index === 2 ? '#b45309' : '#4b5563',
                                    fontWeight: 'bold',
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar
                                    sx={{
                                      width: 36,
                                      height: 36,
                                      mr: 2,
                                      bgcolor: '#e0e7ff',
                                      color: '#4f46e5',
                                      fontSize: '0.875rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {user.avatar}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                      {user.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Last activity: {new Date(user.lastCompleted).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {user.completedTasks}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={user.points}
                                  size="small"
                                  sx={{
                                    backgroundColor: '#e0f2fe',
                                    color: '#0369a1',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <LinearProgress
                                  variant="determinate"
                                  value={(user.points / (filteredData[0]?.points || 1)) * 100}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: '#4f46e5',
                                      borderRadius: 3
                                    }
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Performance Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Task Completion Rate
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        {/* Placeholder for chart - would be replaced with actual chart component */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%',
                          backgroundColor: '#f8fafc',
                          borderRadius: 2
                        }}>
                          <Typography color="text.secondary">
                            Chart: Task completion rate over {timeRange}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Points Distribution
                      </Typography>
                      <Box sx={{ height: 300 }}>
                        {/* Placeholder for chart */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%',
                          backgroundColor: '#f8fafc',
                          borderRadius: 2
                        }}>
                          <Typography color="text.secondary">
                            Chart: Points distribution among team members
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Recent Activity
                </Typography>
                {filteredData.length > 0 ? (
                  <Box>
                    {filteredData.flatMap(user => 
                      user.tasks
                        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                        .slice(0, 3)
                        .map(task => ({
                          user,
                          task
                        }))
                    )
                    .sort((a, b) => new Date(b.task.completedAt) - new Date(a.task.completedAt))
                    .slice(0, 10)
                    .map((item, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              mr: 2,
                              bgcolor: '#e0e7ff',
                              color: '#4f46e5',
                              fontSize: '0.875rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {item.user.avatar}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {item.user.name} completed a task
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(item.task.completedAt).toLocaleString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={`+${calculatePoints(item.task.priority)} pts`}
                            size="small"
                            sx={{
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {item.task.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {item.task.description.substring(0, 100)}...
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={item.task.priority}
                              size="small"
                              sx={{
                                backgroundColor: 
                                  item.task.priority === 'High' ? '#fee2e2' : 
                                  item.task.priority === 'Medium' ? '#fef3c7' : '#ecfdf5',
                                color: 
                                  item.task.priority === 'High' ? '#dc2626' : 
                                  item.task.priority === 'Medium' ? '#d97706' : '#059669',
                                fontSize: '0.65rem'
                              }}
                            />
                            {item.task.labels.map((label, idx) => (
                              <Chip
                                key={idx}
                                label={label}
                                size="small"
                                sx={{
                                  backgroundColor: '#f1f5f9',
                                  color: '#64748b',
                                  fontSize: '0.65rem'
                                }}
                              />
                            ))}
                          </Box>
                        </Paper>
                        {index < 9 && <Divider sx={{ my: 2 }} />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No recent activity found
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default Leaderboard;