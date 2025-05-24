import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Paper,
  Box,
  Button,
  Chip
} from '@mui/material';
import {
  FiCheckCircle,
  FiRefreshCw,
  FiUser,
  FiUsers
} from 'react-icons/fi';

const ActivityFeed = ({ activities }) => {
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
                    {activity.type.includes("Completed") ? (
                      <FiCheckCircle className="text-green-500" />
                    ) : activity.type.includes("Updated") ? (
                      <FiRefreshCw className="text-blue-500" />
                    ) : activity.type.includes("Assigned") ? (
                      <FiUser className="text-purple-500" />
                    ) : (
                      <FiUsers className="text-amber-500" />
                    )}
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

export default ActivityFeed;