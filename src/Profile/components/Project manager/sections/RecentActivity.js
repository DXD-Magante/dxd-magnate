import React from 'react';
import { 
  Card, CardContent, List, ListItem, Paper, 
  Typography, Button, Chip, Box 
} from '@mui/material';
import { 
  FiCheckCircle, FiRefreshCw, FiUser, FiUsers 
} from 'react-icons/fi';

const RecentActivity = ({ activities }) => {
  const getActivityIcon = (type) => {
    if (type.includes("Completed")) return <FiCheckCircle className="text-green-500" />;
    if (type.includes("Updated")) return <FiRefreshCw className="text-blue-500" />;
    if (type.includes("Assigned")) return <FiUser className="text-purple-500" />;
    return <FiUsers className="text-amber-500" />;
  };

  return (
    <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
      <CardContent className="p-6">
        <Typography variant="h6" className="font-bold text-gray-800 mb-4">
          Recent Activity
        </Typography>
        
        <List className="space-y-4">
          {activities.map((activity) => (
            <ListItem key={activity.id} className="p-0">
              <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                <Box className="flex items-start">
                  <Box className="mr-3 mt-1">
                    {getActivityIcon(activity.type)}
                  </Box>
                  <Box>
                    <Typography variant="body2" className="font-medium">
                      {activity.type}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      {activity.description}
                    </Typography>
                    <Box className="flex items-center mt-1">
                      <Typography variant="caption" className="text-gray-500 mr-2">
                        {activity.date}
                      </Typography>
                      <Chip
                        label={activity.project}
                        size="small"
                        className="bg-gray-100 text-gray-700"
                      />
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </ListItem>
          ))}
        </List>
        
        <Button
          fullWidth
          variant="text"
          className="mt-3 text-indigo-600 hover:bg-indigo-50"
        >
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;