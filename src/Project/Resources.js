import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Paper, Grid, Button, 
  List, ListItem, ListItemAvatar, ListItemText,
  Divider, Avatar, Chip, LinearProgress, CircularProgress
} from "@mui/material";
import {
  FiFolder, FiLink, FiFile, FiImage, FiDownload,
  FiPlus, FiExternalLink
} from "react-icons/fi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { format } from "date-fns";

const typeIcons = {
  'file': <FiFile />,
  'link': <FiLink />,
  'image': <FiImage />
};

const ResourcesComponent = ({ projectId }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "project-resources"),
          where("projectId", "==", projectId)
        );
        const querySnapshot = await getDocs(q);
        const resourcesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setResources(resourcesData);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [projectId]);

  const parseCustomDateString = (dateString) => {
    // Example for "2 May 2025 at 23:11:40 UTC+5:30"
    const parts = dateString.split(' at ');
    if (parts.length === 2) {
      return new Date(parts[0] + ' ' + parts[1].split(' UTC')[0]);
    }
    return new Date(dateString);
  };
  
  const formatDate = (dateValue) => {
    if (!dateValue) return 'No date';
    
    try {
      if (dateValue.toDate) { // Firestore Timestamp
        return format(dateValue.toDate(), "MMM dd, yyyy");
      }
      
      const date = typeof dateValue === 'string' 
        ? parseCustomDateString(dateValue)
        : new Date(dateValue);
        
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper className="p-4 rounded-lg shadow-sm">
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h6" className="font-bold">
          Resources ({resources.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<FiPlus size={18} />}
          size="small"
        >
          Add Resource
        </Button>
      </Box>

      {resources.length === 0 ? (
        <Box className="text-center py-8">
          <FiFolder className="mx-auto text-gray-400" size={48} />
          <Typography variant="h6" className="mt-4 text-gray-600">
            No resources found
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-2">
            Add files or links to share with your team
          </Typography>
        </Box>
      ) : (
        <List>
          {resources.map((resource, index) => (
            <React.Fragment key={resource.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: resource.type === 'link' ? '#e0f2fe' : '#ecfdf5',
                    color: resource.type === 'link' ? '#0369a1' : '#059669'
                  }}>
                    {typeIcons[resource.type] || <FiFile />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box className="flex items-center gap-2">
                      <Typography variant="subtitle1" className="font-medium">
                        {resource.title}
                      </Typography>
                      <Chip
                        label={resource.type}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          backgroundColor: resource.type === 'link' ? '#e0f2fe' : '#ecfdf5',
                          color: resource.type === 'link' ? '#0369a1' : '#059669'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" className="text-gray-600">
                        {resource.description || 'No description provided'}
                      </Typography>
                      <Box className="flex items-center gap-2 mt-1">
                        <Typography variant="caption" className="text-gray-500">
                          Added {formatDate(resource.createdAt)}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FiExternalLink />}
                          onClick={() => {
                            if (resource.type === 'link') {
                              window.open(resource.url, '_blank');
                            } else if (resource.fileUrl) {
                              window.open(resource.fileUrl, '_blank');
                            }
                          }}
                        >
                          {resource.type === 'link' ? 'Visit' : 'Download'}
                        </Button>
                      </Box>
                    </>
                  }
                />
              </ListItem>
              {index < resources.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default ResourcesComponent;