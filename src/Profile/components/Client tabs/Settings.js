import React from 'react';
import {
  Card, CardContent, Typography, TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip
} from '@mui/material';
import { FiFile, FiDownload } from 'react-icons/fi';

const ResourcesTab = ({ resources, formatDate }) => {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardContent className="p-6">
        <Typography variant="h6" className="font-bold text-gray-800 mb-4">
          Shared Resources
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Uploaded On</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id} hover>
                  <TableCell>
                    <Box className="flex items-center">
                      <FiFile className="mr-2 text-gray-500" />
                      <Typography variant="body2">
                        {resource.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={resource.type}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(resource.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {resource.size}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                      startIcon={<FiDownload />}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ResourcesTab;