import React, { useEffect, useState } from "react";
import { 
  FiDollarSign, FiUsers, FiLayers, 
  FiTrendingUp, FiBarChart2, FiHome,
  FiUser, FiKey, FiShield, FiAlertTriangle,
  FiClock, FiCheckCircle, FiCalendar
} from "react-icons/fi";
import { Typography, Avatar, Button, Box, useTheme } from "@mui/material";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FaRupeeSign } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';

const DashboardCards = ({ activeSection, activeSubsection }) => {
  const theme = useTheme();
  const [leadsCount, setLeadsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [potentialRevenue, setPotentialRevenue] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [criticalProjectsCount, setCriticalProjectsCount] = useState(0);
  const [overdueProjectsCount, setOverdueProjectsCount] = useState(0);
  const [completedProjectsCount, setCompletedProjectsCount] = useState(0);
  const [criticalProjects, setCriticalProjects] = useState([]);
  const [overdueProjects, setOverdueProjects] = useState([]);
  const [projectTypesData, setProjectTypesData] = useState([]);
  const [revenueTrendData, setRevenueTrendData] = useState([]);
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all data in parallel where possible
      const [leadsSnapshot, projectsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "leads"), where("status", "==", "closed-won"))),
        getDocs(query(collection(db, "dxd-magnate-projects")))
      ]);

      // Process leads data
      setLeadsCount(leadsSnapshot.size);

      // Process projects data
      const today = new Date();
      let paidRevenue = 0;
      let potential = 0;
      let completedCount = 0;
      const projectTypes = {};
      const revenueByMonth = {};
      const statusCounts = {
        'Completed': 0,
        'In Progress': 0,
        'Not Started': 0,
        'On Hold': 0
      };
      
      let criticalCount = 0;
      let overdueCount = 0;
      const criticalProjectsList = [];
      const overdueProjectsList = [];
      const allProjects = [];

      projectsSnapshot.forEach(doc => {
        const project = doc.data();
        allProjects.push({
          id: doc.id,
          ...project,
          createdAt: project.createdAt?.toDate?.() || new Date()
        });

        // Revenue calculations
        if (project.paymentStatus === "paid" && project.paidAmount) {
          paidRevenue += parseInt(project.paidAmount || 0);
          
          // Track revenue by month
          if (project.paymentDate) {
            const paymentDate = project.paymentDate?.toDate?.() || new Date();
            const month = paymentDate.toLocaleString('default', { month: 'short' });
            revenueByMonth[month] = (revenueByMonth[month] || 0) + parseInt(project.paidAmount || 0);
          }
        } else if (project.budget) {
          potential += parseInt(project.budget || 0);
        }
        
        // Project status counts
        if (project.status) {
          statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
        }
        
        // Project type distribution
        if (project.type) {
          projectTypes[project.type] = (projectTypes[project.type] || 0) + 1;
        }
        
        if (project.status === "Completed") {
          completedCount++;
        }

        // Deadline calculations
        if (project.status !== "Completed" && project.endDate) {
          const deadline = project.endDate?.toDate?.() || new Date();
          const diffTime = deadline - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) {
            overdueCount++;
            overdueProjectsList.push({
              id: doc.id,
              ...project,
              daysOverdue: Math.abs(diffDays)
            });
          } else if (diffDays <= 7) {
            criticalCount++;
            criticalProjectsList.push({
              id: doc.id,
              ...project,
              daysRemaining: diffDays
            });
          }
        }
      });

      // Set state with processed data
      setProjectsCount(projectsSnapshot.size);
      setRevenue(paidRevenue);
      setPotentialRevenue(potential);
      setCompletedProjectsCount(completedCount);
      setCriticalProjectsCount(criticalCount);
      setOverdueProjectsCount(overdueCount);
      setCriticalProjects(criticalProjectsList);
      setOverdueProjects(overdueProjectsList);

      // Prepare chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setRevenueTrendData(months.map(month => ({
        name: month,
        revenue: revenueByMonth[month] || 0
      })));

      setProjectTypesData(Object.keys(projectTypes).map(type => ({
        name: type,
        value: projectTypes[type]
      })));

      setProjectStatusData(Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
      })));

      // Get recent activities (sorted by creation date)
      setRecentActivities(
        allProjects
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 3)
      );

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Retry after 2 seconds if there's an error
      setTimeout(fetchData, 2000);
      return;
    } finally {
      setLoading(false);
    }
  };

  // Chart color schemes
  const COLORS = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const CHART_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.warning,
    COLORS.error,
    COLORS.info,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // If a subsection is selected, show its content
  if (activeSubsection) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-3">
        <div className="text-center">
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activeSubsection} Content
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Detailed information about {activeSubsection.toLowerCase()}
          </Typography>
        </div>
      </div>
    );
  }

  // If on Dashboard section, show the dashboard cards
  if (activeSection === "Dashboard") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-2 md:p-0">
        {/* Financial Summary Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Financial Summary
            </Typography>
            <div className="p-2 rounded-lg bg-indigo-50">
              <FaRupeeSign className="text-indigo-600" size={16} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            ₹{revenue.toLocaleString()}
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" size={14} />
            <span>Paid Revenue</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
              Potential: ₹{potentialRevenue.toLocaleString()}
            </Typography>
          </div>
        </div>
        
        {/* Active Projects Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Active Projects
            </Typography>
            <div className="p-2 rounded-lg bg-blue-50">
              <FiLayers className="text-blue-600" size={16} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {projectsCount}
          </Typography>
          <div className="flex items-center text-sm text-blue-600">
            <span>Total Projects</span>
          </div>
        </div>
        
        {/* Completed Projects Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Completed Projects
            </Typography>
            <div className="p-2 rounded-lg bg-green-50">
              <FiCheckCircle className="text-green-600" size={16} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {completedProjectsCount}
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <span>Successfully delivered</span>
          </div>
        </div>

          {/* Critical Projects Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Critical Projects
            </Typography>
            <div className="p-2 rounded-lg bg-orange-50">
              <FiAlertTriangle className="text-orange-600" size={16} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {criticalProjectsCount}
          </Typography>
          <div className="flex items-center text-sm text-orange-600">
            <FiClock className="mr-1" size={14} />
            <span>Approaching deadline</span>
          </div>
          {criticalProjects.length > 0 && (
            <div className="mt-3 space-y-2">
              {criticalProjects.slice(0, 3).map(project => (
                <div key={project.id} className="flex items-center text-xs">
                  <span className="truncate">{project.title}</span>
                  <span className="ml-auto font-medium">{project.daysRemaining}d left</span>
                </div>
              ))}
              {criticalProjects.length > 3 && (
                <Button 
                  size="small" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'none',
                    color: '#64748b',
                    mt: 1
                  }}
                >
                  View all ({criticalProjects.length})
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Overdue Projects Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Overdue Projects
            </Typography>
            <div className="p-2 rounded-lg bg-red-50">
              <FiAlertTriangle className="text-red-600" size={16} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {overdueProjectsCount}
          </Typography>
          <div className="flex items-center text-sm text-red-600">
            <FiClock className="mr-1" size={14} />
            <span>Past deadline</span>
          </div>
          {overdueProjects.length > 0 && (
            <div className="mt-3 space-y-2">
              {overdueProjects.slice(0, 3).map(project => (
                <div key={project.id} className="flex items-center text-xs">
                  <span className="truncate">{project.title}</span>
                  <span className="ml-auto font-medium">{project.daysOverdue}d overdue</span>
                </div>
              ))}
              {overdueProjects.length > 3 && (
                <Button 
                  size="small" 
                  sx={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'none',
                    color: '#64748b',
                    mt: 1
                  }}
                >
                  View all ({overdueProjects.length})
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Closed Leads Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Closed Leads
            </Typography>
            <div className="p-2 rounded-lg bg-purple-50">
              <FiUsers className="text-purple-600" size={16} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {leadsCount}
          </Typography>
          <div className="flex items-center text-sm text-purple-600">
            <FiTrendingUp className="mr-1" size={14} />
            <span>Successful conversions</span>
          </div>
        </div>

        {/* Revenue Trend Chart Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow col-span-1 md:col-span-3">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Revenue Trend
            </Typography>
            <div className="p-2 rounded-lg bg-indigo-50">
              <FiTrendingUp className="text-indigo-600" size={16} />
            </div>
          </div>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueTrendData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value.toLocaleString()}`}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={COLORS.primary} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Types Distribution Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Project Types Distribution
            </Typography>
            <div className="p-2 rounded-lg bg-purple-50">
              <FiBarChart2 className="text-purple-600" size={16} />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {projectTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value) => [value, 'Projects']}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status Overview Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Project Status
            </Typography>
            <div className="p-2 rounded-lg bg-green-50">
              <FiCheckCircle className="text-green-600" size={16} />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectStatusData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={80}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value) => [value, 'Projects']}
                />
                <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      
        
        {/* Recent Projects Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 hover:shadow-md transition-shadow col-span-1 md:col-span-3">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Recent Projects
            </Typography>
            <div className="p-2 rounded-lg bg-indigo-50">
              <FiCalendar className="text-indigo-600" size={16} />
            </div>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((project, index) => (
                <div key={project.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <Avatar sx={{ 
                    width: { xs: 28, md: 32 }, 
                    height: { xs: 28, md: 32 }, 
                    fontSize: '0.75rem', 
                    mr: 2,
                    bgcolor: getColorForIndex(index)
                  }}>
                    {index + 1}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Typography variant="body2" sx={{ 
                      fontWeight: 'medium', 
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {project.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: '#64748b', 
                      fontSize: { xs: '0.65rem', md: '0.75rem' },
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <FiClock size={10} className="mr-1" />
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </div>
                  <div className="ml-2">
                    <Typography variant="caption" sx={{ 
                      color: project.status === 'Completed' ? '#10b981' : '#64748b',
                      fontSize: { xs: '0.65rem', md: '0.75rem' }
                    }}>
                      {project.status}
                    </Typography>
                  </div>
                </div>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>
                No recent projects found
              </Typography>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-3">
      {activeSubsection ? (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            {activeSubsection === "Admin & Team Roles" ? (
              <FiShield className="text-indigo-600" size={20} />
            ) : activeSubsection === "Permissions & Access" ? (
              <FiKey className="text-indigo-600" size={20} />
            ) : (
              <FiUser className="text-indigo-600" size={20} />
            )}
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activeSubsection}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {activeSubsection === "Admin & Team Roles"
              ? "Manage administrator and team member roles and permissions"
              : `Detailed information about ${activeSubsection.toLowerCase()}`}
          </Typography>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            <FiHome className="text-indigo-600" size={20} />
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activeSection}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Select a subsection from the sidebar to view detailed information
          </Typography>
        </div>
      )}
    </div>
  );
};

// Helper function for avatar colors
const getColorForIndex = (index) => {
  const colors = [
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#ec4899', // pink
  ];
  return colors[index % colors.length];
};

export default DashboardCards;