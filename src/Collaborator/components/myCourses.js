import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Card, CardContent, Grid, 
  LinearProgress, Avatar, Chip, Button, Badge,
  Tabs, Tab, Divider, IconButton, Tooltip, TextField, 
} from "@mui/material";
import { 
  FiBook, FiClock, FiUsers, FiAward, FiSearch,
  FiChevronRight, FiPlay, FiFileText, FiLink,
  FiBarChart2, FiMessageSquare, FiStar
} from "react-icons/fi";
import { styled } from "@mui/material/styles";
import { auth, db } from "../../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const StyledCourseCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
    '& .course-cta': {
      backgroundColor: theme.palette.primary.main,
      color: 'white'
    }
  }
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 3,
    backgroundColor: theme.palette.success.main
  }
}));

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('in-progress');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // First get user's department
        const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
        const userSnapshot = await getDocs(userQuery);
        const userData = userSnapshot.docs[0]?.data();
        const userDepartment = userData?.department;
        const userRole = userData?.role;

        if (!userDepartment) return;

        // Fetch courses that match user's department or are visible to their role
        const coursesQuery = query(
          collection(db, "courses"),
          where("department", "==", userDepartment)
        );
        
        const allCoursesSnapshot = await getDocs(collection(db, "courses"));
        const coursesData = allCoursesSnapshot.docs
          .filter(doc => {
            const course = doc.data();
            return (
              course.department === userDepartment || 
              (course.visibleTo && course.visibleTo.includes(userRole))
            );
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            progress: Math.floor(Math.random() * 100) // Mock progress for now
          }));

        setCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <FiBook size={26} /> My Courses
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {courses.length > 0 
            ? `You have ${courses.length} courses assigned to you` 
            : 'No courses assigned yet'}
        </Typography>
      </Box>

      {/* Tabs and Search */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
              height: 3
            }
          }}
        >
          <Tab 
            value="all" 
            label="All Courses"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="in-progress" 
            label="In Progress"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            value="completed" 
            label="Completed"
            iconPosition="start"
            sx={{ minHeight: 48 }}
          />
        </Tabs>

        <TextField
          size="small"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <FiSearch style={{ marginRight: 8, color: 'text.secondary' }} />
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {/* Courses Grid */}
      {loading ? (
        <LinearProgress sx={{ my: 3 }} />
      ) : filteredCourses.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          p: 6,
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px'
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiBook size={36} color="text.secondary" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: '600', mb: 1 }}>
            No courses found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {searchTerm 
              ? 'No courses match your search criteria' 
              : 'You have no courses assigned to you yet'}
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <StyledCourseCard>
                <CardContent sx={{ p: 0 }}>
                  {/* Course Thumbnail */}
                  <Box sx={{
                    height: 160,
                    backgroundColor: 'grey.100',
                    backgroundImage: `url(https://source.unsplash.com/random/400x300/?${course.title.split(' ')[0]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    borderRadius: '12px 12px 0 0'
                  }}>
                    <Badge
                      badgeContent={course.status === 'Published' ? 'Active' : 'Draft'}
                      color={course.status === 'Published' ? 'success' : 'warning'}
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        '& .MuiBadge-badge': {
                          fontWeight: 600,
                          fontSize: '0.65rem'
                        }
                      }}
                    />
                  </Box>

                  {/* Course Content */}
                  <Box sx={{ p: 2.5 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                        {course.title}
                      </Typography>
                      <Chip 
                        label={course.level} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {course.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      {course.tags?.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{ 
                            mr: 0.5, 
                            mb: 0.5,
                            backgroundColor: 'primary.light',
                            color: 'primary.dark'
                          }}
                        />
                      ))}
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FiClock size={14} color="text.secondary" />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {course.estimatedDuration || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FiUsers size={14} color="text.secondary" />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {course.visibleTo?.join(', ') || 'All'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: '500' }}>
                          Progress
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {course.progress}%
                        </Typography>
                      </Box>
                      <ProgressBar variant="determinate" value={course.progress} />
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      endIcon={<FiChevronRight />}
                      onClick={() => handleViewCourse(course.id)}
                      className="course-cta"
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {course.progress === 0 ? 'Start Course' : 'Continue'}
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