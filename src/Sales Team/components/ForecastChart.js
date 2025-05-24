// ForecastChart.js
import React from "react";
import { Box, Typography,} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const ForecastChart = ({ data }) => {
  return (
    <Box className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="forecast" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]} 
            name="Forecast" 
          />
          <Bar 
            dataKey="actual" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]} 
            name="Actual" 
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ForecastChart;