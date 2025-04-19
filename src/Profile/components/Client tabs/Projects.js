import React from 'react';
import {
  Card, CardContent, Typography, Box, Button,
  TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, Chip, LinearProgress
} from '@mui/material';
import { FiChevronRight, FiSearch } from 'react-icons/fi';

const ProjectsTab = ({ projects, formatDate }) => {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardContent className="p-6">
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-gray-800">
            All Projects
          </Typography>
          <Box className="flex space-x-2">
            <TextField
              size="small"
              placeholder="Search projects..."
              InputProps={{
                startAdornment: <FiSearch className="mr-2 text-gray-400" />
              }}
              sx={{ width: 200 }}
            />
            <Button
              variant="outlined"
              size="small"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Filter
            </Button>
          </Box>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Project Manager</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" className="font-bold">
                      {project.title}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      {project.clientName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        backgroundColor: project.status === "In Progress" ? '#e0f2fe' : 
                                        project.status === "On Hold" ? '#fef3c7' : '#dcfce7',
                        color: project.status === "In Progress" ? '#0369a1' : 
                               project.status === "On Hold" ? '#92400e' : '#166534'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center">
                      <LinearProgress
                        variant="determinate"
                        value={project.progress || 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          width: '80%',
                          mr: 1,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            backgroundColor: '#4f46e5'
                          }
                        }}
                      />
                      <Typography variant="caption">
                        {project.progress || 0}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(project.startDate)}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      to {formatDate(project.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {project.projectManager || "Not assigned"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                      endIcon={<FiChevronRight />}
                    >
                      View
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

export default ProjectsTab;