import React from 'react';
import {
  Card, CardContent, Typography, Box, Button,
  List, ListItem, ListItemAvatar, ListItemText,
  Avatar, Chip, LinearProgress, Grid, Paper,
} from '@mui/material';
import { FiBook, FiAward, FiCheck, FiClock } from 'react-icons/fi';

const LearningTab = ({ formatDate }) => {
  // Mock data
  const learningResources = [
    {
      id: 1,
      title: "React Fundamentals",
      type: "Course",
      progress: 85,
      lastAccessed: "2025-04-18",
      status: "in_progress",
      badge: "React Basics"
    },
    {
      id: 2,
      title: "Advanced JavaScript Patterns",
      type: "Course",
      progress: 45,
      lastAccessed: "2025-04-15",
      status: "in_progress"
    },
    {
      id: 3,
      title: "UI/UX Design Principles",
      type: "Course",
      progress: 100,
      lastAccessed: "2025-04-10",
      status: "completed",
      badge: "Design Foundations"
    },
    {
      id: 4,
      title: "Firebase Integration Guide",
      type: "Tutorial",
      progress: 30,
      lastAccessed: "2025-04-05",
      status: "in_progress"
    }
  ];

  const badges = [
    {
      id: 1,
      title: "React Basics",
      earnedOn: "2025-03-28",
      description: "Completed React Fundamentals course with 90% score"
    },
    {
      id: 2,
      title: "Design Foundations",
      earnedOn: "2025-04-10",
      description: "Completed UI/UX Design Principles course"
    },
    {
      id: 3,
      title: "Top Contributor",
      earnedOn: "2025-04-12",
      description: "Awarded for exceptional contributions to team projects"
    }
  ];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Learning Resources
            </Typography>
            
            <List className="space-y-3">
              {learningResources.map((resource) => (
                <ListItem key={resource.id} className="p-0">
                  <Paper className="w-full p-4 rounded-lg hover:shadow-sm">
                    <Box className="flex items-center justify-between">
                      <Box className="flex items-center">
                        <Avatar sx={{ bgcolor: '#EFF6FF', mr: 2 }}>
                          <FiBook color="#3B82F6" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" className="font-bold">
                            {resource.title}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            {resource.type} • Last accessed: {formatDate(resource.lastAccessed)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box className="flex items-center">
                        <Box className="w-32 mr-4">
                          <LinearProgress
                            variant="determinate"
                            value={resource.progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: '#E5E7EB',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                backgroundColor: '#4F46E5'
                              }
                            }}
                          />
                          <Typography variant="caption" className="text-gray-600">
                            {resource.progress}% complete
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                        >
                          Continue
                        </Button>
                      </Box>
                    </Box>
                    
                    {resource.badge && (
                      <Box className="flex items-center mt-3">
                        <FiAward className="text-yellow-500 mr-2" />
                        <Typography variant="caption" className="text-yellow-700">
                          Earn "{resource.badge}" badge on completion
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Your Badges
            </Typography>
            
            <List className="space-y-3">
              {badges.map((badge) => (
                <ListItem key={badge.id} className="p-0">
                  <Paper className="w-full p-4 rounded-lg hover:shadow-sm">
                    <Box className="flex items-start">
                      <Avatar sx={{ bgcolor: '#FEF3C7', mr: 2 }}>
                        <FiAward color="#F59E0B" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" className="font-bold">
                          {badge.title}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600">
                          Earned on {formatDate(badge.earnedOn)}
                        </Typography>
                        <Typography variant="body2" className="mt-1 text-gray-700">
                          {badge.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default LearningTab;