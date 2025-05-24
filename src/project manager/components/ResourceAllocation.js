import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Pagination,
  Stack,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Snackbar,
  Alert
} from "@mui/material";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiLink,
  FiFile,
  FiFolder,
  FiExternalLink,
  FiX,
  FiCheck,
  FiUpload
} from "react-icons/fi";
import { collection, getDocs, query, where, doc, deleteDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { format } from "date-fns";

const ResourceAllocation = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentResource, setCurrentResource] = useState({
    title: "",
    description: "",
    type: "link",
    url: "",
    file: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const rowsPerPage = 8;

  // Fetch projects where current user is project manager
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", user.uid)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(projectsData);
        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setLoading(false);
        showSnackbar("Failed to load projects", "error");
      }
    };

    fetchProjects();
  }, []);

  // Fetch resources for selected project
  useEffect(() => {
    const fetchResources = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const resourcesQuery = query(
          collection(db, "project-resources"),
          where("projectId", "==", selectedProject)
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        const resourcesData = resourcesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        // Sort by creation date (newest first)
        resourcesData.sort((a, b) => b.createdAt - a.createdAt);
        setResources(resourcesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setLoading(false);
        showSnackbar("Failed to load resources", "error");
      }
    };

    fetchResources();
  }, [selectedProject]);

  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      typeFilter === "all" || 
      resource.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const paginatedResources = filteredResources.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleOpenDialog = (resource = null) => {
    if (resource) {
      setCurrentResource({
        id: resource.id,
        title: resource.title,
        description: resource.description || "",
        type: resource.type,
        url: resource.url || "",
        file: null
      });
      setEditMode(true);
    } else {
      setCurrentResource({
        title: "",
        description: "",
        type: "link",
        url: "",
        file: null
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentResource(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!currentResource.title || (currentResource.type === "link" && !currentResource.url)) {
      showSnackbar("Please fill all required fields", "error");
      return;
    }

    try {
      const resourceData = {
        projectId: selectedProject,
        title: currentResource.title,
        description: currentResource.description,
        type: currentResource.type,
        updatedAt: serverTimestamp()
      };

      if (currentResource.type === "link") {
        resourceData.url = currentResource.url;
      }

      if (editMode) {
        await updateDoc(doc(db, "project-resources", currentResource.id), resourceData);
        showSnackbar("Resource updated successfully", "success");
      } else {
        resourceData.createdAt = serverTimestamp();
        await addDoc(collection(db, "project-resources"), resourceData);
        showSnackbar("Resource added successfully", "success");
      }

      setOpenDialog(false);
    } catch (error) {
      console.error("Error saving resource:", error);
      showSnackbar("Failed to save resource", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "project-resources", id));
      showSnackbar("Resource deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting resource:", error);
      showSnackbar("Failed to delete resource", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getResourceIcon = (type) => {
    return type === "link" ? (
      <FiLink className="text-blue-500" size={18} />
    ) : (
      <FiFile className="text-purple-500" size={18} />
    );
  };

  const formatDate = (date) => {
    if (!date) return "";
    return format(date, "MMM dd, yyyy");
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <Box>
          <Typography variant="h4" className="font-bold text-slate-800 mb-1">
            Resource Allocation
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            Manage and allocate resources across your projects
          </Typography>
        </Box>
        <Box className="flex items-center gap-3">
          <Button
            variant="outlined"
            startIcon={<FiDownload size={18} />}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<FiPlus size={18} />}
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => handleOpenDialog()}
          >
            Add Resource
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper className="p-4 rounded-lg shadow-sm mb-6">
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Select
              fullWidth
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-white"
              IconComponent={FiChevronDown}
              disabled={projects.length === 0}
            >
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.title}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FiSearch className="text-slate-400" />
                  </InputAdornment>
                ),
                className: "bg-white"
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Select
              fullWidth
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white"
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="link">Links</MenuItem>
              <MenuItem value="file">Files</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              startIcon={<FiFilter size={18} />}
              fullWidth
              className="border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
            >
              Advanced Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Resources Table */}
      <Paper className="rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <Box className="p-4">
            <LinearProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Box className="p-8 text-center">
            <FiFolder className="mx-auto text-slate-400" size={48} />
            <Typography variant="h6" className="font-semibold mt-4">
              No Projects Found
            </Typography>
            <Typography variant="body2" className="text-slate-500 mt-2">
              You don't have any projects assigned yet.
            </Typography>
          </Box>
        ) : filteredResources.length === 0 ? (
          <Box className="p-8 text-center">
            <FiFile className="mx-auto text-slate-400" size={48} />
            <Typography variant="h6" className="font-semibold mt-4">
              No Resources Found
            </Typography>
            <Typography variant="body2" className="text-slate-500 mt-2">
              {searchTerm ? "No resources match your search criteria" : "This project has no resources yet"}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FiPlus size={16} />}
              className="mt-4"
              onClick={() => handleOpenDialog()}
            >
              Add First Resource
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead className="bg-slate-50">
                  <TableRow>
                    <TableCell className="font-bold text-slate-600">Resource</TableCell>
                    <TableCell className="font-bold text-slate-600">Type</TableCell>
                    <TableCell className="font-bold text-slate-600">Description</TableCell>
                    <TableCell className="font-bold text-slate-600">Created</TableCell>
                    <TableCell className="font-bold text-slate-600">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedResources.map(resource => (
                    <TableRow key={resource.id} hover>
                      <TableCell>
                        <Box className="flex items-center gap-3">
                          <Avatar className="bg-indigo-100 text-indigo-600">
                            {getResourceIcon(resource.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" className="font-semibold">
                              {resource.title}
                            </Typography>
                            {resource.type === "link" && (
                              <Typography variant="caption" className="text-slate-500">
                                {resource.url?.length > 30 
                                  ? `${resource.url.substring(0, 30)}...` 
                                  : resource.url}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={resource.type}
                          size="small"
                          className={`capitalize ${
                            resource.type === "link"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="text-slate-600">
                          {resource.description || "No description"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="text-slate-600">
                          {formatDate(resource.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box className="flex gap-2">
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (resource.type === "link") {
                                  window.open(resource.url, "_blank");
                                } else {
                                  // Handle file view
                                }
                              }}
                            >
                              <FiEye className="text-slate-600" size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(resource)}
                            >
                              <FiEdit2 className="text-slate-600" size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(resource.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {filteredResources.length > 0 && (
              <Box className="p-4 border-t border-slate-200">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" className="text-slate-500">
                    Showing {(page - 1) * rowsPerPage + 1} to{" "}
                    {Math.min(page * rowsPerPage, filteredResources.length)} of{" "}
                    {filteredResources.length} resources
                  </Typography>
                  <Pagination
                    count={Math.ceil(filteredResources.length / rowsPerPage)}
                    page={page}
                    onChange={handleChangePage}
                    shape="rounded"
                    className="[&_.MuiPaginationItem-root]:text-slate-600 
                              [&_.Mui-selected]:bg-indigo-600 
                              [&_.Mui-selected]:text-white 
                              [&_.Mui-selected:hover]:bg-indigo-700"
                  />
                </Stack>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Add/Edit Resource Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle className="flex justify-between items-center border-b border-slate-200 pb-3">
          <Typography variant="h6" className="font-semibold">
            {editMode ? "Edit Resource" : "Add New Resource"}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pt-4">
          <Box className="mb-4">
            <Typography variant="subtitle2" className="font-semibold mb-2">
              Resource Type
            </Typography>
            <Box className="flex gap-3">
              <Button
                variant={currentResource.type === "link" ? "contained" : "outlined"}
                startIcon={<FiLink size={16} />}
                onClick={() => setCurrentResource(prev => ({ ...prev, type: "link" }))}
                className={`flex-1 ${
                  currentResource.type === "link"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                Link
              </Button>
              <Button
                variant={currentResource.type === "file" ? "contained" : "outlined"}
                startIcon={<FiFile size={16} />}
                onClick={() => setCurrentResource(prev => ({ ...prev, type: "file" }))}
                className={`flex-1 ${
                  currentResource.type === "file"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                File
              </Button>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Title"
            name="title"
            value={currentResource.title}
            onChange={handleInputChange}
            className="mb-4"
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={currentResource.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            className="mb-4"
          />

          {currentResource.type === "link" ? (
            <TextField
              fullWidth
              label="URL"
              name="url"
              value={currentResource.url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="mb-2"
            />
          ) : (
            <Box className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <FiUpload className="mx-auto text-slate-400 mb-3" size={32} />
              <Typography variant="body2" className="text-slate-500 mb-4">
                Drag and drop files here or click to browse
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FiFolder size={16} />}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Select File
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="px-4 py-3 border-t border-slate-200">
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={<FiCheck size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {editMode ? "Update Resource" : "Add Resource"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          className="w-full"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ResourceAllocation;