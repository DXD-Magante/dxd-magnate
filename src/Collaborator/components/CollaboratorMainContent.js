import React, { useState, useEffect } from "react";
import { 
  Box, Toolbar, Typography, Card, CardContent, Grid, 
  LinearProgress, Avatar, Stack, Divider, Chip,
  CircularProgress, Paper
} from "@mui/material";
import { 
  FiHome, FiCheckSquare, FiLayers, FiFolder, FiCalendar,
  FiMessageSquare, FiAward, FiUpload, FiHelpCircle, FiSettings,
  FiUsers, FiBarChart2, FiClock, FiAlertCircle, FiStar,
  FiTrendingUp,
  FiList
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where, doc, getDoc,  } from "firebase/firestore";
import AllTasks from "./AllTasks";
import ToDoTasks from "./ToDo";
import InProgressTasks from "./InProgress";
import AllProjects from "./All-Projects";
import WaitingReviewTasks from "./Waiting-Reviews";
import SubmitQueries from "./SubmitQueries";
import CompletedTasks from "./CompletedTasks";
import UploadFiles from "./UploadFiles";
import TeamCollaboration from "./TeamCollaboaratord";
import UpcomingMeetings from "./Upcoming";
import Leaderboard from "./Leaderboard";
import CollaboratorProfileSettings from "./ProfileSettings";
import MyCourses from "./myCourses";
import CollaborationTasks from "./collaborationTasks";
import ProgressTracking from "./ProgressTracking";
import SubmitWorkModal from "./SubmitWorkModal";
import Resources from "./Resources";
import Analytics from "./Analytics";
import RequestFeedbackModal from "./RequestFeedbackModal";

const CollaboratorMainContent = ({ activeSection, activeSubsection, setActiveSection, setActiveSubsection }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [submitWorkModalOpen, setSubmitWorkModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          // Wait for auth to be ready
          const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
              await fetchData(user);
              unsubscribe();
            }
          });
          return;
        }
        
        await fetchData(user);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    const fetchData = async (user) => {
      try {
        // Fetch user department
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userDepartment = userDoc.data()?.department || '';
        
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
    
        // If user is in marketing department, fetch collaboration tasks
        let collaborationTasksData = [];
        if (userDepartment === "Marketing") {
          const collabTasksQuery = query(
            collection(db, "marketing-collaboration-tasks"),
            where("assignee.id", "==", user.uid)
          );
          const collabTasksSnapshot = await getDocs(collabTasksQuery);
          collaborationTasksData = collabTasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isCollaborationTask: true
          }));
        }
    
        const allTasks = [...tasksData, ...collaborationTasksData];
        
        // Fetch projects where current user is a team member
        const allProjectsSnapshot = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = allProjectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === user.uid);
          })
          .map(doc => doc.id);
    
        // Calculate statistics
        const completedTasks = allTasks.filter(task => task.status === "Done").length;
        const totalTasks = allTasks.length;
        const pendingReviews = allTasks.filter(task => task.status === "Review").length;
        const projectsCount = projectsData.length;
    
        // Calculate performance metrics
        const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Calculate quality based on task ratings (from submissions)
        const submissionsQuery = query(
          collection(db, "project-submissions"),
          where("userId", "==", user.uid)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        const ratedSubmissions = submissionsSnapshot.docs
          .map(doc => doc.data())
          .filter(sub => sub.rating);
        
        let totalRating = 0;
        let quality = 0;
        if (ratedSubmissions.length > 0) {
          totalRating = ratedSubmissions.reduce((sum, sub) => sum + sub.rating, 0);
          quality = Math.round((totalRating / (ratedSubmissions.length * 5)) * 100);
        }
        
        // If marketing, include collaboration submissions
        if (userDepartment === "Marketing") {
          const collabSubmissionsQuery = query(
            collection(db, "marketing-collaboration-submissions"),
            where("userId", "==", user.uid)
          );
          const collabSubmissionsSnapshot = await getDocs(collabSubmissionsQuery);
          const collabRatedSubmissions = collabSubmissionsSnapshot.docs
            .map(doc => doc.data())
            .filter(sub => sub.rating);
          
          if (collabRatedSubmissions.length > 0) {
            const totalCollabRating = collabRatedSubmissions.reduce((sum, sub) => sum + sub.rating, 0);
            const combinedLength = ratedSubmissions.length + collabRatedSubmissions.length;
            const combinedRating = totalRating + totalCollabRating;
            quality = Math.round((combinedRating / (combinedLength * 5)) * 100);
          }
        }
        
        // Calculate timeliness (on-time tasks)
        const onTimeTasks = allTasks.filter(task => {
          if (task.status !== "Done" || !task.dueDate) return false;
          const completionDate = task.updatedAt || task.createdAt;
          return new Date(completionDate) <= new Date(task.dueDate);
        }).length;
        
        const timeliness = completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 0;
    
        // Get recent activities
        const recentTasks = [...allTasks]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 3)
          .map(task => ({
            id: task.id,
            title: `Task updated: ${task.title}`,
            time: formatTimeAgo(task.updatedAt || task.createdAt),
            icon: getStatusIcon(task.status)
          }));
    
        setStats({
          tasksCompleted: `${completedTasks}/${totalTasks}`,
          tasksCompletedPercent: productivity, // Same as productivity
          projects: projectsCount,
          pendingReviews: pendingReviews,
          performanceMetrics: {
            productivity,
            quality,
            timeliness
          }
        });
    
        setRecentActivities(recentTasks);
      } catch (error) {
        console.error("Error in fetchData:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeSection]);

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
              {stats?.performanceMetrics ? (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Your Performance
                      </Typography>
                      <Stack spacing={3}>
                        {/* Productivity */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FiTrendingUp size={18} color="#4f46e5" />
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                Productivity
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {stats.performanceMetrics.productivity}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.performanceMetrics.productivity} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: '#e0e7ff',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#4f46e5'
                              }
                            }} 
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                            <Chip 
                              label={`${stats.tasksCompleted} tasks completed`} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.65rem',
                                backgroundColor: '#eef2ff',
                                color: '#4f46e5'
                              }} 
                            />
                          </Box>
                        </Box>
                        
                        {/* Quality */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FiStar size={18} color="#f59e0b" />
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                Quality
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {stats.performanceMetrics.quality}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.performanceMetrics.quality} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: '#fef3c7',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#f59e0b'
                              }
                            }} 
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                            <Chip 
                              label={stats.performanceMetrics.quality >= 80 ? 'Excellent' : 
                                    stats.performanceMetrics.quality >= 60 ? 'Good' : 'Needs improvement'} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.65rem',
                                backgroundColor: stats.performanceMetrics.quality >= 80 ? '#ecfdf5' : 
                                              stats.performanceMetrics.quality >= 60 ? '#fef3c7' : '#fee2e2',
                                color: stats.performanceMetrics.quality >= 80 ? '#059669' : 
                                      stats.performanceMetrics.quality >= 60 ? '#d97706' : '#dc2626'
                              }} 
                            />
                          </Box>
                        </Box>
                        
                        {/* Timeliness */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FiClock size={18} color="#10b981" />
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                Timeliness
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {stats.performanceMetrics.timeliness}%
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={stats.performanceMetrics.timeliness} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: '#d1fae5',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#10b981'
                              }
                            }} 
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                            <Chip 
                              label={stats.performanceMetrics.timeliness >= 90 ? 'Always on time' : 
                                    stats.performanceMetrics.timeliness >= 70 ? 'Mostly on time' : 'Needs attention'} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.65rem',
                                backgroundColor: stats.performanceMetrics.timeliness >= 90 ? '#ecfdf5' : 
                                              stats.performanceMetrics.timeliness >= 70 ? '#f0fdf4' : '#fee2e2',
                                color: stats.performanceMetrics.timeliness >= 90 ? '#059669' : 
                                      stats.performanceMetrics.timeliness >= 70 ? '#16a34a' : '#dc2626'
                              }} 
                            />
                          </Box>
                        </Box>
                      </Stack>
                      
                      {/* Performance Summary */}
                      <Paper sx={{ 
                        mt: 3, 
                        p: 2, 
                        backgroundColor: '#f8fafc',
                        borderRadius: 2,
                        borderLeft: '4px solid #6366f1'
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Performance Summary
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {stats.performanceMetrics.productivity >= 80 && 
                           stats.performanceMetrics.quality >= 80 && 
                           stats.performanceMetrics.timeliness >= 90 ? (
                            "Excellent performance! You're exceeding expectations in all areas."
                          ) : stats.performanceMetrics.productivity >= 70 && 
                              stats.performanceMetrics.quality >= 70 && 
                              stats.performanceMetrics.timeliness >= 80 ? (
                            "Good performance! You're meeting expectations across the board."
                          ) : (
                            "Keep improving! Focus on areas where your metrics are lower."
                          )}
                        </Typography>
                      </Paper>
                    </CardContent>
                  </Card>
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Quick Actions */}
<Card sx={{ mt: 3 }}>
  <CardContent>
    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
      Quick Actions
    </Typography>
    <Grid container spacing={2}>
      {[
        { title: "Submit Work", icon: <FiUpload size={20} />, color: "#8b5cf6", onClick: () => setSubmitWorkModalOpen(true) },
        { title: "Request Feedback", icon: <FiHelpCircle size={20} />, color: "#ec4899", onClick: () => setFeedbackModalOpen(true) }, 
        { title: "Manage Tasks", icon: <FiList size={20} />, color: "#14b8a6", onClick: () => {
          setActiveSection("My Tasks");
          setActiveSubsection("All Tasks");
        }},
        { title: "View Resources", icon: <FiFolder size={20} />, color: "#f97316", onClick: () => {
          setActiveSection("Projects");
          setActiveSubsection("Resources");
        }}
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
            onClick={action.onClick} // Add this line to attach the onClick handler
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

      case "Feedback & Queries": 
        if (activeSubsection === "Submit Queries") {
          return <SubmitQueries/>;
        }
        break;

      case "Projects":
        if (activeSubsection === "My Projects") {
          return <AllProjects />;
        }

        if (activeSubsection === "Team Collaboration") {
          return <TeamCollaboration />;
        }

        if (activeSubsection === "Analytics") {
          return <Analytics />;
        }

        if (activeSubsection === "Resources") {
          return <Resources />;
        }
        break;

      case "Submit Work":
        if (activeSubsection === "Upload Files") {
          return <UploadFiles />;
        }
        break;

      case "Meetings":
        if (activeSubsection === "Upcoming") {
          return <UpcomingMeetings/>;
        }
        break;

      case "Performance & Learning":
        if (activeSubsection === "Leaderboard") {
          return <Leaderboard/>;
        }
        if (activeSubsection === "My Courses") {
          return <MyCourses/>;
        }
        break;

      case "Settings":
        if (activeSubsection === "Profile") {
          return <CollaboratorProfileSettings/>;
        }
        break;
      
      case "My Tasks":
        if (activeSubsection === "All Tasks") {
          return <AllTasks />;
        }
        if (activeSubsection === "Progress Tracking") {
          return <ProgressTracking />;
        }
        if (activeSubsection === "Collaboration Tasks") {
          return <CollaborationTasks/>;
        }
        break;

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
      {renderContent()}
      <SubmitWorkModal 
        open={submitWorkModalOpen} 
        onClose={() => setSubmitWorkModalOpen(false)} 
      />
      <RequestFeedbackModal 
        open={feedbackModalOpen} 
        onClose={() => setFeedbackModalOpen(false)} 
      />

    </Box>
  );
};

export default CollaboratorMainContent;