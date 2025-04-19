import React from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Button,
  TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, Avatar, Paper, Alert, CircularProgress, Chip,
  IconButton
} from '@mui/material';
import {
  FiDollarSign, FiFileText, FiDownload, FiPrinter,
  FiRefreshCw, FiCalendar
} from 'react-icons/fi';

const FinancialTab = ({
  transactions,
  loadingTransactions,
  transactionError,
  fetchTransactions,
  getStatusColor,
  handleDownloadReceipt,
  handlePrintReceipt
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
          <CardContent className="p-6">
            <Box className="flex justify-between items-center mb-4">
              <Typography variant="h6" className="font-bold text-gray-800">
                Transaction History
              </Typography>
              <Button
                variant="text"
                size="small"
                className="text-indigo-600 hover:bg-indigo-50"
                onClick={fetchTransactions}
                startIcon={<FiRefreshCw size={16} />}
              >
                Refresh
              </Button>
            </Box>
            
            {loadingTransactions ? (
              <Box className="flex flex-col items-center justify-center py-8">
                <CircularProgress />
                <Typography variant="body2" className="text-gray-600 mt-2">
                  Loading transactions...
                </Typography>
              </Box>
            ) : transactionError ? (
              <Alert severity="error" className="mb-4">
                {transactionError}
              </Alert>
            ) : transactions.length === 0 ? (
              <Box className="flex flex-col items-center justify-center py-8">
                <FiFileText size={48} className="text-gray-400 mb-4" />
                <Typography variant="h6" className="font-bold text-gray-800 mb-2">
                  No Transactions Found
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  You don't have any transactions yet.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
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
                    {transactions.map((transaction) => {
                      const status = getStatusColor(transaction.status);
                      
                      return (
                        <TableRow key={transaction.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {transaction.transactionNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transaction.projectTitle || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box className="flex items-center">
                              <FiCalendar className="mr-2 text-gray-400" />
                              <Typography variant="body2">
                                {transaction.formattedDate}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box className="flex items-center">
                              <FiDollarSign className="mr-2 text-gray-400" />
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
                                fontWeight: 'medium'
                              }}
                              icon={status.icon}
                            />
                          </TableCell>
                          <TableCell>
                            <Box className="flex space-x-2">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadReceipt(transaction)}
                                className="text-indigo-600 hover:bg-indigo-50"
                              >
                                <FiDownload size={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handlePrintReceipt(transaction)}
                                className="text-indigo-600 hover:bg-indigo-50"
                              >
                                <FiPrinter size={16} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card className="shadow-lg rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-bold text-gray-800 mb-4">
              Financial Summary
            </Typography>
            
            <Box className="space-y-4">
              <Paper className="p-4 rounded-lg">
                <Typography variant="subtitle2" className="text-gray-600 mb-1">
                  TOTAL TRANSACTIONS
                </Typography>
                <Box className="flex justify-between items-center">
                  <Typography variant="h4" className="font-bold">
                    {transactions.length}
                  </Typography>
                  <Avatar sx={{ bgcolor: '#4f46e510' }}>
                    <FiFileText size={20} color="#4f46e5" />
                  </Avatar>
                </Box>
              </Paper>
              
              <Paper className="p-4 rounded-lg">
                <Typography variant="subtitle2" className="text-gray-600 mb-1">
                  TOTAL AMOUNT
                </Typography>
                <Box className="flex justify-between items-center">
                  <Typography variant="h4" className="font-bold text-green-600">
                    ₹{transactions.reduce((sum, txn) => sum + (txn.amount || 0), 0).toLocaleString()}
                  </Typography>
                  <Avatar sx={{ bgcolor: '#10b98110' }}>
                    <FiDollarSign size={20} color="#10b981" />
                  </Avatar>
                </Box>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default FinancialTab;