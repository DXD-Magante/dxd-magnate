import React from 'react';
import { 
  Card, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Typography, 
  Button, LinearProgress, Tooltip, Chip, Avatar, IconButton , Box
} from '@mui/material';
import { FiPlus, FiEye } from 'react-icons/fi';

const CurrentProjects = ({ projects }) => {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
      <CardContent className="p-6">
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-gray-800">
            Current Projects
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FiPlus />}
            size="small"
            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            New Project
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {projects.filter(p => p.status !== "Completed").map((project) => (
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
                    <Tooltip title={`${project.completedTasks || 0} completed, ${(project.totalTasks || 0) - (project.completedTasks || 0)} remaining`}>
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
                              backgroundColor: project.progress >= 80 ? '#10B981' : 
                                             project.progress >= 50 ? '#F59E0B' : '#EF4444'
                            }
                          }}
                        />
                        <Typography variant="caption">
                          {project.progress || 0}% ({project.completedTasks}/{project.totalTasks})
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                    <Typography variant="caption" className="text-gray-600">
                      to {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <Avatar 
                          key={i}
                          sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                          className="border-2 border-white"
                        >
                          {i === 1 ? 'JS' : i === 2 ? 'MJ' : 'SW'}
                        </Avatar>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <FiEye className="text-gray-600" />
                    </IconButton>
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

export default CurrentProjects;