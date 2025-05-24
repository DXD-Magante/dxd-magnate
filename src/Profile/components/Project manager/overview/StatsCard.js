import React from 'react';
import { Paper, Typography } from '@mui/material';

const StatsCard = ({ title, value, icon, color }) => {
  return (
    <Paper sx={{ 
      p: 3, 
      borderRadius: 2, 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      height: '100%'
    }}>
      <div className="flex justify-between items-start">
        <div>
          <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" className="font-bold">
            {value}
          </Typography>
        </div>
        <div 
          className="p-2 rounded-lg" 
          style={{ 
            backgroundColor: color ? `${color}20` : '#e0e7ff',
            color: color || '#6366f1'
          }}
        >
          {icon}
        </div>
      </div>
    </Paper>
  );
};

export default StatsCard;