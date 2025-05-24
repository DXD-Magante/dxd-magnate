import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Button,
  TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, LinearProgress,
  Select, MenuItem, TextField, InputAdornment
} from '@mui/material';
import { FiCheckCircle, FiClock, FiAlertCircle, FiExternalLink, FiSearch } from 'react-icons/fi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';

const TasksTab = ({ formatDate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch projects where current user is a team member
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("teamMembers", "array-contains", { id: user.uid })
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectsData);

        // Fetch tasks assigned to current user
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("assignee.id", "==", user.uid)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTasks(tasksData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesProject = selectedProject === 'all' || task.projectId === selectedProject;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
        return { bg: '#ECFDF5', color: '#10B981', icon: <FiCheckCircle /> };
      case 'In Progress':
        return { bg: '#EFF6FF', color: '#3B82F6', icon: <FiClock /> };
      case 'Review':
        return { bg: '#FEF3C7', color: '#F59E0B', icon: <FiClock /> };
      case 'To Do':
        return { bg: '#F3F4F6', color: '#6B7280', icon: <FiClock /> };
      case 'Blocked':
        return { bg: '#FEE2E2', color: '#DC2626', icon: <FiAlertCircle /> };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', icon: <FiAlertCircle /> };
    }
  };

  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardContent className="p-6">
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-gray-800">
            Your Tasks
          </Typography>
          <Box className="flex space-x-2">
            <Button
              variant="outlined"
              size="small"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              Active
            </Button>
            <Button
              variant="text"
              size="small"
              className="text-gray-600 hover:bg-gray-50"
            >
              Completed
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Box className="flex gap-3 mb-4">
          <TextField
            variant="outlined"
            placeholder="Search tasks..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch color="#94a3b8" />
                </InputAdornment>
              ),
              sx: { backgroundColor: 'white' }
            }}
            sx={{ width: 300 }}
          />

          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            size="small"
            sx={{ backgroundColor: 'white', minWidth: 200 }}
          >
            <MenuItem value="all">All Projects</MenuItem>
            {projects.map(project => (
              <MenuItem key={project.id} value={project.id}>
                {project.title}
              </MenuItem>
            ))}
          </Select>
        </Box>
        
        {loading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const status = getStatusColor(task.status);
                    const progress = task.status === 'Done' ? 100 : 
                                   task.status === 'In Progress' ? 50 : 
                                   task.status === 'Review' ? 75 : 
                                   0;
                    
                    return (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-bold">
                            {task.title}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            {task.description?.substring(0, 50)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {task.projectTitle}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(task.dueDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.status}
                            size="small"
                            sx={{ 
                              backgroundColor: status.bg,
                              color: status.color,
                              fontWeight: 'medium',
                              textTransform: 'capitalize'
                            }}
                            icon={status.icon}
                          />
                        </TableCell>
                        <TableCell>
                          <Box className="flex items-center">
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                width: '80%',
                                mr: 1,
                                backgroundColor: '#E5E7EB',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  backgroundColor: status.color
                                }
                              }}
                            />
                            <Typography variant="caption">
                              {progress}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                            href={task.link || '#'}
                            target="_blank"
                            disabled={!task.link}
                            startIcon={<FiExternalLink size={14} />}
                          >
                            {task.status === 'Done' ? 'Review' : 'Submit'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: '#64748b' }}>
                        No tasks found matching your criteria
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TasksTab;