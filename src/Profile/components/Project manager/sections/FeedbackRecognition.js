import React from 'react';
import { 
  Card, CardContent, Typography, Box, Divider, 
  Chip, Avatar, Skeleton, Select, MenuItem, 
  InputLabel, FormControl, Grid, Tooltip, Rating
} from '@mui/material';
import { 
  FiStar, FiAward, FiFilter, FiClock, 
  FiTrendingUp, FiTrendingDown, FiCalendar 
} from 'react-icons/fi';
import { format } from 'date-fns';

const FeedbackRecognition = ({ 
  ratings, 
  ratingsLoading, 
  averageRating,
  projects,
  sortOption,
  setSortOption,
  projectFilter,
  setProjectFilter
}) => {
  // Format date function
  const formatDate = (date) => {
    return format(date, "dd MMM yyyy 'at' hh:mm a");
  };

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : 'Unknown Project';
  };

  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardContent className="p-6">
        <Box className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <Typography variant="h6" className="font-bold text-gray-800">
            Client Feedback & Ratings
          </Typography>
          
          <Box className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="project-filter-label">
                <Box className="flex items-center gap-1">
                  <FiFilter size={14} /> Project
                </Box>
              </InputLabel>
              <Select
                labelId="project-filter-label"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                label={
                  <Box className="flex items-center gap-1">
                    <FiFilter size={14} /> Project
                  </Box>
                }
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-label">
                <Box className="flex items-center gap-1">
                  <FiClock size={14} /> Sort By
                </Box>
              </InputLabel>
              <Select
                labelId="sort-label"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                label={
                  <Box className="flex items-center gap-1">
                    <FiClock size={14} /> Sort By
                  </Box>
                }
              >
                <MenuItem value="recent">
                  <Box className="flex items-center gap-1">
                    <FiCalendar /> Most Recent
                  </Box>
                </MenuItem>
                <MenuItem value="oldest">
                  <Box className="flex items-center gap-1">
                    <FiCalendar /> Oldest
                  </Box>
                </MenuItem>
                <MenuItem value="highest">
                  <Box className="flex items-center gap-1">
                    <FiTrendingUp /> Highest
                  </Box>
                </MenuItem>
                <MenuItem value="lowest">
                  <Box className="flex items-center gap-1">
                    <FiTrendingDown /> Lowest
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Average Rating Section */}
        <Box className="bg-indigo-50 p-4 rounded-lg mb-6">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box className="flex items-center">
                <Typography variant="h4" className="font-bold mr-2">
                  {averageRating.toFixed(1)}
                </Typography>
                <Rating 
                  value={averageRating} 
                  precision={0.1} 
                  readOnly 
                  size="large"
                />
                <Typography variant="body2" className="ml-2 text-gray-600">
                  ({ratings.length} reviews)
                </Typography>
              </Box>
              <Typography variant="body2" className="text-gray-600 mt-1">
                Based on client feedback
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box className="flex flex-col">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratings.filter(r => r.rating === star).length;
                  const percentage = ratings.length > 0 
                    ? Math.round((count / ratings.length) * 100) 
                    : 0;
                  
                  return (
                    <Box key={star} className="flex items-center mb-1">
                      <Typography variant="body2" className="w-8">
                        {star} <FiStar className="inline text-yellow-400" />
                      </Typography>
                      <Box className="flex-1 mx-2">
                        <Box 
                          className="h-2 bg-gray-200 rounded-full overflow-hidden"
                        >
                          <Box 
                            className="h-full bg-yellow-400" 
                            style={{ width: `${percentage}%` }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" className="text-gray-600 w-10">
                        {percentage}%
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {ratingsLoading ? (
          <Box>
            {[...Array(3)].map((_, i) => (
              <Box key={i} className="mb-4">
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="rectangular" height={20} className="mt-2" />
              </Box>
            ))}
          </Box>
        ) : ratings.length === 0 ? (
          <Box className="text-center py-6">
            <Typography variant="body1" className="text-gray-500">
              No feedback received yet
            </Typography>
          </Box>
        ) : (
          <Box>
            {ratings.map((rating) => (
              <Box key={rating.id} className="mb-6 pb-4 border-b border-gray-100 last:border-0">
                <Box className="flex items-start justify-between mb-2">
                  <Box className="flex items-center">
                    <Avatar 
                      alt={rating.clientName} 
                      sx={{ width: 40, height: 40, mr: 2 }}
                    >
                      {rating.clientName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" className="font-medium">
                        {rating.clientName}
                      </Typography>
                      <Box className="flex items-center">
                        <Rating 
                          value={rating.rating} 
                          precision={0.5} 
                          readOnly 
                          size="small"
                        />
                        <Typography variant="body2" className="ml-1 text-gray-500">
                          {rating.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Tooltip title={formatDate(rating.submittedAt)}>
                    <Typography variant="caption" className="text-gray-400">
                      {format(rating.submittedAt, "MMM d, yyyy")}
                    </Typography>
                  </Tooltip>
                </Box>
                
                <Typography variant="body2" className="mb-2 text-gray-700">
                  {rating.feedback}
                </Typography>
                
                <Chip
                  label={getProjectName(rating.projectId)}
                  size="small"
                  variant="outlined"
                  className="mt-2"
                />
                
                {rating.media && rating.media.length > 0 && (
                  <Box className="flex flex-wrap gap-2 mt-3">
                    {rating.media.map((mediaUrl, index) => (
                      <Box 
                        key={index}
                        className="w-16 h-16 rounded-md overflow-hidden border border-gray-200"
                      >
                        <img 
                          src={mediaUrl} 
                          alt={`Feedback media ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        <Divider className="my-4" />
        
        <Box>
          <Typography variant="subtitle2" className="text-gray-800 mb-2">
            Awards & Recognition
          </Typography>
          <Box className="flex items-center space-x-2">
            <FiAward className="text-amber-500" />
            <Typography variant="body2">
              Employee of the Month - {format(new Date(), 'MMMM yyyy')}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackRecognition;