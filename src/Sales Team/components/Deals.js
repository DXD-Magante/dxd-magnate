import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Tabs, Tab, 
  Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, 
  TableRow, Chip, Button, Badge,
  Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Divider,
  LinearProgress, Grid,
  CircularProgress
} from '@mui/material';
import { 
  FiPlus, FiFilter, FiDownload, 
  FiSearch, FiEdit2, FiTrash2,
  FiChevronRight, FiClock, FiDollarSign
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { FaArrowAltCircleDown,  } from 'react-icons/fa';

const DealsDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDeal, setCurrentDeal] = useState(null);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const userId = auth.currentUser.uid;
        const q = query(
          collection(db, 'leads'),
          where('assignedTo', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const dealsData = [];
          querySnapshot.forEach((doc) => {
            const lead = doc.data();
            dealsData.push({
              id: doc.id,
              name: `${lead.fullName} - ${lead.service}`,
              value: lead.budget ? parseInt(lead.budget) : 0,
              stage: lead.status,
              probability: calculateProbability(lead.status),
              expectedClose: lead.expectedCloseDate || '',
              owner: "You", // Since it's assigned to this user
              lastActivity: lead.lastUpdated?.toDate().toISOString().split('T')[0] || '',
              ...lead
            });
          });
          setDeals(dealsData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching deals:', err);
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const calculateProbability = (status) => {
    switch (status) {
      case 'new': return 10;
      case 'contacted': return 30;
      case 'proposal-sent': return 50;
      case 'negotiation': return 70;
      case 'closed-won': return 100;
      case 'closed-lost': return 0;
      default: return 20;
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditDeal = (deal) => {
    setCurrentDeal(deal);
    setOpenDialog(true);
  };

  const filteredDeals = () => {
    switch (tabValue) {
      case 1: // Active
        return deals.filter(deal => !['closed-won', 'closed-lost'].includes(deal.stage));
      case 2: // Closed Won
        return deals.filter(deal => deal.stage === 'closed-won');
      case 3: // Closed Lost
        return deals.filter(deal => deal.stage === 'closed-lost');
      default: // All Deals
        return deals;
    }
  };

  const calculatePipelineStats = () => {
    const activeDeals = filteredDeals();
    const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = activeDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
    
    const wonDeals = deals.filter(deal => deal.stage === 'closed-won').length;
    const lostDeals = deals.filter(deal => deal.stage === 'closed-lost').length;
    const winRate = wonDeals + lostDeals > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;

    return {
      totalValue,
      weightedValue,
      winRate
    };
  };

  const stats = calculatePipelineStats();

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Deal Pipeline</Typography>
        <Button 
          variant="contained" 
          startIcon={<FiPlus />}
          onClick={() => handleEditDeal(null)}
        >
          Add New Deal
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Deals" />
          <Tab label="Active" />
          <Tab label="Closed Won" />
          <Tab label="Closed Lost" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Pipeline Value</Typography>
          <Typography variant="h4"> ₹{stats.totalValue.toLocaleString()}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Weighted Value</Typography>
          <Typography variant="h4"> ₹{stats.weightedValue.toLocaleString()}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Win Rate</Typography>
          <Typography variant="h4">{stats.winRate.toFixed(0)}%</Typography>
        </Paper>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Deal Name</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Stage</TableCell>
              <TableCell>Probability</TableCell>
              <TableCell>Expected Close</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredDeals().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No deals found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals().map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>{deal.name}</TableCell>
                  <TableCell> ₹{deal.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={deal.stage} 
                      color={
                        deal.stage === "closed-won" ? "success" : 
                        deal.stage === "closed-lost" ? "error" : "primary"
                      } 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate" 
                          value={deal.probability} 
                          sx={{ height: 6, borderRadius: 3 }} 
                        />
                      </Box>
                      <Typography variant="body2">{deal.probability}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{deal.expectedClose}</TableCell>
                  <TableCell>{deal.owner}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => handleEditDeal(deal)}>
                      <FiEdit2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Deal Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{currentDeal ? "Edit Deal" : "Create New Deal"}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Deal Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Deal Name" 
                  variant="outlined" 
                  defaultValue={currentDeal?.name || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  fullWidth 
                  label="Company" 
                  variant="outlined" 
                  defaultValue={currentDeal?.company || ''}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  fullWidth 
                  label="Value" 
                  variant="outlined" 
                  type="number" 
                  defaultValue={currentDeal?.value || ''}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  fullWidth 
                  label="Probability (%)" 
                  variant="outlined" 
                  type="number" 
                  defaultValue={currentDeal?.probability || ''}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  fullWidth 
                  label="Expected Close Date" 
                  variant="outlined" 
                  type="date" 
                  defaultValue={currentDeal?.expectedClose || ''}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="subtitle1" gutterBottom>Deal Stage</Typography>
            {/* Stage selection component */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            {currentDeal ? "Update Deal" : "Create Deal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DealsDashboard;