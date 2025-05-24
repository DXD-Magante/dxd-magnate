import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Grid, Typography, Avatar, Chip,
  LinearProgress, Divider, Stack, Button, Tooltip, IconButton,
  TextField, InputAdornment
} from "@mui/material";
import {
  FiCalendar, FiUsers, FiDollarSign, FiFlag, FiClock,
  FiBarChart2, FiMoreVertical, FiExternalLink, FiSearch
} from "react-icons/fi";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { FaRupeeSign } from "react-icons/fa";

const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get all projects where current user is a team member
        const allProjectsSnapshot = await getDocs(collection(db, "dxd-magnate-projects"));
        const projectsData = allProjectsSnapshot.docs
          .filter(doc => {
            const teamMembers = doc.data().teamMembers || [];
            return teamMembers.some(member => member.id === user.uid);
          })
          .map(doc => ({
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
    switch (status) {
      case "Completed": return "success";
      case "In Progress": return "primary";
      case "Not started yet": return "default";
      case "On Hold": return "warning";
      case "Cancelled": return "error";
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

  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Projects Header with Search */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            All Projects ({projects.length})
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
                backgroundColor: '#f8fafc',
                borderRadius: 1,
                width: 300
              }
            }}
          />
        </Box>
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
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Tooltip title="More options">
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
                        <FaRupeeSign className="text-gray-500" size={16} />
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

                  {/* Project Type and Priority */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={project.type || "No type"} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 'medium' }}
                    />
                    <Chip 
                      label={`Priority: ${project.priority || "N/A"}`} 
                      size="small" 
                      color={getPriorityColor(project.priority)}
                    />
                  </Box>

                  {/* Team Members */}
                  {project.teamMembers?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Team Members:
                      </Typography>
                      <Stack direction="row" spacing={-1}>
                        {project.teamMembers.slice(0, 5).map((member, index) => (
                          <Tooltip key={index} title={member.name}>
                            <Avatar 
                              sx={{ 
                                width: 32, 
                                height: 32, 
                                border: '2px solid white',
                                bgcolor: '#4f46e5',
                                fontSize: '0.75rem'
                              }}
                            >
                              {member.name?.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                          </Tooltip>
                        ))}
                        {project.teamMembers.length > 5 && (
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              border: '2px solid white',
                              bgcolor: '#f1f5f9',
                              color: '#64748b',
                              fontSize: '0.75rem'
                            }}
                          >
                            +{project.teamMembers.length - 5}
                          </Avatar>
                        )}
                      </Stack>
                    </Box>
                  )}

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
                    sx={{ mt: 1 }}
                    onClick={() => window.location.href =`/project/${project.id}`}
                  >
                    View Project
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <FiBarChart2 size={48} className="text-gray-400 mx-auto mb-3" />
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery 
                ? "No projects match your search criteria"
                : "You're not assigned to any projects yet"}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AllProjects;