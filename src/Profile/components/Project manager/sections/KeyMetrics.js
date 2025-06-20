import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { FiFolder, FiCheckCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';

const KeyMetrics = ({ stats }) => {
  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'FiFolder': return <FiFolder size={24} />;
      case 'FiCheckCircle': return <FiCheckCircle size={24} />;
      case 'FiUsers': return <FiUsers size={24} />;
      case 'FiTrendingUp': return <FiTrendingUp size={24} />;
      default: return null;
    }
  };

  return (
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
              </div>
              <div 
                className="p-2 rounded-lg" 
                style={{ 
                  backgroundColor: stat.color ? `${stat.color}20` : '#e0e7ff',
                  color: stat.color || '#6366f1'
                }}
              >
                {getIconComponent(stat.icon)}
              </div>
            </div>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default KeyMetrics;