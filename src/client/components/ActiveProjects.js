import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Grid, Typography, Avatar, Chip,
  LinearProgress, Divider, Stack, Button, Tooltip, IconButton,
  TextField, InputAdornment, Badge, Tabs, Tab
} from "@mui/material";
import {
  FiCalendar, FiUsers, FiDollarSign, FiFlag, FiClock,
  FiBarChart2, FiMoreVertical, FiExternalLink, FiSearch,
  FiLayers, FiCheckCircle, FiAlertCircle, FiTrendingUp
} from "react-icons/fi";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { FaRupeeSign } from "react-icons/fa";

const ActiveProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabValue, setTabValue] = useState("all");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get all projects where current user is the client
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("clientId", "==", user.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(projectsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed": return "success";
      case "in progress": return "primary";
      case "pending": return "warning";
      case "on hold": return "default";
      case "cancelled": return "error";
      default: return "info";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "error";
      case "medium": return "warning";
      case "low": return "success";
      default: return "info";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      tabValue === "all" || 
      (tabValue === "active" && project.status?.toLowerCase() === "in progress") ||
      (tabValue === "pending" && project.status?.toLowerCase() === "pending") ||
      (tabValue === "completed" && project.status?.toLowerCase() === "completed");
    
    return matchesSearch && matchesTab;
  });

  const statusCounts = projects.reduce((acc, project) => {
    const status = project.status?.toLowerCase() || "other";
    if (status === "in progress") acc.active++;
    else if (status === "pending") acc.pending++;
    else if (status === "completed") acc.completed++;
    return acc;
  }, { active: 0, pending: 0, completed: 0 });

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Projects Header with Search and Stats */}
      <Card sx={{ mb: 3, p: 2, backgroundColor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Active Projects
            <Typography component="span" variant="body2" sx={{ ml: 1, color: '#64748b' }}>
              ({projects.length} total)
            </Typography>
          </Typography>
          <TextField
            size="small"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch className="text-gray-400" />
                </InputAdornment>
              ),
              sx: {
                backgroundColor: 'white',
                borderRadius: 1,
                width: 300
              }
            }}
          />
        </Box>

        {/* Status Tabs */}
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: '#4f46e5',
              height: 3
            }
          }}
        >
          <Tab 
            value="all" 
            label="All Projects" 
            icon={<FiLayers size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="active" 
            label={
              <Badge badgeContent={statusCounts.active} color="primary" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                Active
              </Badge>
            }
            icon={<FiTrendingUp size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="pending" 
            label={
              <Badge badgeContent={statusCounts.pending} color="warning" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                Pending
              </Badge>
            }
            icon={<FiClock size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="completed" 
            label={
              <Badge badgeContent={statusCounts.completed} color="success" sx={{ '& .MuiBadge-badge': { right: -15 } }}>
                Completed
              </Badge>
            }
            icon={<FiCheckCircle size={16} />}
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Card>

      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : filteredProjects.length > 0 ? (
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                borderLeft: `4px solid ${
                  project.status?.toLowerCase() === 'completed' ? '#10b981' :
                  project.status?.toLowerCase() === 'in progress' ? '#3b82f6' :
                  project.status?.toLowerCase() === 'pending' ? '#f59e0b' : '#64748b'
                }`,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      label={project.status || "No status"} 
                      size="small" 
                      color={getStatusColor(project.status)}
                      sx={{ 
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}
                    />
                    <Tooltip title="Project options">
                      <IconButton size="small">
                        <FiMoreVertical size={16} />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {project.title || "Untitled Project"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {project.description?.length > 100 
                      ? `${project.description.substring(0, 100)}...` 
                      : project.description || "No description available"}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Project Meta */}
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FiCalendar className="text-gray-500" size={16} />
                        <Typography variant="caption">
                          {formatDate(project.startDate)}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FiClock className="text-gray-500" size={16} />
                        <Typography variant="caption">
                          {project.duration || "N/A"}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FiDollarSign className="text-gray-500" size={16} />
                        <Typography variant="caption">
                          {project.budget ? `₹${parseInt(project.budget).toLocaleString()}` : "N/A"}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <FiUsers className="text-gray-500" size={16} />
                        <Typography variant="caption">
                          {project.teamMembers?.length || 0} members
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Project Type */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={project.type || "No type"} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 'medium' }}
                    />
                    {project.projectManager && (
                      <Tooltip title={`Project Manager: ${project.projectManager}`}>
                        <Chip 
                          label={`PM: ${project.projectManager.split(' ')[0]}`} 
                          size="small" 
                          color="info"
                        />
                      </Tooltip>
                    )}
                  </Box>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {project.progress || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.progress || 0} 
                      sx={{ 
                        height: 6, 
                        borderRadius: 3,
                        backgroundColor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#4f46e5'
                        }
                      }} 
                    />
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    endIcon={<FiExternalLink size={14} />}
                    sx={{ 
                      mt: 1,
                      borderColor: '#e2e8f0',
                      '&:hover': {
                        borderColor: '#cbd5e1',
                        backgroundColor: '#f8fafc'
                      }
                    }}
                  >
                    View Project Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FiBarChart2 size={48} className="text-gray-400 mx-auto mb-3" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery 
                ? "No projects match your search criteria"
                : tabValue === "all"
                  ? "You don't have any projects yet"
                  : `You don't have any ${tabValue} projects`}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ActiveProjects;