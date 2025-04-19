// ForecastDashboard.js
import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Grid, Card, CardContent, 
  LinearProgress, Chip, Divider, Tooltip,
  Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import { 
  FiTrendingUp, FiDollarSign, FiCalendar, 
  FiBarChart2, FiFilter, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiClock, 
} from "react-icons/fi";
import ForecastMetrics from "./ForecastMetrics";
import ForecastChart from "./ForecastChart";
import PipelineHealth from "./PipelineHealth";
import { db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const ForecastDashboard = () => {
  const [timeframe, setTimeframe] = useState('quarter');
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState({
    committed: 0,
    bestCase: 0,
    pipeline: 0,
    quota: 200000,
    winRate: 0,
    avgDealSize: 0,
    dealVelocity: 0,
    stages: [
      { name: 'Prospecting', value: 0, trend: 'steady' },
      { name: 'Qualified', value: 0, trend: 'steady' },
      { name: 'Proposal', value: 0, trend: 'steady' },
      { name: 'Negotiation', value: 0, trend: 'steady' },
      { name: 'Closed Won', value: 0, trend: 'steady' },
    ],
    historical: [
      { month: 'Jan', actual: 0, forecast: 0 },
      { month: 'Feb', actual: 0, forecast: 0 },
      { month: 'Mar', actual: 0, forecast: 0 },
      { month: 'Apr', actual: 0, forecast: 0 },
      { month: 'May', actual: 0, forecast: 0 },
      { month: 'Jun', actual: 0, forecast: 0 },
    ]
  });

  useEffect(() => {
    fetchForecastData();
  }, [timeframe]);

  const fetchForecastData = async () => {
    setLoading(true);
    try {
      const userId = "66wihIq9fPPZMf1FTUbaOKKi1Fv2"; // Replace with actual user ID or get from auth
      const leadsQuery = query(
        collection(db, 'leads'),
        where('assignedTo', '==', userId)
      );
      
      const leadsSnapshot = await getDocs(leadsQuery);
      
      let committed = 0;
      let bestCase = 0;
      let pipeline = 0;
      let closedWonCount = 0;
      let closedLostCount = 0;
      let totalDealSize = 0;
      let stages = {
        prospecting: 0,
        qualified: 0,
        proposal: 0,
        negotiation: 0,
        closedWon: 0
      };
      
      leadsSnapshot.forEach((doc) => {
        const lead = doc.data();
        const budget = parseInt(lead.budget || 0);
        
        // Calculate pipeline value
        pipeline += budget;
        
        // Calculate committed (only closed-won deals)
        if (lead.status === 'closed-won') {
          committed += budget;
          closedWonCount++;
          totalDealSize += budget;
        } else if (lead.status === 'closed-lost') {
          closedLostCount++;
        }
        
        // Categorize leads by stage
        if (lead.status === 'new') {
          stages.prospecting++;
        } else if (lead.status === 'contacted') {
          stages.qualified++;
        } else if (lead.status === 'proposal-sent') {
          stages.proposal++;
        } else if (lead.status === 'negotiation') {
          stages.negotiation++;
        } else if (lead.status === 'closed-won') {
          stages.closedWon++;
        }
      });
      
      // Calculate best case (committed + 50% of remaining pipeline)
      bestCase = committed + (pipeline - committed) * 0.5;
      
      // Calculate win rate
      const winRate = closedWonCount + closedLostCount > 0 
        ? Math.round((closedWonCount / (closedWonCount + closedLostCount)) * 100)
        : 0;
      
      // Calculate average deal size
      const avgDealSize = closedWonCount > 0 
        ? Math.round(totalDealSize / closedWonCount)
        : 0;
      
      // Update forecast data
      setForecastData(prev => ({
        ...prev,
        committed,
        bestCase,
        pipeline,
        winRate,
        avgDealSize,
        dealVelocity: 45, // This would need actual calculation based on date fields
        stages: [
          { name: 'Prospecting', value: stages.prospecting, trend: stages.prospecting > 0 ? 'up' : 'steady' },
          { name: 'Qualified', value: stages.qualified, trend: stages.qualified > 0 ? 'up' : 'steady' },
          { name: 'Proposal', value: stages.proposal, trend: stages.proposal > 0 ? 'up' : 'steady' },
          { name: 'Negotiation', value: stages.negotiation, trend: stages.negotiation > 0 ? 'up' : 'steady' },
          { name: 'Closed Won', value: stages.closedWon, trend: stages.closedWon > 0 ? 'up' : 'steady' },
        ],
        // Historical data would need to be calculated based on actual time periods
        historical: [
          { month: 'Jan', actual: Math.round(committed * 0.2), forecast: Math.round(committed * 0.25) },
          { month: 'Feb', actual: Math.round(committed * 0.3), forecast: Math.round(committed * 0.35) },
          { month: 'Mar', actual: Math.round(committed * 0.5), forecast: Math.round(committed * 0.45) },
          { month: 'Apr', actual: Math.round(committed * 0.7), forecast: Math.round(committed * 0.65) },
          { month: 'May', actual: Math.round(committed * 0.9), forecast: Math.round(committed * 0.85) },
          { month: 'Jun', actual: committed, forecast: Math.round(committed * 1.1) },
        ]
      }));
      
    } catch (error) {
      console.error("Error fetching forecast data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
    // In a real app, you would adjust the data based on timeframe
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <FiTrendingUp className="text-green-500" />;
      case 'down': return <FiTrendingUp className="text-red-500 transform rotate-180" />;
      default: return <FiBarChart2 className="text-gray-500" />;
    }
  };

  return (
    <Box className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h5" className="font-bold text-gray-800">
          Sales Forecast
        </Typography>
        <div className="flex items-center space-x-4">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={handleTimeframeChange}
              label="Timeframe"
              startAdornment={<FiFilter className="mr-2" />}
            >
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <button 
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={fetchForecastData}
            >
              <FiRefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>
        </div>
      </div>

      <ForecastMetrics data={forecastData} loading={loading} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card className="h-full  shadow-sm rounded-xl border border-gray-100">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="subtitle1" className="font-bold">
                  Forecast vs Actual
                </Typography>
                <div className="flex space-x-2">
                  <Chip 
                    label="Forecast" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderColor: '#4f46e5',
                      backgroundColor: '#eef2ff',
                      color: '#4f46e5'
                    }}
                  />
                  <Chip 
                    label="Actual" 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      borderColor: '#10b981',
                      backgroundColor: '#ecfdf5',
                      color: '#10b981'
                    }}
                  />
                </div>
              </div>
              <ForecastChart data={forecastData.historical} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <PipelineHealth stages={forecastData.stages} />
        </Grid>
      </Grid>

      <Card className="shadow-sm rounded-xl border border-gray-100">
        <CardContent>
          <Typography variant="subtitle1" className="font-bold mb-4">
            Forecast Summary
          </Typography>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <FiDollarSign size={18} />
                </div>
                <Typography variant="body2" className="font-medium">
                  Committed Deals
                </Typography>
              </div>
              <Typography variant="body2" className="font-bold">
                ₹{forecastData.committed.toLocaleString()}
              </Typography>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <FiCheckCircle size={18} />
                </div>
                <Typography variant="body2" className="font-medium">
                  Best Case Scenario
                </Typography>
              </div>
              <Typography variant="body2" className="font-bold">
                ₹{forecastData.bestCase.toLocaleString()}
              </Typography>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <FiBarChart2 size={18} />
                </div>
                <Typography variant="body2" className="font-medium">
                  Total Pipeline
                </Typography>
              </div>
              <Typography variant="body2" className="font-bold">
                ₹{forecastData.pipeline.toLocaleString()}
              </Typography>
            </div>
            <Divider />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <FiCalendar size={18} />
                </div>
                <Typography variant="body2" className="font-medium">
                  Quota Attainment
                </Typography>
              </div>
              <div className="flex items-center space-x-4">
                <LinearProgress 
                  variant="determinate" 
                  value={(forecastData.committed / forecastData.quota) * 100} 
                  sx={{ 
                    width: 100,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e9d5ff',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#8b5cf6'
                    }
                  }}
                />
                <Typography variant="body2" className="font-bold">
                  {Math.round((forecastData.committed / forecastData.quota) * 100)}%
                </Typography>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForecastDashboard;