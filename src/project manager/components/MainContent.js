import React, { useState, useEffect } from "react";
import { 
  Box, Toolbar, Typography, Grid, Paper, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Avatar, Chip, Button,
  TextField, InputAdornment, MenuItem, Select,
  Pagination, Stack, LinearProgress, Badge,
  IconButton
} from "@mui/material";
import { 
  FiLayers, FiUsers, FiCalendar, FiTrendingUp, 
  FiCheckCircle, FiAlertTriangle, FiClock,
  FiSearch, FiFilter, FiDownload, FiPlus,
  FiEye, FiEdit2, FiTrash2, FiChevronDown
} from "react-icons/fi";
import { 
  FaRegDotCircle, 
  FaCircle,
  FaRegClock,
  FaCheckCircle
} from "react-icons/fa";
import ProjectStatusChart from "./ProjectStatusChart";
import TeamPerformanceWidget from "./TeamPerformanceWidget";
import RecentActivity from "./RecentActivity";
import UpcomingMilestones from "./UpcomingMilestones";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AllProjects from "./AllProjects";
import TaskBoard from "./TaskBoard";
import SubmissionsDashboard from "./Submissions";
import ClientProjects from "./ClientProjects";
import TimelineView from "./Timeline";
import MeetingsView from "./Meetings";
import MilestoneView from "./Milestones";
import ProjectHealth from "./ProjectHealth";
import TeamPerformance from "./TeamPerformance";
import TaskAssignment from "./TaskAssignment";
import FeedbackApprovalsDashboard from "./Feedbackk";
import TestimonialsDashboard from "./Testimonials";
import DeadlinesView from "./Deadlines";

const MainContent = ({ activeSection, activeSubSection }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState([
    { title: "Active Projects", value: 0, icon: <FiLayers size={24} />, trend: "stable" },
    { title: "Team Members", value: 0, icon: <FiUsers size={24} />, trend: "stable" },
    { title: "Upcoming Deadlines", value: 0, icon: <FiCalendar size={24} />, trend: "stable" },
    { title: "Tasks Completed", value: "0%", icon: <FiCheckCircle size={24} />, trend: "stable" }
  ]);
  const rowsPerPage = 8;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const querySnapshot = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(project => project.projectManagerId === user.uid);
          
        setProjects(projectsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    if (activeSubSection === "All Projects") {
      fetchProjects();
    }
  }, [activeSubSection]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        
        // Fetch projects where current user is project manager
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch tasks for all projects
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("projectId", "in", projectsData.map(p => p.id))
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch team members (users)
        const usersQuery = query(collection(db, "users"));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate stats
        const activeProjects = projectsData.length;

        const teamMembersCount = usersData.filter(
          user => user.role === "Collaborator" || 
                 user.role === "Intern" || 
                 user.role === "Freelancer"
        ).length;

        const totalTasks = tasksData.length;
        const completedTasks = tasksData.filter(
          task => task.status === "Done"
        ).length;
        const completionRate = totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100) 
          : 0;

        // Get upcoming deadlines (tasks due in next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const upcomingDeadlines = tasksData.filter(task => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);
          return dueDate > today && dueDate <= nextWeek && task.status !== "Done";
        }).length;

        setStats([
          { 
            title: "Active Projects", 
            value: activeProjects, 
            icon: <FiLayers size={24} />,
            trend: activeProjects > 0 ? "up" : "stable",
            change: activeProjects > 0 ? `${activeProjects} active` : "No active projects"
          },
          { 
            title: "Team Members", 
            value: teamMembersCount, 
            icon: <FiUsers size={24} />,
            trend: "stable",
            change: `${teamMembersCount} members`
          },
          { 
            title: "Upcoming Deadlines", 
            value: upcomingDeadlines, 
            icon: <FiCalendar size={24} />,
            trend: upcomingDeadlines > 3 ? "warning" : "stable",
            change: upcomingDeadlines > 0 ? `${upcomingDeadlines} due soon` : "No upcoming deadlines"
          },
          { 
            title: "Tasks Completed", 
            value: `${completionRate}%`, 
            icon: <FiCheckCircle size={24} />,
            trend: completionRate > 80 ? "up" : completionRate < 50 ? "warning" : "stable",
            change: `${completedTasks} of ${totalTasks} tasks`
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    if (activeSection === "Dashboard") {
      fetchDashboardData();
    }
  }, [activeSection]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         project.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesType = typeFilter === "all" || project.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedProjects = filteredProjects.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b', mb: 1 }}>
          Project Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Overview of all active projects, team performance, and upcoming milestones
        </Typography>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {loading && (
                <LinearProgress sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0
                }} />
              )}
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stat.value}
                  </Typography>
                </div>
                <div className={`p-2 rounded-lg ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-600' : 
                  stat.trend === 'warning' ? 'bg-amber-100 text-amber-600' : 
                  'bg-blue-100 text-blue-600'
                }`}>
                  {stat.icon}
                </div>
              </div>
              {stat.change && (
                <div className={`mt-2 flex items-center text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'warning' ? 'text-amber-600' : 'text-blue-600'
                }`}>
                  {stat.trend === 'up' ? <FiTrendingUp className="mr-1" /> : 
                   stat.trend === 'warning' ? <FiAlertTriangle className="mr-1" /> : 
                   <FiClock className="mr-1" />}
                  <span>{stat.change}</span>
                </div>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts and Widgets */}
      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Project Status Overview
            </Typography>
            <ProjectStatusChart projects={projects} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Team Performance
            </Typography>
            <TeamPerformanceWidget />
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Recent Activity
            </Typography>
            <RecentActivity />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Upcoming Milestones
            </Typography>
            <UpcomingMilestones projects={projects} />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
      <Toolbar />
      
      {activeSection === "Dashboard" ? (
        renderDashboard()
      ) : activeSubSection === "All Projects" ? (
        <AllProjects projects={projects} loading={loading} />
      ) : activeSubSection ===  "Task Board" ? (
        <TaskBoard />
      ) : activeSubSection ===  "Submissions" ? (
        <SubmissionsDashboard />
      ) : activeSubSection ===  "Client Projects" ? (
        <ClientProjects/>
      ) : activeSubSection ===  "Timeline View" ? (
        <TimelineView/>
      ) : activeSubSection ===  "Meetings" ? (
        <MeetingsView/>
      ) :   activeSubSection ===  "Milestones" ? (
        <MilestoneView/>
      ) :  activeSubSection === "Task Assignment" ? (
        <TaskAssignment />
      ) :  activeSubSection === "Team Performance" ? (
        <TeamPerformance/>
      ) :  activeSubSection === "Feedback/Approvals" ? (
        <FeedbackApprovalsDashboard/>
      ) : activeSubSection === "Testimonials" ? (
        <TestimonialsDashboard />
      ) :  activeSubSection === "Deadlines" ? (
        <DeadlinesView />
      ) : (
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            {activeSubSection}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b' }}>
            Detailed view for {activeSubSection.toLowerCase()} will be displayed here.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MainContent;