// Invoices.js
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
  useTheme
} from '@mui/material';
import {
  FiDownload,
  FiPrinter,
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiSearch,
  FiCheckCircle
} from 'react-icons/fi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { format } from 'date-fns';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const invoicesQuery = query(
          collection(db, "platform-transactions"),
          where("clientId", "==", user.uid),
          where("type", "==", "project_payment")
        );
        
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM yyyy') : 'N/A'
        }));

        setInvoices(invoicesData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError("Failed to load invoices. Please try again.");
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleDownload = (invoice) => {
    // Create a printable HTML content
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
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DXD Magnate</h1>
              <p>123 Business Street<br>City, State 10001<br>Tax ID: 123456789</p>
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
                <td>${invoice.projectTitle} - Payment</td>
                <td>₹${invoice.amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Total</strong></td>
                <td class="total">₹${invoice.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Payment terms: Due upon receipt</p>
          </div>
        </body>
      </html>
    `;

    // Create a Blob with the HTML content
    const blob = new Blob([invoiceContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger download
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
              <p>10 Rue Eugène Hénaff<br>, 93000 Bobigny, France.<br>Tax ID: 123456789</p>
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
                <td>${invoice.projectTitle} - Payment</td>
                <td>₹${invoice.amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Total</strong></td>
                <td class="total">₹${invoice.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Payment terms: Due upon receipt</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Invoices
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading your invoices...
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
            Invoices
          </Typography>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FiFileText size={24} style={{ marginRight: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              No Invoices Found
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            You don't have any invoices at this time.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Invoice History
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and download your payment invoices
      </Typography>

      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {invoice.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.projectTitle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <FiCalendar size={16} style={{ marginRight: 8, color: '#64748b' }} />
                      <Typography variant="body2">
                        {invoice.formattedDate}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <FiDollarSign size={16} style={{ marginRight: 8, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        ₹{invoice.amount.toLocaleString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label="Paid" 
                      size="small"
                      sx={{ 
                        backgroundColor: '#10B98110',
                        color: '#10B981',
                        fontWeight: 'medium'
                      }}
                      icon={<FiCheckCircle size={14} />}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Invoice Summary */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Invoice Summary
          </Typography>
          <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} gap={4}>
            <Box flex={1} sx={{ backgroundColor: '#F8FAFC', p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                TOTAL INVOICES
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {invoices.length}
              </Typography>
            </Box>
            <Box flex={1} sx={{ backgroundColor: '#F0FDF4', p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                TOTAL AMOUNT
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10B981' }}>
                ₹{invoices.reduce((sum, invoice) => sum + invoice.amount, 0).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Invoices;