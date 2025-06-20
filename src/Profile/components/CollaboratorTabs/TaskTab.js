import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Button,
  TableContainer, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, LinearProgress,
  Select, MenuItem, TextField, InputAdornment,
  Avatar, Tooltip, Divider, FormControl, InputLabel
} from '@mui/material';
import { 
  FiCheckCircle, FiClock, FiAlertCircle, 
  FiExternalLink, FiSearch, FiFilter,
  FiChevronDown, FiStar, FiArchive, FiPlus
} from 'react-icons/fi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';

const TasksTab = ({ formatDate }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch projects where current user is a team member
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === user.uid);
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            label: doc.data().title || 'Untitled Project'
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
          ...doc.data(),
          projectTitle: projectsData.find(p => p.id === doc.data().projectId)?.title || 'Unknown Project'
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
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesProject && matchesSearch && matchesStatus;
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return { bg: '#FEE2E2', color: '#DC2626', icon: <FiAlertCircle /> };
      case 'Medium':
        return { bg: '#FEF3C7', color: '#F59E0B', icon: <FiStar /> };
      case 'Low':
        return { bg: '#ECFDF5', color: '#10B981', icon: <FiArchive /> };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', icon: <FiArchive /> };
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Review', label: 'Review' },
    { value: 'Done', label: 'Completed' },
    { value: 'Blocked', label: 'Blocked' }
  ];

  return (
    <Card className="shadow-lg rounded-xl border border-gray-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Header Section */}
        <Box className="p-6 pb-4 border-b border-gray-200">
          <Box className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <Typography variant="h6" className="font-bold text-gray-800">
              Task Management
            </Typography>
      
          </Box>

          {/* Filters */}
          <Box className="flex flex-col md:flex-row gap-3">
            <TextField
              variant="outlined"
              placeholder="Search tasks..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch className="text-gray-400" />
                  </InputAdornment>
                ),
                sx: { 
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  width: { xs: '100%', md: 280 }
                }
              }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="Project"
                IconComponent={FiChevronDown}
                sx={{ borderRadius: '8px' }}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Box className="flex items-center gap-2">
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24,
                          bgcolor: '#E0E7FF',
                          color: '#4F46E5',
                          fontSize: '0.75rem'
                        }}
                      >
                        {project.label.charAt(0).toUpperCase()}
                      </Avatar>
                      <span className="truncate max-w-[180px]">{project.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                IconComponent={FiChevronDown}
                sx={{ borderRadius: '8px' }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box className="flex items-center gap-2">
                      {option.value !== 'all' ? (
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(option.value).bg,
                            border: `2px solid ${getStatusColor(option.value).color}`
                          }}
                        />
                      ) : (
                        <FiFilter className="text-gray-400" size={14} />
                      )}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Stats Summary */}
        <Box className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <Box className="flex flex-wrap gap-4">
            <Box className="flex items-center gap-2">
              <Typography variant="body2" className="text-gray-600">
                Total:
              </Typography>
              <Typography variant="subtitle2" className="font-bold">
                {filteredTasks.length} tasks
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box className="flex items-center gap-2">
              <Typography variant="body2" className="text-gray-600">
                Completed:
              </Typography>
              <Typography variant="subtitle2" className="font-bold text-green-600">
                {filteredTasks.filter(t => t.status === 'Done').length}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box className="flex items-center gap-2">
              <Typography variant="body2" className="text-gray-600">
                In Progress:
              </Typography>
              <Typography variant="subtitle2" className="font-bold text-blue-600">
                {filteredTasks.filter(t => t.status === 'In Progress').length}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box className="flex items-center gap-2">
              <Typography variant="body2" className="text-gray-600">
                Overdue:
              </Typography>
              <Typography variant="subtitle2" className="font-bold text-red-600">
                {filteredTasks.filter(t => 
                  t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done'
                ).length}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Task Table */}
        {loading ? (
          <Box className="p-6">
            <LinearProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Task Details</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const status = getStatusColor(task.status);
                    const priority = getPriorityColor(task.priority || 'Medium');
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
                    
                    return (
                      <TableRow key={task.id} hover>
                        <TableCell>
                          <Box className="flex flex-col">
                            <Typography variant="subtitle2" className="font-bold">
                              {task.title}
                            </Typography>
                            <Typography variant="caption" className="text-gray-600 line-clamp-2">
                              {task.description || 'No description provided'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={task.projectTitle} placement="top">
                            <Box className="flex items-center gap-2 max-w-[150px]">
                              <Avatar 
                                sx={{ 
                                  width: 24, 
                                  height: 24,
                                  bgcolor: '#E0E7FF',
                                  color: '#4F46E5',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {task.projectTitle?.charAt(0).toUpperCase() || 'P'}
                              </Avatar>
                              <Typography variant="body2" className="truncate">
                                {task.projectTitle}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Box className="flex flex-col">
                            <Typography 
                              variant="body2" 
                              className={isOverdue ? 'text-red-600 font-medium' : ''}
                            >
                              {formatDate(task.dueDate) || 'No due date'}
                            </Typography>
                            {isOverdue && (
                              <Typography variant="caption" className="text-red-500">
                                Overdue
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={task.priority || 'Medium'}
                            size="small"
                            sx={{ 
                              backgroundColor: priority.bg,
                              color: priority.color,
                              fontWeight: 'medium',
                              textTransform: 'capitalize'
                            }}
                            icon={priority.icon}
                          />
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
                          <Box className="flex gap-2">
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{
                                borderColor: '#4F46E5',
                                color: '#4F46E5',
                                '&:hover': {
                                  backgroundColor: '#EEF2FF',
                                  borderColor: '#4F46E5'
                                }
                              }}
                              href={task.link || '#'}
                              target="_blank"
                              disabled={!task.link}
                              startIcon={<FiExternalLink size={14} />}
                            >
                              {task.status === 'Done' ? 'Review' : 'Submit'}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}>
                      <Box className="flex flex-col items-center justify-center gap-2">
                        <FiArchive className="text-gray-400" size={48} />
                        <Typography variant="body1" sx={{ color: '#64748b' }}>
                          No tasks found matching your criteria
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          Try adjusting your filters or create a new task
                        </Typography>
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
  );
};

export default TasksTab;