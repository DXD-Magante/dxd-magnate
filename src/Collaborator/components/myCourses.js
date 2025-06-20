import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Card, CardContent, Grid, 
  LinearProgress, Chip, Button, Badge,
  Tabs, Tab, TextField, FormControl, 
  InputLabel, Select, MenuItem, Paper, Stack, Tooltip
} from "@mui/material";
import { 
  FiBook, FiClock, FiUsers, FiSearch,
  FiChevronRight, FiCheckCircle, FiFilter,
  FiAward
} from "react-icons/fi";
import { styled } from "@mui/material/styles";
import { auth, db } from "../../services/firebase";
import { 
  collection, getDocs, query, where, 
  doc, updateDoc, arrayUnion, addDoc 
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const StyledCourseCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.05)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
    '& .course-cta': {
      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
      color: 'white',
      boxShadow: '0 4px 15px rgba(63, 81, 181, 0.3)'
    }
  }
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[100],
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
  }
}));

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('in-progress');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('recent');
  const [userDepartment, setUserDepartment] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndCourses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Get current user's data
        const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          setLoading(false);
          return;
        }

        const userData = userSnapshot.docs[0].data();
        setUserDepartment(userData.department || '');
        setUserRole(userData.role || '');

        // Fetch courses that match user's department or are visible to their role
        const coursesQuery = query(
          collection(db, "courses"),
          where("department", "==", userData.department)
        );
        
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesData = [];

        // Fetch progress for each course
        for (const doc of coursesSnapshot.docs) {
          const course = doc.data();
          const progressQuery = query(
            collection(db, "course-progress"),
            where("courseId", "==", doc.id),
            where("userId", "==", user.uid)
          );
          const progressSnapshot = await getDocs(progressQuery);
          
          let progress = 0;
          if (!progressSnapshot.empty) {
            progress = progressSnapshot.docs[0].data().progress || 0;
          }

          coursesData.push({
            id: doc.id,
            ...course,
            progress,
            isMember: course.members?.includes(user.uid) || false
          });
        }

        setCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchUserAndCourses();
  }, []);

  const handleStartLearning = async (courseId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Update the course members array
      const courseRef = doc(db, "courses", courseId);
      await updateDoc(courseRef, {
        members: arrayUnion(user.uid),
        lastAccessed: new Date()
      });

      // Create initial progress record if it doesn't exist
      const progressQuery = query(
        collection(db, "course-progress"),
        where("courseId", "==", courseId),
        where("userId", "==", user.uid)
      );
      const progressSnapshot = await getDocs(progressQuery);

      if (progressSnapshot.empty) {
        await addDoc(collection(db, "course-progress"), {
          courseId,
          userId: user.uid,
          progress: 0,
          lastUpdated: new Date(),
          completed: false
        });
      }

      navigate(`/courses/${courseId}`);
    } catch (error) {
      console.error("Error starting course:", error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'in-progress' && course.progress < 100) ||
      (activeTab === 'completed' && course.progress === 100);
    
    return matchesSearch && matchesTab;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortOption) {
      case 'recent':
        return new Date(b.updatedAt?.toDate() || 0) - new Date(a.updatedAt?.toDate() || 0);
      case 'progress-asc':
        return a.progress - b.progress;
      case 'progress-desc':
        return b.progress - a.progress;
      case 'duration-asc':
        return parseInt(a.estimatedDuration) - parseInt(b.estimatedDuration);
      case 'duration-desc':
        return parseInt(b.estimatedDuration) - parseInt(a.estimatedDuration);
      default:
        return 0;
    }
  });

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: '700', 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: 'text.primary'
        }}>
          <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3f51b5, #2196f3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <FiBook size={24} />
          </Box>
          My Courses
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '600px' }}>
          {courses.length > 0 
            ? `You have ${courses.length} courses in your ${userDepartment} learning path.` 
            : 'No courses available for your department yet.'}
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: '16px',
        background: 'rgba(245, 245, 245, 0.5)',
        backdropFilter: 'blur(8px)'
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="medium"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <FiSearch style={{ marginRight: 12, color: 'text.secondary' }} />
                ),
                sx: { borderRadius: '12px', background: 'white' }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  label="Sort by"
                  sx={{ borderRadius: '12px', background: 'white' }}
                >
                  <MenuItem value="recent">Recently Updated</MenuItem>
                  <MenuItem value="progress-asc">Progress (Low to High)</MenuItem>
                  <MenuItem value="progress-desc">Progress (High to Low)</MenuItem>
                  <MenuItem value="duration-asc">Duration (Short to Long)</MenuItem>
                  <MenuItem value="duration-desc">Duration (Long to Short)</MenuItem>
                </Select>
              </FormControl>
              
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'primary.main',
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                <Tab 
                  value="all" 
                  label="All Courses"
                  sx={{ minHeight: 48, fontSize: '0.875rem', fontWeight: 600 }}
                />
                <Tab 
                  value="in-progress" 
                  label="In Progress"
                  sx={{ minHeight: 48, fontSize: '0.875rem', fontWeight: 600 }}
                />
                <Tab 
                  value="completed" 
                  label="Completed"
                  sx={{ minHeight: 48, fontSize: '0.875rem', fontWeight: 600 }}
                />
              </Tabs>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Courses Grid */}
      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : sortedCourses.length === 0 ? (
        <Paper sx={{ 
          textAlign: 'center', 
          p: 6,
          borderRadius: '16px',
          boxShadow: 'none',
          background: 'rgba(245, 245, 245, 0.5)'
        }}>
          <Box sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(63, 81, 181, 0.1), rgba(33, 150, 243, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiBook size={48} color="#3f51b5" />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: '600', mb: 1 }}>
            No courses found
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
            {searchTerm 
              ? 'No courses match your search criteria' 
              : `No courses available for ${userDepartment} department yet`}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {sortedCourses.map((course) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
              <StyledCourseCard>
                <CardContent sx={{ p: 0 }}>
                  {/* Course Thumbnail */}
                  <Box sx={{
                    height: 180,
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(https://source.unsplash.com/random/600x400/?${course.title.split(' ')[0]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    borderRadius: '16px 16px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    p: 2
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <Chip 
                        label={course.level} 
                        size="small" 
                        color="primary"
                        variant="filled"
                        sx={{ 
                          fontWeight: 600,
                          background: 'rgba(255,255,255,0.9)',
                          color: 'primary.dark'
                        }}
                      />
                      {course.allowCertificate && (
                        <Tooltip title="Certificate available">
                          <Box sx={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FiAward size={16} color="#3f51b5" />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: '700', 
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        {course.title}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Course Content */}
                  <Box sx={{ p: 3 }}>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: 60
                    }}>
                      {course.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      {course.tags?.slice(0, 4).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{ 
                            mr: 1, 
                            mb: 1,
                            backgroundColor: 'primary.light',
                            color: 'primary.dark',
                            fontWeight: 500,
                            fontSize: '0.7rem'
                          }}
                        />
                      ))}
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: '600' }}>
                          Your Progress
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {course.progress}%
                        </Typography>
                      </Box>
                      <ProgressBar variant="determinate" value={course.progress} />
                    </Box>

                    <Button
                      fullWidth
                      variant={course.progress === 0 ? "contained" : "outlined"}
                      endIcon={course.progress === 100 ? <FiCheckCircle /> : <FiChevronRight />}
                      onClick={() => course.isMember 
                        ? navigate(`/courses/${course.id}`) 
                        : handleStartLearning(course.id)}
                      className="course-cta"
                      sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: '600',
                        py: 1.5,
                        ...(course.progress === 100 && {
                          backgroundColor: 'success.light',
                          color: 'success.dark',
                          '&:hover': {
                            backgroundColor: 'success.main',
                            color: 'white'
                          }
                        })
                      }}
                    >
                      {!course.isMember ? 'Start Learning' :
                       course.progress === 0 ? 'Start Learning' : 
                       course.progress === 100 ? 'Completed' : 'Continue'}
                    </Button>
                  </Box>
                </CardContent>
              </StyledCourseCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyCourses;