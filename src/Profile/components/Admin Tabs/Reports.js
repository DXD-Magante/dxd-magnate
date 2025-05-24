import React, { useState, useEffect } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, 
  Stepper, Step, StepLabel, StepContent, 
  FormControl, InputLabel, Select, MenuItem,
  TextField, Button, List, ListItem, Paper,
  FormControlLabel, Switch, CircularProgress,
  Snackbar, Alert
} from '@mui/material';
import { 
  FiFileText, FiCalendar, FiSettings, 
  FiDownload, FiEdit2, FiXCircle, FiPlus
} from 'react-icons/fi';
import { collection, getDocs, query, where, orderBy, addDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';
import { format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportPDF from './ReportPdf';

const ReportsTab = () => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('performance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [exportPDF, setExportPDF] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch recent and scheduled reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        
        const reportsQuery = query(
            collection(db, "reports"),
            where("type", "in", ["performance", "financial", "project"])
          );
          const adminReportsQuery = query(
            collection(db, "admin-reports"),
            where("type", "in", ["performance", "financial", "project"])
          );
          
          const [reportsSnapshot, adminReportsSnapshot] = await Promise.all([
            getDocs(reportsQuery),
            getDocs(adminReportsQuery)
          ]);
          
          const reportsData = [
            ...reportsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              formattedDate: doc.data().createdAt ? format(doc.data().createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'
            })),
            ...adminReportsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              formattedDate: doc.data().createdAt ? format(doc.data().createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'
            }))
          ].sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA; // Sort by newest first
          });
          
          setRecentReports(reportsData.slice(0, 4));
        
        // Fetch scheduled reports
        const scheduledQuery = query(
          collection(db, "scheduled-reports"),
          where("status", "==", "active")
        );
        const scheduledSnapshot = await getDocs(scheduledQuery);
        const scheduledData = scheduledSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          nextRun: doc.data().nextRun ? format(doc.data().nextRun.toDate(), 'MMM dd, yyyy') : 'N/A'
        }));
        setScheduledReports(scheduledData);
      } catch (error) {
        alert(error)
        console.error("Error fetching reports:", error);
        setSnackbar({
          open: true,
          message: "Failed to load reports",
          severity: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setGenerating(true);
      
      // Fetch projects data
      const projectsQuery = query(collection(db, "dxd-magnate-projects"));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Calculate active and completed projects
      const activeProjects = projectsSnapshot.docs.filter(
        doc => doc.data().status === "In progress"
      ).length;
      const completedProjects = projectsSnapshot.docs.filter(
        doc => doc.data().status === "Completed"
      ).length;

      // Fetch users data
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      
      // Fetch tasks data
      const tasksQuery = query(collection(db, "project-tasks"));
      const tasksSnapshot = await getDocs(tasksQuery);
      
      // Calculate task completion rate
      const totalTasks = tasksSnapshot.size;
      const completedTasks = tasksSnapshot.docs.filter(
        doc => doc.data().status === "Done"
      ).length;
      const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      // Prepare timeline data (filtered by date range if specified)
      const timeline = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(currentDate.getMonth() - i);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        const completedInMonth = projectsSnapshot.docs.filter(doc => {
          const project = doc.data();
          if (project.completionDate) {
            const completionDate = project.completionDate.toDate();
            return completionDate >= monthStart && completionDate <= monthEnd;
          }
          return false;
        }).length;
        
        timeline.push({
          name: monthName,
          completed: completedInMonth
        });
      }

      // Prepare task distribution by status
      const statusCounts = {};
      tasksSnapshot.forEach(doc => {
        const status = doc.data().status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      const distribution = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status]
      }));

      const metrics = {
        activeProjects,
        teamMembers: usersSnapshot.size,
        tasksTracked: totalTasks,
        projectsCompleted: completedProjects,
        taskCompletionRate: completionRate
      };
      
      setReportData({
        type: 'performance',
        title: 'Performance Metrics Report',
        data: {
          metrics,
          timeline,
          distribution
        },
        createdAt: new Date()
      });
      
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setSnackbar({
        open: true,
        message: "Failed to generate performance report",
        severity: "error"
      });
    } finally {
      setGenerating(false);
    }
  };

  const fetchFinancialData = async () => {
    try {
      setGenerating(true);
      
      // Fetch transactions
      const transactionsQuery = query(
        collection(db, "platform-transactions"),
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      // Filter by date range if specified and convert timestamps
      let filteredTransactions = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to Date object
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
        };
      });
  
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredTransactions = filteredTransactions.filter(txn => {
          if (!txn.timestamp) return false;
          return txn.timestamp >= start && txn.timestamp <= end;
        });
      }
      
      // Calculate totals
      const totalRevenue = filteredTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
      const totalProjects = filteredTransactions.length;
      const avgRevenue = totalProjects > 0 ? totalRevenue / totalProjects : 0;
      
      // Group by project type
      const revenueByType = {};
      filteredTransactions.forEach(txn => {
        const type = txn.projectType || 'Other';
        revenueByType[type] = (revenueByType[type] || 0) + (txn.amount || 0);
      });
      
      // Group by month
      const monthlyRevenue = {};
      filteredTransactions.forEach(txn => {
        if (!txn.timestamp) return;
        const monthYear = format(txn.timestamp, 'MMM yyyy');
        monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + (txn.amount || 0);
      });
  
      // Prepare the report data
      const reportData = {
        type: 'financial',
        title: 'Financial Summary Report',
        data: {
          totalRevenue,
          totalProjects,
          avgRevenue,
          revenueByType: Object.entries(revenueByType).map(([name, value]) => ({ name, value })),
          monthlyRevenue: Object.entries(monthlyRevenue).map(([name, value]) => ({ name, value })),
          transactions: filteredTransactions.map(txn => ({
            id: txn.id,
            clientName: txn.clientName,
            projectTitle: txn.projectTitle,
            amount: txn.amount,
            date: txn.timestamp ? format(txn.timestamp, 'yyyy-MM-dd') : 'N/A',
            status: txn.status
          }))
        },
        createdAt: new Date(),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        generatedBy: auth.currentUser?.uid || 'system'
      };
  
      // Save to Firestore
      const reportsCollection = collection(db, "admin-reports");
      await addDoc(reportsCollection, reportData);
  
      // Update local state
      setReportData(reportData);
      
      setSnackbar({
        open: true,
        message: "Financial report generated successfully",
        severity: "success"
      });
      
    } catch (error) {
      console.error("Error fetching financial data:", error);
      alert(error)
      setSnackbar({
        open: true,
        message: "Failed to generate financial report",
        severity: "error"
      });
    } finally {
      setGenerating(false);
    }
  };

  const fetchProjectStatusData = async () => {
    try {
      setGenerating(true);
      
      // Fetch projects
      const projectsQuery = query(collection(db, "dxd-magnate-projects"));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      // Filter by date range if specified
      let filteredProjects = projectsSnapshot.docs.map(doc => doc.data());
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredProjects = filteredProjects.filter(project => {
          const projectDate = project.createdAt.toDate();
          return projectDate >= start && projectDate <= end;
        });
      }
      
      // Calculate status distribution
      const statusCounts = {
        'In progress': 0,
        'Completed': 0,
        'Not started': 0,
        'Delayed': 0,
        'On Hold': 0
      };
      
      filteredProjects.forEach(project => {
        const status = project.status || 'Not started';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      // Calculate priority distribution
      const priorityCounts = {
        'High': 0,
        'Medium': 0,
        'Low': 0
      };
      
      filteredProjects.forEach(project => {
        const priority = project.priority || 'Medium';
        priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
      });
      
      // Get project managers performance
      const managers = {};
      filteredProjects.forEach(project => {
        const manager = project.projectManager || 'Unassigned';
        if (!managers[manager]) {
          managers[manager] = {
            total: 0,
            completed: 0,
            delayed: 0
          };
        }
        managers[manager].total++;
        if (project.status === 'Completed') managers[manager].completed++;
        if (project.status === 'Delayed') managers[manager].delayed++;
      });
      
      setReportData({
        type: 'project',
        title: 'Project Status Report',
        data: {
          totalProjects: filteredProjects.length,
          statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
          priorityDistribution: Object.entries(priorityCounts).map(([name, value]) => ({ name, value })),
          managersPerformance: Object.entries(managers).map(([name, stats]) => ({
            name,
            ...stats,
            completionRate: Math.round((stats.completed / stats.total) * 100) || 0
          }))
        },
        createdAt: new Date()
      });
      
    } catch (error) {
      console.error("Error fetching project data:", error);
      setSnackbar({
        open: true,
        message: "Failed to generate project report",
        severity: "error"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateReport = () => {
    switch (reportType) {
      case 'performance':
        return fetchPerformanceData();
      case 'financial':
        return fetchFinancialData();
      case 'project':
        return fetchProjectStatusData();
      default:
        return fetchPerformanceData();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (date) => {
    if (!date) return '';
    // Handle both Firestore Timestamp and JavaScript Date
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return jsDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 4 }}>
              Report Generation
            </Typography>
            
            <Stepper orientation="vertical">
              <Step active>
                <StepLabel 
                  icon={<FiFileText className="text-indigo-600" />}
                  sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}
                >
                  Select Report Type
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Report Type</InputLabel>
                      <Select
                        label="Report Type"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                      >
                        <MenuItem value="performance">Performance Metrics</MenuItem>
                        <MenuItem value="financial">Financial Summary</MenuItem>
                        <MenuItem value="project">Project Status</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel 
                  icon={<FiCalendar className="text-indigo-600" />}
                  sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}
                >
                  Set Date Range
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="End Date"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </StepContent>
              </Step>
              <Step active>
                <StepLabel 
                  icon={<FiSettings className="text-indigo-600" />}
                  sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}
                >
                  Customize Options
                </StepLabel>
                <StepContent>
                  <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControlLabel 
                      control={<Switch checked={includeCharts} onChange={(e) => setIncludeCharts(e.target.checked)} />} 
                      label="Include Charts" 
                    />
                    <FormControlLabel 
                      control={<Switch checked={includeDetails} onChange={(e) => setIncludeDetails(e.target.checked)} />} 
                      label="Include Detailed Metrics" 
                    />
                    <FormControlLabel 
                      control={<Switch checked={exportPDF} onChange={(e) => setExportPDF(e.target.checked)} />} 
                      label="Export as PDF" 
                    />
                  </Box>
                </StepContent>
              </Step>
            </Stepper>

            <Box sx={{ display: 'flex', justifyContent: 'end', mt: 4, gap: 2 }}>
              <Button 
                variant="outlined" 
                sx={{ 
                  borderColor: 'gray.300',
                  color: 'gray.700',
                  '&:hover': { backgroundColor: 'gray.50' }
                }}
              >
                Cancel
              </Button>
              {reportData && exportPDF ? (
                <PDFDownloadLink 
                  document={
                    <ReportPDF 
                      data={reportData} 
                      includeCharts={includeCharts} 
                      includeDetails={includeDetails} 
                    />
                  }
                  fileName={`${reportData.type}_report_${format(new Date(), 'yyyyMMdd')}.pdf`}
                >
                  {({ loading }) => (
                    <Button
                      variant="contained"
                      startIcon={<FiDownload />}
                      disabled={loading || generating}
                      sx={{
                        backgroundColor: '#4f46e5',
                        '&:hover': { backgroundColor: '#4338ca' }
                      }}
                    >
                      {loading ? 'Preparing PDF...' : 'Download PDF'}
                    </Button>
                  )}
                </PDFDownloadLink>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<FiDownload />}
                  onClick={generateReport}
                  disabled={generating}
                  sx={{
                    backgroundColor: '#4f46e5',
                    '&:hover': { backgroundColor: '#4338ca' }
                  }}
                >
                  {generating ? 'Generating...' : 'Generate Report'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 4 }}>
              Recent Reports
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
                {recentReports.map(report => (
                  <ListItem key={report.id}>
                    <Paper sx={{ width: '100%', p: 2, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {report.title || 'Untitled Report'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.formattedDate} • {report.type} • {report.size || 'N/A'}
                          </Typography>
                        </Box>
                        <Button 
                          size="small" 
                          variant="text" 
                          startIcon={<FiDownload size={14} />}
                          sx={{ color: '#4f46e5' }}
                        >
                          Download
                        </Button>
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 4 }}>
              Scheduled Reports
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <List sx={{ '& .MuiListItem-root': { px: 0 } }}>
                  {scheduledReports.map(report => (
                    <ListItem key={report.id}>
                      <Paper sx={{ width: '100%', p: 2, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {report.title || 'Untitled Report'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {report.frequency} • Next: {report.nextRun} • {report.recipients?.length || 0} recipients
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              size="small" 
                              variant="text" 
                              startIcon={<FiEdit2 size={14} />}
                              sx={{ color: 'gray.600' }}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="small" 
                              variant="text" 
                              startIcon={<FiXCircle size={14} />}
                              sx={{ color: 'red.600' }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    </ListItem>
                  ))}
                </List>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<FiPlus />}
                  sx={{ 
                    mt: 3,
                    borderColor: '#4f46e5',
                    color: '#4f46e5',
                    '&:hover': { backgroundColor: '#eef2ff' }
                  }}
                >
                  Schedule New Report
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default ReportsTab;