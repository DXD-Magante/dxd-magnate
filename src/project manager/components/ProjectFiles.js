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
  Alert,
  Breadcrumbs,
  Link
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
  FiFile,
  FiFolder,
  FiExternalLink,
  FiX,
  FiCheck,
  FiUpload,
  FiHardDrive,
  FiImage,
  FiVideo,
  FiMusic,
  FiFileText,
  FiCode,
  FiArchive,
  FiFolderPlus,
  FiGrid,
  FiList,
  FiShare2,
  FiStar,
  FiMoreVertical
} from "react-icons/fi";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { format } from "date-fns";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ProjectFiles = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentFile, setCurrentFile] = useState({
    name: "",
    description: "",
    file: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFolder, setCurrentFolder] = useState("root");
  const [folderPath, setFolderPath] = useState([{ id: "root", name: "All Files" }]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const rowsPerPage = 12;

  // File type icons and colors
  const fileTypes = {
    pdf: { icon: <FiFileText className="text-red-500" />, color: "bg-red-100 text-red-800" },
    doc: { icon: <FiFileText className="text-blue-500" />, color: "bg-blue-100 text-blue-800" },
    docx: { icon: <FiFileText className="text-blue-500" />, color: "bg-blue-100 text-blue-800" },
    xls: { icon: <FiFileText className="text-green-500" />, color: "bg-green-100 text-green-800" },
    xlsx: { icon: <FiFileText className="text-green-500" />, color: "bg-green-100 text-green-800" },
    ppt: { icon: <FiFileText className="text-orange-500" />, color: "bg-orange-100 text-orange-800" },
    pptx: { icon: <FiFileText className="text-orange-500" />, color: "bg-orange-100 text-orange-800" },
    jpg: { icon: <FiImage className="text-purple-500" />, color: "bg-purple-100 text-purple-800" },
    jpeg: { icon: <FiImage className="text-purple-500" />, color: "bg-purple-100 text-purple-800" },
    png: { icon: <FiImage className="text-purple-500" />, color: "bg-purple-100 text-purple-800" },
    gif: { icon: <FiImage className="text-purple-500" />, color: "bg-purple-100 text-purple-800" },
    mp4: { icon: <FiVideo className="text-yellow-500" />, color: "bg-yellow-100 text-yellow-800" },
    mov: { icon: <FiVideo className="text-yellow-500" />, color: "bg-yellow-100 text-yellow-800" },
    mp3: { icon: <FiMusic className="text-pink-500" />, color: "bg-pink-100 text-pink-800" },
    zip: { icon: <FiArchive className="text-gray-500" />, color: "bg-gray-100 text-gray-800" },
    rar: { icon: <FiArchive className="text-gray-500" />, color: "bg-gray-100 text-gray-800" },
    txt: { icon: <FiFileText className="text-gray-500" />, color: "bg-gray-100 text-gray-800" },
    js: { icon: <FiCode className="text-yellow-500" />, color: "bg-yellow-100 text-yellow-800" },
    json: { icon: <FiCode className="text-yellow-500" />, color: "bg-yellow-100 text-yellow-800" },
    html: { icon: <FiCode className="text-red-500" />, color: "bg-red-100 text-red-800" },
    css: { icon: <FiCode className="text-blue-500" />, color: "bg-blue-100 text-blue-800" },
    default: { icon: <FiFile className="text-indigo-500" />, color: "bg-indigo-100 text-indigo-800" }
  };

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

  // Fetch files for selected project
  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const filesQuery = query(
          collection(db, "project-resources"),
          where("projectId", "==", selectedProject),
          where("type", "==", "file")
        );
        
        const filesSnapshot = await getDocs(filesQuery);
        const filesData = filesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        // Sort by creation date (newest first)
        filesData.sort((a, b) => b.createdAt - a.createdAt);
        setFiles(filesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching files:", error);
        setLoading(false);
        showSnackbar("Failed to load files", "error");
      }
    };

    fetchFiles();
  }, [selectedProject]);

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    return fileTypes[extension] || fileTypes.default;
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = 
      file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = 
      fileTypeFilter === "all" || 
      file.title.split('.').pop().toLowerCase() === fileTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const paginatedFiles = filteredFiles.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleOpenDialog = (file = null) => {
    if (file) {
      setCurrentFile({
        id: file.id,
        name: file.title,
        description: file.description || "",
        file: null
      });
    } else {
      setCurrentFile({
        name: "",
        description: "",
        file: null
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setUploadProgress(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentFile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setCurrentFile(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const handleUpload = async () => {
    if (!currentFile.name || !currentFile.file) {
      showSnackbar("Please provide a name and select a file", "error");
      return;
    }

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `project-files/${selectedProject}/${currentFolder}/${currentFile.file.name}`);
      
      // Upload file to Firebase Storage
      const uploadTask = uploadBytes(storageRef, currentFile.file);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          showSnackbar("File upload failed", "error");
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save file metadata to Firestore
          const fileData = {
            projectId: selectedProject,
            title: currentFile.name,
            description: currentFile.description,
            type: "file",
            url: downloadURL,
            fileType: currentFile.file.name.split('.').pop().toLowerCase(),
            size: currentFile.file.size,
            folder: currentFolder,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          if (currentFile.id) {
            await updateDoc(doc(db, "project-resources", currentFile.id), fileData);
            showSnackbar("File updated successfully", "success");
          } else {
            await addDoc(collection(db, "project-resources"), fileData);
            showSnackbar("File uploaded successfully", "success");
          }

          setOpenDialog(false);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      showSnackbar("Failed to upload file", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "project-resources", id));
      showSnackbar("File deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting file:", error);
      showSnackbar("Failed to delete file", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const formatDate = (date) => {
    if (!date) return "";
    return format(date, "MMM dd, yyyy");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const navigateToFolder = (folderId, folderName) => {
    setCurrentFolder(folderId);
    if (folderId === "root") {
      setFolderPath([{ id: "root", name: "All Files" }]);
    } else {
      setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    }
  };

  const navigateUp = (index) => {
    setCurrentFolder(folderPath[index].id);
    setFolderPath(folderPath.slice(0, index + 1));
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <Box>
          <Typography variant="h4" className="font-bold text-slate-800 mb-1">
            Project Files
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            Manage and organize all project files in one place
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
            startIcon={<FiUpload size={18} />}
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => handleOpenDialog()}
          >
            Upload File
          </Button>
        </Box>
      </Box>

      {/* Breadcrumbs */}
      <Paper className="p-3 rounded-lg shadow-sm mb-4">
        <Breadcrumbs aria-label="breadcrumb">
          {folderPath.map((folder, index) => (
            <Link
              key={folder.id}
              color={index === folderPath.length - 1 ? "text.primary" : "inherit"}
              underline="hover"
              onClick={() => navigateUp(index)}
              className="cursor-pointer flex items-center gap-1"
            >
              {index === 0 ? <FiHardDrive size={16} /> : <FiFolder size={16} />}
              {folder.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      {/* Filters and View Controls */}
      <Paper className="p-4 rounded-lg shadow-sm mb-6">
        <Grid container spacing={2} alignItems="center">
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
              placeholder="Search files..."
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
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="bg-white"
              IconComponent={FiChevronDown}
            >
              <MenuItem value="all">All File Types</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="docx">Word</MenuItem>
              <MenuItem value="xlsx">Excel</MenuItem>
              <MenuItem value="pptx">PowerPoint</MenuItem>
              <MenuItem value="jpg">Images</MenuItem>
              <MenuItem value="mp4">Videos</MenuItem>
              <MenuItem value="zip">Archives</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={3} className="flex justify-end gap-2">
            <IconButton
              onClick={() => setViewMode("grid")}
              color={viewMode === "grid" ? "primary" : "default"}
            >
              <FiGrid />
            </IconButton>
            <IconButton
              onClick={() => setViewMode("list")}
              color={viewMode === "list" ? "primary" : "default"}
            >
              <FiList />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Files Display */}
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
      ) : filteredFiles.length === 0 ? (
        <Box className="p-8 text-center">
          <FiFile className="mx-auto text-slate-400" size={48} />
          <Typography variant="h6" className="font-semibold mt-4">
            No Files Found
          </Typography>
          <Typography variant="body2" className="text-slate-500 mt-2">
            {searchTerm ? "No files match your search criteria" : "This project has no files yet"}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FiUpload size={16} />}
            className="mt-4"
            onClick={() => handleOpenDialog()}
          >
            Upload First File
          </Button>
        </Box>
      ) : viewMode === "grid" ? (
        <>
          <Grid container spacing={3}>
            {paginatedFiles.map(file => {
              const fileType = getFileType(file.title);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
                  <Paper className="p-4 rounded-lg hover:shadow-md transition-shadow h-full flex flex-col">
                    <Box className="flex justify-between items-start mb-3">
                      <Avatar className={`w-12 h-12 ${fileType.color} flex items-center justify-center`}>
                        {fileType.icon}
                      </Avatar>
                      <Box className="flex gap-1">
                        <IconButton size="small">
                          <FiStar className="text-slate-400 hover:text-yellow-500" size={16} />
                        </IconButton>
                        <IconButton size="small">
                          <FiMoreVertical className="text-slate-400" size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography 
                      variant="subtitle2" 
                      className="font-semibold mb-1 truncate"
                      title={file.title}
                    >
                      {file.title}
                    </Typography>
                    <Typography variant="caption" className="text-slate-500 mb-2">
                      {formatFileSize(file.size || 0)}
                    </Typography>
                    <Typography variant="body2" className="text-slate-600 text-sm mb-3 line-clamp-2">
                      {file.description || "No description"}
                    </Typography>
                    <Box className="mt-auto flex justify-between items-center">
                      <Typography variant="caption" className="text-slate-500">
                        {formatDate(file.createdAt)}
                      </Typography>
                      <Box className="flex gap-1">
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => window.open(file.url, "_blank")}
                          >
                            <FiDownload className="text-slate-600" size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Share">
                          <IconButton size="small">
                            <FiShare2 className="text-slate-600" size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          {filteredFiles.length > 0 && (
            <Box className="mt-6">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" className="text-slate-500">
                  Showing {(page - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(page * rowsPerPage, filteredFiles.length)} of{" "}
                  {filteredFiles.length} files
                </Typography>
                <Pagination
                  count={Math.ceil(filteredFiles.length / rowsPerPage)}
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
      ) : (
        <>
          <Paper className="rounded-lg shadow-sm overflow-hidden">
            <TableContainer>
              <Table>
                <TableHead className="bg-slate-50">
                  <TableRow>
                    <TableCell className="font-bold text-slate-600">Name</TableCell>
                    <TableCell className="font-bold text-slate-600">Type</TableCell>
                    <TableCell className="font-bold text-slate-600">Size</TableCell>
                    <TableCell className="font-bold text-slate-600">Modified</TableCell>
                    <TableCell className="font-bold text-slate-600">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedFiles.map(file => {
                    const fileType = getFileType(file.title);
                    return (
                      <TableRow key={file.id} hover>
                        <TableCell>
                          <Box className="flex items-center gap-3">
                            <Avatar className={`w-8 h-8 ${fileType.color} flex items-center justify-center`}>
                              {fileType.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" className="font-semibold">
                                {file.title}
                              </Typography>
                              <Typography variant="caption" className="text-slate-500">
                                {file.description?.substring(0, 30)}{file.description?.length > 30 ? "..." : ""}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={file.fileType || "file"}
                            size="small"
                            className={`capitalize ${fileType.color}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-slate-600">
                            {formatFileSize(file.size || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-slate-600">
                            {formatDate(file.updatedAt || file.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box className="flex gap-2">
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => window.open(file.url, "_blank")}
                              >
                                <FiDownload className="text-slate-600" size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Share">
                              <IconButton size="small">
                                <FiShare2 className="text-slate-600" size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(file)}
                              >
                                <FiEdit2 className="text-slate-600" size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(file.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {filteredFiles.length > 0 && (
              <Box className="p-4 border-t border-slate-200">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" className="text-slate-500">
                    Showing {(page - 1) * rowsPerPage + 1} to{" "}
                    {Math.min(page * rowsPerPage, filteredFiles.length)} of{" "}
                    {filteredFiles.length} files
                  </Typography>
                  <Pagination
                    count={Math.ceil(filteredFiles.length / rowsPerPage)}
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
          </Paper>
        </>
      )}

      {/* Upload/Edit File Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle className="flex justify-between items-center border-b border-slate-200 pb-3">
          <Typography variant="h6" className="font-semibold">
            {currentFile.id ? "Edit File" : "Upload New File"}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <FiX />
          </IconButton>
        </DialogTitle>
        <DialogContent className="pt-4">
          <TextField
            fullWidth
            label="File Name"
            name="name"
            value={currentFile.name}
            onChange={handleInputChange}
            className="mb-4"
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={currentFile.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            className="mb-4"
          />

          <Box className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
            {currentFile.file ? (
              <Box className="flex flex-col items-center">
                <FiFile className="mx-auto text-indigo-500 mb-3" size={32} />
                <Typography variant="body2" className="font-medium mb-1">
                  {currentFile.file.name}
                </Typography>
                <Typography variant="caption" className="text-slate-500 mb-4">
                  {formatFileSize(currentFile.file.size)}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setCurrentFile(prev => ({ ...prev, file: null }))}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Change File
                </Button>
              </Box>
            ) : (
              <>
                <FiUpload className="mx-auto text-slate-400 mb-3" size={32} />
                <Typography variant="body2" className="text-slate-500 mb-4">
                  Drag and drop files here or click to browse
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<FiFolder size={16} />}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Select File
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </>
            )}
          </Box>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box className="mt-4">
              <Typography variant="caption" className="block mb-1 text-slate-600">
                Uploading: {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
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
            onClick={handleUpload}
            startIcon={<FiCheck size={16} />}
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={!currentFile.name || !currentFile.file || uploadProgress > 0}
          >
            {currentFile.id ? "Update File" : "Upload File"}
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

export default ProjectFiles;