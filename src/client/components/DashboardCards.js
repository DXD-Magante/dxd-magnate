import React, { useState, useEffect } from "react";
import { 
  Typography, Avatar, Card, CardContent, Box, LinearProgress
} from "@mui/material";
import { 
  FiTrendingUp, FiCheckCircle, FiClock, FiDollarSign,
} from "react-icons/fi";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { FaRupeeSign } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";

const ClientDashboardCards = () => {
  const [activeProjectsCount, setActiveProjectsCount] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState({
    projects: true,
    balance: true,
    tasks: true,
    activities: true
  });

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData(user.uid);
      } else {
        // Handle case when user is not logged in
        setLoading({
          projects: false,
          balance: false,
          tasks: false,
          activities: false
        });
      }
    });

    return () => unsubscribe(); // Clean up listener on unmount
  }, []);

  const fetchData = async (userId) => {
    try {
      setLoading({
        projects: true,
        balance: true,
        tasks: true,
        activities: true
      });

      // Get projects where current user is the client
      const projectsQuery = query(
        collection(db, "dxd-magnate-projects"),
        where("clientId", "==", userId),
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      setActiveProjectsCount(projectsSnapshot.size);
      
      // Calculate outstanding balance
      let totalBalance = 0;
      let paymentDueDate = "";
      
      projectsSnapshot.forEach(doc => {
        const project = doc.data();
        if (project.paymentStatus === "not_paid" && project.budget) {
          const budgetAmount = parseFloat(project.budget) || 0;
          const paidAmount = parseFloat(project.paidAmount) || 0;
          totalBalance += (budgetAmount - paidAmount);
          
          // Calculate due date (10 days from creation)
          if (project.createdAt) {
            const createdDate = new Date(project.createdAt);
            const dueDate = new Date(createdDate);
            dueDate.setDate(dueDate.getDate() + 10);
            paymentDueDate = dueDate.toLocaleDateString();
          }
        }
      });
      
      setOutstandingBalance(totalBalance);
      setDueDate(paymentDueDate);
      setLoading(prev => ({ ...prev, projects: false, balance: false }));

      // Fetch tasks data
      const tasksQuery = query(
        collection(db, "client-tasks"),
        where("assignee.id", "==", userId)
      );
      
      const tasksSnapshot = await getDocs(tasksQuery);
      let completed = 0;
      let pending = 0;
      
      tasksSnapshot.forEach(doc => {
        const task = doc.data();
        if (task.status === "completed") {
          completed++;
        } else if (task.status === "pending") {
          pending++;
        }
      });
      
      setCompletedTasksCount(completed);
      setPendingTasksCount(pending);
      setLoading(prev => ({ ...prev, tasks: false }));

      // Fetch recent activities for client's projects
      const activitiesQuery = query(
        collection(db, "project-activities"),
        where("projectId", "in", projectsSnapshot.docs.map(doc => doc.id)),
        orderBy("timestamp", "desc"),
        limit(3)
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);
      const activitiesData = activitiesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.message || "Activity update",
          time: formatActivityTime(data.timestamp?.toDate()),
          user: data.userFullName || "System"
        };
      });

      setRecentActivities(activitiesData);
      setLoading(prev => ({ ...prev, activities: false }));

    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading({
        projects: false,
        balance: false,
        tasks: false,
        activities: false
      });
    }
  };

  // Helper function to format activity timestamp
  const formatActivityTime = (date) => {
    if (!date) return "Just now";
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = [
    {
      title: "Active Projects",
      value: loading.projects ? "..." : activeProjectsCount.toString(),
      change: loading.projects ? "Loading..." : "+2 this month",
      icon: <FiTrendingUp size={20} />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "Tasks Completed",
      value: loading.tasks ? "..." : completedTasksCount.toString(),
      change: loading.tasks ? "Loading..." : `${Math.round((completedTasksCount / (completedTasksCount + pendingTasksCount || 1)) * 100 || 0)}% of total`,
      icon: <FiCheckCircle size={20} />,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Pending Tasks",
      value: loading.tasks ? "..." : pendingTasksCount.toString(),
      change: loading.tasks ? "Loading..." : "Due soon: 2",
      icon: <FiClock size={20} />,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      title: "Outstanding Balance",
      value: loading.balance ? "..." : `₹${outstandingBalance.toLocaleString()}`,
      change: loading.balance ? "Loading..." : dueDate ? `Due by ${dueDate}` : "No pending payments",
      icon: <FaRupeeSign size={20} />,
      color: "text-rose-600",
      bgColor: "bg-rose-50"
    }
  ];

  // Helper function for avatar colors
  const stringToColor = (string) => {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      '#4f46e5', // indigo
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <div className="flex justify-between items-start">
                <div>
                  <Typography variant="subtitle2" color="text.secondary">
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" className={`${stat.color} flex items-center mt-1`}>
                    {stat.icon && React.cloneElement(stat.icon, { className: "mr-1" })}
                    {stat.change}
                  </Typography>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  {React.cloneElement(stat.icon, { className: stat.color })}
                </div>
              </div>
              {(loading.projects && index === 0) || 
               (loading.tasks && (index === 1 || index === 2)) || 
               (loading.balance && index === 3) ? (
                <LinearProgress sx={{ mt: 2 }} />
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Recent Activity
          </Typography>
          <div className="space-y-4">
            {loading.activities ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <LinearProgress sx={{ width: '100%' }} />
              </Box>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <Avatar sx={{ 
                    width: 40, 
                    height: 40, 
                    fontSize: '0.875rem', 
                    mr: 2,
                    bgcolor: stringToColor(activity.user)
                  }}>
                    {activity.user.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {activity.title}
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                      <span className="text-gray-400">•</span>
                      <Typography variant="caption" color="text.secondary">
                        {activity.user}
                      </Typography>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No recent activities found
              </Typography>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboardCards;