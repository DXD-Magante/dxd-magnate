// PaymentHistory.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  Divider,
  Chip,
  IconButton,
  useMediaQuery,
  useTheme,
  Alert,
  Menu,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiFileText,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { format } from 'date-fns';

const PaymentHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const transactionsQuery = query(
          collection(db, "platform-transactions"),
          where("clientId", "==", user.uid),
        );
        
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM yyyy, hh:mm a') : 'N/A',
          shortDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM') : 'N/A',
          transactionNumber: `TXN-${doc.id.slice(0, 8).toUpperCase()}`
        }));

        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Failed to load payment history. Please try again.");
        setLoading(false);

      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    let results = transactions;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(txn => txn.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(txn => 
        txn.projectTitle?.toLowerCase().includes(term) ||
        txn.transactionNumber?.toLowerCase().includes(term) ||
        txn.paymentId?.toLowerCase().includes(term) ||
        txn.amount?.toString().includes(term)
      );
    }
    
    setFilteredTransactions(results);
  }, [searchTerm, statusFilter, transactions]);

  const handleDownload = (transaction) => {
    const content = `
      <html>
        <head>
          <title>Transaction ${transaction.transactionNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .title { font-size: 20px; font-weight: bold; margin: 20px 0; }
            .divider { border-top: 2px dashed #ddd; margin: 20px 0; }
            .details { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .detail-label { font-weight: bold; color: #64748b; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .status-badge { 
              background-color: ${transaction.status === 'completed' ? '#10B98120' : '#EF444420'}; 
              color: ${transaction.status === 'completed' ? '#10B981' : '#EF4444'}; 
              padding: 5px 10px; 
              border-radius: 20px; 
              font-weight: bold;
              display: inline-block;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">DXD Magnate</div>
            <div>10 Rue Eugène Hénaff, 93000 Bobigny, France</div>
            <div>Tax ID: 123456789</div>
          </div>
          
          <div class="title">TRANSACTION DETAILS</div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Transaction Number</div>
              <div>${transaction.transactionNumber}</div>
            </div>
            <div>
              <div class="detail-label">Date</div>
              <div>${transaction.formattedDate}</div>
            </div>
          </div>
          
          <div class="details">
            <div>
              <div class="detail-label">Payment Method</div>
              <div>${transaction.paymentMethod || 'Credit Card'}</div>
            </div>
            <div>
              <div class="detail-label">Payment ID</div>
              <div>${transaction.paymentId || 'N/A'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Project</div>
              <div>${transaction.projectTitle || 'N/A'}</div>
            </div>
            <div>
              <div class="detail-label">Type</div>
              <div>${transaction.projectType || 'Project Payment'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Amount</div>
              <div>₹${transaction.amount?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div class="detail-label">Currency</div>
              <div>${transaction.currency || 'INR'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="status-badge">
            ${transaction.status === 'completed' ? 
              '<FiCheckCircle style="margin-right: 5px;" /> COMPLETED' : 
              transaction.status === 'failed' ? 
              '<FiAlertCircle style="margin-right: 5px;" /> FAILED' : 
              '<FiClock style="margin-right: 5px;" /> PENDING'}
          </div>
          
          <div class="footer">
            <div>Thank you for your business!</div>
            <div style="margin-top: 5px;">This is an official transaction record from DXD Magnate</div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Transaction_${transaction.transactionNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = (transaction) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Transaction ${transaction.transactionNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .title { font-size: 20px; font-weight: bold; margin: 20px 0; }
            .divider { border-top: 2px dashed #ddd; margin: 20px 0; }
            .details { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .detail-label { font-weight: bold; color: #64748b; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .status-badge { 
              background-color: ${transaction.status === 'completed' ? '#10B98120' : '#EF444420'}; 
              color: ${transaction.status === 'completed' ? '#10B981' : '#EF4444'}; 
              padding: 5px 10px; 
              border-radius: 20px; 
              font-weight: bold;
              display: inline-block;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="header">
            <div class="logo">DXD Magnate</div>
            <div>10 Rue Eugène Hénaff, 93000 Bobigny, France</div>
            <div>Tax ID: 123456789</div>
          </div>
          
          <div class="title">TRANSACTION DETAILS</div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Transaction Number</div>
              <div>${transaction.transactionNumber}</div>
            </div>
            <div>
              <div class="detail-label">Date</div>
              <div>${transaction.formattedDate}</div>
            </div>
          </div>
          
          <div class="details">
            <div>
              <div class="detail-label">Payment Method</div>
              <div>${transaction.paymentMethod || 'Credit Card'}</div>
            </div>
            <div>
              <div class="detail-label">Payment ID</div>
              <div>${transaction.paymentId || 'N/A'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Project</div>
              <div>${transaction.projectTitle || 'N/A'}</div>
            </div>
            <div>
              <div class="detail-label">Type</div>
              <div>${transaction.projectType || 'Project Payment'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Amount</div>
              <div>₹${transaction.amount?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div class="detail-label">Currency</div>
              <div>${transaction.currency || 'INR'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="status-badge">
            ${transaction.status === 'completed' ? 
              '<FiCheckCircle style="margin-right: 5px;" /> COMPLETED' : 
              transaction.status === 'failed' ? 
              '<FiAlertCircle style="margin-right: 5px;" /> FAILED' : 
              '<FiClock style="margin-right: 5px;" /> PENDING'}
          </div>
          
          <div class="footer">
            <div>Thank you for your business!</div>
            <div style="margin-top: 5px;">This is an official transaction record from DXD Magnate</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = (value) => {
    setAnchorEl(null);
    if (value !== undefined) {
      setStatusFilter(value);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const transactionsQuery = query(
        collection(db, "platform-transactions"),
        where("clientId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM yyyy, hh:mm a') : 'N/A',
        shortDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM') : 'N/A',
        transactionNumber: `TXN-${doc.id.slice(0, 8).toUpperCase()}`
      }));

      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
    } catch (err) {
      console.error("Error refreshing transactions:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return { bg: '#10B98110', color: '#10B981', icon: <FiCheckCircle /> };
      case 'pending':
        return { bg: '#F59E0B10', color: '#F59E0B', icon: <FiRefreshCw /> };
      case 'failed':
        return { bg: '#EF444410', color: '#EF4444', icon: <FiAlertCircle /> };
      default:
        return { bg: '#64748B10', color: '#64748B', icon: <FiFileText /> };
    }
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Payment History
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading your payment history...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Payment History
          </Typography>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FiFileText size={24} style={{ marginRight: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              No Transactions Found
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            You don't have any payment transactions at this time.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Payment History
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View your complete transaction history and download receipts
      </Typography>

      {/* Filters and Search */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={2} mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch color="#64748B" />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: 'white',
              borderRadius: 1,
              '& fieldset': {
                borderColor: '#E2E8F0',
              },
            }
          }}
        />
        
        <Button
          variant="outlined"
          onClick={handleFilterClick}
          endIcon={<FiChevronDown />}
          startIcon={<FiFilter />}
          sx={{
            minWidth: 180,
            textTransform: 'none',
            borderColor: '#E2E8F0',
            color: '#1E293B',
            '&:hover': {
              borderColor: '#CBD5E1',
              backgroundColor: '#F8FAFC'
            }
          }}
        >
          {statusOptions.find(opt => opt.value === statusFilter)?.label || 'Filter'}
        </Button>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => handleFilterClose()}
          PaperProps={{
            sx: {
              mt: 1,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              borderRadius: 1,
              minWidth: 200
            }
          }}
        >
          {statusOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => handleFilterClose(option.value)}
              selected={statusFilter === option.value}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#F1F5F9'
                },
                '&:hover': {
                  backgroundColor: '#F8FAFC'
                }
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
        
        <Button
          variant="text"
          onClick={refreshData}
          startIcon={<FiRefreshCw />}
          sx={{
            textTransform: 'none',
            color: '#4F46E5',
            '&:hover': {
              backgroundColor: '#EEF2FF'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Transaction Summary Cards */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={3} mb={4}>
        <Card sx={{ flex: 1, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              TOTAL TRANSACTIONS
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {transactions.length}
              </Typography>
              <Avatar sx={{ bgcolor: '#4F46E510' }}>
                <FiFileText size={20} color="#4F46E5" />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              TOTAL AMOUNT
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                ₹{transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0).toLocaleString()}
              </Typography>
              <Avatar sx={{ bgcolor: '#10B98110' }}>
                <FiDollarSign size={20} color="#10B981" />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              LAST TRANSACTION
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {transactions[0]?.shortDate || 'N/A'}
              </Typography>
              <Avatar sx={{ bgcolor: '#F59E0B10' }}>
                <FiCalendar size={20} color="#F59E0B" />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Transactions Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Transaction #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const status = getStatusColor(transaction.status);
                
                return (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {transaction.transactionNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {transaction.projectTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {transaction.projectType}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <FiCalendar size={16} style={{ marginRight: 8, color: '#64748b' }} />
                        <Typography variant="body2">
                          {transaction.shortDate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <FiDollarSign size={16} style={{ marginRight: 8, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          ₹{transaction.amount?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={transaction.status.toUpperCase()} 
                        size="small"
                        sx={{ 
                          backgroundColor: status.bg,
                          color: status.color,
                          fontWeight: 'medium',
                          px: 1
                        }}
                        icon={status.icon}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FiDownload size={16} />}
                          onClick={() => handleDownload(transaction)}
                          sx={{ 
                            textTransform: 'none',
                            borderColor: '#E2E8F0',
                            '&:hover': { borderColor: '#CBD5E1' }
                          }}
                        >
                          Download
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FiPrinter size={16} />}
                          onClick={() => handlePrint(transaction)}
                          sx={{ 
                            textTransform: 'none',
                            borderColor: '#E2E8F0',
                            '&:hover': { borderColor: '#CBD5E1' }
                          }}
                        >
                          Print
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Empty State */}
      {filteredTransactions.length === 0 && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <FiSearch size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                No matching transactions found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PaymentHistory;