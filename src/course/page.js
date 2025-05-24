import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Button, IconButton, 
  LinearProgress, useTheme, Paper, Divider,
  Tabs, Tab, Card, CardContent, Grid,
  Avatar, Chip, Accordion, AccordionSummary,
  AccordionDetails, List, ListItem, ListItemText,
  ListItemAvatar, TextField, Rating, Badge, FormControl, InputLabel, Select, Menu, MenuItem
} from "@mui/material";
import { 
  FiPlay, FiChevronRight, FiChevronLeft,
  FiX, FiList, FiBookmark, FiShare2,
  FiBook, FiClock, FiUsers, FiAward,
  FiFileText, FiLink, FiBarChart2,
  FiMessageSquare, FiStar, FiChevronDown,
  FiHeart, FiMessageCircle, FiCheckCircle,
  FiSend, FiDownload, FiYoutube, FiSearch,  FiFilter, FiArrowRight, FiInfo, FiCalendar, FiUser, FiBookOpen, FiEye
} from "react-icons/fi";
import{AiOutlineRead} from "react-icons/ai";
import { styled } from "@mui/material/styles";
import { auth, db } from "../services/firebase";
import {   doc, getDoc, collection, query, 
    where, orderBy, addDoc, updateDoc,
    serverTimestamp, getDocs, limit, arrayUnion, arrayRemove, setDoc, increment, deleteField } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from 'react-youtube';
import { Tooltip } from "recharts";
import { onAuthStateChanged } from "firebase/auth";



const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  minHeight: 48,
  fontSize: theme.typography.pxToRem(15),
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const CourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [expandedModule, setExpandedModule] = useState(null);
  const [progress, setProgress] = useState('');
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [review, setReview] = useState({
    rating: 5,
    comment: ''
  });
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortOption, setSortOption] = useState('newest');
  const [userProgress, setUserProgress] = useState(null);
const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);
            
            // Only fetch progress for collaborators and interns
            if (userData.role === 'collaborator' || userData.role === 'intern') {
              const progressDoc = await getDoc(doc(db, "course-progress", `${user.uid}_${courseId}`));
              if (progressDoc.exists()) {
                setUserProgress(progressDoc.data());
              } else {
                // Initialize progress if it doesn't exist
                setUserProgress({
                  userId: user.uid,
                  courseId,
                  completedMaterials: [],
                  lastAccessed: new Date(),
                  progressPercentage: 0
                });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserRole(null);
        setUserProgress(null);
      }
    });
  
    return () => unsubscribe();
  }, [courseId]);

  const updateCourseProgress = async (moduleIndex, videoIndex) => {
    if (!auth.currentUser || !(userRole === 'collaborator' || userRole === 'intern')) return;
  
    try {
      const materialId = `${moduleIndex}_${videoIndex}`;
      const progressRef = doc(db, "course-progress", `${auth.currentUser.uid}_${courseId}`);
      
      // Check if this material is already completed
      const progressDoc = await getDoc(progressRef);
      let completedMaterials = [];
      let progressPercentage = 0;
      
      if (progressDoc.exists()) {
        completedMaterials = progressDoc.data().completedMaterials || [];
      }
      
      // Add material if not already completed
      if (!completedMaterials.includes(materialId)) {
        completedMaterials.push(materialId);
        
        // Calculate total materials count
        const totalMaterials = course.modules.reduce(
          (total, module) => total + (module.materials?.length || 0), 
          0
        );
        
        // Calculate new progress percentage
        progressPercentage = Math.round((completedMaterials.length / totalMaterials) * 100);
        
        // Update progress in Firestore
        await setDoc(progressRef, {
          userId: auth.currentUser.uid,
          courseId,
          completedMaterials,
          lastAccessed: serverTimestamp(),
          progressPercentage,
          courseTitle: course.title,
          lastMaterial: `${moduleIndex}_${videoIndex}`,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Update local state
        setUserProgress({
          completedMaterials,
          progressPercentage,
          lastAccessed: new Date(),
          userId: auth.currentUser.uid,
          courseId
        });
      }
    } catch (error) {
      console.error("Error updating course progress:", error);
    }
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          setCourse({
            id: courseDoc.id,
            ...courseDoc.data()
          });
        } else {
          navigate('/courses');
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching course:", error);
        setLoading(false);
      }
    };

    fetchCourse();

    // Mock questions and reviews
    setQuestions([
      {
        id: 1,
        question: "How do I access the course materials?",
        author: "John Doe",
        avatar: "https://randomuser.me/api/portraits/men/1.jpg",
        date: "2 days ago",
        replies: [
          {
            id: 1,
            reply: "All materials are available in the Resources tab.",
            author: "Course Instructor",
            avatar: "https://randomuser.me/api/portraits/women/1.jpg",
            date: "1 day ago"
          }
        ]
      }
    ]);

    setReviews([
      {
        id: 1,
        rating: 5,
        comment: "Great course! Very comprehensive and well-structured. The instructor explains concepts clearly and the hands-on projects really helped solidify my understanding.",
        author: "Jane Smith",
        avatar: "https://randomuser.me/api/portraits/women/2.jpg",
        date: "1 week ago"
      }
    ]);
  }, [courseId, navigate]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, ratingFilter, sortOption, searchTerm]);

  const fetchReviews = async () => {
    try {
      let reviewsQuery = query(
        collection(db, "course-reviews"),
        where("courseId", "==", courseId)
      );

      // Apply rating filter if set
      if (ratingFilter > 0) {
        reviewsQuery = query(reviewsQuery, where("rating", "==", ratingFilter));
      }

      // Apply sorting
      if (sortOption === 'newest') {
        reviewsQuery = query(reviewsQuery,);
      } else if (sortOption === 'oldest') {
        reviewsQuery = query(reviewsQuery,);
      } else if (sortOption === 'highest') {
        reviewsQuery = query(reviewsQuery,);
      } else if (sortOption === 'lowest') {
        reviewsQuery = query(reviewsQuery,);
      }

      const querySnapshot = await getDocs(reviewsQuery);
      const reviewsData = [];
      const userIds = new Set();
      const stats = {
        total: 0,
        sum: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      querySnapshot.forEach((doc) => {
        const reviewData = doc.data();
        reviewsData.push({
          id: doc.id,
          ...reviewData,
          createdAt: reviewData.createdAt?.toDate()?.toLocaleDateString() || 'N/A',
          lastUpdated: reviewData.lastUpdated?.toDate()?.toLocaleDateString() || 'N/A'
        });
        userIds.add(reviewData.userId);
        
        // Calculate stats
        stats.total++;
        stats.sum += reviewData.rating;
        stats.distribution[reviewData.rating]++;
      });

      setReviews(reviewsData);
      
      // Calculate average rating
      const average = stats.total > 0 ? (stats.sum / stats.total).toFixed(1) : 0;
      setReviewStats({
        average,
        total: stats.total,
        distribution: stats.distribution
      });

      // Fetch user data for reviews
      await fetchUsersData(Array.from(userIds));
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchUsersData = async (userIds) => {
    try {
      const users = {};
      await Promise.all(userIds.map(async (userId) => {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          users[userId] = userDoc.data();
        }
      }));
      setUsersData(users);
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (!review.comment.trim() || !auth.currentUser) return;

    try {
      const reviewData = {
        userId: auth.currentUser.uid,
        courseId,
        rating: review.rating,
        comment: review.comment,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };

      await addDoc(collection(db, "course-reviews"), reviewData);
      setReview({
        rating: 5,
        comment: ''
      });
      fetchReviews(); // Refresh reviews after submission
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const getUserDisplayName = (userId) => {
    const user = usersData[userId];
    if (!user) return 'Anonymous';
    return user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  };

  const getUserAvatar = (userId) => {
    const user = usersData[userId];
    if (!user) return null;
    return user.photoURL || null;
  };

  const filteredReviews = reviews.filter(review => {
    // Apply search term filter
    const matchesSearch = searchTerm === '' || 
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) || 
      getUserDisplayName(review.userId).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });


  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getCurrentVideo = () => {
    if (!course || !course.modules || course.modules.length === 0) return null;
    const module = course.modules[currentModuleIndex];
    if (!module.materials || module.materials.length === 0) return null;
    return module.materials[currentVideoIndex];
  };

  const handleNextVideo = () => {
    if (!course || !course.modules) return;
    
    const currentModule = course.modules[currentModuleIndex];
    if (currentVideoIndex < currentModule.materials.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentVideoIndex(0);
    }
  };

  const handlePreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    } else if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1];
      setCurrentModuleIndex(currentModuleIndex - 1);
      setCurrentVideoIndex(prevModule.materials.length - 1);
    }
  };

  const handleVideoEnd = () => {
    handleNextVideo();
  };

  const goToVideo = (moduleIdx, videoIdx) => {
    setCurrentModuleIndex(moduleIdx);
    setCurrentVideoIndex(videoIdx);
    setShowSidebar(false);
    updateCourseProgress(moduleIdx, videoIdx);
  };

  const handleModuleExpand = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  const fetchQuestions = async () => {
    try {
      const q = query(
        collection(db, "course-q&a"),
        where("courseId", "==", courseId),
        where("type", "==", "question")
      );
  
      const querySnapshot = await getDocs(q);
      const questionsData = [];
      const userIds = new Set();
  
      querySnapshot.forEach((doc) => {
        const questionData = doc.data();
        questionsData.push({
          id: doc.id,
          ...questionData,
          createdAt: questionData.createdAt?.toDate()?.toLocaleDateString() || 'N/A',
          lastUpdated: questionData.lastUpdated?.toDate()?.toLocaleDateString() || 'N/A'
        });
        userIds.add(questionData.userId);
      });
  
      // Sort by timestamp (newest first) without using orderBy
      questionsData.sort((a, b) => {
        const dateA = a.createdAt === 'N/A' ? new Date(0) : new Date(a.createdAt);
        const dateB = b.createdAt === 'N/A' ? new Date(0) : new Date(b.createdAt);
        return dateB - dateA;
      });
  
      setQuestions(questionsData);
      await fetchUsersData(Array.from(userIds));
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'qna') {
      fetchQuestions();
    }
  }, [activeTab]);

  const handleSubmitQuestion = async () => {
    if (!question.trim() || !auth.currentUser) return;
  
    try {
      const questionData = {
        courseId,
        userId: auth.currentUser.uid,
        question: question.trim(),
        type: "question",
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        replies: [],
        upvotes: 0,
        status: "open"
      };
  
      // Add question to Firestore
      await addDoc(collection(db, "course-q&a"), questionData);
      
      // Refresh questions
      fetchQuestions();
      setQuestion('');
    } catch (error) {
      console.error("Error submitting question:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: '80%', height: 6, borderRadius: 3 }} />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        p: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Course not found
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          The course you're looking for doesn't exist or may have been removed.
        </Typography>
        <Button 
          variant="contained" 
          size="large"
          sx={{ 
            mt: 2,
            borderRadius: '8px',
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontWeight: '600',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          }}
          onClick={() => navigate('/courses')}
        >
          Back to Courses
        </Button>
      </Box>
    );
  }

  const currentVideo = getCurrentVideo();
  const isLastVideo = 
    currentModuleIndex === course.modules.length - 1 && 
    currentVideoIndex === course.modules[currentModuleIndex].materials.length - 1;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
 
    }}>
      {/* Video Player Section */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000',
        position: 'relative',
        marginTop: '60px'
      }}>
        {/* Video Player */}
        {currentVideo && currentVideo.url && (
          <Box sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000'
          }}>
            <YouTube
              videoId={extractYouTubeId(currentVideo.url)}
              opts={{
                height: '100%',
                width: '100%',
                playerVars: {
                  autoplay: 1,
                  modestbranding: 1,
                  rel: 0,
                  controls: 1
                }
              }}
              onEnd={handleVideoEnd}
              style={{
                maxWidth: '1200px',
                width: '100%',
                height: '100%'
              }}
            />
          </Box>
        )}
        
        {/* Video Navigation Controls */}
        <Box sx={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          zIndex: 10
        }}>
          <Button
            variant="contained"
            startIcon={<FiChevronLeft />}
            onClick={handlePreviousVideo}
            disabled={currentModuleIndex === 0 && currentVideoIndex === 0}
            sx={{
              borderRadius: '20px',
              px: 3,
              py: 1,
              fontWeight: '600',
              textTransform: 'none',
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            Previous
          </Button>
          
          {!isLastVideo && (
            <Button
              variant="contained"
              endIcon={<FiChevronRight />}
              onClick={handleNextVideo}
              sx={{
                borderRadius: '20px',
                px: 3,
                py: 1,
                fontWeight: '600',
                textTransform: 'none',
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              Next
            </Button>
          )}
          
          {isLastVideo && (
            <Button
              variant="contained"
              onClick={() => navigate('/courses')}
              sx={{
                borderRadius: '20px',
                px: 3,
                py: 1,
                fontWeight: '600',
                textTransform: 'none',
                backgroundColor: theme.palette.success.main,
                '&:hover': {
                  backgroundColor: theme.palette.success.dark
                }
              }}
            >
              Course Completed!
            </Button>
          )}
        </Box>
        
        {/* Course Title and Toggle Sidebar Button */}
        <Box sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 10
        }}>
          <Typography variant="h6" sx={{ 
            color: '#fff',
            fontWeight: '600',
            backgroundColor: 'rgba(0,0,0,0.5)',
            px: 2,
            py: 1,
            borderRadius: '4px',
            fontSize:"12px"
          }}>
            {course.title} - {course.modules?.[currentModuleIndex]?.title}
          </Typography>
          
          <Box>
            <IconButton
              onClick={() => setShowSidebar(!showSidebar)}
              sx={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              <FiList />
            </IconButton>
           
          </Box>
        </Box>
      </Box>
      
      {/* Tabbed Content Section */}
      <Box sx={{ 
        backgroundColor: theme.palette.background.default,
        borderTop: `1px solid ${theme.palette.divider}`,
        height: '50%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Tabs Header */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3
              }
            }}
          >
              <StyledTab value="overview" label="Overview" icon={<AiOutlineRead size={18} />} iconPosition="start" />
            <StyledTab value="content" label="Course Content" icon={<FiBook size={18} />} iconPosition="start" />
            <StyledTab value="resources" label="Resources" icon={<FiDownload size={18} />} iconPosition="start" />
            <StyledTab value="qna" label="Q&A" icon={<FiMessageSquare size={18} />} iconPosition="start" />
            <StyledTab value="reviews" label="Reviews" icon={<FiStar size={18} />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* Tab Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
        {activeTab === 'overview' && (
  <Grid container spacing={4}>
    <Grid item xs={12} md={8}>
      {/* Hero Section */}
      <Box sx={{
        mb: 5,
        p: 4,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
        color: theme.palette.getContrastText(theme.palette.primary.light),
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: '800', 
          mb: 2,
          letterSpacing: '-0.5px'
        }}>
          Welcome to {course.title}
        </Typography>
        <Typography variant="body1" sx={{ 
          fontSize: '1.1rem',
          lineHeight: 1.7,
          mb: 3
        }}>
          {course.shortDescription || course.description.substring(0, 200) + '...'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            label={`${course.level} Level`} 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 600
            }} 
          />
          <Chip 
            label={`${course.estimatedDuration}`} 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 600
            }} 
          />

{(userRole === 'collaborator' || userRole === 'intern') && userProgress && (
  <Box sx={{ 
    mb: 4,
    p: 3,
    backgroundColor: 'background.paper',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid',
    borderColor: 'divider'
  }}>
    <Typography variant="h6" sx={{ 
      fontWeight: '700', 
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1.5
    }}>
      <Box sx={{
        width: '6px',
        height: '24px',
        backgroundColor: 'primary.main',
        borderRadius: '3px'
      }} />
      Your Progress
    </Typography>
    
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 1
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
          {userProgress.progressPercentage}% Complete
        </Typography>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
          {userProgress.completedMaterials?.length || 0} of {course.modules.reduce(
            (total, module) => total + (module.materials?.length || 0), 0
          )} items
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={userProgress.progressPercentage} 
        sx={{ 
          height: '10px',
          borderRadius: '5px',
          backgroundColor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: '5px',
            backgroundColor: 'primary.main'
          }
        }} 
      />
    </Box>
    
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap',
      gap: 2
    }}>
      <Box sx={{
        p: 2,
        flex: 1,
        minWidth: 150,
        backgroundColor: 'primary.50',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Last Accessed
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
          {userProgress.lastAccessed?.toLocaleDateString?.() || 'Today'}
        </Typography>
      </Box>
      
      <Box sx={{
        p: 2,
        flex: 1,
        minWidth: 150,
        backgroundColor: 'secondary.50',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Status
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
          {userProgress.progressPercentage === 100 ? 'Completed' : 'In Progress'}
        </Typography>
      </Box>
    </Box>
  </Box>
)}

        </Box>
      </Box>

      {/* About Section */}
      <Box sx={{ 
        mb: 6,
        p: 4,
        backgroundColor: 'background.paper',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: '700', 
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <Box sx={{
            width: '6px',
            height: '24px',
            backgroundColor: 'primary.main',
            borderRadius: '3px'
          }} />
          About This Course
        </Typography>
        <Typography variant="body1" sx={{ 
          mb: 4, 
          lineHeight: 1.8,
          fontSize: '1.05rem',
          color: 'text.secondary'
        }}>
          {course.description}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 1.5 }}>
              <Box component="span" sx={{ color: 'primary.main', mr: 1 }}>✓</Box>
              Practical Skills
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Hands-on projects and real-world applications to build job-ready skills.
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 1.5 }}>
              <Box component="span" sx={{ color: 'primary.main', mr: 1 }}>✓</Box>
              Certificate
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Earn a certificate upon completion to showcase your achievement.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Learning Outcomes */}
      {course.learningOutcomes?.length > 0 && (
        <Box sx={{ 
          mb: 6,
          p: 4,
          backgroundColor: 'background.paper',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" sx={{ 
            fontWeight: '700', 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <Box sx={{
              width: '6px',
              height: '24px',
              backgroundColor: 'primary.main',
              borderRadius: '3px'
            }} />
            What You'll Learn
          </Typography>
          <Grid container spacing={3}>
            {course.learningOutcomes.map((outcome, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 2,
                  p: 2.5,
                  backgroundColor: index % 2 === 0 ? 'primary.50' : 'secondary.50',
                  borderRadius: '8px',
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)'
                  }
                }}>
                  <Box sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: '50%',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: '2px'
                  }}>
                    <FiCheckCircle size={16} />
                  </Box>
                  <Typography variant="body1" sx={{ 
                    lineHeight: 1.6,
                    fontWeight: 500
                  }}>
                    {outcome}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Course Content Preview */}
      <Box sx={{ 
        mb: 4,
        p: 4,
        backgroundColor: 'background.paper',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: '700', 
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <Box sx={{
            width: '6px',
            height: '24px',
            backgroundColor: 'primary.main',
            borderRadius: '3px'
          }} />
          Course Content
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
              {course.modules?.length} Modules • {course.materialsCount || '20+'} Lessons
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              {course.totalDuration || '5h 30m'} Total Duration
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progress || 0} 
            sx={{ 
              height: '8px',
              borderRadius: '4px',
              mb: 3,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: '4px'
              }
            }} 
          />
        </Box>

        {course.modules?.slice(0, 3).map((module, index) => (
          <Accordion 
            key={index} 
            expanded={expandedModule === index}
            onChange={() => handleModuleExpand(index)}
            sx={{ 
              mb: 2,
              borderRadius: '8px !important',
              overflow: 'hidden',
              boxShadow: 'none',
              border: '1px solid',
              borderColor: 'divider',
              '&:before': {
                display: 'none'
              },
              '&.Mui-expanded': {
                borderColor: 'primary.main'
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<FiChevronDown />}
              sx={{
                backgroundColor: expandedModule === index ? 'primary.50' : 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover'
                },
                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                  transform: 'rotate(180deg)',
                  color: 'primary.main'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'primary.100',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700'
                }}>
                  {index + 1}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: '600', textAlign: 'left' }}>
                    {module.title}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    display: 'block',
                    mt: 0.5
                  }}>
                    {module.materials?.length} lessons • {module.duration || '30 min'}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <List disablePadding>
                {module.materials?.map((material, matIndex) => (
                  <ListItem 
                    key={matIndex} 
                    sx={{ 
                      py: 1.5,
                      px: 3,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 'none'
                      },
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: material.type === 'link' ? 'primary.100' : 'secondary.100', 
                        color: material.type === 'link' ? 'primary.main' : 'secondary.main',
                        width: 36,
                        height: 36
                      }}>
                        {material.type === 'link' ? (
                          <FiPlay size={18} />
                        ) : (
                          <FiFileText size={18} />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {material.type === 'link' ? material.title || "Video Lesson" : material.fileName}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {material.type === 'file' ? (
                            <>
                              <Box component="span" sx={{ 
                                fontSize: '0.7rem',
                                backgroundColor: 'grey.100',
                                px: 1,
                                py: 0.25,
                                borderRadius: '4px'
                              }}>
                                {material.fileType.toUpperCase()}
                              </Box>
                              <Box component="span">
                                {formatFileSize(material.fileSize)}
                              </Box>
                            </>
                          ) : (
                            <>
                              <FiClock size={14} />
                              <Box component="span">
                                5 min
                              </Box>
                            </>
                          )}
                        </Box>
                      }
                      sx={{ mr: 2 }}
                    />
                    <Tooltip title={material.type === 'link' ? "Watch video" : "View resource"}>
                      <IconButton
                        size="small"
                        onClick={() => window.open(material.url, '_blank')}
                        sx={{
                          borderRadius: '6px',
                          backgroundColor: 'primary.50',
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.100'
                          }
                        }}
                      >
                        {material.type === 'link' ? <FiPlay size={16} /> : <FiEye size={16} />}
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
        
        <Button 
          variant="outlined"
          fullWidth
          endIcon={<FiArrowRight />}
          sx={{
            textTransform: 'none',
            fontWeight: '600',
            mt: 3,
            py: 1.5,
            borderRadius: '8px',
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px',
              backgroundColor: 'primary.50'
            }
          }}
          onClick={() => setActiveTab('content')}
        >
          View Full Curriculum
        </Button>
      </Box>
    </Grid>
    
    {/* Sidebar */}
    <Grid item xs={12} md={4}>
      {/* Enroll Card */}
      <Card sx={{ 
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        mb: 4,
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
        }
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: '700' }}>
              Start Learning
            </Typography>
            <Chip 
              label={course.isPremium ? "Premium" : "Free"} 
              color={course.isPremium ? "secondary" : "success"}
              size="small"
              sx={{ fontWeight: '700' }}
            />
          </Box>
          
          {course.isPremium ? (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: '800' }}>
                  ${course.price}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  One-time payment • Lifetime access
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: '700',
                  py: 1.5,
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                Enroll Now
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: '600',
                  py: 1.5,
                  borderWidth: '2px',
                  '&:hover': {
                    borderWidth: '2px'
                  }
                }}
              >
                Add to Wishlist
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '700',
                py: 1.5,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              Enroll for Free
            </Button>
          )}
          
          <Box sx={{ 
            mt: 3,
            pt: 2,
            borderTop: '1px dashed',
            borderColor: 'divider'
          }}>
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1
            }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Already enrolled?
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: '600' }}>
                {course.enrollmentCount || '1,245'} students
              </Typography>
            </Box>
            <Button
              variant="text"
              fullWidth
              size="small"
              sx={{
                textTransform: 'none',
                fontWeight: '600',
                color: 'primary.main'
              }}
            >
              Continue Learning
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Course Details */}
      <Card sx={{ 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        mb: 4,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: '700', 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <FiInfo size={20} />
            Course Details
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1.5
            }}>
              <Box sx={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'primary.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiBookmark size={18} color={theme.palette.primary.main} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  display: 'block'
                }}>
                  Department
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {course.department}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1.5
            }}>
              <Box sx={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'secondary.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiBarChart2 size={18} color={theme.palette.secondary.main} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  display: 'block'
                }}>
                  Level
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {course.level}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1.5
            }}>
              <Box sx={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'warning.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiClock size={18} color={theme.palette.warning.main} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  display: 'block'
                }}>
                  Duration
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {course.estimatedDuration}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1.5
            }}>
              <Box sx={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'error.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FiCalendar size={18} color={theme.palette.error.main} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary',
                  display: 'block'
                }}>
                  Deadline
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: '600' }}>
                  {course.completionDeadline || 'Flexible'}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              display: 'block',
              mb: 1
            }}>
              Visible To
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {course.visibleTo?.map((role, index) => (
                <Chip
                  key={index}
                  label={role}
                  size="small"
                  sx={{ 
                    backgroundColor: 'grey.100',
                    color: 'text.primary',
                    fontWeight: 500,
                    borderRadius: '6px'
                  }}
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Instructor Card */}
      <Card sx={{ 
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: '700', 
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <FiUser size={20} />
            Your Instructor
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 3,
            p: 2,
            backgroundColor: 'grey.50',
            borderRadius: '8px'
          }}>
            <Avatar 
              alt="Instructor" 
              src={course.instructor?.photoURL || "/static/images/avatar/1.jpg"} 
              sx={{ 
                width: 72, 
                height: 72,
                border: '3px solid',
                borderColor: 'primary.main'
              }}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: '700' }}>
                {course.instructor?.name || "Sarah Johnson"}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'text.secondary',
                mb: 1
              }}>
                {course.instructor?.title || "Senior Web Developer"}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Rating 
                  value={4.8} 
                  precision={0.1} 
                  readOnly 
                  size="small"
                />
                <Typography variant="caption" sx={{ fontWeight: '600' }}>
                  4.8 (1,245)
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ 
            mb: 3, 
            lineHeight: 1.7,
            color: 'text.secondary'
          }}>
            {course.instructor?.bio || "With over 10 years of experience in web development, Sarah has worked with companies like Google and Airbnb. She specializes in frontend technologies and loves teaching beginners."}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FiBookOpen size={16} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '600',
                py: 1,
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px'
                }
              }}
            >
              View Courses
            </Button>
            <Button
              variant="contained"
              fullWidth
              startIcon={<FiMessageSquare size={16} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '600',
                py: 1,
                boxShadow: 'none'
              }}
            >
              Contact
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
)}
          {activeTab === 'content' && (
            <Box>
              {course.modules?.map((module, index) => (
                <Accordion 
                  key={index} 
                  expanded={expandedModule === index}
                  onChange={() => handleModuleExpand(index)}
                  sx={{ 
                    mb: 2,
                    borderRadius: '8px !important',
                    overflow: 'hidden',
                    boxShadow: theme.shadows[1],
                    '&:before': {
                      display: 'none'
                    }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<FiChevronDown />}
                    sx={{
                      backgroundColor: expandedModule === index ? 'action.selected' : 'background.paper',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'primary.light', 
                        color: 'primary.dark',
                        width: 32,
                        height: 32,
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </Avatar>
                      <Typography sx={{ fontWeight: '600' }}>
                        {module.title}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List disablePadding>
                      {module.materials?.map((material, matIndex) => (
                        <ListItem 
                          key={matIndex} 
                          sx={{ 
                            py: 1.5,
                            px: 3,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {
                              borderBottom: 'none'
                            },
                            backgroundColor: currentModuleIndex === index && currentVideoIndex === matIndex ? 
                              'action.selected' : 'transparent'
                          }}
                          onClick={() => goToVideo(index, matIndex)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: 'primary.light', 
                              color: 'primary.dark',
                              width: 32,
                              height: 32
                            }}>
                              {material.type === 'link' ? (
                                <FiPlay size={16} />
                              ) : (
                                <FiFileText size={16} />
                              )}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                {material.title || `Video ${matIndex + 1}`}
                              </Typography>
                            }
                            secondary={
                              material.type === 'file' ? 
                              `${material.fileType} • ${formatFileSize(material.fileSize)}` : 
                              "Video • 5 min"
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {activeTab === 'resources' && (
            <Grid container spacing={2}>
              {course.modules?.flatMap(module => 
                module.materials?.filter(material => material.type === 'file').map((material, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '8px',
                      boxShadow: theme.shadows[1],
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)'
                      }
                    }}>
                      <CardContent sx={{ p: 0, flex: 1 }}>
                        <Box sx={{ 
                          height: 120,
                          backgroundColor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }}>
                          <Box sx={{ 
                            backgroundColor: 'primary.light',
                            color: 'primary.dark',
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FiFileText size={24} />
                          </Box>
                        </Box>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 1 }}>
                            {material.fileName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            {material.fileType} • {formatFileSize(material.fileSize)}
                          </Typography>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<FiDownload size={16} />}
                            onClick={() => window.open(material.url, '_blank')}
                            sx={{
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontWeight: '600',
                              boxShadow: 'none'
                            }}
                          >
                            Download
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          )}

{activeTab === 'qna' && (
  <Box>
    <Paper sx={{ 
      p: 2, 
      mb: 3, 
      borderRadius: '8px',
      boxShadow: theme.shadows[1]
    }}>
      <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
        Ask a question
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What would you like to know about this course?"
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSubmitQuestion}
          disabled={!question.trim() || !auth.currentUser}
          sx={{
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: '600',
            px: 3,
            boxShadow: 'none'
          }}
        >
          {auth.currentUser ? 'Post Question' : 'Sign in to Ask'}
        </Button>
      </Box>
    </Paper>

    {questions.length > 0 ? (
      <Box>
        <Typography variant="subtitle1" sx={{ 
          fontWeight: '600', 
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
        </Typography>
        <List disablePadding>
          {questions.map((q) => (
            <Paper 
              key={q.id} 
              sx={{ 
                mb: 2, 
                p: 2, 
                borderRadius: '8px',
                boxShadow: theme.shadows[1]
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Avatar 
                  alt={getUserDisplayName(q.userId)} 
                  src={getUserAvatar(q.userId)} 
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 0.5
                  }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: '600' }}>
                      {getUserDisplayName(q.userId)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {q.createdAt}
                      {q.createdAt !== q.lastUpdated && ` • Updated ${q.lastUpdated}`}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {q.question}
                  </Typography>
                </Box>
              </Box>
              
              {q.replies?.length > 0 && (
                <Box sx={{ 
                  backgroundColor: 'action.hover',
                  borderRadius: '6px',
                  p: 2,
                  mt: 2
                }}>
                  {q.replies.map((reply, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        mb: index < q.replies.length - 1 ? 2 : 0,
                        display: 'flex',
                        gap: 2
                      }}
                    >
                      <Avatar 
                        alt={getUserDisplayName(reply.userId)} 
                        src={getUserAvatar(reply.userId)} 
                        sx={{ width: 32, height: 32 }} 
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1,
                          mb: 0.5
                        }}>
                          <Typography variant="body2" sx={{ fontWeight: '600' }}>
                            {getUserDisplayName(reply.userId)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {reply.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {reply.content}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          ))}
        </List>
      </Box>
    ) : (
      <Box sx={{ 
        textAlign: 'center', 
        p: 4,
        backgroundColor: 'action.hover',
        borderRadius: '8px'
      }}>
        <FiMessageCircle size={32} color={theme.palette.text.secondary} style={{ marginBottom: 16 }} />
        <Typography variant="h6" sx={{ fontWeight: '600', mb: 1 }}>
          No questions yet
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
          Be the first to ask a question about this course.
        </Typography>
      </Box>
    )}
  </Box>
)}

{activeTab === 'reviews' && (
        <Box>
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: '8px',
            boxShadow: theme.shadows[1]
          }}>
            <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
              Write a Review
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                How would you rate this course?
              </Typography>
              <Rating
                value={review.rating}
                onChange={(e, newValue) => setReview(prev => ({ ...prev, rating: newValue }))}
                size="medium"
                emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                sx={{ color: theme.palette.warning.main }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={review.comment}
              onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with this course..."
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSubmitReview}
                disabled={!review.comment.trim() || !auth.currentUser}
                sx={{
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontWeight: '600',
                  px: 3,
                  boxShadow: 'none'
                }}
              >
                {auth.currentUser ? 'Submit Review' : 'Sign in to Review'}
              </Button>
            </Box>
          </Paper>

          {/* Reviews Analytics and Filters */}
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: '8px',
            boxShadow: theme.shadows[1]
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              alignItems: 'center',
              gap: 3,
              mb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {reviewStats.average}
                </Typography>
                <Box>
                  <Rating 
                    value={parseFloat(reviewStats.average)} 
                    precision={0.1} 
                    readOnly 
                    size="medium"
                    emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                    sx={{ color: theme.palette.warning.main }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {reviewStats.total} {reviewStats.total === 1 ? 'review' : 'reviews'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ width: 80 }}>
                      {star} star{star !== 1 ? 's' : ''}
                    </Typography>
                    <Box sx={{ flexGrow: 1, mx: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(reviewStats.distribution[star] / reviewStats.total) * 100 || 0}
                        sx={{ 
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: theme.palette.warning.main
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ width: 40, textAlign: 'right' }}>
                      {Math.round((reviewStats.distribution[star] / reviewStats.total) * 100 || 0)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              mb: 2
            }}>
              <TextField
                placeholder="Search reviews..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <FiSearch style={{ marginRight: 8, color: theme.palette.text.secondary }} />
                }}
                sx={{ 
                  minWidth: 200,
                  flexGrow: 1
                }}
              />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter by rating</InputLabel>
                <Select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  label="Filter by rating"
                >
                  <MenuItem value={0}>All ratings</MenuItem>
                  <MenuItem value={5}>5 stars</MenuItem>
                  <MenuItem value={4}>4 stars</MenuItem>
                  <MenuItem value={3}>3 stars</MenuItem>
                  <MenuItem value={2}>2 stars</MenuItem>
                  <MenuItem value={1}>1 star</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  label="Sort by"
                >
                  <MenuItem value="newest">Newest first</MenuItem>
                  <MenuItem value="oldest">Oldest first</MenuItem>
                  <MenuItem value="highest">Highest rated</MenuItem>
                  <MenuItem value="lowest">Lowest rated</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {filteredReviews.length > 0 ? (
            <Box>
              <Typography variant="subtitle1" sx={{ 
                fontWeight: '600', 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {filteredReviews.length} {filteredReviews.length === 1 ? 'Review' : 'Reviews'}
              </Typography>
              <List disablePadding>
                {filteredReviews.map((r) => (
                  <Paper 
                    key={r.id} 
                    sx={{ 
                      mb: 2, 
                      p: 2, 
                      borderRadius: '8px',
                      boxShadow: theme.shadows[1]
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Avatar 
                        alt={getUserDisplayName(r.userId)} 
                        src={getUserAvatar(r.userId)}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1,
                          mb: 0.5
                        }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: '600' }}>
                            {getUserDisplayName(r.userId)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {r.createdAt}
                            {r.createdAt !== r.lastUpdated && ` • Updated ${r.lastUpdated}`}
                          </Typography>
                        </Box>
                        <Rating 
                          value={r.rating} 
                          readOnly 
                          size="small"
                          emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                          sx={{ color: theme.palette.warning.main, mb: 1 }}
                        />
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {r.comment}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
            </Box>
          ) : (
            <Box sx={{ 
              textAlign: 'center', 
              p: 4,
              backgroundColor: 'action.hover',
              borderRadius: '8px'
            }}>
              <FiStar size={32} color={theme.palette.text.secondary} style={{ marginBottom: 16 }} />
              <Typography variant="h6" sx={{ fontWeight: '600', mb: 1 }}>
                No reviews found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                {ratingFilter > 0 ? 
                  `No reviews match your ${ratingFilter}-star filter. Try changing filters.` : 
                  'Be the first to review this course.'}
              </Typography>
            </Box>
          )}
        </Box>
      )}

        </Box>
      </Box>
      
      {/* Sidebar with Course Content */}
      {showSidebar && (
        <Paper sx={{
          position: 'fixed',
          top: '60px',
          right: 0,
          bottom: 0,
          width: { xs: '100%', sm: '400px' },
          zIndex: 1200,
          overflowY: 'auto',
          boxShadow: theme.shadows[10]
        }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Course Content
              </Typography>
              <IconButton onClick={() => setShowSidebar(false)}>
                <FiX />
              </IconButton>
            </Box>
            
            {course.modules?.map((module, moduleIdx) => (
              <Box key={moduleIdx} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ 
                  fontWeight: '600',
                  mb: 1,
                  color: moduleIdx === currentModuleIndex ? 
                    theme.palette.primary.main : 'text.primary'
                }}>
                  Module {moduleIdx + 1}: {module.title}
                </Typography>
                
                <Box sx={{ 
                  borderLeft: '2px solid',
                  borderColor: 'divider',
                  pl: 2,
                  ml: 1
                }}>
                  {module.materials?.map((material, videoIdx) => (
                    <Box 
                      key={videoIdx}
                      onClick={() => goToVideo(moduleIdx, videoIdx)}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: 
                          moduleIdx === currentModuleIndex && videoIdx === currentVideoIndex ?
                          theme.palette.action.selected : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 
                            moduleIdx === currentModuleIndex && videoIdx === currentVideoIndex ?
                            theme.palette.primary.main : theme.palette.grey[400],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FiPlay size={12} color="#fff" />
                        </Box>
                        <Typography variant="body2" sx={{
                          fontWeight: moduleIdx === currentModuleIndex && videoIdx === currentVideoIndex ?
                            '600' : 'normal'
                        }}>
                          {material.title || `Video ${videoIdx + 1}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default CourseDetail;