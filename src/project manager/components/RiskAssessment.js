import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  CircularProgress,
  Tooltip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@mui/material";
import {
  FiDollarSign,
  FiClock,
  FiCalendar,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiInfo
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { styled } from '@mui/material/styles';

const RiskAssessmentCard = styled(Paper)(({ theme, risklevel }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  borderLeft: `4px solid ${getRiskColor(risklevel)}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
  }
}));

const getRiskColor = (level) => {
  if (level <= 20) return '#10B981'; // green
  if (level <= 50) return '#F59E0B'; // amber
  return '#EF4444'; // red
};

const getRiskLabel = (level) => {
  if (level <= 20) return 'Low';
  if (level <= 50) return 'Medium';
  return 'High';
};

const RiskAssessmentSection = ({ projectId }) => {
  const [riskData, setRiskData] = useState({
    payment: { value: 0, weight: 0.35, weighted: 0 },
    tat: { value: 0, weight: 0.25, weighted: 0 },
    deadline: { value: 0, weight: 0.25, weighted: 0 },
    blockedTasks: { value: 0, weight: 0.15, weighted: 0 },
    overall: 0
  });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState({
    payment: '',
    tat: '',
    deadline: '',
    blockedTasks: ''
  });

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        setLoading(true);
        
        // Fetch project data
        const projectRef = doc(db, "dxd-magnate-projects", projectId);
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) return;

        const projectData = projectSnap.data();
        
        // Fetch tasks for the project
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("projectId", "==", projectId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Calculate all risks
        const payment = calculatePaymentRisk(projectData);
        const tat = calculateTatRisk(tasksData);
        const deadline = calculateDeadlineRisk(projectData, tasksData);
        const blockedTasks = calculateBlockedTasksRisk(tasksData);
        
        // Calculate weighted values
        const paymentWeighted = payment.value * 0.35;
        const tatWeighted = tat.value * 0.25;
        const deadlineWeighted = deadline.value * 0.25;
        const blockedTasksWeighted = blockedTasks.value * 0.15;
        
        // Calculate overall weighted risk
        const overallRisk = Math.min(100, Math.round(
          paymentWeighted + tatWeighted + deadlineWeighted + blockedTasksWeighted
        ));

        setRiskData({
          payment: { ...payment, weight: 0.35, weighted: paymentWeighted },
          tat: { ...tat, weight: 0.25, weighted: tatWeighted },
          deadline: { ...deadline, weight: 0.25, weighted: deadlineWeighted },
          blockedTasks: { ...blockedTasks, weight: 0.15, weighted: blockedTasksWeighted },
          overall: overallRisk
        });

        setCalculationDetails({
          payment: payment.details,
          tat: tat.details,
          deadline: deadline.details,
          blockedTasks: blockedTasks.details
        });
      } catch (error) {
        console.error("Error calculating risk data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchRiskData();
    }
  }, [projectId]);

  const calculatePaymentRisk = (projectData) => {
    let riskValue = 0;
    let details = '';
    
    // If payment is marked as paid
    if (projectData.paymentStatus === 'paid') {
      details = 'Payment status: Paid (0% risk)';
      return { value: 0, details };
    }
    
    const today = new Date();
    const startDate = new Date(projectData.startDate);
    
    // For completed projects without payment
    if (projectData.completedAt && projectData.paymentStatus !== 'paid') {
      riskValue = 100; // Full weight for unpaid completed projects
      details = 'Project completed but payment not received (100% risk)';
      return { value: riskValue, details };
    }
    
    // For ongoing projects without payment
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceStart > 7) {
      riskValue = 100; // Full weight if overdue by more than 7 days
      details = `Payment overdue by >7 days (100% risk)`;
    } 
    else if (daysSinceStart > 3) {
      riskValue = 80;
      details = `Payment overdue by 4-7 days (80% risk)`;
    }
    else if (daysSinceStart > 0) {
      riskValue = 50;
      details = `Payment overdue by 1-3 days (50% risk)`;
    }
    else {
      details = 'Payment not yet due (0% risk)';
    }
    
    return { value: riskValue, details };
  };

  const calculateTatRisk = (tasksData) => {
    if (tasksData.length === 0) {
      return { value: 0, details: 'No tasks available (0% risk)' };
    }
    
    const tasksWithTatViolation = tasksData.filter(task => {
      if (!task.dueDate) return false;
      
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      
      // Task is overdue and not done
      if (task.status !== 'Done' && today > dueDate) {
        return true;
      }
      
      // Task was completed late
      if (task.completedAt) {
        const completedAt = new Date(task.completedAt);
        return completedAt > dueDate;
      }
      
      return false;
    });
    
    const riskValue = Math.round((tasksWithTatViolation.length / tasksData.length) * 100);
    const details = `${tasksWithTatViolation.length} of ${tasksData.length} tasks had TAT violations (${riskValue}% risk)`;
    
    return { value: riskValue, details };
  };

  const calculateDeadlineRisk = (projectData, tasksData) => {
    if (!projectData.endDate) {
      return { value: 0, details: 'No deadline set (0% risk)' };
    }
    
    const today = new Date();
    const endDate = new Date(projectData.endDate);
    const daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    
    // Calculate completion percentage
    const completedTasks = tasksData.filter(task => task.status === 'Done').length;
    const completionPercentage = tasksData.length > 0 
      ? Math.round((completedTasks / tasksData.length) * 100)
      : 0;
    
    let riskValue = 0;
    let details = '';
    
    // Project is overdue and incomplete
    if (daysRemaining < 0 && completionPercentage < 100) {
      riskValue = 100; // Full weight for overdue projects
      details = `Project is overdue by ${Math.abs(daysRemaining)} days, only ${completionPercentage}% complete (100% risk)`;
    }
    // Project is due today or tomorrow and incomplete
    else if (daysRemaining <= 1 && completionPercentage < 100) {
      riskValue = 80;
      details = `1 day left, ${completionPercentage}% complete (80% risk)`;
    }
    // Project is due in 2-4 days and behind schedule
    else if (daysRemaining <= 4 && completionPercentage < 70) {
      riskValue = 60;
      details = `2-4 days left, ${completionPercentage}% complete (60% risk)`;
    }
    // Project is due in 5-7 days and behind schedule
    else if (daysRemaining <= 7 && completionPercentage < 50) {
      riskValue = 40;
      details = `5-7 days left, ${completionPercentage}% complete (40% risk)`;
    }
    else {
      details = `On track: ${daysRemaining} days left, ${completionPercentage}% complete (0% risk)`;
    }
    
    return { value: riskValue, details };
  };

  const calculateBlockedTasksRisk = (tasksData) => {
    if (tasksData.length === 0) {
      return { value: 0, details: 'No tasks available (0% risk)' };
    }
    
    // Only count explicitly blocked tasks, not overdue ones
    const blockedTasks = tasksData.filter(task => task.status === 'Blocked').length;
    
    const riskValue = Math.round((blockedTasks / tasksData.length) * 100);
    const details = `${blockedTasks} of ${tasksData.length} tasks blocked (${riskValue}% risk)`;
    
    return { value: riskValue, details };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box className="space-y-4">
      <Box className="flex items-center justify-between">
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Risk Assessment
        </Typography>
        <IconButton 
          size="small" 
          onClick={() => setExpanded(!expanded)}
          sx={{ color: '#64748b' }}
        >
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
        </IconButton>
      </Box>
      
      {/* Overall Risk Indicator */}
      <RiskAssessmentCard risklevel={riskData.overall}>
        <Box className="flex items-center justify-between mb-2">
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Overall Project Risk
          </Typography>
          <Box className="flex items-center">
            <Typography variant="body2" sx={{ 
              fontWeight: 'bold',
              color: getRiskColor(riskData.overall),
              mr: 1
            }}>
              {getRiskLabel(riskData.overall)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {riskData.overall}%
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={riskData.overall}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#E5E7EB',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundColor: getRiskColor(riskData.overall)
            }
          }}
        />
      </RiskAssessmentCard>
      
      <Collapse in={expanded}>
        <Box className="space-y-3">
          {/* Risk Calculation Breakdown */}
          <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Risk Calculation Formula
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Overall Risk = (Payment × 35%) + (TAT × 25%) + (Deadline × 25%) + (Blocked × 15%)
            </Typography>
            
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Factor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Risk Value</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Weight</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contribution</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>{riskData.payment.value}%</TableCell>
                  <TableCell>35%</TableCell>
                  <TableCell>{riskData.payment.weighted.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>TAT Violations</TableCell>
                  <TableCell>{riskData.tat.value}%</TableCell>
                  <TableCell>25%</TableCell>
                  <TableCell>{riskData.tat.weighted.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Deadline Proximity</TableCell>
                  <TableCell>{riskData.deadline.value}%</TableCell>
                  <TableCell>25%</TableCell>
                  <TableCell>{riskData.deadline.weighted.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Blocked Tasks</TableCell>
                  <TableCell>{riskData.blockedTasks.value}%</TableCell>
                  <TableCell>15%</TableCell>
                  <TableCell>{riskData.blockedTasks.weighted.toFixed(1)}%</TableCell>
                </TableRow>
                <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                  <TableCell>Total</TableCell>
                  <TableCell colSpan={2}></TableCell>
                  <TableCell>{riskData.overall}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* Detailed Risk Factors */}
          <Grid container spacing={2}>
            {/* Payment Risk */}
            <Grid item xs={12} sm={6}>
              <RiskAssessmentCard risklevel={riskData.payment.value}>
                <Box className="flex items-center justify-between mb-1">
                  <Box className="flex items-center">
                    <FiDollarSign size={16} className="mr-2" />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Payment Status
                    </Typography>
                    <Tooltip title={calculationDetails.payment}>
                      <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                        <FiInfo size={14} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 'bold',
                    color: getRiskColor(riskData.payment.value)
                  }}>
                    {riskData.payment.value}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={riskData.payment.value}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: getRiskColor(riskData.payment.value)
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  mt: 0.5,
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  Weight: 35% (High impact)
                </Typography>
              </RiskAssessmentCard>
            </Grid>
            
            {/* TAT Risk */}
            <Grid item xs={12} sm={6}>
              <RiskAssessmentCard risklevel={riskData.tat.value}>
                <Box className="flex items-center justify-between mb-1">
                  <Box className="flex items-center">
                    <FiClock size={16} className="mr-2" />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      TAT Violations
                    </Typography>
                    <Tooltip title={calculationDetails.tat}>
                      <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                        <FiInfo size={14} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 'bold',
                    color: getRiskColor(riskData.tat.value)
                  }}>
                    {riskData.tat.value}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={riskData.tat.value}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: getRiskColor(riskData.tat.value)
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  mt: 0.5,
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  Weight: 25% (Medium impact)
                </Typography>
              </RiskAssessmentCard>
            </Grid>
            
            {/* Deadline Risk */}
            <Grid item xs={12} sm={6}>
              <RiskAssessmentCard risklevel={riskData.deadline.value}>
                <Box className="flex items-center justify-between mb-1">
                  <Box className="flex items-center">
                    <FiCalendar size={16} className="mr-2" />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Deadline Proximity
                    </Typography>
                    <Tooltip title={calculationDetails.deadline}>
                      <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                        <FiInfo size={14} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 'bold',
                    color: getRiskColor(riskData.deadline.value)
                  }}>
                    {riskData.deadline.value}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={riskData.deadline.value}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: getRiskColor(riskData.deadline.value)
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  mt: 0.5,
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  Weight: 25% (Medium impact)
                </Typography>
              </RiskAssessmentCard>
            </Grid>
            
            {/* Blocked Tasks Risk */}
            <Grid item xs={12} sm={6}>
              <RiskAssessmentCard risklevel={riskData.blockedTasks.value}>
                <Box className="flex items-center justify-between mb-1">
                  <Box className="flex items-center">
                    <FiAlertTriangle size={16} className="mr-2" />
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Blocked Tasks
                    </Typography>
                    <Tooltip title={calculationDetails.blockedTasks}>
                      <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                        <FiInfo size={14} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 'bold',
                    color: getRiskColor(riskData.blockedTasks.value)
                  }}>
                    {riskData.blockedTasks.value}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={riskData.blockedTasks.value}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: getRiskColor(riskData.blockedTasks.value)
                    }
                  }}
                />
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  mt: 0.5,
                  color: '#64748b',
                  fontStyle: 'italic'
                }}>
                  Weight: 15% (Low impact)
                </Typography>
              </RiskAssessmentCard>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};

export default RiskAssessmentSection;