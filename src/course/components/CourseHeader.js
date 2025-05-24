import React from 'react';
import { Box, Grid, Typography, Chip, Rating, Button, Card, CardContent } from '@mui/material';
import { FiUsers, FiClock, FiPlay, FiBookmark, FiShare2, FiStar } from 'react-icons/fi';
import ReactPlayer from 'react-player';

const CourseHeader = ({ course }) => {
  return (
    <Box sx={{ 
      backgroundColor: 'grey.100',
      p: 4,
      borderRadius: '12px',
      mb: 4,
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(https://source.unsplash.com/random/1200x400/?${course.title.split(' ')[0]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={course.level} 
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, mb: 1.5 }}
            />
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1.5 }}>
              {course.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {course.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Rating 
                value={4.5} 
                precision={0.5} 
                readOnly 
                emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
              />
              <Typography variant="body2">
                4.5 (124 reviews)
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FiUsers size={16} /> 245 students
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FiClock size={16} /> {course.estimatedDuration}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {course.tags?.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
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
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '12px', boxShadow: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                height: 200,
                backgroundColor: 'grey.200',
                position: 'relative',
                borderRadius: '12px 12px 0 0'
              }}>
                {course.modules?.[0]?.materials?.[0]?.url && (
                  <ReactPlayer
                    url={course.modules[0].materials[0].url}
                    width="100%"
                    height="100%"
                    controls
                    light={true}
                  />
                )}
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Free
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<FiPlay size={18} />}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: '600',
                    mb: 1.5
                  }}
                >
                  Start Learning
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FiBookmark size={16} />}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: '600'
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FiShare2 size={16} />}
                    sx={{
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: '600'
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
  );
};

export default CourseHeader;