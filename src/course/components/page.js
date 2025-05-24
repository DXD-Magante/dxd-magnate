import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Card, CardContent, Grid, 
  LinearProgress, Avatar, Chip, Button, Badge,
  Tabs, Tab, Divider, IconButton, Tooltip,
  Paper, List, ListItem, ListItemText, ListItemAvatar,
  Accordion, AccordionSummary, AccordionDetails,
  TextField, Rating, useTheme
} from "@mui/material";
import { 
  FiBook, FiClock, FiUsers, FiAward, FiSearch,
  FiChevronRight, FiPlay, FiFileText, FiLink,
  FiBarChart2, FiMessageSquare, FiStar, FiChevronDown,
  FiBookmark, FiShare2, FiHeart, FiMessageCircle,
  FiCheckCircle, FiX, FiSend, FiDownload, FiYoutube
} from "react-icons/fi";
import { styled } from "@mui/material/styles";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import YouTube from 'react-youtube';

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  minHeight: 48,
  fontSize: theme.typography.pxToRem(15),
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const CourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedModule, setExpandedModule] = useState(null);
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState({
    rating: 5,
    comment: ''
  });
  const navigate = useNavigate();
  const theme = useTheme();

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

    // Mock questions and reviews (replace with actual data fetching)
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
      },
      {
        id: 2,
        rating: 4,
        comment: "Excellent content, though some sections could use more advanced examples. Overall a great introduction to web development.",
        author: "Michael Johnson",
        avatar: "https://randomuser.me/api/portraits/men/3.jpg",
        date: "2 weeks ago"
      }
    ]);
  }, [courseId, navigate]);

  const handleModuleExpand = (moduleIndex) => {
    setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex);
  };

  const handleSubmitQuestion = () => {
    if (question.trim()) {
      setQuestions(prev => [
        ...prev,
        {
          id: prev.length + 1,
          question,
          author: "You",
          avatar: "https://randomuser.me/api/portraits/men/5.jpg",
          date: "Just now",
          replies: []
        }
      ]);
      setQuestion('');
    }
  };

  const handleSubmitReview = () => {
    if (review.comment.trim()) {
      setReviews(prev => [
        ...prev,
        {
          id: prev.length + 1,
          rating: review.rating,
          comment: review.comment,
          author: "You",
          avatar: "https://randomuser.me/api/portraits/men/5.jpg",
          date: "Just now"
        }
      ]);
      setReview({
        rating: 5,
        comment: ''
      });
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
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

  return (
    <Box sx={{ flexGrow: 1, pb: 6, marginTop:'60px' }}>
      {/* Course Header */}
      <Box sx={{ 
        backgroundColor: 'grey.100',
        p: { xs: 3, md: 6 },
        borderRadius: '16px',
        mb: 4,
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url(https://source.unsplash.com/random/1200x600/?${course.title.split(' ')[0]},coding)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: theme.shadows[2],

      }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={course.level} 
                color="primary"
                size="small"
                sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  px: 1,
                  py: 0.5,
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.dark
                }}
              />
              <Typography variant="h3" sx={{ 
                fontWeight: 'bold', 
                mb: 2,
                fontSize: { xs: '1.8rem', md: '2.4rem' },
                lineHeight: 1.2
              }}>
                {course.title}
              </Typography>
              <Typography variant="body1" sx={{ 
                mb: 3, 
                fontSize: '1.1rem',
                color: 'text.secondary',
                lineHeight: 1.6
              }}>
                {course.description}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap',
                gap: 1.5, 
                mb: 3 
              }}>
                <Rating 
                  value={4.5} 
                  precision={0.5} 
                  readOnly 
                  size="medium"
                  emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                  sx={{ color: theme.palette.warning.main }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  4.5 (124 reviews)
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  color: 'text.secondary'
                }}>
                  <FiUsers size={16} />
                  <Typography variant="body2">245 students</Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  color: 'text.secondary'
                }}>
                  <FiClock size={16} />
                  <Typography variant="body2">{course.estimatedDuration}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {course.tags?.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    sx={{ 
                      backgroundColor: 'primary.light',
                      color: 'primary.dark',
                      fontWeight: 500,
                      borderRadius: '4px'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: '16px', 
              boxShadow: theme.shadows[4],
              border: 'none',
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  height: 200,
                  backgroundColor: 'grey.900',
                  position: 'relative',
                  borderRadius: '16px 16px 0 0',
                  overflow: 'hidden'
                }}>
                  {course.modules?.[0]?.materials?.[1]?.url && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.1)'
                    }}>
                      <YouTube
                        videoId={extractYouTubeId(course.modules[0].materials[1].url)}
                        opts={{
                          height: '100%',
                          width: '100%',
                          playerVars: {
                            autoplay: 0,
                            modestbranding: 1,
                            rel: 0
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2 
                  }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      Free
                    </Typography>
                    {course.allowCertificate && (
                      <Chip 
                        label="Certificate" 
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<FiPlay size={18} />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: '600',
                      mb: 2,
                      py: 1.5,
                      fontSize: '1rem',
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: 'none',
                        backgroundColor: theme.palette.primary.dark
                      }
                    }}
                  >
                    Start Learning
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FiBookmark size={16} />}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: '600',
                        py: 1,
                        borderWidth: '2px',
                        '&:hover': {
                          borderWidth: '2px'
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FiShare2 size={16} />}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: '600',
                        py: 1,
                        borderWidth: '2px',
                        '&:hover': {
                          borderWidth: '2px'
                        }
                      }}
                    >
                      Share
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Course Tabs */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 4,
        position: 'sticky',
        top: 64,
        backgroundColor: 'background.paper',
        zIndex: 10,
        [theme.breakpoints.down('sm')]: {
          top: 56
        }
      }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3
            }
          }}
        >
          <StyledTab value="overview" label="Overview" />
          <StyledTab value="content" label="Course Content" />
          <StyledTab value="resources" label="Resources" />
          <StyledTab value="qna" label="Q&A" />
          <StyledTab value="reviews" label="Reviews" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 } }}>
        {activeTab === 'overview' && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                About This Course
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>
                {course.description}
              </Typography>

              {course.learningOutcomes?.length > 0 && (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                    What You'll Learn
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {course.learningOutcomes.map((outcome, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: 2,
                          p: 2,
                          backgroundColor: 'action.hover',
                          borderRadius: '8px',
                          height: '100%'
                        }}>
                          <Box sx={{
                            backgroundColor: 'primary.light',
                            color: 'primary.dark',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: '2px'
                          }}>
                            <FiCheckCircle size={16} />
                          </Box>
                          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                            {outcome}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}

              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Course Content
              </Typography>
              <Box sx={{ mb: 4 }}>
                {course.modules?.slice(0, 3).map((module, index) => (
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
                      <Typography sx={{ fontWeight: '600', flex: 1 }}>
                        Module {index + 1}: {module.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mr: 2 }}>
                        {module.materials?.length} items • 30 min
                      </Typography>
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
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: 'primary.light', 
                                color: 'primary.dark',
                                width: 36,
                                height: 36
                              }}>
                                {material.type === 'link' ? (
                                  <FiLink size={18} />
                                ) : (
                                  <FiFileText size={18} />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                  {material.type === 'link' ? material.title || "Video Lesson" : material.fileName}
                                </Typography>
                              }
                              secondary={
                                material.type === 'file' ? 
                                `${material.fileType} • ${formatFileSize(material.fileSize)}` : 
                                "Video • 5 min"
                              }
                              sx={{ mr: 2 }}
                            />
                            <Button 
                              size="small"
                              variant="outlined"
                              startIcon={<FiPlay size={14} />}
                              onClick={() => window.open(material.url, '_blank')}
                              sx={{
                                borderRadius: '6px',
                                textTransform: 'none',
                                fontWeight: '500',
                                borderWidth: '2px',
                                '&:hover': {
                                  borderWidth: '2px'
                                }
                              }}
                            >
                              View
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
                <Button 
                  variant="text"
                  endIcon={<FiChevronRight />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: '600',
                    mt: 2,
                    color: 'text.primary'
                  }}
                  onClick={() => setActiveTab('content')}
                >
                  View full curriculum
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: theme.shadows[1],
                mb: 3 
              }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Course Details
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                      Department:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {course.department}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                      Level:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {course.level}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                      Duration:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {course.estimatedDuration}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                      Completion Deadline:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {course.completionDeadline || 'No deadline'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: '500', mb: 1 }}>
                      Visible To:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {course.visibleTo?.map((role, index) => (
                        <Chip
                          key={index}
                          label={role}
                          size="small"
                          sx={{ 
                            backgroundColor: 'primary.light',
                            color: 'primary.dark',
                            fontWeight: 500
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: theme.shadows[1]
              }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Instructor
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar 
                      alt="Instructor" 
                      src="https://randomuser.me/api/portraits/women/1.jpg" 
                      sx={{ width: 56, height: 56 }}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                        Sarah Johnson
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Senior Web Developer
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                    With over 10 years of experience in web development, Sarah has worked with companies like Google and Airbnb. She specializes in frontend technologies and loves teaching beginners.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
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
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 'content' && (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
              Course Curriculum
            </Typography>
            {course.modules?.map((module, index) => (
              <Accordion 
                key={index} 
                expanded={expandedModule === index}
                onChange={() => handleModuleExpand(index)}
                sx={{ 
                  mb: 3,
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  boxShadow: theme.shadows[2],
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
                    },
                    py: 2,
                    px: 3
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                    <Avatar sx={{ 
                      bgcolor: 'primary.light', 
                      color: 'primary.dark',
                      width: 40,
                      height: 40,
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: '600', mb: 0.5 }}>
                        {module.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {module.materials?.length} items • 30 min
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      display: { xs: 'none', sm: 'block' }
                    }}>
                      {expandedModule === index ? 'Hide' : 'Show'} content
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List disablePadding>
                    {module.materials?.map((material, matIndex) => (
                      <ListItem 
                        key={matIndex}
                        sx={{
                          py: 2,
                          px: 3,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          },
                          '&:last-child': {
                            borderBottom: 'none'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: 'primary.light', 
                            color: 'primary.dark',
                            width: 40,
                            height: 40
                          }}>
                            {material.type === 'link' ? (
                              <FiLink size={18} />
                            ) : (
                              <FiFileText size={18} />
                            )}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {material.type === 'link' ? material.title || "Video Lesson" : material.fileName}
                            </Typography>
                          }
                          secondary={
                            material.type === 'file' ? 
                            `${material.fileType} • ${formatFileSize(material.fileSize)}` : 
                            "Video • 5 min"
                          }
                          sx={{ mr: 3 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            display: { xs: 'none', sm: 'block' }
                          }}>
                            5 min
                          </Typography>
                          <Button 
                            size="small"
                            variant="contained"
                            startIcon={<FiPlay size={14} />}
                            onClick={() => window.open(material.url, '_blank')}
                            sx={{
                              borderRadius: '6px',
                              textTransform: 'none',
                              fontWeight: '500',
                              minWidth: 100,
                              boxShadow: 'none'
                            }}
                          >
                            View
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {activeTab === 'resources' && (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4
            }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Course Resources
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {course.modules?.flatMap(m => m.materials?.filter(mat => mat.type === 'file')).length} resources available
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {course.modules?.flatMap(module => 
                module.materials?.filter(material => material.type === 'file').map((material, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      boxShadow: theme.shadows[1],
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4]
                      }
                    }}>
                      <CardContent sx={{ p: 0, flex: 1 }}>
                        <Box sx={{ 
                          height: 180,
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
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FiFileText size={32} />
                          </Box>
                        </Box>
                        <Box sx={{ p: 3 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 1 }}>
                            {material.fileName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            {material.fileType} • {formatFileSize(material.fileSize)}
                          </Typography>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<FiDownload size={16} />}
                            onClick={() => window.open(material.url, '_blank')}
                            sx={{
                              borderRadius: '8px',
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
          </Box>
        )}

        {activeTab === 'qna' && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
                Questions & Answers
              </Typography>
              
              <Paper sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: '12px',
                boxShadow: theme.shadows[1]
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 2 }}>
                  Ask a question
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to know about this course?"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmitQuestion}
                    disabled={!question.trim()}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: '600',
                      px: 4,
                      boxShadow: 'none'
                    }}
                  >
                    Post Question
                  </Button>
                </Box>
              </Paper>

              {questions.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: '600', 
                    mb: 3,
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
                          mb: 3, 
                          p: 3, 
                          borderRadius: '12px',
                          boxShadow: theme.shadows[1]
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Avatar alt={q.author} src={q.avatar} />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 1,
                              mb: 0.5
                            }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                                {q.author}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {q.date}
                              </Typography>
                            </Box>
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {q.question}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {q.replies.length > 0 && (
                          <Box sx={{ 
                            backgroundColor: 'action.hover',
                            borderRadius: '8px',
                            p: 2.5,
                            mt: 2
                          }}>
                            <Typography variant="subtitle2" sx={{ 
                              fontWeight: '600', 
                              mb: 2,
                              color: 'text.secondary'
                            }}>
                              {q.replies.length} {q.replies.length === 1 ? 'Reply' : 'Replies'}
                            </Typography>
                            {q.replies.map((reply, index) => (
                              <Box 
                                key={index} 
                                sx={{ 
                                  mb: index < q.replies.length - 1 ? 3 : 0,
                                  display: 'flex',
                                  gap: 2
                                }}
                              >
                                <Avatar alt={reply.author} src={reply.avatar} />
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    mb: 0.5
                                  }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: '600' }}>
                                      {reply.author}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {reply.date}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                    {reply.reply}
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
                  p: 6,
                  backgroundColor: 'action.hover',
                  borderRadius: '12px'
                }}>
                  <FiMessageCircle size={48} color={theme.palette.text.secondary} style={{ marginBottom: 16 }} />
                  <Typography variant="h6" sx={{ fontWeight: '600', mb: 1 }}>
                    No questions yet
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                    Be the first to ask a question about this course. Your question might help other learners too!
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: theme.shadows[1],
                mb: 3 
              }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Tips for Asking Questions
                  </Typography>
                  <List disablePadding>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                          1
                        </Typography>
                      </Box>
                      <ListItemText primary="Be specific and clear in your question" />
                    </ListItem>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                          2
                        </Typography>
                      </Box>
                      <ListItemText primary="Check if your question has already been answered" />
                    </ListItem>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                          3
                        </Typography>
                      </Box>
                      <ListItemText primary="Be respectful to other learners" />
                    </ListItem>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                          4
                        </Typography>
                      </Box>
                      <ListItemText primary="Include relevant details about your issue" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: theme.shadows[1]
              }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Popular Questions
                  </Typography>
                  <List disablePadding>
                    <ListItem button sx={{ py: 1.5, px: 0 }}>
                      <ListItemText 
                        primary="How do I access the course materials?" 
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem button sx={{ py: 1.5, px: 0 }}>
                      <ListItemText 
                        primary="Is there a certificate upon completion?" 
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem button sx={{ py: 1.5, px: 0 }}>
                      <ListItemText 
                        primary="Can I download the videos for offline viewing?" 
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                    <Divider component="li" />
                    <ListItem button sx={{ py: 1.5, px: 0 }}>
                      <ListItemText 
                        primary="How long do I have access to the course?" 
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 'reviews' && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
                Course Reviews
              </Typography>
              
              <Paper sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: '12px',
                boxShadow: theme.shadows[1]
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: '600', mb: 3 }}>
                  Write a Review
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    How would you rate this course?
                  </Typography>
                  <Rating
                    value={review.rating}
                    onChange={(e, newValue) => setReview(prev => ({ ...prev, rating: newValue }))}
                    size="large"
                    emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                    sx={{ color: theme.palette.warning.main }}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  value={review.comment}
                  onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience with this course. What did you like? What could be improved?"
                  sx={{ mb: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmitReview}
                    disabled={!review.comment.trim()}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: '600',
                      px: 4,
                      boxShadow: 'none'
                    }}
                  >
                    Submit Review
                  </Button>
                </Box>
              </Paper>

              {reviews.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    fontWeight: '600', 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                  </Typography>
                  <List disablePadding>
                    {reviews.map((r) => (
                      <Paper 
                        key={r.id} 
                        sx={{ 
                          mb: 3, 
                          p: 4, 
                          borderRadius: '12px',
                          boxShadow: theme.shadows[1]
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                          <Avatar alt={r.author} src={r.avatar} />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 1,
                              mb: 0.5
                            }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                                {r.author}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {r.date}
                              </Typography>
                            </Box>
                            <Rating 
                              value={r.rating} 
                              readOnly 
                              size="small"
                              emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                              sx={{ color: theme.palette.warning.main, mb: 1 }}
                            />
                            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
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
                  p: 6,
                  backgroundColor: 'action.hover',
                  borderRadius: '12px'
                }}>
                  <FiStar size={48} color={theme.palette.text.secondary} style={{ marginBottom: 16 }} />
                  <Typography variant="h6" sx={{ fontWeight: '600', mb: 1 }}>
                    No reviews yet
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
                    Be the first to review this course. Your feedback helps others make informed decisions!
                  </Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: theme.shadows[1],
                mb: 3 
              }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Rating Summary
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 'bold', 
                      mr: 2,
                      color: theme.palette.text.primary
                    }}>
                      4.5
                    </Typography>
                    <Box>
                      <Rating 
                        value={4.5} 
                        precision={0.5} 
                        readOnly 
                        size="medium"
                        emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                        sx={{ color: theme.palette.warning.main }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        124 reviews
                      </Typography>
                    </Box>
                  </Box>
                  <List disablePadding>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <ListItem key={star} sx={{ py: 1, px: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography variant="body2" sx={{ 
                            width: 80,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            {star} <FiStar size={14} />
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 7 : star === 2 ? 2 : 1}
                            sx={{ 
                              flexGrow: 1, 
                              height: 8, 
                              borderRadius: 4,
                              mx: 2,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: star >= 4 ? '#4CAF50' : star >= 3 ? '#FFC107' : '#F44336',
                                borderRadius: 4
                              }
                            }} 
                          />
                          <Typography variant="body2" sx={{ 
                            width: 40, 
                            textAlign: 'right',
                            color: 'text.secondary'
                          }}>
                            {star === 5 ? '70%' : star === 4 ? '20%' : star === 3 ? '7%' : star === 2 ? '2%' : '1%'}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              <Card sx={{ 
                borderRadius: '12px',
                boxShadow: theme.shadows[1]
              }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Review Guidelines
                  </Typography>
                  <List disablePadding>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <FiCheckCircle size={14} />
                      </Box>
                      <ListItemText primary="Share your honest opinion about the course" />
                    </ListItem>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <FiCheckCircle size={14} />
                      </Box>
                      <ListItemText primary="Mention what you liked and what could be improved" />
                    </ListItem>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <FiCheckCircle size={14} />
                      </Box>
                      <ListItemText primary="Keep it respectful and constructive" />
                    </ListItem>
                    <ListItem sx={{ alignItems: 'flex-start', py: 1.5, px: 0 }}>
                      <Box sx={{
                        backgroundColor: 'primary.light',
                        color: 'primary.dark',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mr: 2,
                        mt: '2px'
                      }}>
                        <FiCheckCircle size={14} />
                      </Box>
                      <ListItemText primary="Avoid personal attacks or offensive language" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
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