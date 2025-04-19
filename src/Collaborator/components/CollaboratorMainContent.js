import React, { useState, useEffect } from "react";
import { 
  Box, Toolbar, Typography, Card, CardContent, Grid, 
  LinearProgress, Avatar, Stack, Divider, Chip
} from "@mui/material";
import { 
  FiHome, FiCheckSquare, FiLayers, FiFolder, FiCalendar,
  FiMessageSquare, FiAward, FiUpload, FiHelpCircle, FiSettings,
  FiUsers, FiBarChart2, FiClock, FiAlertCircle, FiStar
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AllTasks from "./AllTasks";
import ToDoTasks from "./ToDo";
import InProgressTasks from "./InProgress";
import AllProjects from "./All-Projects";
import WaitingReviewTasks from "./Waiting-Reviews";
import SubmitQueries from "./SubmitQueries";
import CompletedTasks from "./CompletedTasks";
import { gapi } from "gapi-script";
import UploadFiles from "./UploadFiles";


const CollaboratorMainContent = ({ activeSection, activeSubsection }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch all tasks assigned to current user
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", user.uid)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch projects where current user is a team member
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("teamMembers", "array-contains-any", [
            { id: user.uid },
            { id: user.uid, allocation: "100%" }, // Include other possible variations
            { id: user.uid, isNew: true }
          ])
        );
        
        // Or better yet, use a more flexible approach:
        const allProjectsSnapshot = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = allProjectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === user.uid);
          })
          .map(doc => doc.id);

        // Calculate statistics
        const completedTasks = tasksData.filter(task => task.status === "Done").length;
        const totalTasks = tasksData.length;
        const pendingReviews = tasksData.filter(task => task.status === "Review").length;
        const projectsCount = projectsData.length;

        // Get recent activities (last 3 updated tasks)
        const recentTasks = [...tasksData]
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 3)
          .map(task => ({
            id: task.id,
            title: `Task updated: ${task.title}`,
            time: formatTimeAgo(task.updatedAt),
            icon: getStatusIcon(task.status)
          }));

        setStats({
          tasksCompleted: `${completedTasks}/${totalTasks}`,
          tasksCompletedPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          projects: projectsCount,
          pendingReviews: pendingReviews
        });

        setRecentActivities(recentTasks);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        alert(error)
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done': return <FiCheckSquare className="text-green-500" />;
      case 'Review': return <FiAlertCircle className="text-amber-500" />;
      case 'In Progress': return <FiClock className="text-blue-500" />;
      default: return <FiCheckSquare className="text-gray-500" />;
    }
  };

  const performanceMetrics = [
    { title: "Productivity", value: 84, trend: "up" },
    { title: "Quality", value: 92, trend: "up" },
    { title: "Collaboration", value: 78, trend: "steady" },
    { title: "Timeliness", value: 81, trend: "up" }
  ];
  
  const renderContent = () => {
    switch(activeSection) {
      case "Dashboard":
        return (
          <Box sx={{ flexGrow: 1 }}>
            {/* Welcome Header */}
            <Card sx={{ mb: 3, backgroundColor: '#4f46e5', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Welcome back, Collaborator!
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {stats ? `You have ${stats.pendingReviews} tasks awaiting review. Keep up the good work!` : 'Loading your tasks...'}
                </Typography>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            {loading ? (
              <LinearProgress sx={{ mb: 3 }} />
            ) : stats ? (
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                        <Avatar sx={{ bgcolor: '#4f46e520', color: '#4f46e5' }}>
                          <FiCheckSquare size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Tasks Completed
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {stats.tasksCompleted}
                          </Typography>
                        </Box>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={stats.tasksCompletedPercent} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: '#4f46e520',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#4f46e5'
                          }
                        }} 
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                        <Avatar sx={{ bgcolor: '#10b98120', color: '#10b981' }}>
                          <FiLayers size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Projects
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {stats.projects}
                          </Typography>
                        </Box>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={100} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: '#10b98120',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#10b981'
                          }
                        }} 
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                        <Avatar sx={{ bgcolor: '#3b82f620', color: '#3b82f6' }}>
                          <FiCalendar size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Upcoming Meetings
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            0
                          </Typography>
                        </Box>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={100} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: '#3b82f620',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#3b82f6'
                          }
                        }} 
                      />
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                        <Avatar sx={{ bgcolor: '#f59e0b20', color: '#f59e0b' }}>
                          <FiAlertCircle size={20} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Pending Reviews
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {stats.pendingReviews}
                          </Typography>
                        </Box>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={100} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: '#f59e0b20',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: '#f59e0b'
                          }
                        }} 
                      />
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : null}

            {/* Two Column Layout */}
            <Grid container spacing={3}>
              {/* Recent Activities */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Recent Activities
                    </Typography>
                    {loading ? (
                      <LinearProgress />
                    ) : recentActivities.length > 0 ? (
                      <Stack spacing={2}>
                        {recentActivities.map((activity) => (
                          <Box key={activity.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: '#f8fafc', 
                              color: '#4f46e5',
                              width: 36, 
                              height: 36 
                            }}>
                              {activity.icon}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {activity.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No recent activities found
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Performance Metrics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Your Performance
                    </Typography>
                    <Stack spacing={3}>
                      {performanceMetrics.map((metric, index) => (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {metric.title}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {metric.value}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={metric.value} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: '#f1f5f9',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: metric.trend === 'up' ? '#10b981' : 
                                              metric.trend === 'down' ? '#ef4444' : '#f59e0b'
                              }
                            }} 
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                            <Chip 
                              label={metric.trend === 'up' ? 'Improving' : 
                                    metric.trend === 'down' ? 'Needs attention' : 'Steady'} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.65rem',
                                backgroundColor: metric.trend === 'up' ? '#ecfdf5' : 
                                              metric.trend === 'down' ? '#fee2e2' : '#fef3c7',
                                color: metric.trend === 'up' ? '#059669' : 
                                      metric.trend === 'down' ? '#dc2626' : '#d97706'
                              }} 
                            />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { title: "Submit Work", icon: <FiUpload size={20} />, color: "#8b5cf6" },
                    { title: "Request Feedback", icon: <FiHelpCircle size={20} />, color: "#ec4899" },
                    { title: "Schedule Meeting", icon: <FiCalendar size={20} />, color: "#14b8a6" },
                    { title: "View Resources", icon: <FiFolder size={20} />, color: "#f97316" }
                  ].map((action, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                      <Card 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          bgcolor: `${action.color}20`, 
                          color: action.color,
                          width: 48, 
                          height: 48,
                          mx: 'auto',
                          mb: 1
                        }}>
                          {action.icon}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {action.title}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

        case "Feedback & Queries": if (activeSubsection === "Submit Queries") {
          return <SubmitQueries/>
        }

        case "Projects":
  if (activeSubsection === "My Projects") {
    return <AllProjects />;
  }

  case "Submit Work":
    if (activeSubsection === "Upload Files") {
      return <UploadFiles />;
    }

      case "My Tasks":
        if (activeSubsection === "All Tasks") {
          return <AllTasks />;
        }
        if (activeSubsection === "To Do") {
          return <ToDoTasks />;
        }
        if (activeSubsection === "In Progress") {
          return <InProgressTasks/>
        }

        if (activeSubsection === "Waiting Review") {
          return <WaitingReviewTasks />;
        }

        if (activeSubsection === "Completed") {
          return <CompletedTasks />;
        }
        return <div>Other tasks content</div>;
      default:
        return (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
              {React.createElement(
                {
                  "Dashboard": FiHome,
                  "My Tasks": FiCheckSquare,
                  "Projects": FiLayers,
                  "Resources": FiFolder,
                  "Meetings": FiCalendar,
                  "Communication": FiMessageSquare,
                  "Performance & Learning": FiAward,
                  "Submit Work": FiUpload,
                  "Feedback & Queries": FiHelpCircle,
                  "Settings": FiSettings
                }[activeSection] || FiHome,
                { className: "text-indigo-600", size: 20 }
              )}
            </div>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {activeSubsection || activeSection}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {activeSubsection 
                ? `Detailed view for ${activeSubsection.toLowerCase()}`
                : `Select a subsection from the sidebar to view ${activeSection.toLowerCase()} details`}
            </Typography>
          </div>
        );
    }
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
      <Toolbar />
      <div className="mb-6">
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          {activeSubsection || activeSection}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {activeSection === "Dashboard" 
            ? "Overview of your tasks, projects, and performance"
            : `Manage your ${activeSection.toLowerCase()} activities`}
        </Typography>
      </div>
      {renderContent()}
    </Box>
  );
};

export default CollaboratorMainContent;