// MonthlyTargetManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Dialog, 
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Chip, IconButton
} from '@mui/material';
import { 
  FiTarget, FiPlus, FiEdit2, FiTrash2, 
  FiCalendar, FiTrendingUp, FiCheckCircle, 
  FiDollarSign
} from 'react-icons/fi';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { styled } from '@mui/material/styles';

const departments = ['Sales', 'Marketing', 'Development', 'Support', 'Operations'];
const months = [
  'January', 'February', 'March', 'April', 
  'May', 'June', 'July', 'August', 
  'September', 'October', 'November', 'December'
];

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.grey[100],
}));

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ProgressCell = ({ value, target }) => {
  const progress = Math.min(Math.round((value / target) * 100), 100);
  const status = progress >= 100 ? 'success' : progress >= 75 ? 'warning' : 'error';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          color={status}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        {progress}%
      </Typography>
    </Box>
  );
};

const MonthlyTargetManagement = () => {
  const [targets, setTargets] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    month: '',
    year: new Date().getFullYear().toString(),
    target: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'monthly-target'));
      const targetsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt // Keep as Firestore timestamp
      }));
      setTargets(targetsData);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (target = null) => {
    if (target) {
      setCurrentTarget(target.id);
      setFormData({
        department: target.department,
        month: target.month,
        year: target.year,
        target: target.target
      });
    } else {
      setCurrentTarget(null);
      setFormData({
        department: '',
        month: '',
        year: new Date().getFullYear().toString(),
        target: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentTarget) {
        await updateDoc(doc(db, 'monthly-target', currentTarget), {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'monthly-target'), {
          ...formData,
          createdAt: new Date()
        });
      }
      fetchTargets();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving target:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'monthly-target', id));
      fetchTargets();
    } catch (error) {
      console.error('Error deleting target:', error);
    }
  };

  const getStatus = (target) => {
    // This is a placeholder - implement actual progress calculation
    const progress = Math.random() * 120; // Random for demo
    if (progress >= 100) return 'Achieved';
    if (progress >= 75) return 'On Track';
    return 'Needs Attention';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Achieved': return 'success';
      case 'On Track': return 'warning';
      default: return 'error';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4 
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <FiTarget style={{ marginRight: '12px' }} />
          Monthly Targets
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          onClick={() => handleOpenDialog()}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            py: 1
          }}
        >
          Add Target
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <StyledTableCell>Department</StyledTableCell>
                <StyledTableCell>Month</StyledTableCell>
                <StyledTableCell>Year</StyledTableCell>
                <StyledTableCell>Target ($)</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell>Progress</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.map((target) => (
                <TableRow key={target.id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{target.department}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FiCalendar style={{ marginRight: '8px', color: '#64748b' }} />
                      {target.month}
                    </Box>
                  </TableCell>
                  <TableCell>{target.year}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    ${parseInt(target.target).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {formatDate(target.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ProgressCell 
                      value={Math.random() * parseInt(target.target)} 
                      target={parseInt(target.target)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatus(target)}
                      color={getStatusColor(getStatus(target))}
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(target)}>
                      <FiEdit2 size={18} color="#4f46e5" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(target.id)}>
                      <FiTrash2 size={18} color="#ef4444" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {currentTarget ? 'Edit Target' : 'Add New Target'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                label="Department"
                required
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  name="month"
                  value={formData.month}
                  onChange={handleInputChange}
                  label="Month"
                  required
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  label="Year"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                    <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Target Amount ($)"
              name="target"
              type="number"
              value={formData.target}
              onChange={handleInputChange}
              required
              InputProps={{
                startAdornment: (
                  <FiDollarSign style={{ marginRight: '8px', color: '#64748b' }} />
                ),
              }}
              sx={{ mb: 3 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDialog} 
            sx={{ 
              color: '#64748b',
              '&:hover': { backgroundColor: 'rgba(100, 116, 139, 0.08)' }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            onClick={handleSubmit}
            sx={{
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1
            }}
          >
            {currentTarget ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonthlyTargetManagement;