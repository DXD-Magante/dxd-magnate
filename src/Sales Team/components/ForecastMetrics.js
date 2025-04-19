// ForecastMetrics.js
import React from "react";
import { Box, Typography, Card, CardContent, Tooltip } from "@mui/material";
import { FiClock, FiInfo, FiTrendingUp } from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const ForecastMetrics = ({ data, loading }) => {
  const metrics = [
    {
      title: "Win Rate",
      value: `${data.winRate}%`,
      change: "+5%",
      trend: "up",
      icon: <FiTrendingUp className="text-green-500" />,
      tooltip: "Percentage of deals won vs total closed deals"
    },
    {
      title: "Avg Deal Size",
      value: `₹${data.avgDealSize.toLocaleString()}`,
      change: "+12%",
      trend: "up",
      icon: <FaRupeeSign className="text-blue-500" />,
      tooltip: "Average value of won deals"
    },
    {
      title: "Deal Velocity",
      value: `${data.dealVelocity} days`,
      change: "-3 days",
      trend: "down",
      icon: <FiClock className="text-purple-500" />,
      tooltip: "Average time from lead to closed deal"
    }
  ];

  return (
    <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="shadow-sm rounded-xl border border-gray-100">
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <Typography variant="body2" className="font-medium text-gray-600">
                {metric.title}
              </Typography>
              <Tooltip title={metric.tooltip}>
                <span className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <FiInfo size={16} />
                </span>
              </Tooltip>
            </div>
            <div className="flex items-end justify-between">
              <Typography variant="h5" className="font-bold">
                {metric.value}
              </Typography>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                metric.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {metric.icon}
                <Typography variant="caption" className="font-medium">
                  {metric.change}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default ForecastMetrics;