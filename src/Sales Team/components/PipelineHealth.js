// PipelineHealth.js
import React from "react";
import { Box, Typography, LinearProgress,  Card, CardContent  } from "@mui/material";
import { FiAlertCircle, FiCheckCircle, FiClock } from "react-icons/fi";

const PipelineHealth = ({ stages }) => {
  const getStageIcon = (stage) => {
    if (stage.name === 'Closed Won') return <FiCheckCircle className="text-green-500" />;
    if (stage.name === 'Closed Lost') return <FiAlertCircle className="text-red-500" />;
    return <FiClock className="text-yellow-500" />;
  };

  return (
    <Card className="h-full shadow-sm rounded-xl border border-gray-100">
      <CardContent>
        <Typography variant="subtitle1" className="font-bold mb-4">
          Pipeline Health
        </Typography>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  {getStageIcon(stage)}
                  <Typography variant="body2" className="font-medium">
                    {stage.name}
                  </Typography>
                </div>
                <Typography variant="body2" className="font-bold">
                  {stage.value}
                </Typography>
              </div>
              <LinearProgress 
                variant="determinate" 
                value={(stage.value / Math.max(...stages.map(s => s.value)) * 100)} 
                sx={{ 
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#e0e7ff',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: stage.trend === 'up' ? '#10b981' : 
                                    stage.trend === 'down' ? '#ef4444' : '#f59e0b'
                  }
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineHealth;