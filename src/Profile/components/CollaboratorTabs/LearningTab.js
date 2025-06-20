import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, 
  LinearProgress, Chip, Button, Avatar,
  Tabs, Tab, Paper, Stack, Tooltip, Skeleton,
  Badge, Divider, IconButton
} from '@mui/material';
import { 
  FiBook, FiClock, FiUsers, FiCheckCircle, 
  FiAward, FiChevronRight, FiBarChart2, 
  FiBookmark, FiCalendar, FiFlag, FiStar,
  FiPlay, FiLock, FiExternalLink, FiBookOpen
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { 
  collection, getDocs, query, where, 
  doc, getDoc, orderBy, onSnapshot
} from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { db, auth } from '../../../services/firebase';

const LearningTab = ({ formatDate }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!userData) return;

    let unsubscribeCourses = () => {};
    let unsubscribeProgress = () => {};

    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // Real-time listener for courses
        const coursesQuery = query(
          collection(db, "courses"),
          where("department", "==", userData.department),
          where("visibleTo", "array-contains", userData.role),
        );

        unsubscribeCourses = onSnapshot(coursesQuery, async (coursesSnapshot) => {
          const coursesData = [];
          
          for (const courseDoc of coursesSnapshot.docs) {
            const course = courseDoc.data();
            
            // Real-time listener for progress
            const progressQuery = query(
              collection(db, "course-progress"),
              where("courseId", "==", courseDoc.id),
              where("userId", "==", auth.currentUser.uid)
            );

            unsubscribeProgress = onSnapshot(progressQuery, (progressSnapshot) => {
              let progress = 0;
              let completed = false;
              let lastAccessed = null;
              
              if (!progressSnapshot.empty) {
                const progressData = progressSnapshot.docs[0].data();
                progress = progressData.progress || 0;
                completed = progressData.completed || false;
                lastAccessed = progressData.lastAccessed?.toDate();
              }

              // Update the specific course's progress
              setCourses(prev => {
                const existingCourseIndex = prev.findIndex(c => c.id === courseDoc.id);
                if (existingCourseIndex >= 0) {
                  const updatedCourses = [...prev];
                  updatedCourses[existingCourseIndex] = {
                    ...updatedCourses[existingCourseIndex],
                    progress,
                    completed,
                    lastAccessed
                  };
                  return updatedCourses;
                }
                return prev;
              });
            });

            coursesData.push({
              id: courseDoc.id,
              ...course,
              progress: 0,
              completed: false,
              lastAccessed: null
            });
          }

          setCourses(coursesData);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    };

    fetchCourses();

    return () => {
      unsubscribeCourses();
      unsubscribeProgress();
    };
  }, [userData]);

  const filteredCourses = courses.filter(course => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in-progress') return course.progress > 0 && course.progress < 100;
    if (activeTab === 'completed') return course.completed;
    if (activeTab === 'new') return course.progress === 0;
    return true;
  });

  const getCourseStatus = (progress, completed) => {
    if (completed) return { label: 'Completed', color: 'success', icon: <FiCheckCircle /> };
    if (progress > 0) return { label: 'In Progress', color: 'primary', icon: <FiBarChart2 /> };
    return { label: 'Not Started', color: 'default', icon: <FiBookOpen /> };
  };

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const getCourseBadge = (course) => {
    if (course.status === 'Featured') {
      return (
        <Chip 
          label="Featured" 
          size="small" 
          color="secondary"
          icon={<FiStar size={14} />}
          sx={{ 
            position: 'absolute',
            top: 12,
            right: 12,
            fontWeight: 600,
            backgroundColor: 'secondary.light',
            color: 'secondary.dark'
          }}
        />
      );
    }
    
    if (course.new) {
      return (
        <Chip 
          label="New" 
          size="small" 
          color="success"
          sx={{ 
            position: 'absolute',
            top: 12,
            right: 12,
            fontWeight: 600,
            backgroundColor: 'success.light',
            color: 'success.dark'
          }}
        />
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item}>
            <Card>
              <CardContent>
                <Skeleton variant="rectangular" width="100%" height={180} />
                <Box sx={{ pt: 2 }}>
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                  <Skeleton width="80%" />
                  <Skeleton width="100%" height={60} />
                  <Skeleton width="100%" height={8} />
                  <Skeleton width="100%" height={40} sx={{ mt: 2 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Learning Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available for {userData?.department}
        </Typography>
      </Box>

      {/* Tabs and Filters */}
      <Paper sx={{ mb: 4, p: 2, borderRadius: 3, boxShadow: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab 
            label="All Courses" 
            value="all" 
            icon={<FiBook size={18} />} 
            iconPosition="start"
            sx={{ minHeight: 48, minWidth: 'fit-content', px: 2 }}
          />
          <Tab 
            label="New" 
            value="new" 
            icon={<FiBookOpen size={18} />} 
            iconPosition="start"
            sx={{ minHeight: 48, minWidth: 'fit-content', px: 2 }}
          />
          <Tab 
            label="In Progress" 
            value="in-progress" 
            icon={<FiBarChart2 size={18} />} 
            iconPosition="start"
            sx={{ minHeight: 48, minWidth: 'fit-content', px: 2 }}
          />
          <Tab 
            label="Completed" 
            value="completed" 
            icon={<FiCheckCircle size={18} />} 
            iconPosition="start"
            sx={{ minHeight: 48, minWidth: 'fit-content', px: 2 }}
          />
        </Tabs>
      </Paper>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Paper sx={{ 
          textAlign: 'center', 
          p: 6,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          boxShadow: 2
        }}>
          <Box sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiBook size={48} color="text.secondary" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No courses found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {activeTab === 'in-progress' 
              ? "You don't have any courses in progress" 
              : activeTab === 'completed' 
                ? "You haven't completed any courses yet" 
                : activeTab === 'new'
                  ? "All available courses have been started"
                  : "No courses available for your department"}
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 3 }}
            onClick={() => setActiveTab('all')}
          >
            Browse All Courses
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => {
            const status = getCourseStatus(course.progress, course.completed);
            const isNew = course.progress === 0;
            const lastAccessedText = course.lastAccessed 
              ? `Last accessed ${formatDistanceToNow(course.lastAccessed, { addSuffix: true })}`
              : 'Not started yet';
            
            return (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    },
                    border: isNew ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(0, 0, 0, 0.12)',
                    position: 'relative'
                  }}
                >
                  {/* Course Badge */}
                  {getCourseBadge(course)}

                  {/* Course Thumbnail */}
                  <Box
                    sx={{
                      height: 160,
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${course.thumbnailUrl || `https://source.unsplash.com/random/600x400/?${course.title.split(' ')[0]}`})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                      borderRadius: '12px 12px 0 0'
                    }}
                  >
                    {/* Level Chip */}
                    <Chip 
                      label={course.level} 
                      size="small" 
                      color="primary"
                      sx={{ 
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        fontWeight: 600,
                        backgroundColor: 'background.paper',
                        color: 'primary.main'
                      }}
                    />

                    {/* Progress Overlay */}
                    {course.progress > 0 && (
                      <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        backgroundColor: 'rgba(0,0,0,0.1)'
                      }}>
                        <Box sx={{
                          width: `${course.progress}%`,
                          height: '100%',
                          backgroundColor: course.completed ? 'success.main' : 'primary.main'
                        }} />
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Course Title and Status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={600}
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: 44
                        }}
                      >
                        {course.title}
                      </Typography>
                      <Tooltip title={status.label}>
                        <Avatar sx={{ 
                          width: 28, 
                          height: 28, 
                          bgcolor: `${status.color}.light`,
                          color: `${status.color}.dark`
                        }}>
                          {status.icon}
                        </Avatar>
                      </Tooltip>
                    </Box>

                    {/* Course Description */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: 60
                      }}
                    >
                      {course.description}
                    </Typography>

                    {/* Tags */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {course.tags?.slice(0, 3).map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ 
                              mb: 1,
                              backgroundColor: 'action.selected',
                              color: 'text.primary',
                              fontSize: '0.65rem'
                            }}
                          />
                        ))}
                        {course.tags?.length > 3 && (
                          <Tooltip title={course.tags.slice(3).join(', ')}>
                            <Chip
                              label={`+${course.tags.length - 3}`}
                              size="small"
                              sx={{ 
                                mb: 1,
                                backgroundColor: 'action.selected',
                                color: 'text.primary',
                                fontSize: '0.65rem'
                              }}
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>

                    {/* Divider */}
                    <Divider sx={{ my: 2 }} />

                    {/* Course Metadata */}
                    <Box sx={{ mb: 2 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FiClock size={14} style={{ marginRight: 6 }} color="text.secondary" />
                            <Typography variant="caption" color="text.secondary">
                              {course.estimatedDuration}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FiUsers size={14} style={{ marginRight: 6 }} color="text.secondary" />
                            <Typography variant="caption" color="text.secondary">
                              {course.members?.length || 0} enrolled
                            </Typography>
                          </Box>
                        </Grid>
                        {course.completionDeadline && (
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <FiCalendar size={14} style={{ marginRight: 6 }} color="text.secondary" />
                              <Typography variant="caption" color="text.secondary">
                                Deadline: {format(new Date(course.completionDeadline), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>

                    {/* Last Accessed */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      {lastAccessedText}
                    </Typography>

                    {/* Progress Bar */}
                    {course.progress > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600}>
                            Progress
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {course.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={course.progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: course.completed ? 'success.main' : 'primary.main'
                            }
                          }}
                        />
                      </Box>
                    )}

                    {/* Action Button */}
                    <Button
                      fullWidth
                      variant={course.progress === 0 ? "contained" : "outlined"}
                      color={status.color}
                      endIcon={<FiChevronRight />}
                      onClick={() => handleCourseClick(course.id)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1,
                        mt: 1
                      }}
                      startIcon={course.progress === 0 ? <FiPlay /> : null}
                    >
                      {course.progress === 0 ? 'Start Now' : 
                       course.completed ? 'View Certificate' : 'Continue'}
                    </Button>

                    {/* Certificate Badge */}
                    {course.completed && course.allowCertificate && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mt: 2,
                        p: 1,
                        backgroundColor: 'success.light',
                        borderRadius: 2,
                        color: 'success.dark'
                      }}>
                        <FiAward size={16} style={{ marginRight: 8 }} />
                        <Typography variant="caption" fontWeight={600}>
                          Certificate Available
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default LearningTab;