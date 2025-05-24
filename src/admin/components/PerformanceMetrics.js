import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Chip,
  Divider,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  InputAdornment,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiAward,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiBarChart2,
  FiPieChart,
  FiDollarSign,
  FiCalendar,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiStar,
  FiBriefcase,
  FiUser,
  FiTarget
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { auth, db } from '../../services/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
const PerformanceMetrics = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectManagersData, setProjectManagersData] = useState([]);
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [salesStats, setSalesStats] = useState({
    totalLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    conversionRate: 0,
    revenue: 0,
    revenuePotential: 0,
    salesReps: []
  });

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        
        // Get all users first to map sales rep names
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersMap = new Map();
        usersSnapshot.forEach(userDoc => {
          usersMap.set(userDoc.id, userDoc.data());
        });
    
        // Get all leads
        const leadsQuery = query(collection(db, 'leads'));
        const leadsSnapshot = await getDocs(leadsQuery);
        
        // Get all projects
        const projectsQuery = query(collection(db, 'dxd-magnate-projects'));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        // Get all transactions from platform-transactions
        const transactionsQuery = query(collection(db, 'platform-transactions'));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        
        // Get monthly targets
        const targetsQuery = query(collection(db, 'monthly-target'));
        const targetsSnapshot = await getDocs(targetsQuery);
        
        // Calculate basic stats
        let totalLeads = 0;
        let wonLeads = 0;
        let lostLeads = 0;
        let revenue = 0;
        let revenuePotential = 0;
        const salesRepsMap = new Map();
        
        // Process transactions to calculate revenue by month
        const monthlyRevenue = {};
        const currentYear = new Date().getFullYear().toString();
        
        transactionsSnapshot.forEach((transactionDoc) => {
          const transaction = transactionDoc.data();
          if (transaction.status !== 'completed') return;
          
          const amount = parseInt(transaction.amount || 0);
          revenue += amount;
          
          // Group by month
          const date = new Date(transaction.timestamp);
          const month = date.toLocaleString('default', { month: 'short' });
          const year = date.getFullYear().toString();
          
          if (year === currentYear) {
            if (!monthlyRevenue[month]) {
              monthlyRevenue[month] = 0;
            }
            monthlyRevenue[month] += amount;
          }
        });
        
        // Process targets
        const monthlyTargets = {};
        targetsSnapshot.forEach((targetDoc) => {
          const target = targetDoc.data();
          if (target.year === currentYear) {
            monthlyTargets[target.month] = parseInt(target.target || 0);
          }
        });
        
        // Prepare chart data for all months
        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueData = allMonths.map(month => ({
          name: month,
          revenue: monthlyRevenue[month] || 0,
          target: monthlyTargets[month] || 0
        }));
        
        // Process leads
        leadsSnapshot.forEach((leadDoc) => {
          const lead = leadDoc.data();
          totalLeads++;
          
          if (lead.status === 'closed-won') {
            wonLeads++;
          } else if (lead.status === 'closed-lost') {
            lostLeads++;
          }
          
          // Track by sales rep
          if (lead.assignedTo) {
            const userData = usersMap.get(lead.assignedTo);
            const repName = userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown';
            
            if (!salesRepsMap.has(lead.assignedTo)) {
              salesRepsMap.set(lead.assignedTo, {
                id: lead.assignedTo,
                name: repName,
                totalLeads: 0,
                wonLeads: 0,
                lostLeads: 0,
                revenue: 0,
                revenuePotential: 0
              });
            }
            
            const repData = salesRepsMap.get(lead.assignedTo);
            repData.totalLeads++;
            
            if (lead.status === 'closed-won') {
              repData.wonLeads++;
            } else if (lead.status === 'closed-lost') {
              repData.lostLeads++;
            }
          }
        });
      
        // Process projects to calculate revenue potential
        projectsSnapshot.forEach((projectDoc) => {
          const project = projectDoc.data();
          const budget = parseInt(project.budget || 0);
          
          if (project.paymentStatus !== 'paid') {
            revenuePotential += budget;
            
            // Add to sales rep if this was a converted lead
            if (project.leadId) {
              const leadDoc = leadsSnapshot.docs.find(doc => doc.id === project.leadId);
              if (leadDoc && leadDoc.data().assignedTo) {
                const repData = salesRepsMap.get(leadDoc.data().assignedTo);
                if (repData) {
                  repData.revenuePotential += budget;
                }
              }
            }
          }
        });
        
        // Calculate conversion rates and prepare sales reps data
        const salesReps = Array.from(salesRepsMap.values()).map(rep => ({
          ...rep,
          conversionRate: rep.totalLeads > 0 ? (rep.wonLeads / rep.totalLeads) * 100 : 0
        }));
        
        // Sort sales reps by revenue (descending)
        salesReps.sort((a, b) => b.revenue - a.revenue);
        
        setSalesStats({
          totalLeads,
          wonLeads,
          lostLeads,
          conversionRate: totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0,
          revenue,
          revenuePotential,
          salesReps,
          revenueData // Add the prepared revenue data to state
        });
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSalesData();
  }, []);

  const collaboratorsData = [
    { id: 1, name: 'Daniel Lee', role: 'Designer', avatar: 'DL', tasksCompleted: 42, qualityScore: 4.8, onTimeDelivery: 92 },
    { id: 2, name: 'Olivia Martin', role: 'Developer', avatar: 'OM', tasksCompleted: 38, qualityScore: 4.7, onTimeDelivery: 88 },
    { id: 3, name: 'Thomas Garcia', role: 'Marketing Intern', avatar: 'TG', tasksCompleted: 28, qualityScore: 4.5, onTimeDelivery: 85 },
  ];

  const revenueData = salesStats.revenueData || [
    { name: 'Jan', revenue: 0, target: 0 },
    { name: 'Feb', revenue: 0, target: 0 },
    { name: 'Mar', revenue: 0, target: 0 },
    { name: 'Apr', revenue: 0, target: 0 },
    { name: 'May', revenue: 0, target: 0 },
    { name: 'Jun', revenue: 0, target: 0 },
    { name: 'Jul', revenue: 0, target: 0 },
    { name: 'Aug', revenue: 0, target: 0 },
    { name: 'Sep', revenue: 0, target: 0 },
    { name: 'Oct', revenue: 0, target: 0 },
    { name: 'Nov', revenue: 0, target: 0 },
    { name: 'Dec', revenue: 0, target: 0 }
  ];
  

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRankColor = (rank) => {
    switch(rank) {
      case 1: return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
      case 2: return 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)';
      case 3: return 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)';
      default: return '#f8fafc';
    }
  };

  const filteredSalesTeam = salesStats.salesReps?.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectsSnapshot = await getDocs(collection(db, 'dxd-magnate-projects'));
        const projects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Group projects by project manager
        const managersMap = {};
        const today = new Date();
        
        projects.forEach(project => {
          if (!project.projectManagerId) return;
          
          if (!managersMap[project.projectManagerId]) {
            managersMap[project.projectManagerId] = {
              id: project.projectManagerId,
              name: project.projectManager,
              avatar: project.projectManager?.split(' ').map(n => n[0]).join('') || 'PM',
              projectsCompleted: 0,
              projectsOngoing: 0,
              totalProjects: 0,
              delayedProjects: 0,
              criticalProjects: 0,
              overdueProjects: 0,
              totalBudget: 0
            };
          }
          
          const manager = managersMap[project.projectManagerId];
          manager.totalProjects++;
          manager.totalBudget += parseInt(project.budget || 0);
          
          if (project.status === 'Completed') {
            manager.projectsCompleted++;
          } else {
            manager.projectsOngoing++;
            
            // Check for critical and overdue projects
            if (project.endDate) {
              const deadline = new Date(project.endDate);
              const diffTime = deadline - today;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays <= 0) {
                manager.overdueProjects++;
              } else if (diffDays <= 7) {
                manager.criticalProjects++;
              }
            }
          }
        });

        // Calculate completion rates and prepare data for display
        const managersData = Object.values(managersMap).map(manager => ({
          ...manager,
          completionRate: Math.round((manager.projectsCompleted / manager.totalProjects) * 100),
          avgDeliveryTime: '14 days' // Placeholder - you would calculate this based on actual data
        }));

        // Calculate project status distribution
        const statusCounts = {
          completed: 0,
          inProgress: 0,
          delayed: 0,
          onHold: 0
        };

        projects.forEach(project => {
          if (project.status === 'Completed') {
            statusCounts.completed++;
          } else if (project.status === 'In progress') {
            statusCounts.inProgress++;
          } else if (project.status === 'Delayed') {
            statusCounts.delayed++;
          } else if (project.status === 'On Hold') {
            statusCounts.onHold++;
          }
        });

        setProjectStatusData([
          { name: 'Completed', value: statusCounts.completed },
          { name: 'In Progress', value: statusCounts.inProgress },
          { name: 'Delayed', value: statusCounts.delayed },
          { name: 'On Hold', value: statusCounts.onHold }
        ]);

        setProjectManagersData(managersData);
        setLoading(false);
      } catch (error) {
        alert(error)
        console.error('Error fetching project data:', error);
        setLoading(false);
      }
    };

    fetchProjectData();
  }, []);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };



  const filteredCollaborators = collaboratorsData.filter(collab =>
    collab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collab.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjectManagers = projectManagersData.filter(pm =>
    pm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography>Loading performance data...</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}>
          Performance Metrics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive analytics and insights on team performance across all departments
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2, backgroundColor: theme.palette.background.paper }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: theme.palette.background.default,
                  borderRadius: 1
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Select
                fullWidth
                size="small"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  borderRadius: 1
                }}
                IconComponent={FiChevronDown}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>

              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "standard"}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                    height: 3
                  }
                }}
              >
                <Tab label="Sales Team" icon={<FiDollarSign size={18} />} iconPosition="start" />
                <Tab label="Project Managers" icon={<FiBriefcase size={18} />} iconPosition="start" />
                <Tab label="Collaborators" icon={<FiUsers size={18} />} iconPosition="start" />
              </Tabs>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {activeTab === 0 && (
  <>
    {/* Sales Team Metrics */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} md={8}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FiBarChart2 size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Revenue Performance
              </Typography>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Amount']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Actual Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Revenue Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FiPieChart size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Lead Conversion
              </Typography>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Won Leads', value: salesStats.wonLeads },
                      { name: 'Lost Leads', value: salesStats.lostLeads },
                      { name: 'Active Leads', value: salesStats.totalLeads - salesStats.wonLeads - salesStats.lostLeads }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key="cell-won" fill="#10B981" />
                    <Cell key="cell-lost" fill="#EF4444" />
                    <Cell key="cell-active" fill="#3B82F6" />
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} leads`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Summary Cards */}
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FiUsers size={20} style={{ marginRight: 8, color: theme.palette.primary.main }} />
              <Typography variant="body2" color="text.secondary">
                Total Leads
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {salesStats.totalLeads}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                All time
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FiCheckCircle size={20} style={{ marginRight: 8, color: '#10B981' }} />
              <Typography variant="body2" color="text.secondary">
                Won Leads
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10B981' }}>
              {salesStats.wonLeads}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {salesStats.conversionRate.toFixed(1)}% conversion
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FiDollarSign size={20} style={{ marginRight: 8, color: '#4f46e5' }} />
              <Typography variant="body2" color="text.secondary">
                Revenue Generated
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {formatCurrency(salesStats.revenue)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatCurrency(salesStats.revenuePotential)} potential
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FiAward size={20} style={{ marginRight: 8, color: '#F59E0B' }} />
              <Typography variant="body2" color="text.secondary">
                Top Performer
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {salesStats.salesReps.length > 0 ? salesStats.salesReps[0].name : 'N/A'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {salesStats.salesReps.length > 0 ? formatCurrency(salesStats.salesReps[0].revenue) : ''}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Sales Team Table */}
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FiUsers size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Sales Team Performance
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: theme.palette.background.default }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Member</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Revenue</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Won Leads</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Conversion Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Potential</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesStats.salesReps.filter(member =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((member, index) => (
                <TableRow key={member.id || index} hover>
                  <TableCell>
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      sx={{
                        backgroundColor: getRankColor(index + 1),
                        color: index < 3 ? '#fff' : theme.palette.text.primary,
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        background: getRankColor(index + 1),
                        color: index < 3 ? '#fff' : theme.palette.primary.main 
                      }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {member.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sales Representative
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(member.revenue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {member.wonLeads}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mr: 1 }}>
                        {member.conversionRate.toFixed(1)}%
                      </Typography>
                      {member.conversionRate > 60 ? (
                        <FiTrendingUp color="#10B981" />
                      ) : member.conversionRate > 40 ? (
                        <FiCheckCircle color="#3B82F6" />
                      ) : (
                        <FiTrendingDown color="#EF4444" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(member.revenuePotential)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (member.revenue / (member.revenue + member.revenuePotential)) * 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: member.revenuePotential === 0 ? '#10B981' : '#3B82F6',
                          borderRadius: 4
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  </>
)}

      {activeTab === 1 && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <FiCheckCircle size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Project Completion Rate
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredProjectManagers.map(pm => ({
                          name: pm.name,
                          rate: pm.completionRate,
                          critical: pm.criticalProjects,
                          overdue: pm.overdueProjects
                        }))}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                        <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="rate" name="Completion Rate (%)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="critical" name="Critical Projects" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="overdue" name="Overdue Projects" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <FiPieChart size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Project Status Distribution
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FiBriefcase size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Project Managers Performance
                </Typography>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Manager</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Projects</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Completed</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Ongoing</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Critical</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Overdue</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Completion Rate</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProjectManagers.map((pm) => (
                      <TableRow key={pm.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.main }}>
                              {pm.avatar}
                            </Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {pm.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {pm.totalProjects}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {pm.projectsCompleted}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {pm.projectsOngoing}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={pm.criticalProjects}
                            size="small"
                            sx={{
                              backgroundColor: pm.criticalProjects > 0 ? '#FEF3C7' : '#ECFDF5',
                              color: pm.criticalProjects > 0 ? '#D97706' : '#10B981',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={pm.overdueProjects}
                            size="small"
                            sx={{
                              backgroundColor: pm.overdueProjects > 0 ? '#FEF2F2' : '#ECFDF5',
                              color: pm.overdueProjects > 0 ? '#EF4444' : '#10B981',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mr: 1 }}>
                              {pm.completionRate}%
                            </Typography>
                            {pm.completionRate > 85 ? (
                              <FiTrendingUp color="#10B981" />
                            ) : pm.completionRate > 70 ? (
                              <FiCheckCircle color="#3B82F6" />
                            ) : (
                              <FiTrendingDown color="#EF4444" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={pm.completionRate}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: pm.completionRate > 85 ? '#10B981' : pm.completionRate > 70 ? '#3B82F6' : '#EF4444',
                                borderRadius: 4
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 2 && (
        <>
          {/* Collaborators/Interns Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <FiStar size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Quality & Delivery Metrics
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={collaboratorsData.map(collab => ({
                          name: collab.name,
                          quality: collab.qualityScore * 20, // Convert to percentage
                          delivery: collab.onTimeDelivery
                        }))}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <Tooltip formatter={(value) => [`${value}%`, value > 100 ? 'Score (out of 5)' : 'Percentage']} />
                        <Legend />
                        <Bar dataKey="quality" name="Quality Score (out of 5)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="delivery" name="On-time Delivery (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <FiTarget size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Task Completion Overview
                    </Typography>
                  </Box>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={collaboratorsData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                        <YAxis stroke={theme.palette.text.secondary} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FiUser size={24} style={{ marginRight: 12, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Collaborators & Interns Performance
                </Typography>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: theme.palette.background.default }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Tasks Completed</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">Quality Score</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">On-time Delivery</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCollaborators.map((collab) => (
                      <TableRow key={collab.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.main }}>
                              {collab.avatar}
                            </Avatar>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {collab.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                            {collab.role}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {collab.tasksCompleted}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mr: 1 }}>
                              {collab.qualityScore}/5
                            </Typography>
                            {collab.qualityScore > 4.5 ? (
                              <FiTrendingUp color="#10B981" />
                            ) : collab.qualityScore > 4 ? (
                              <FiCheckCircle color="#3B82F6" />
                            ) : (
                              <FiTrendingDown color="#EF4444" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${collab.onTimeDelivery}%`}
                            size="small"
                            sx={{
                              backgroundColor: collab.onTimeDelivery > 90 ? '#ECFDF5' : collab.onTimeDelivery > 80 ? '#FEF3C7' : '#FEF2F2',
                              color: collab.onTimeDelivery > 90 ? '#10B981' : collab.onTimeDelivery > 80 ? '#D97706' : '#EF4444',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <LinearProgress
                            variant="determinate"
                            value={(collab.qualityScore / 5) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: collab.qualityScore > 4.5 ? '#10B981' : collab.qualityScore > 4 ? '#3B82F6' : '#EF4444',
                                borderRadius: 4
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default PerformanceMetrics;