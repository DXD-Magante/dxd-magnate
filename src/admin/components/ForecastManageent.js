// ForecastManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Avatar, Chip, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, MenuItem, Select,
  InputLabel, FormControl, Divider, LinearProgress,
  Tooltip, IconButton, Checkbox, FormControlLabel,
  Grid
} from '@mui/material';
import { 
  FiTarget, FiPlus, FiEdit2, FiTrash2, FiSearch, 
  FiFilter, FiUsers, FiUser, FiCalendar, FiTrendingUp,
  FiDollarSign, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { 
  MdOutlineGroupWork, MdOutlineShowChart,
  MdOutlineBarChart, MdOutlinePieChart
} from 'react-icons/md';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { format } from 'date-fns';

const ForecastManagement = () => {
  const [forecasts, setForecasts] = useState([]);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [newForecast, setNewForecast] = useState({
    userId: '',
    userName: '',
    targetAmount: '',
    period: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    notes: '',
    isRecurring: false
  });
  const [bulkForecast, setBulkForecast] = useState({
    targetAmount: '',
    period: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    notes: '',
    isRecurring: false,
    selectedUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedForecast, setExpandedForecast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        
        // Fetch forecasts
        const forecastsSnapshot = await getDocs(collection(db, 'forecasts'));
        const forecastsData = forecastsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate?.toDate(),
          endDate: doc.data().endDate?.toDate()
        }));
        setForecasts(forecastsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewForecast(prev => ({ ...prev, [name]: value }));
  };

  const handleBulkInputChange = (e) => {
    const { name, value } = e.target;
    setBulkForecast(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId);
    setNewForecast(prev => ({
      ...prev,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`
    }));
  };

  const handleBulkUserSelect = (userId, isChecked) => {
    setBulkForecast(prev => {
      const selectedUsers = isChecked 
        ? [...prev.selectedUsers, userId]
        : prev.selectedUsers.filter(id => id !== userId);
      return { ...prev, selectedUsers };
    });
  };

  const handleSubmitForecast = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'forecasts'), {
        ...newForecast,
        startDate: new Date(newForecast.startDate),
        endDate: new Date(newForecast.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        progress: 0
      });
      
      // Refresh forecasts
      const snapshot = await getDocs(collection(db, 'forecasts'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate()
      }));
      setForecasts(data);
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding forecast:', error);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      const promises = bulkForecast.selectedUsers.map(async (userId) => {
        const user = users.find(u => u.id === userId);
        await addDoc(collection(db, 'forecasts'), {
          userId,
          userName: `${user.firstName} ${user.lastName}`,
          targetAmount: bulkForecast.targetAmount,
          period: bulkForecast.period,
          startDate: new Date(bulkForecast.startDate),
          endDate: new Date(bulkForecast.endDate),
          notes: bulkForecast.notes,
          isRecurring: bulkForecast.isRecurring,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          progress: 0
        });
      });
      
      await Promise.all(promises);
      
      // Refresh forecasts
      const snapshot = await getDocs(collection(db, 'forecasts'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate()
      }));
      setForecasts(data);
      setOpenBulkDialog(false);
      resetBulkForm();
    } catch (error) {
      console.error('Error adding bulk forecasts:', error);
    }
  };

  const handleDeleteForecast = async (id) => {
    if (window.confirm('Are you sure you want to delete this forecast?')) {
      try {
        await deleteDoc(doc(db, 'forecasts', id));
        setForecasts(forecasts.filter(f => f.id !== id));
      } catch (error) {
        console.error('Error deleting forecast:', error);
      }
    }
  };

  const resetForm = () => {
    setNewForecast({
      userId: '',
      userName: '',
      targetAmount: '',
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      notes: '',
      isRecurring: false
    });
  };

  const resetBulkForm = () => {
    setBulkForecast({
      targetAmount: '',
      period: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
      notes: '',
      isRecurring: false,
      selectedUsers: []
    });
  };

  const toggleExpandForecast = (id) => {
    setExpandedForecast(expandedForecast === id ? null : id);
  };

  const filteredForecasts = forecasts.filter(forecast => {
    const matchesSearch = forecast.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = filterPeriod === 'all' || forecast.period === filterPeriod;
    const matchesUser = filterUser === 'all' || forecast.userId === filterUser;
    return matchesSearch && matchesPeriod && matchesUser;
  });

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'warning';
    if (progress >= 50) return 'info';
    return 'error';
  };

  const getPeriodIcon = (period) => {
    switch(period) {
      case 'weekly': return <FiCalendar className="text-blue-500" />;
      case 'monthly': return <MdOutlineBarChart className="text-indigo-500" />;
      case 'quarterly': return <MdOutlineShowChart className="text-purple-500" />;
      case 'yearly': return <MdOutlinePieChart className="text-green-500" />;
      default: return <FiCalendar className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <LinearProgress className="w-full max-w-md" />
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <Box className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <Typography variant="h4" className="font-bold text-gray-800">
          <FiTrendingUp className="inline mr-2" />
          Forecast Management
        </Typography>
        <Box className="flex gap-3 mt-4 md:mt-0">
          <Button
            variant="contained"
            startIcon={<FiUser />}
            onClick={() => setOpenDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Individual Forecast
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiUsers />}
            onClick={() => setOpenBulkDialog(true)}
            className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
          >
            Bulk Forecast
          </Button>
        </Box>
      </Box>

      {/* Filters Section */}
      <Paper className="p-4 mb-6 rounded-lg shadow-sm">
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search by user..."
              InputProps={{
                startAdornment: <FiSearch className="text-gray-400 mr-2" />
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Period</InputLabel>
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                label="Filter by Period"
              >
                <MenuItem value="all">All Periods</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by User</InputLabel>
              <Select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                label="Filter by User"
              >
                <MenuItem value="all">All Users</MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FiFilter />}
              onClick={() => {
                setSearchTerm('');
                setFilterPeriod('all');
                setFilterUser('all');
              }}
              className="text-gray-600 border-gray-300"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Forecasts Table */}
      {filteredForecasts.length === 0 ? (
        <Paper className="p-8 text-center rounded-lg shadow-sm">
          <FiTarget className="mx-auto text-4xl text-gray-400 mb-4" />
          <Typography variant="h6" className="text-gray-600 mb-2">
            No forecasts found
          </Typography>
          <Typography variant="body2" className="text-gray-500 mb-4">
            {searchTerm || filterPeriod !== 'all' || filterUser !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first forecast to get started'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => setOpenDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Add Forecast
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} className="rounded-lg shadow-sm">
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell className="font-semibold">User</TableCell>
                <TableCell className="font-semibold">Target</TableCell>
                <TableCell className="font-semibold">Period</TableCell>
                <TableCell className="font-semibold">Progress</TableCell>
                <TableCell className="font-semibold">Date Range</TableCell>
                <TableCell className="font-semibold text-right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredForecasts.map((forecast) => (
                <React.Fragment key={forecast.id}>
                  <TableRow hover>
                    <TableCell>
                      <Box className="flex items-center gap-3">
                        <Avatar className="bg-indigo-100 text-indigo-600">
                          {forecast.userName?.charAt(0) || 'U'}
                        </Avatar>
                        <Typography className="font-medium">
                          {forecast.userName || 'Unknown User'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography className="font-bold">
                        ${parseInt(forecast.targetAmount).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getPeriodIcon(forecast.period)}
                        label={forecast.period?.charAt(0).toUpperCase() + forecast.period?.slice(1)}
                        className="bg-blue-50 text-blue-700"
                      />
                    </TableCell>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <LinearProgress
                          variant="determinate"
                          value={forecast.progress || 0}
                          color={getProgressColor(forecast.progress || 0)}
                          className="w-full rounded-full h-2"
                        />
                        <Typography variant="body2" className="text-gray-600">
                          {forecast.progress || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(forecast.startDate, 'MMM d, yyyy')} - {format(forecast.endDate, 'MMM d, yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box className="flex justify-end gap-2">
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={() => toggleExpandForecast(forecast.id)}
                            className="text-gray-500 hover:bg-gray-100"
                          >
                            {expandedForecast === forecast.id ? <FiChevronUp /> : <FiChevronDown />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small"
                            onClick={() => handleDeleteForecast(forecast.id)}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                  {expandedForecast === forecast.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-gray-50">
                        <Box className="p-4">
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="subtitle2" className="text-gray-500 mb-1">
                                NOTES
                              </Typography>
                              <Typography variant="body2" className="text-gray-800">
                                {forecast.notes || 'No notes provided'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="subtitle2" className="text-gray-500 mb-1">
                                RECURRING
                              </Typography>
                              <Chip
                                label={forecast.isRecurring ? 'Yes' : 'No'}
                                color={forecast.isRecurring ? 'success' : 'default'}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={6} md={3}>
                              <Typography variant="subtitle2" className="text-gray-500 mb-1">
                                CREATED ON
                              </Typography>
                              <Typography variant="body2" className="text-gray-800">
                                {forecast.createdAt ? format(forecast.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Individual Forecast Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-gray-800 border-b pb-3">
          <FiUser className="inline mr-2" />
          Create Individual Forecast
        </DialogTitle>
        <DialogContent className="py-4">
          <FormControl fullWidth size="small" className="mb-4">
            <InputLabel>Select User</InputLabel>
            <Select
              label="Select User"
              value={newForecast.userId}
              onChange={(e) => handleUserSelect(e.target.value)}
              required
            >
              {users.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  <Box className="flex items-center gap-3">
                    <Avatar className="w-6 h-6 text-xs bg-indigo-100 text-indigo-600">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </Avatar>
                    {user.firstName} {user.lastName}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Target Amount ($)"
            variant="outlined"
            size="small"
            type="number"
            name="targetAmount"
            value={newForecast.targetAmount}
            onChange={handleInputChange}
            className="mb-4"
            required
            InputProps={{
              startAdornment: <FiDollarSign className="text-gray-400 mr-2" />
            }}
          />

          <FormControl fullWidth size="small" className="mb-4">
            <InputLabel>Forecast Period</InputLabel>
            <Select
              label="Forecast Period"
              name="period"
              value={newForecast.period}
              onChange={handleInputChange}
              required
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2} className="mb-4">
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                name="startDate"
                value={newForecast.startDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                name="endDate"
                value={newForecast.endDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: newForecast.startDate
                }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Notes (Optional)"
            variant="outlined"
            size="small"
            name="notes"
            value={newForecast.notes}
            onChange={handleInputChange}
            className="mb-3"
            multiline
            rows={3}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={newForecast.isRecurring}
                onChange={(e) => setNewForecast(prev => ({ ...prev, isRecurring: e.target.checked }))}
                color="primary"
              />
            }
            label="Set as recurring forecast"
          />
        </DialogContent>
        <DialogActions className="border-t pt-3 px-4">
          <Button 
            variant="outlined" 
            onClick={() => {
              setOpenDialog(false);
              resetForm();
            }}
            className="text-gray-600 border-gray-300"
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitForecast}
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={!newForecast.userId || !newForecast.targetAmount || !newForecast.period}
          >
            Create Forecast
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Forecast Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle className="font-bold text-gray-800 border-b pb-3">
          <FiUsers className="inline mr-2" />
          Create Bulk Forecasts
        </DialogTitle>
        <DialogContent className="py-4">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" className="font-medium mb-3">
                Select Users
              </Typography>
              <Paper className="p-3 overflow-auto" style={{ maxHeight: '300px' }}>
                {users.map(user => (
                  <Box key={user.id} className="mb-2 last:mb-0">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={bulkForecast.selectedUsers.includes(user.id)}
                          onChange={(e) => handleBulkUserSelect(user.id, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box className="flex items-center gap-3">
                          <Avatar className="w-6 h-6 text-xs bg-indigo-100 text-indigo-600">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </Avatar>
                          <span>
                            {user.firstName} {user.lastName}
                          </span>
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Target Amount ($)"
                variant="outlined"
                size="small"
                type="number"
                name="targetAmount"
                value={bulkForecast.targetAmount}
                onChange={handleBulkInputChange}
                className="mb-4"
                required
                InputProps={{
                  startAdornment: <FiDollarSign className="text-gray-400 mr-2" />
                }}
              />

              <FormControl fullWidth size="small" className="mb-4">
                <InputLabel>Forecast Period</InputLabel>
                <Select
                  label="Forecast Period"
                  name="period"
                  value={bulkForecast.period}
                  onChange={handleBulkInputChange}
                  required
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>

              <Grid container spacing={2} className="mb-4">
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    size="small"
                    name="startDate"
                    value={bulkForecast.startDate}
                    onChange={handleBulkInputChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    size="small"
                    name="endDate"
                    value={bulkForecast.endDate}
                    onChange={handleBulkInputChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      min: bulkForecast.startDate
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Notes (Optional)"
                variant="outlined"
                size="small"
                name="notes"
                value={bulkForecast.notes}
                onChange={handleBulkInputChange}
                className="mb-3"
                multiline
                rows={3}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={bulkForecast.isRecurring}
                    onChange={(e) => setBulkForecast(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Set as recurring forecast"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="border-t pt-3 px-4">
          <Button 
            variant="outlined" 
            onClick={() => {
              setOpenBulkDialog(false);
              resetBulkForm();
            }}
            className="text-gray-600 border-gray-300"
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleBulkSubmit}
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={!bulkForecast.selectedUsers.length || !bulkForecast.targetAmount || !bulkForecast.period}
          >
            Create Forecasts ({bulkForecast.selectedUsers.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForecastManagement;