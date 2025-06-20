import React, { useState, useEffect } from "react";
import { 
  Typography, 
  Chip,
  LinearProgress,
  Menu,
  MenuItem,
  Button
} from "@mui/material";
import { 
  FiTrendingUp,
  FiTrendingDown,
  FiChevronRight,
  FiChevronDown,
  FiBarChart2,
  FiUserCheck,
  FiUsers,
  FiCheckCircle
} from "react-icons/fi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";

const PerformanceTrendsCard = ({ userId }) => {
  const [performanceData, setPerformanceData] = useState({
    revenue: 0,
    winRate: 0,
    conversionRate: 0,
    trends: Array(12).fill(0)
  });
  const [timeRange, setTimeRange] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        
        const now = new Date();
        const currentYear = now.getFullYear();
        let leadsQuery;
        
        // Base query for all user's leads
        leadsQuery = query(
          collection(db, 'leads'),
          where('assignedTo', '==', userId)
        );
        
        const leadsSnapshot = await getDocs(leadsQuery);
        
        let totalRevenue = 0;
        let wonDeals = 0;
        let lostDeals = 0;
        let convertedLeads = 0;
        let totalLeads = 0;
        const monthlyTrends = Array(12).fill(0);
        
        leadsSnapshot.forEach((doc) => {
          const lead = doc.data();
          const budget = parseInt(lead.budget || 0);
          const convertedDate = lead.convertedDate ? new Date(lead.convertedDate) : null;
          
          // Filter based on selected time range
          if (timeRange === 'weekly') {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            if (convertedDate && (convertedDate < startDate || convertedDate > now)) {
              return; // Skip if not in weekly range
            }
          } else if (timeRange === 'monthly') {
            if (convertedDate && 
                (convertedDate < new Date(currentYear, now.getMonth(), 1) || 
                 convertedDate > new Date(currentYear, now.getMonth() + 1, 0))) {
              return; // Skip if not in monthly range
            }
          } else if (timeRange === 'yearly') {
            if (convertedDate && convertedDate.getFullYear() !== currentYear) {
              return; // Skip if not in current year
            }
          }
          
          if (lead.status === 'closed-won') {
            totalRevenue += budget;
            wonDeals++;
          } else if (lead.status === 'closed-lost') {
            lostDeals++;
          }
          
          if (lead.converted && convertedDate) {
            convertedLeads++;
            const month = convertedDate.getMonth();
            monthlyTrends[month] += budget;
          }
          
          totalLeads++;
        });
        
        const winRate = wonDeals + lostDeals > 0 ? 
          (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
        const conversionRate = totalLeads > 0 ? 
          (convertedLeads / totalLeads) * 100 : 0;
        
        setPerformanceData({
          revenue: totalRevenue,
          winRate,
          conversionRate,
          trends: monthlyTrends
        });
      } catch (err) {
        console.error('Error fetching performance data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerformanceData();
  }, [userId, timeRange]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    handleMenuClose();
  };

  // Calculate max value for chart scaling with minimum of 1000 to ensure visibility
  const maxChartValue = Math.max(...performanceData.trends, 1000);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-2 flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-6 bg-gray-200 rounded-full mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Performance Trends
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {timeRange === 'weekly' ? 'Last 7 days' : 
             timeRange === 'monthly' ? 'This month' : 'This year'} • 
            <span className="text-green-600 ml-1">↑12%</span> from last period
          </Typography>
        </div>
        <div>
          <Button
            variant="outlined"
            size="small"
            endIcon={<FiChevronDown size={16} />}
            onClick={handleMenuOpen}
            sx={{
              textTransform: 'capitalize',
              borderRadius: '8px',
              borderColor: timeRange === 'monthly' ? '#6366f1' : '#e2e8f0',
              color: timeRange === 'monthly' ? '#6366f1' : '#64748b',
              backgroundColor: timeRange === 'monthly' ? '#eef2ff' : 'transparent',
              '&:hover': {
                borderColor: '#c7d2fe',
                backgroundColor: '#eef2ff'
              }
            }}
          >
            {timeRange === 'weekly' ? 'Weekly' : 
             timeRange === 'monthly' ? 'Monthly' : 'Yearly'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1,
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                minWidth: 120
              }
            }}
          >
            <MenuItem 
              onClick={() => handleTimeRangeChange('weekly')}
              sx={{
                '&:hover': { backgroundColor: '#f8fafc' },
                color: timeRange === 'weekly' ? '#6366f1' : '#1e293b'
              }}
            >
              Weekly
            </MenuItem>
            <MenuItem 
              onClick={() => handleTimeRangeChange('monthly')}
              sx={{
                '&:hover': { backgroundColor: '#f8fafc' },
                color: timeRange === 'monthly' ? '#6366f1' : '#1e293b'
              }}
            >
              Monthly
            </MenuItem>
            <MenuItem 
              onClick={() => handleTimeRangeChange('yearly')}
              sx={{
                '&:hover': { backgroundColor: '#f8fafc' },
                color: timeRange === 'yearly' ? '#6366f1' : '#1e293b'
              }}
            >
              Yearly
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Revenue Card */}
        <div className="bg-indigo-50 p-4 rounded-lg transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Revenue
            </Typography>
            <FiBarChart2 className="text-indigo-600" size={18} />
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            ₹{performanceData.revenue.toLocaleString()}
          </Typography>
          <div className="flex items-center mt-1">
            <FiTrendingUp className="text-green-500 mr-1" size={14} />
            <Typography variant="caption" sx={{ color: '#16a34a' }}>
              {Math.floor(Math.random() * 15 + 5)}%
            </Typography>
          </div>
        </div>
        
        {/* Win Rate Card */}
        <div className="bg-green-50 p-4 rounded-lg transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Win Rate
            </Typography>
            <FiCheckCircle className="text-green-600" size={18} />
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {performanceData.winRate.toFixed(1)}%
          </Typography>
          <div className="flex items-center mt-1">
            <FiTrendingUp className="text-green-500 mr-1" size={14} />
            <Typography variant="caption" sx={{ color: '#16a34a' }}>
              {Math.floor(Math.random() * 10 + 2)}%
            </Typography>
          </div>
        </div>
        
        {/* Conversion Rate Card */}
        <div className="bg-purple-50 p-4 rounded-lg transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Conversion Rate
            </Typography>
            <FiUserCheck className="text-purple-600" size={18} />
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {performanceData.conversionRate.toFixed(1)}%
          </Typography>
          <div className="flex items-center mt-1">
            {performanceData.conversionRate > 50 ? (
              <>
                <FiTrendingUp className="text-green-500 mr-1" size={14} />
                <Typography variant="caption" sx={{ color: '#16a34a' }}>
                  {Math.floor(Math.random() * 10 + 5)}%
                </Typography>
              </>
            ) : (
              <>
                <FiTrendingDown className="text-red-500 mr-1" size={14} />
                <Typography variant="caption" sx={{ color: '#dc2626' }}>
                  {Math.floor(Math.random() * 5 + 1)}%
                </Typography>
              </>
            )}
          </div>
        </div>
        
        {/* Total Leads Card */}
        <div className="bg-blue-50 p-4 rounded-lg transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2">
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Total Leads
            </Typography>
            <FiUsers className="text-blue-600" size={18} />
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {performanceData.trends.reduce((a, b) => a + (b > 0 ? 1 : 0), 0)}
          </Typography>
          <div className="flex items-center mt-1">
            <FiTrendingUp className="text-green-500 mr-1" size={14} />
            <Typography variant="caption" sx={{ color: '#16a34a' }}>
              {Math.floor(Math.random() * 20 + 10)}%
            </Typography>
          </div>
        </div>
      </div>

      {/* Chart with real data */}
      <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Revenue Trend by Month
          </Typography>
          <div className="flex space-x-2">
            <Chip 
              label="Revenue" 
              size="small" 
              sx={{ 
                backgroundColor: '#e0e7ff', 
                color: '#4f46e5',
                fontWeight: 'medium'
              }} 
            />
          </div>
        </div>
        
        {/* Chart with real data */}
        <div className="relative h-full w-full">
          {/* X-axis */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200"></div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-400">
            <span>₹{maxChartValue.toLocaleString()}</span>
            <span>₹{(maxChartValue * 0.75).toLocaleString()}</span>
            <span>₹{(maxChartValue * 0.5).toLocaleString()}</span>
            <span>₹{(maxChartValue * 0.25).toLocaleString()}</span>
            <span>₹0</span>
          </div>
          
          {/* Chart content */}
          <div className="absolute left-8 right-0 top-0 bottom-8 flex items-end space-x-1">
            {performanceData.trends.map((value, i) => {
              // Ensure minimum height of 2% so bars are always visible
              const height = Math.max((value / maxChartValue) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                  <div 
                    className="w-full bg-indigo-600 rounded-t-sm transition-all duration-300 hover:bg-indigo-700"
                    style={{ 
                      height: `${height}%`,
                      minHeight: '2px' // Ensure tiny bars are visible
                    }}
                  ></div>
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    ₹{value.toLocaleString()}
                  </div>
                  <span className="text-xs text-gray-400 mt-1">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PerformanceTrendsCard;