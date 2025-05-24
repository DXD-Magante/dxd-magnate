import React from "react";
import { 
  Card, CardContent, Typography, Box, Button, 
  Grid, Paper, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Chip, Avatar,
  FormControl, InputLabel, Select, MenuItem, CircularProgress
} from "@mui/material";
import { FiPlus, FiDownload, FiChevronUp, FiChevronDown, FiUser,  } from "react-icons/fi";

const LeadsTab = ({ performanceData, leads, leadsLoading, sortConfig, handleSort }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Box className="space-y-6">
      {/* Leads Summary */}
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-bold text-gray-800">
              Leads Overview
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<FiPlus />}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Add New Lead
            </Button>
          </Box>
          
          <Grid container spacing={2} className="mb-4">
            {[
              { status: 'new', count: performanceData.leadStatus.new, color: 'blue' },
              { status: 'contacted', count: performanceData.leadStatus.contacted, color: 'purple' },
              { status: 'proposal-sent', count: performanceData.leadStatus.proposalSent, color: 'yellow' },
              { status: 'negotiation', count: performanceData.leadStatus.negotiation, color: 'orange' },
              { status: 'closed-won', count: performanceData.leadStatus.closedWon, color: 'green' },
              { status: 'closed-lost', count: performanceData.leadStatus.closedLost, color: 'red' }
            ].map((item, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Paper className={`p-3 rounded-lg bg-${item.color}-50`}>
                  <Typography variant="subtitle2" className={`text-${item.color}-600 capitalize`}>
                    {item.status.replace('-', ' ')}
                  </Typography>
                  <Typography variant="h4" className={`font-bold text-${item.color}-900`}>
                    {item.count}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      
      {/* Leads Table */}
      <Card className="shadow-lg rounded-xl border border-gray-200">
        <CardContent className="p-6">
          <Box className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-bold text-gray-800">
              Your Leads
            </Typography>
            <Box className="flex items-center space-x-2">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select label="Filter" defaultValue="all">
                  <MenuItem value="all">All Leads</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="proposal-sent">Proposal Sent</MenuItem>
                  <MenuItem value="negotiation">Negotiation</MenuItem>
                  <MenuItem value="closed-won">Closed Won</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<FiDownload />}>
                Export
              </Button>
            </Box>
          </Box>
          
          {leadsLoading ? (
            <Box className="flex justify-center items-center h-64">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell>
                      <Box 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSort('fullName')}
                      >
                        <Typography variant="subtitle2" className="font-bold text-gray-600">
                          Lead
                        </Typography>
                        {sortConfig.key === 'fullName' && (
                          sortConfig.direction === 'asc' ? 
                            <FiChevronUp className="ml-1" size={16} /> : 
                            <FiChevronDown className="ml-1" size={16} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSort('company')}
                      >
                        <Typography variant="subtitle2" className="font-bold text-gray-600">
                          Company
                        </Typography>
                        {sortConfig.key === 'company' && (
                          sortConfig.direction === 'asc' ? 
                            <FiChevronUp className="ml-1" size={16} /> : 
                            <FiChevronDown className="ml-1" size={16} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" className="font-bold text-gray-600">
                        Status
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        <Typography variant="subtitle2" className="font-bold text-gray-600">
                          Created
                        </Typography>
                        {sortConfig.key === 'createdAt' && (
                          sortConfig.direction === 'asc' ? 
                            <FiChevronUp className="ml-1" size={16} /> : 
                            <FiChevronDown className="ml-1" size={16} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" className="font-bold text-gray-600">
                        Value
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leads.length > 0 ? (
                    leads.map((lead) => (
                      <TableRow key={lead.id} hover className="hover:bg-gray-50">
                        <TableCell>
                          <Box className="flex items-center space-x-3">
                            <Avatar className="bg-indigo-100 text-indigo-600">
                              {lead.fullName?.charAt(0) || 'L'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" className="font-medium">
                                {lead.fullName || 'Unnamed Lead'}
                              </Typography>
                              <Typography variant="caption" className="text-gray-500">
                                {lead.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {lead.company || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lead.status ? lead.status.replace('-', ' ') : 'new'}
                            size="small"
                            className={`capitalize ${
                              lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                              lead.status === 'proposal-sent' ? 'bg-yellow-100 text-yellow-800' :
                              lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                              lead.status === 'closed-won' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(lead.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" className="font-medium">
                            {lead.budget ? `₹${parseInt(lead.budget).toLocaleString('en-IN')}` : 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" className="py-8">
                        <Box className="flex flex-col items-center space-y-2">
                          <FiUser className="text-gray-400" size={32} />
                          <Typography variant="body1" className="text-gray-500">
                            No leads found
                          </Typography>
                          <Button 
                            variant="outlined" 
                            startIcon={<FiPlus />}
                            className="mt-2"
                          >
                            Add New Lead
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LeadsTab;