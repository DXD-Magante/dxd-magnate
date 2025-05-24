import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Button,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Alert,
  Badge,
  Tabs,
  Tab,
  
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
  FiUser,
  FiMail,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiEdit,
  FiTrash2,
  FiEye,
  FiPlus,
  FiAlertCircle
} from 'react-icons/fi';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { format } from 'date-fns';

const BillingInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [filterType, setFilterType] = useState("status")
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Status options for filtering
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' }
  ];

  // Type options for filtering
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'project_payment', label: 'Project Payment' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'service_fee', label: 'Service Fee' }
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesQuery = query(
          collection(db, "platform-transactions"),
          orderBy("timestamp", "desc")
        );
        
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM yyyy, hh:mm a') : 'N/A',
          shortDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM') : 'N/A',
        }));

        setInvoices(invoicesData);
        setFilteredInvoices(invoicesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to load invoices. Please try again.");
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  useEffect(() => {
    let results = invoices;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(inv => inv.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      results = results.filter(inv => inv.type === typeFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(inv => 
        inv.clientName?.toLowerCase().includes(term) ||
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.projectTitle?.toLowerCase().includes(term) ||
        inv.amount?.toString().includes(term)
      );
    }
    
    setFilteredInvoices(results);
  }, [searchTerm, statusFilter, typeFilter, invoices]);

  const handleDownload = (invoice) => {
    const invoiceContent = `
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .company-info { margin-bottom: 30px; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .client-info { margin-bottom: 20px; }
            .details { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; }
            .status-badge { 
              background-color: ${invoice.status === 'completed' ? '#10B98120' : '#EF444420'}; 
              color: ${invoice.status === 'completed' ? '#10B981' : '#EF4444'}; 
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
            <div>
              <h1>DXD Magnate</h1>
              <p>10 Rue Eugène Hénaff<br>93000 Bobigny, France<br>Tax ID: 123456789</p>
            </div>
            <div>
              <h2 class="invoice-title">INVOICE</h2>
              <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoice.formattedDate}</p>
            </div>
          </div>
          
          <div class="client-info">
            <h3>Bill To:</h3>
            <p>${invoice.clientName}<br>
            ${invoice.clientEmail}</p>
          </div>
          
          <div class="details">
            <p><strong>Project:</strong> ${invoice.projectTitle}</p>
            <p><strong>Payment ID:</strong> ${invoice.paymentId || 'N/A'}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.projectTitle} - ${invoice.type.replace('_', ' ')}</td>
                <td>₹${invoice.amount.toLocaleString()}</td>
              </tr>
              ${invoice.platformFee > 0 ? `
              <tr>
                <td>Platform Fee</td>
                <td>₹${invoice.platformFee.toLocaleString()}</td>
              </tr>
              ` : ''}
              ${invoice.taxAmount > 0 ? `
              <tr>
                <td>Tax</td>
                <td>₹${invoice.taxAmount.toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr>
                <td><strong>Total</strong></td>
                <td class="total">₹${(invoice.amount + (invoice.platformFee || 0) + (invoice.taxAmount || 0)).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="status-badge">
            ${invoice.status === 'completed' ? 
              '<FiCheckCircle style="margin-right: 5px;" /> COMPLETED' : 
              invoice.status === 'failed' ? 
              '<FiAlertCircle style="margin-right: 5px;" /> FAILED' : 
              '<FiClock style="margin-right: 5px;" /> PENDING'}
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Payment terms: Due upon receipt</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .company-info { margin-bottom: 30px; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .client-info { margin-bottom: 20px; }
            .details { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; }
            .status-badge { 
              background-color: ${invoice.status === 'completed' ? '#10B98120' : '#EF444420'}; 
              color: ${invoice.status === 'completed' ? '#10B981' : '#EF4444'}; 
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
            <div>
              <h1>DXD Magnate</h1>
              <p>10 Rue Eugène Hénaff<br>93000 Bobigny, France<br>Tax ID: 123456789</p>
            </div>
            <div>
              <h2 class="invoice-title">INVOICE</h2>
              <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoice.formattedDate}</p>
            </div>
          </div>
          
          <div class="client-info">
            <h3>Bill To:</h3>
            <p>${invoice.clientName}<br>
            ${invoice.clientEmail}</p>
          </div>
          
          <div class="details">
            <p><strong>Project:</strong> ${invoice.projectTitle}</p>
            <p><strong>Payment ID:</strong> ${invoice.paymentId || 'N/A'}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.projectTitle} - ${invoice.type.replace('_', ' ')}</td>
                <td>₹${invoice.amount.toLocaleString()}</td>
              </tr>
              ${invoice.platformFee > 0 ? `
              <tr>
                <td>Platform Fee</td>
                <td>₹${invoice.platformFee.toLocaleString()}</td>
              </tr>
              ` : ''}
              ${invoice.taxAmount > 0 ? `
              <tr>
                <td>Tax</td>
                <td>₹${invoice.taxAmount.toLocaleString()}</td>
              </tr>
              ` : ''}
              <tr>
                <td><strong>Total</strong></td>
                <td class="total">₹${(invoice.amount + (invoice.platformFee || 0) + (invoice.taxAmount || 0)).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="status-badge">
            ${invoice.status === 'completed' ? 
              '<FiCheckCircle style="margin-right: 5px;" /> COMPLETED' : 
              invoice.status === 'failed' ? 
              '<FiAlertCircle style="margin-right: 5px;" /> FAILED' : 
              '<FiClock style="margin-right: 5px;" /> PENDING'}
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Payment terms: Due upon receipt</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = (filterType, value) => {
    setAnchorEl(null);
    if (value !== undefined) {
      if (filterType === 'status') {
        setStatusFilter(value);
      } else if (filterType === 'type') {
        setTypeFilter(value);
      }
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const invoicesQuery = query(
        collection(db, "platform-transactions"),
        orderBy("timestamp", "desc")
      );
      
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM yyyy, hh:mm a') : 'N/A',
        shortDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM') : 'N/A',
      }));

      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);
    } catch (err) {
      console.error("Error refreshing invoices:", err);
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

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Billing & Invoices
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading invoices...
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
            Billing & Invoices
          </Typography>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="space-y-6">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Billing & Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' }
          }}
        >
          Create Invoice
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage all client invoices and billing records
      </Typography>

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          mb: 3
        }}
      >
        <Tab label="All Invoices" />
        <Tab label="Pending" />
        <Tab label="Completed" />
        <Tab label="Failed" />
      </Tabs>

      {/* Filters and Search */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={2} mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search invoices..."
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
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
            setFilterType('status');
          }}
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
          {statusOptions.find(opt => opt.value === statusFilter)?.label || 'Status'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
            setFilterType('type');
          }}
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
          {typeOptions.find(opt => opt.value === typeFilter)?.label || 'Type'}
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
          {(filterType === 'status' ? statusOptions : typeOptions).map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => handleFilterClose(filterType, option.value)}
              selected={
                (filterType === 'status' ? statusFilter : typeFilter) === option.value
              }
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

      {/* Summary Cards */}
      <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={3} mb={4}>
        <Card sx={{ flex: 1, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              TOTAL INVOICES
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {invoices.length}
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
              TOTAL REVENUE
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                ₹{invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
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
              PENDING INVOICES
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#F59E0B' }}>
                {invoices.filter(inv => inv.status === 'pending').length}
              </Typography>
              <Avatar sx={{ bgcolor: '#F59E0B10' }}>
                <FiRefreshCw size={20} color="#F59E0B" />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Invoices Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map((invoice) => {
                const status = getStatusColor(invoice.status);
                
                return (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {invoice.invoiceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {invoice.clientName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {invoice.clientEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {invoice.projectTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {invoice.projectType}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <FiCalendar size={16} style={{ marginRight: 8, color: '#64748b' }} />
                        <Typography variant="body2">
                          {invoice.shortDate}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <FiDollarSign size={16} style={{ marginRight: 8, color: '#64748b' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          ₹{invoice.amount?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status.toUpperCase()} 
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
                        <IconButton 
                          size="small"
                          onClick={() => handleViewDetails(invoice)}
                          sx={{ 
                            backgroundColor: '#EFF6FF',
                            '&:hover': { backgroundColor: '#DBEAFE' }
                          }}
                        >
                          <FiEye size={16} color="#3B82F6" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handleDownload(invoice)}
                          sx={{ 
                            backgroundColor: '#EFF6FF',
                            '&:hover': { backgroundColor: '#DBEAFE' }
                          }}
                        >
                          <FiDownload size={16} color="#3B82F6" />
                        </IconButton>
                        <IconButton 
                          size="small"
                          onClick={() => handlePrint(invoice)}
                          sx={{ 
                            backgroundColor: '#F5F3FF',
                            '&:hover': { backgroundColor: '#EDE9FE' }
                          }}
                        >
                          <FiPrinter size={16} color="#8B5CF6" />
                        </IconButton>
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
      {filteredInvoices.length === 0 && (
        <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <FiSearch size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                No matching invoices found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Invoice Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedInvoice?.invoiceNumber}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box>
              <Box display="flex" justifyContent="space-between" mb={4}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    BILL FROM
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    DXD Magnate
                  </Typography>
                  <Typography variant="body2">
                    10 Rue Eugène Hénaff
                  </Typography>
                  <Typography variant="body2">
                    93000 Bobigny, France
                  </Typography>
                  <Typography variant="body2">
                    Tax ID: 123456789
                  </Typography>
                </Box>
                
                <Box textAlign="right">
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    BILL TO
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {selectedInvoice.clientName}
                  </Typography>
                  <Typography variant="body2">
                    {selectedInvoice.clientEmail}
                  </Typography>
                  <Typography variant="body2">
                    Client ID: {selectedInvoice.clientId}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" justifyContent="space-between" mb={3}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    INVOICE DATE
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoice.formattedDate}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>
                    STATUS
                  </Typography>
                  <Chip 
                    label={selectedInvoice.status.toUpperCase()} 
                    size="small"
                    sx={{ 
                      backgroundColor: getStatusColor(selectedInvoice.status).bg,
                      color: getStatusColor(selectedInvoice.status).color,
                      fontWeight: 'bold',
                      px: 1
                    }}
                    icon={getStatusColor(selectedInvoice.status).icon}
                  />
                </Box>
              </Box>
              
              <Box mb={4}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  PROJECT DETAILS
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {selectedInvoice.projectTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedInvoice.projectType}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Project ID: {selectedInvoice.projectId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Project Manager: {selectedInvoice.projectManager}
                </Typography>
              </Box>
              
              <TableContainer component={Paper} sx={{ boxShadow: 'none', mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        {selectedInvoice.projectTitle} - {selectedInvoice.type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        ₹{selectedInvoice.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {selectedInvoice.platformFee > 0 && (
                      <TableRow>
                        <TableCell>Platform Fee</TableCell>
                        <TableCell>₹{selectedInvoice.platformFee.toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {selectedInvoice.taxAmount > 0 && (
                      <TableRow>
                        <TableCell>Tax</TableCell>
                        <TableCell>₹{selectedInvoice.taxAmount.toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        ₹{(selectedInvoice.amount + (selectedInvoice.platformFee || 0) + (selectedInvoice.taxAmount || 0)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  PAYMENT DETAILS
                </Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Payment Method:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {selectedInvoice.paymentMethod || 'Credit Card'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Payment ID:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {selectedInvoice.paymentId || 'N/A'}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Currency:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {selectedInvoice.currency || 'INR'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              color: '#64748B',
              '&:hover': { backgroundColor: '#F1F5F9' }
            }}
          >
            Close
          </Button>
          <Button 
            variant="contained"
            onClick={() => handlePrint(selectedInvoice)}
            startIcon={<FiPrinter />}
            sx={{ 
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' }
            }}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingInvoices;