import React, { useState, useEffect } from "react";
import { Box, Typography, Avatar, LinearProgress } from "@mui/material";
import { FiCheckCircle, FiAlertCircle, FiMessageSquare, FiUserPlus } from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where,  } from "firebase/firestore";

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);
        
        // First get all projects where current user is project manager
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectIds = projectsSnapshot.docs.map(doc => doc.id);

        if (projectIds.length === 0) {
          setActivities([]);
          setLoading(false);
          return;
        }

        // Then get activities for these projects
        const activitiesQuery = query(
          collection(db, "project-activities"),
          where("projectId", "in", projectIds),
          where("actionType", "==", "team_member_added")
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        
        const activitiesData = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by timestamp descending (newest first)
        activitiesData.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
        
        // Format for display
        const formattedActivities = activitiesData.map(activity => ({
          id: activity.id,
          user: activity.userFullName,
          action: activity.message,
          time: formatTime(activity.timestamp.toDate()),
          type: "team_add",
          avatar: getInitials(activity.userFullName),
          projectName: activity.projectName
        }));

        setActivities(formattedActivities.slice(0, 4)); // Show only 4 most recent
        setLoading(false);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

 

  const getInitials = (name) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getIcon = (type) => {
    switch(type) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'issue': return <FiAlertCircle className="text-amber-500" />;
      case 'comment': return <FiMessageSquare className="text-blue-500" />;
      case 'team_add': return <FiUserPlus className="text-indigo-500" />;
      default: return <FiCheckCircle className="text-green-500" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (activities.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          No recent team member additions
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
          <Avatar sx={{ 
            width: 32, 
            height: 32, 
            fontSize: '0.75rem', 
            mr: 2,
            bgcolor: '#e0e7ff',
            color: '#4f46e5'
          }}>
            {activity.avatar}
          </Avatar>
          <div className="flex-1">
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              <span className="font-semibold">{activity.user}</span> {activity.action}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              {activity.projectName}
            </Typography>
            <div className="flex items-center mt-1">
              {getIcon(activity.type)}
              <Typography variant="caption" sx={{ color: '#64748b', ml: 1 }}>
                {activity.time}
              </Typography>
            </div>
          </div>
        </div>
      ))}
    </Box>
  );
};

export default RecentActivity;