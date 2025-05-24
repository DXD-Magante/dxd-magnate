import React from 'react';
import { Grid, Paper, Typography, Avatar, Box } from '@mui/material';
import { FiCheckCircle, FiTrendingUp, FiAward } from 'react-icons/fi';

const QuickStats = ({ stats }) => {
  return (
    <Grid container spacing={3} className="mb-8">
      <Grid item xs={12} sm={6} md={4}>
        <Paper className="p-4 rounded-xl shadow-sm border border-gray-200">
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="subtitle2" className="text-gray-600">
                Tasks Completed
              </Typography>
              <Typography variant="h4" className="font-bold">
                {stats.tasksCompleted}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                Last task: {formatDate(new Date())}
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#ECFDF5', width: 48, height: 48 }}>
              <FiCheckCircle size={24} color="#10B981" />
            </Avatar>
          </Box>
        </Paper>
      </Grid>
      {/* Other stat cards... */}
    </Grid>
  );
};

export default QuickStats;