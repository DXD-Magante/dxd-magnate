// Receipts.js
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
  Alert
} from '@mui/material';
import {
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiFileText,
} from 'react-icons/fi';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { format } from 'date-fns';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const receiptsQuery = query(
          collection(db, "platform-transactions"),
          where("clientId", "==", user.uid),
          where("status", "==", "completed")
        );
        
        const receiptsSnapshot = await getDocs(receiptsQuery);
        const receiptsData = receiptsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          formattedDate: doc.data().timestamp ? format(new Date(doc.data().timestamp), 'dd MMM yyyy, hh:mm a') : 'N/A',
          receiptNumber: `RCPT-${doc.id.slice(0, 8).toUpperCase()}`
        }));

        setReceipts(receiptsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching receipts:", err);
        setError("Failed to load receipts. Please try again.");
        setLoading(false);
      }
    };

    fetchReceipts();
  }, []);

  const handleDownload = (receipt) => {
    const receiptContent = `
      <html>
        <head>
          <title>Receipt ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .receipt-title { font-size: 20px; font-weight: bold; margin: 20px 0; }
            .divider { border-top: 2px dashed #ddd; margin: 20px 0; }
            .details { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .detail-label { font-weight: bold; color: #64748b; }
            .items { margin: 30px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .status-badge { 
              background-color: #10B98120; 
              color: #10B981; 
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
          
          <div class="receipt-title">PAYMENT RECEIPT</div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Receipt Number</div>
              <div>${receipt.receiptNumber}</div>
            </div>
            <div>
              <div class="detail-label">Date</div>
              <div>${receipt.formattedDate}</div>
            </div>
          </div>
          
          <div class="details">
            <div>
              <div class="detail-label">Payment Method</div>
              <div>${receipt.paymentMethod || 'Credit Card'}</div>
            </div>
            <div>
              <div class="detail-label">Payment ID</div>
              <div>${receipt.paymentId || 'N/A'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="items">
            <div class="item-row">
              <div>${receipt.projectTitle || 'Project Payment'}</div>
              <div>₹${receipt.amount.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="total">
            <div class="item-row">
              <div>Total Paid</div>
              <div>₹${receipt.amount.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="status-badge">
            <FiCheckCircle style="margin-right: 5px;" /> PAID
          </div>
          
          <div class="footer">
            <div>Thank you for your payment!</div>
            <div style="margin-top: 5px;">This is an official payment receipt from DXD Magnate</div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${receipt.receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = (receipt) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .receipt-title { font-size: 20px; font-weight: bold; margin: 20px 0; }
            .divider { border-top: 2px dashed #ddd; margin: 20px 0; }
            .details { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .detail-label { font-weight: bold; color: #64748b; }
            .items { margin: 30px 0; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; }
            .status-badge { 
              background-color: #10B98120; 
              color: #10B981; 
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
          
          <div class="receipt-title">PAYMENT RECEIPT</div>
          
          <div class="divider"></div>
          
          <div class="details">
            <div>
              <div class="detail-label">Receipt Number</div>
              <div>${receipt.receiptNumber}</div>
            </div>
            <div>
              <div class="detail-label">Date</div>
              <div>${receipt.formattedDate}</div>
            </div>
          </div>
          
          <div class="details">
            <div>
              <div class="detail-label">Payment Method</div>
              <div>${receipt.paymentMethod || 'Credit Card'}</div>
            </div>
            <div>
              <div class="detail-label">Payment ID</div>
              <div>${receipt.paymentId || 'N/A'}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="items">
            <div class="item-row">
              <div>${receipt.projectTitle || 'Project Payment'}</div>
              <div>₹${receipt.amount.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="total">
            <div class="item-row">
              <div>Total Paid</div>
              <div>₹${receipt.amount.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="status-badge">
            <FiCheckCircle style="margin-right: 5px;" /> PAID
          </div>
          
          <div class="footer">
            <div>Thank you for your payment!</div>
            <div style="margin-top: 5px;">This is an official payment receipt from DXD Magnate</div>
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
            Payment Receipts
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading your receipts...
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
            Payment Receipts
          </Typography>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (receipts.length === 0) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FiFileText size={24} style={{ marginRight: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              No Receipts Found
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            You don't have any payment receipts at this time.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="space-y-6">
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Payment Receipts
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and download your payment receipts
      </Typography>

      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Receipt #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payment Method</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {receipt.receiptNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {receipt.projectTitle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <FiCalendar size={16} style={{ marginRight: 8, color: '#64748b' }} />
                      <Typography variant="body2">
                        {receipt.formattedDate}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <FiDollarSign size={16} style={{ marginRight: 8, color: '#64748b' }} />
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        ₹{receipt.amount.toLocaleString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <FiCreditCard size={16} style={{ marginRight: 8, color: '#64748b' }} />
                      <Typography variant="body2">
                        {receipt.paymentMethod || 'Credit Card'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<FiDownload size={16} />}
                        onClick={() => handleDownload(receipt)}
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
                        onClick={() => handlePrint(receipt)}
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Receipt Preview Card */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Receipt Preview
          </Typography>
          <Box sx={{ 
            border: '1px solid #E2E8F0', 
            borderRadius: 2, 
            p: 3,
            backgroundColor: '#F8FAFC',
            maxWidth: '500px',
            mx: 'auto'
          }}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4f46e5' }}>
                DXD Magnate
              </Typography>
              <Typography variant="body2" color="text.secondary">
              10 Rue Eugène Hénaff, 93000 Bobigny, France
              </Typography>
            </Box>
            
            <Typography variant="subtitle1" sx={{ 
              fontWeight: 'bold', 
              textAlign: 'center',
              my: 2
            }}>
              PAYMENT RECEIPT
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="body2" color="text.secondary">
                Receipt Number:
              </Typography>
              <Typography variant="body2">
                {receipts[0]?.receiptNumber || 'RCPT-XXXXXX'}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="body2" color="text.secondary">
                Date:
              </Typography>
              <Typography variant="body2">
                {receipts[0]?.formattedDate || 'N/A'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Payment For:
              </Typography>
              <Typography variant="body2">
                {receipts[0]?.projectTitle || 'Project Payment'}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Amount:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                ₹{receipts[0]?.amount.toLocaleString() || '0'}
              </Typography>
            </Box>
            
            <Box display="flex" justifyContent="space-between" mb={3}>
              <Typography variant="body2" color="text.secondary">
                Payment Method:
              </Typography>
              <Typography variant="body2">
                {receipts[0]?.paymentMethod || 'Credit Card'}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box textAlign="center" mt={3}>
              <Chip 
                label="PAID" 
                color="success" 
                icon={<FiCheckCircle size={16} />}
                sx={{ fontWeight: 'bold' }}
              />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Thank you for your payment!
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Receipts;