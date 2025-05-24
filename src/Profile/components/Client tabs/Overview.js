import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Card, CardContent,
  Button, LinearProgress, List, ListItem, Chip
} from '@mui/material';
import {
  FiFolder, FiDollarSign, FiCheckSquare, FiTrendingUp,
  FiMail, FiUsers, FiMessageSquare, FiChevronRight
} from 'react-icons/fi';
import { auth, db } from '../../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const OverviewTab = ({ projects, communications, formatDate }) => {
  const [stats, setStats] = useState([
    { title: "Active Projects", value: 0, icon: <FiFolder size={24} />, change: "Loading...", loading: true },
    { title: "Pending Invoices", value: 0, icon: <FiDollarSign size={24} />, change: "Loading...", loading: true },
    { title: "Tasks Pending", value: 0, icon: <FiCheckSquare size={24} />, change: "Loading...", loading: true },
    { title: "Overall Progress", value: "0%", icon: <FiTrendingUp size={24} />, change: "Loading...", loading: true }
  ]);

  const [projectsWithProgress, setProjectsWithProgress] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch active projects count
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("clientId", "==", user.uid),
          where("status", "==", "In progress")
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const activeProjectsCount = projectsSnapshot.size;

        // Fetch pending invoices
        const invoicesQuery = query(
          collection(db, "invoices"),
          where("clientId", "==", user.uid),
          where("status", "==", "pending")
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const pendingInvoicesCount = invoicesSnapshot.size;
        const totalPendingAmount = invoicesSnapshot.docs.reduce((sum, doc) => {
          const invoice = doc.data();
          return sum + (invoice.amount || 0);
        }, 0);

        // Fetch pending tasks
        const tasksQuery = query(
          collection(db, "client-tasks"),
          where("assignee.id", "==", user.uid),
          where("status", "==", "pending")
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const pendingTasksCount = tasksSnapshot.size;

        // Calculate project progress for each project
        const projectsWithProgressData = [];
        
        for (const projectDoc of projectsSnapshot.docs) {
          const project = projectDoc.data();
          
          // Fetch all tasks for this project
          const projectTasksQuery = query(
            collection(db, "project-tasks"),
            where("projectId", "==", projectDoc.id)
          );
          const projectTasksSnapshot = await getDocs(projectTasksQuery);
          
          // Calculate completed tasks
          let completedTasks = 0;
          let totalTasks = projectTasksSnapshot.size;
          
          projectTasksSnapshot.forEach(taskDoc => {
            if (taskDoc.data().status === "Done" || taskDoc.data().status === "Completed") {
              completedTasks++;
            }
          });
          
          // Calculate progress percentage
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          projectsWithProgressData.push({
            id: projectDoc.id,
            ...project,
            progress
          });
        }

        // Calculate overall progress (average of all projects)
        const overallProgress = projectsWithProgressData.length > 0 
          ? `${Math.round(projectsWithProgressData.reduce((sum, project) => sum + project.progress, 0)) / projectsWithProgressData.length}%`
          : "0%";

        setProjectsWithProgress(projectsWithProgressData);
        
        setStats([
          { 
            title: "Active Projects", 
            value: activeProjectsCount, 
            icon: <FiFolder size={24} />, 
            change: "+0 this month",
            loading: false
          },
          { 
            title: "Pending Invoices", 
            value: `₹${totalPendingAmount.toLocaleString()}`, 
            icon: <FiDollarSign size={24} />, 
            change: `${pendingInvoicesCount} invoices`,
            loading: false
          },
          { 
            title: "Tasks Pending", 
            value: pendingTasksCount, 
            icon: <FiCheckSquare size={24} />, 
            change: "Due soon: 0",
            loading: false
          },
          { 
            title: "Overall Progress", 
            value: overallProgress, 
            icon: <FiTrendingUp size={24} />, 
            change: "0% increase",
            loading: false
          }
        ]);

      } catch (error) {
        console.error("Error fetching data:", error);
        // Update stats with error state
        setStats(prevStats => prevStats.map(stat => ({
          ...stat,
          value: "Error",
          change: "Failed to load",
          loading: false
        })));
      }
    };

    fetchData();
  }, []);

  return (
    <Box>
      {/* Key Metrics */}
      <Grid container spacing={3} className="mb-6">
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ 
              p: 3, 
              borderRadius: 2, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              height: '100%'
            }}>
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" className="font-bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', mt: 1 }}>
                    {stat.icon && React.cloneElement(stat.icon, { className: "mr-1", size: 16 })}
                    {stat.change}
                  </Typography>
                </div>
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  {stat.icon}
                </div>
              </div>
              {stat.loading && <LinearProgress sx={{ mt: 2 }} />}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Projects */}
      <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
        <CardContent className="p-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-bold text-gray-800">
              Recent Projects
            </Typography>
            <Button
              variant="text"
              size="small"
              className="text-indigo-600 hover:bg-indigo-50"
            >
              View All
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {projectsWithProgress.slice(0, 3).map((project) => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Paper className="p-4 rounded-lg hover:shadow-md transition-shadow h-full">
                  <Box className="flex justify-between items-start mb-3">
                    <Typography variant="subtitle1" className="font-bold">
                      {project.title}
                    </Typography>
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        backgroundColor: project.status === "In Progress" ? '#e0f2fe' : 
                                        project.status === "On Hold" ? '#fef3c7' : '#dcfce7',
                        color: project.status === "In Progress" ? '#0369a1' : 
                               project.status === "On Hold" ? '#92400e' : '#166534'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" className="text-gray-600 mb-3">
                    {project.description?.substring(0, 100)}...
                  </Typography>
                  <Box className="mb-3">
                    <Typography variant="caption" className="text-gray-500">
                      Project Manager
                    </Typography>
                    <Typography variant="body2">
                      {project.projectManager || "Not assigned"}
                    </Typography>
                  </Box>
                  <Box className="mb-3">
                    <Typography variant="caption" className="text-gray-500">
                      Timeline
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </Typography>
                  </Box>
                  <Box className="flex items-center justify-between">
                    <Box className="w-full mr-2">
                      <LinearProgress
                        variant="determinate"
                        value={project.progress || 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: '#4f46e5'
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption">
                      {project.progress || 0}%
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    className="mt-3 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    endIcon={<FiChevronRight />}
                  >
                    View Details
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-bold text-gray-800 mb-4">
            Recent Activity
          </Typography>
          
          <List className="space-y-3">
            {communications.slice(0, 4).map((activity) => (
              <ListItem key={activity.id} className="p-0">
                <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                  <Box className="flex items-start">
                    <Box className="mr-3 mt-1">
                      {activity.type === "Email" ? (
                        <FiMail className="text-blue-500" />
                      ) : activity.type === "Meeting" ? (
                        <FiUsers className="text-purple-500" />
                      ) : (
                        <FiMessageSquare className="text-green-500" />
                      )}
                    </Box>
                    <Box className="flex-1">
                      <Typography variant="subtitle2" className="font-medium">
                        {activity.subject}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {activity.summary}
                      </Typography>
                      <Typography variant="caption" className="text-gray-500 mt-1">
                        {formatDate(activity.date)}
                      </Typography>
                    </Box>
                    <Button
                      variant="text"
                      size="small"
                      className="text-indigo-600 hover:bg-indigo-50"
                    >
                      View
                    </Button>
                  </Box>
                </Paper>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OverviewTab;