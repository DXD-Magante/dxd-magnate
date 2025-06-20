import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Badge,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiEdit2,
  FiDownload,
  FiExternalLink,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiFile,
  FiLink,
  FiStar,
  FiMessageSquare,
  FiSend,
  FiRefreshCw,
  FiEye
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [page, setPage] = useState(1);
  const [projects, setProjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const rowsPerPage = 8;

  // Fetch client's projects and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        setLoading(true);

        // Fetch projects where current user is client
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

        // Fetch tasks assigned to this client
        const tasksQuery = query(
          collection(db, "client-tasks"),
          where("clientId", "==", user.uid),
          where("type", "==", "approval_request")
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTasks(tasksData);

        // Auto-select first project if available
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter tasks based on search, filters and selected project
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || task.status === statusFilter;
    
    const matchesPriority = 
      priorityFilter === "all" || task.priority === priorityFilter;
    
    const matchesProject = 
      selectedProject === "all" || task.projectId === selectedProject;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  // Paginate tasks
  const paginatedTasks = filteredTasks.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handlePriorityChange = (priority) => {
    setPriorityFilter(priority);
    setPage(1);
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
    setPage(1);
  };

  const openFeedbackDialog = (task) => {
    setSelectedTask(task);
    if (task.clientFeedback) {
      setRating(task.clientRating || 0);
      setFeedback(task.clientFeedback || "");
    } else {
      setRating(0);
      setFeedback("");
    }
    setOpenDialog(true);
  };

  const closeFeedbackDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
    setRating(0);
    setFeedback("");
  };

  const submitFeedback = async (action) => {
    try {
      setSubmitting(true);
      const user = auth.currentUser;
      if (!user || !selectedTask) return;

      const taskRef = doc(db, "client-tasks", selectedTask.id);
      
      await updateDoc(taskRef, {
        status: action,
        clientRating: rating,
        clientFeedback: feedback,
        updatedAt: new Date().toISOString()
      });

      // Create notification for project manager
      await addDoc(collection(db, "project-manager-notifications"), {
        message: `Client ${action} your submission: ${selectedTask.title}`,
        userId: selectedTask.createdBy,
        viewed: false,
        timestamp: new Date(),
        projectId: selectedTask.projectId,
        projectName: selectedTask.projectTitle,
        type: "approval-response",
        priority: selectedTask.priority
      });

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === selectedTask.id ? {
          ...task,
          status: action,
          clientRating: rating,
          clientFeedback: feedback,
          updatedAt: new Date().toISOString()
        } : task
      ));

      setSnackbar({
        open: true,
        message: `Feedback submitted successfully!`,
        severity: "success"
      });
      closeFeedbackDialog();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSnackbar({
        open: true,
        message: `Error submitting feedback: ${error.message}`,
        severity: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshTasks = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const tasksQuery = query(
        collection(db, "client-tasks"),
        where("clientId", "==", user.uid),
        where("type", "==", "approval_request")
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "warning";
      case "approved": return "success";
      case "rejected": return "error";
      case "changes_requested": return "info";
      default: return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low": return "success";
      case "medium": return "warning";
      case "high": return "error";
      case "urgent": return "secondary";
      default: return "default";
    }
  };

  const statusCounts = tasks.reduce((counts, task) => {
    counts[task.status] = (counts[task.status] || 0) + 1;
    counts.total++;
    return counts;
  }, { total: 0 });

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
          My Tasks
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Review and approve submissions from your project team
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: "100%",
            borderLeft: "4px solid #6366f1",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: "#e0e7ff",
                  color: "#4f46e5",
                  width: 40,
                  height: 40
                }}>
                  <FiMessageSquare size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Requests
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statusCounts.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: "100%",
            borderLeft: "4px solid #10b981",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: "#d1fae5",
                  color: "#10b981",
                  width: 40,
                  height: 40
                }}>
                  <FiCheckCircle size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statusCounts.approved || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: "100%",
            borderLeft: "4px solid #f59e0b",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: "#fef3c7",
                  color: "#f59e0b",
                  width: 40,
                  height: 40
                }}>
                  <FiClock size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statusCounts.pending || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: "100%",
            borderLeft: "4px solid #ef4444",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
          }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ 
                  bgcolor: "#fee2e2",
                  color: "#ef4444",
                  width: 40,
                  height: 40
                }}>
                  <FiAlertCircle size={20} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Rejected
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {statusCounts.rejected || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2, backgroundColor: "#f8fafc" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch className="text-gray-400" />
                  </InputAdornment>
                ),
                sx: { backgroundColor: "white" }
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Select
              fullWidth
              size="small"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              sx={{ backgroundColor: "white" }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="changes_requested">Changes Requested</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Select
              fullWidth
              size="small"
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
              sx={{ backgroundColor: "white" }}
            >
              <MenuItem value="all">All Priorities</MenuItem>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Select
              fullWidth
              size="small"
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={projects.length === 0}
              sx={{ backgroundColor: "white" }}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={1}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={refreshTasks}
                sx={{ 
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  '&:hover': {
                    backgroundColor: "#f1f5f9"
                  }
                }}
              >
                <FiRefreshCw size={18} />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Card>

      {/* Status Tabs */}
      <Tabs
        value={statusFilter}
        onChange={(e, newValue) => handleStatusChange(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ 
          mb: 3,
          '& .MuiTabs-indicator': {
            backgroundColor: "#4f46e5",
            height: 3
          }
        }}
      >
        <Tab
          label={
            <Badge 
              badgeContent={statusCounts.total} 
              color="primary"
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              All
            </Badge>
          }
          value="all"
          sx={{ minHeight: 48 }}
        />
        <Tab
          label={
            <Badge 
              badgeContent={statusCounts.pending || 0} 
              color="warning"
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              Pending
            </Badge>
          }
          value="pending"
          sx={{ minHeight: 48 }}
        />
        <Tab
          label={
            <Badge 
              badgeContent={statusCounts.approved || 0} 
              color="success"
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              Approved
            </Badge>
          }
          value="approved"
          sx={{ minHeight: 48 }}
        />
        <Tab
          label={
            <Badge 
              badgeContent={statusCounts.rejected || 0} 
              color="error"
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              Rejected
            </Badge>
          }
          value="rejected"
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {/* Tasks List */}
      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : projects.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <FiMessageSquare size={48} className="text-gray-400 mx-auto mb-3" />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              No projects assigned
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any projects yet. When you do, your tasks will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <FiMessageSquare size={48} className="text-gray-400 mx-auto mb-3" />
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              No tasks found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery
                ? "No tasks match your search criteria"
                : "No tasks match your current filters"}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Task</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Submitted By</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <TableRow hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                          {task.notes?.substring(0, 60)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                          {task.projectTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar 
                            src={task.assignee?.avatar} 
                            sx={{ width: 32, height: 32 }}
                          >
                            {task.createdByName?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">
                            {task.createdByName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority}
                          size="small"
                          color={getPriorityColor(task.priority)}
                          sx={{ 
                            fontWeight: "bold",
                            fontSize: "0.65rem",
                            textTransform: "capitalize"
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiClock size={14} className="text-gray-500" />
                          <Typography variant="body2">
                            {formatDate(task.dueDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status.replace("_", " ")}
                          size="small"
                          color={getStatusColor(task.status)}
                          sx={{ 
                            fontWeight: "bold",
                            fontSize: "0.65rem",
                            textTransform: "capitalize"
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              sx={{
                                backgroundColor: "#e0e7ff",
                                color: "#4f46e5",
                                '&:hover': {
                                  backgroundColor: "#c7d2fe"
                                }
                              }}
                              onClick={() => openFeedbackDialog(task)}
                            >
                              <FiEye size={16} />
                            </IconButton>
                          </Tooltip>
                          {task.submissionType === "file" ? (
                            <Tooltip title="Download File">
                              <IconButton
                                size="small"
                                href={task.file?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  backgroundColor: "#f1f5f9",
                                  color: "#64748b",
                                  '&:hover': {
                                    backgroundColor: "#e2e8f0"
                                  }
                                }}
                              >
                                <FiDownload size={16} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Open Link">
                              <IconButton
                                size="small"
                                href={task.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  backgroundColor: "#f1f5f9",
                                  color: "#64748b",
                                  '&:hover': {
                                    backgroundColor: "#e2e8f0"
                                  }
                                }}
                              >
                                <FiExternalLink size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0 }}>
                        <Accordion
                          sx={{
                            backgroundColor: "#f8fafc",
                            boxShadow: "none",
                            '&:before': { display: "none" }
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<FiChevronDown />}
                            sx={{
                              minHeight: "48px !important",
                              '& .MuiAccordionSummary-content': {
                                margin: "12px 0"
                              }
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                              Submission Details
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                  Submission
                                </Typography>
                                {task.submissionType === "file" ? (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <FiFile className="text-gray-500" />
                                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                      {task.file?.name || "File submission"}
                                    </Typography>
                                    <Button
                                      size="small"
                                      startIcon={<FiDownload size={14} />}
                                      href={task.file?.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        ml: 1,
                                        fontSize: "0.65rem",
                                        textTransform: "none",
                                        color: "#4f46e5"
                                      }}
                                    >
                                      Download
                                    </Button>
                                  </Box>
                                ) : (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <FiLink className="text-gray-500" />
                                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                                      {task.link || "Link submission"}
                                    </Typography>
                                    <Button
                                      size="small"
                                      startIcon={<FiExternalLink size={14} />}
                                      href={task.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{
                                        ml: 1,
                                        fontSize: "0.65rem",
                                        textTransform: "none",
                                        color: "#4f46e5"
                                      }}
                                    >
                                      Open
                                    </Button>
                                  </Box>
                                )}
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                  Notes
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#64748b" }}>
                                  {task.notes || "No notes provided"}
                                </Typography>
                              </Grid>
                              {task.status !== "pending" && (
                                <Grid item xs={12}>
                                  <Box sx={{ 
                                    backgroundColor: "#f8fafc", 
                                    p: 2, 
                                    borderRadius: 1,
                                    borderLeft: "4px solid #e2e8f0"
                                  }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                      Your Response
                                    </Typography>
                                    {task.clientRating > 0 && (
                                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                        <Rating
                                          value={task.clientRating}
                                          readOnly
                                          precision={0.5}
                                          size="small"
                                        />
                                        <Typography variant="body2" sx={{ ml: 1, color: "#64748b" }}>
                                          ({task.clientRating.toFixed(1)})
                                        </Typography>
                                      </Box>
                                    )}
                                    <Typography variant="body2" sx={{ color: "#64748b" }}>
                                      {task.clientFeedback || "No feedback provided"}
                                    </Typography>
                                    {task.updatedAt && (
                                      <Typography variant="caption" sx={{ display: "block", mt: 1, color: "#94a3b8" }}>
                                        Responded on {formatDateTime(task.updatedAt)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {filteredTasks.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={Math.ceil(filteredTasks.length / rowsPerPage)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      {/* Feedback Dialog */}
      <Dialog
        open={openDialog}
        onClose={closeFeedbackDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          borderBottom: "1px solid #e2e8f0",
          py: 2.5
        }}>
          {selectedTask?.title || "Task Feedback"}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Rating
              </Typography>
              <Rating
                value={rating}
                onChange={(e, newValue) => setRating(newValue)}
                precision={0.5}
                size="large"
                emptyIcon={<FiStar style={{ opacity: 0.55 }} fontSize="inherit" />}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                Feedback
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide your feedback here..."
                variant="outlined"
                InputProps={{
                  sx: { backgroundColor: "white" }
                }}
              />
            </Box>
            {selectedTask?.submissionType === "file" && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Submission File
                </Typography>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 2,
                  p: 2,
                  backgroundColor: "#f8fafc",
                  borderRadius: 1
                }}>
                  <FiFile size={24} className="text-gray-500" />
                  <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                    {selectedTask?.file?.name || "File submission"}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<FiDownload size={14} />}
                    href={selectedTask?.file?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      ml: "auto",
                      fontSize: "0.65rem",
                      textTransform: "none",
                      color: "#4f46e5"
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          borderTop: "1px solid #e2e8f0",
          justifyContent: "space-between"
        }}>
          <Button 
            onClick={closeFeedbackDialog}
            sx={{ 
              color: "#64748b",
              '&:hover': {
                backgroundColor: "#f1f5f9"
              }
            }}
          >
            Cancel
          </Button>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button 
              variant="contained"
              color="error"
              startIcon={<FiX size={18} />}
              onClick={() => submitFeedback("rejected")}
              disabled={submitting}
              sx={{
                px: 3,
                py: 1,
                '&:disabled': {
                  backgroundColor: "#e2e8f0",
                  color: "#94a3b8"
                }
              }}
            >
              Reject
            </Button>
            <Button 
              variant="contained"
              color="success"
              startIcon={<FiCheck size={18} />}
              onClick={() => submitFeedback("approved")}
              disabled={submitting}
              sx={{
                px: 3,
                py: 1,
                '&:disabled': {
                  backgroundColor: "#e2e8f0",
                  color: "#94a3b8"
                }
              }}
            >
              Approve
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyTasks;