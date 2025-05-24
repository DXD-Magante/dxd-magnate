import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Button,
  Skeleton,
  Badge,
  Stack,
  Paper,
  Tabs,
  Tab
} from "@mui/material";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiExternalLink,
  FiLink
} from "react-icons/fi";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube } from "react-icons/fa";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { format, parseISO, isToday, isTomorrow } from "date-fns";

const platformIcons = {
  facebook: <FaFacebook color="#1877F2" size={14} />,
  twitter: <FaTwitter color="#1DA1F2" size={14} />,
  linkedin: <FaLinkedin color="#0A66C2" size={14} />,
  instagram: <FaInstagram color="#E4405F" size={14} />,
  youtube: <FaYoutube color="#FF0000" size={14} />
};

const statusColors = {
  scheduled: "primary",
  published: "success",
  failed: "error",
  draft: "warning"
};

const UpcomingPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "scheduled-posts"),
        where("assignedTo", "==", auth.currentUser.uid),
      );
      
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return format(date, "MMM d, yyyy h:mm a");
  };

  const getPostStatus = (post) => {
    const now = new Date();
    const scheduledDate = post.scheduledDateTime?.toDate();
    
    if (!scheduledDate) return "scheduled";
    
    if (post.status === "published") return "published";
    if (post.status === "failed") return "failed";
    if (post.status === "draft") return "draft";
    
    if (scheduledDate < now) return "failed";
    return "scheduled";
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 0) return true; // All posts
    if (activeTab === 1) return isToday(post.scheduledDateTime?.toDate()); // Today
    if (activeTab === 2) return isTomorrow(post.scheduledDateTime?.toDate()); // Tomorrow
    return true;
  });

  return (
    <Box className="p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900">
            Upcoming Posts
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage and track your scheduled social media posts
          </Typography>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Paper className="p-2 mb-6 rounded-lg shadow-sm">
        <Tabs 
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Posts" />
          <Tab label="Today" />
          <Tab label="Tomorrow" />
          <Tab label="Scheduled" />
          <Tab label="Drafts" />
        </Tabs>
      </Paper>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Total Posts
          </Typography>
          <Typography variant="h4" className="font-bold">
            {posts.length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Today
          </Typography>
          <Typography variant="h4" className="font-bold text-blue-600">
            {posts.filter(post => isToday(post.scheduledDateTime?.toDate())).length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Tomorrow
          </Typography>
          <Typography variant="h4" className="font-bold text-purple-600">
            {posts.filter(post => isTomorrow(post.scheduledDateTime?.toDate())).length}
          </Typography>
        </Paper>
        <Paper className="p-4 rounded-lg shadow-xs">
          <Typography variant="body2" className="text-gray-500">
            Scheduled
          </Typography>
          <Typography variant="h4" className="font-bold text-green-600">
            {posts.filter(post => getPostStatus(post) === "scheduled").length}
          </Typography>
        </Paper>
      </div>
      
      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-lg shadow-xs">
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" height={24} />
                <div className="flex gap-2 mt-2">
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="circular" width={24} height={24} />
                </div>
                <div className="flex justify-between items-center mt-3">
                  <Skeleton variant="text" width="30%" height={24} />
                  <Skeleton variant="rounded" width={80} height={32} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Paper className="p-8 text-center rounded-lg shadow-xs">
          <FiCalendar className="mx-auto text-gray-400" size={48} />
          <Typography variant="h6" className="mt-4 text-gray-600">
            No upcoming posts found
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-2">
            {activeTab === 0 ? "You don't have any scheduled posts yet." : 
             activeTab === 1 ? "No posts scheduled for today." : 
             "No posts scheduled for tomorrow."}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FiPlus />}
            className="mt-4"
            onClick={() => {/* Add navigation to schedule new post */}}
          >
            Schedule New Post
          </Button>
        </Paper>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const status = getPostStatus(post);
            const isPastDue = status === "failed";
            
            return (
              <Card key={post.id} className="rounded-lg shadow-xs hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <Tooltip title={post.platforms?.join(", ")}>
                                <div className="flex">
                                  {post.platforms?.map((platform, i) => (
                                    <div key={i} className="-mr-2">
                                      {platformIcons[platform]}
                                    </div>
                                  ))}
                                </div>
                              </Tooltip>
                            }
                          >
                            <Avatar
                              sx={{ width: 48, height: 48, bgcolor: '#4f46e510' }}
                              className="border border-gray-200"
                            >
                              <FiCalendar className="text-indigo-600" size={20} />
                            </Avatar>
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <Typography variant="h6" className="font-medium">
                            {post.title || "Untitled Post"}
                          </Typography>
                          <Typography variant="body2" className="text-gray-600 mt-1">
                            {post.description || "No description provided"}
                          </Typography>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Chip
                              label={formatDate(post.scheduledDateTime)}
                              size="small"
                              icon={<FiClock size={14} />}
                              className={`${isPastDue ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800"}`}
                            />
                            <Chip
                              label={status}
                              size="small"
                              color={statusColors[status]}
                              className="capitalize"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Edit">
                          <IconButton size="small" className="text-gray-500 hover:text-indigo-600">
                            <FiEdit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" className="text-gray-500 hover:text-red-600">
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Tooltip>
                        {post.media && (
                          <Tooltip title="View Media">
                            <IconButton 
                              size="small" 
                              className="text-gray-500 hover:text-indigo-600"
                              onClick={() => window.open(post.media, '_blank')}
                            >
                              <FiExternalLink size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                      
                      {isPastDue && (
                        <Chip
                          label="Past Due"
                          size="small"
                          color="error"
                          icon={<FiAlertCircle size={14} />}
                          className="mt-2"
                        />
                      )}
                    </div>
                  </div>
                  
                  {(post.hashtags || post.links) && (
                    <>
                      <Divider className="my-3" />
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags && post.hashtags.split(",").map((tag, i) => (
                          <Chip
                            key={i}
                            label={`#${tag.trim()}`}
                            size="small"
                            variant="outlined"
                            className="text-xs"
                          />
                        ))}
                        {post.links && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<FiLink />}
                            onClick={() => window.open(post.links, '_blank')}
                          >
                            View Link
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Box>
  );
};

export default UpcomingPosts;