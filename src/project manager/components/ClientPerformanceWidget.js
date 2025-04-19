import React from "react";
import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText } from "@mui/material";
import { FiDollarSign, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const ClientPerformanceWidget = ({ projects = [], clients = [] }) => {
  // Calculate client performance metrics with proper initial values for reduce
  const clientPerformance = clients.map(client => {
    const clientProjects = projects.filter(p => p.clientId === client.id);
    const totalSpend = clientProjects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0, 0)); // Added initial value 0
    const completedProjects = clientProjects.filter(p => p.status === "Completed").length;
    const avgRating = clientProjects.length > 0 
      ? clientProjects.reduce((sum, p) => sum + (parseFloat(p.clientRating) || 0, 0)) / clientProjects.length
      : 0;
    
    return {
      ...client,
      totalSpend,
      completedProjects,
      avgRating: isNaN(avgRating) ? 0 : avgRating,
      projectCount: clientProjects.length
    };
  }).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);

  return (
    <Box>
      {clientPerformance.length > 0 ? (
        <List sx={{ width: '100%' }}>
          {clientPerformance.map((client, index) => (
            <ListItem key={client.id} sx={{ px: 0 }}>
              <ListItemAvatar>
                <Avatar 
                  alt={client.name} 
                  src={client.logo}
                  sx={{ bgcolor: '#e0e7ff', color: '#4f46e5' }}
                >
                  {client.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={client.name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      ${client.totalSpend.toLocaleString()} • {client.projectCount} projects
                    </Typography>
                    <br />
                    <Typography component="span" variant="body2" color="text.secondary">
                      {client.completedProjects} completed • Avg. rating: {client.avgRating.toFixed(1)}
                    </Typography>
                  </>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {index < 3 ? (
                  <FiTrendingUp className="text-green-500" size={20} />
                ) : (
                  <FiTrendingDown className="text-red-500" size={20} />
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No client performance data available
        </Typography>
      )}
    </Box>
  );
};

export default ClientPerformanceWidget;