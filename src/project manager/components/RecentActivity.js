import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { FiCheckCircle, FiAlertCircle, FiMessageSquare } from "react-icons/fi";

const RecentActivity = () => {
  const activities = [
    { 
      id: 1,
      user: "Alex Johnson", 
      action: "completed the homepage design", 
      time: "2 hours ago",
      type: "completed",
      avatar: "AJ"
    },
    { 
      id: 2,
      user: "Sarah Miller", 
      action: "reported an issue with the campaign", 
      time: "4 hours ago",
      type: "issue",
      avatar: "SM"
    },
    { 
      id: 3,
      user: "David Wilson", 
      action: "commented on the project brief", 
      time: "1 day ago",
      type: "comment",
      avatar: "DW"
    },
    { 
      id: 4,
      user: "Emily Davis", 
      action: "submitted content for review", 
      time: "1 day ago",
      type: "submission",
      avatar: "ED"
    },
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'completed': return <FiCheckCircle className="text-green-500" />;
      case 'issue': return <FiAlertCircle className="text-amber-500" />;
      case 'comment': return <FiMessageSquare className="text-blue-500" />;
      default: return <FiCheckCircle className="text-green-500" />;
    }
  };

  return (
    <Box>
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', mr: 2 }}>
            {activity.avatar}
          </Avatar>
          <div className="flex-1">
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              <span className="font-semibold">{activity.user}</span> {activity.action}
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