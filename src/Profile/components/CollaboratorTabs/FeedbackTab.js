import React from 'react';
import {
  Card, CardContent, Typography, Box,
  List, ListItem, Paper, Avatar, Chip, Button,
} from '@mui/material';
import { FiMessageSquare, FiUser, FiThumbsUp, FiStar } from 'react-icons/fi';

const FeedbackTab = ({ formatDate }) => {
  // Mock feedback data
  const feedbacks = [
    {
      id: 1,
      from: "Rajesh Kumar",
      role: "Project Manager",
      date: "2025-04-18",
      task: "Login Page UI",
      rating: 4,
      comment: "Great work on the UI design! The responsiveness is excellent. For the next iteration, let's focus on improving the loading states.",
      type: "task"
    },
    {
      id: 2,
      from: "Neha Gupta",
      role: "Tech Lead",
      date: "2025-04-15",
      task: "Quarterly Performance",
      rating: 5,
      comment: "Exceptional progress this quarter! Your attention to detail and willingness to learn new technologies is impressive. Keep it up!",
      type: "performance"
    },
    {
      id: 3,
      from: "Priya Sharma",
      role: "Senior Developer",
      date: "2025-04-10",
      task: "API Integration",
      rating: 3,
      comment: "Good effort on the API integration. Please pay more attention to error handling in the next task. Let's discuss best practices.",
      type: "task"
    }
  ];

  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardContent className="p-6">
        <Typography variant="h6" className="font-bold text-gray-800 mb-4">
          Feedback & Reviews
        </Typography>
        
        <List className="space-y-4">
          {feedbacks.map((feedback) => (
            <ListItem key={feedback.id} className="p-0">
              <Paper className="w-full p-4 rounded-lg hover:shadow-sm">
                <Box className="flex items-start">
                  <Avatar sx={{ bgcolor: '#EFF6FF', mr: 2 }}>
                    <FiUser color="#3B82F6" />
                  </Avatar>
                  <Box className="flex-1">
                    <Box className="flex justify-between items-start">
                      <Box>
                        <Typography variant="subtitle1" className="font-bold">
                          {feedback.from}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600">
                          {feedback.role} • {formatDate(feedback.date)}
                        </Typography>
                      </Box>
                      <Box className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            color={i < feedback.rating ? "#F59E0B" : "#E5E7EB"}
                            fill={i < feedback.rating ? "#F59E0B" : "transparent"}
                            className="ml-1"
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" className="mt-2 text-gray-700">
                      <strong>Task:</strong> {feedback.task}
                    </Typography>
                    
                    <Paper className="p-3 mt-2 bg-gray-50 rounded-lg">
                      <Typography variant="body2">
                        {feedback.comment}
                      </Typography>
                    </Paper>
                    
                    <Box className="flex justify-end mt-2">
                      <Button
                        variant="text"
                        size="small"
                        className="text-indigo-600 hover:bg-indigo-50"
                        startIcon={<FiMessageSquare size={14} />}
                      >
                        Reply
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        className="text-green-600 hover:bg-green-50"
                        startIcon={<FiThumbsUp size={14} />}
                      >
                        Acknowledge
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default FeedbackTab;