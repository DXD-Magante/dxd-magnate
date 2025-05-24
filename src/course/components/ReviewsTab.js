import React from 'react';
import { Grid, Typography, Paper, TextField, Button, Rating, List, Box, Card, CardContent, LinearProgress, ListItem } from '@mui/material';
import { FiStar } from 'react-icons/fi';

const ReviewsTab = ({ review, setReview, reviews, handleSubmitReview }) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Course Reviews
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
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
              emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
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
              disabled={!review.comment.trim()}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '600'
              }}
            >
              Submit Review
            </Button>
          </Box>
        </Paper>

        {reviews.length > 0 ? (
          <List>
            {reviews.map((r) => (
              <Paper key={r.id} sx={{ mb: 3, p: 3, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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
                  emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body1">
                  {r.comment}
                </Typography>
              </Paper>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              No reviews yet. Be the first to review!
            </Typography>
          </Box>
        )}
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: '12px', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Rating Summary
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mr: 1 }}>
                4.5
              </Typography>
              <Box>
                <Rating 
                  value={4.5} 
                  precision={0.5} 
                  readOnly 
                  emptyIcon={<FiStar style={{ opacity: 0.55 }} />}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  124 reviews
                </Typography>
              </Box>
            </Box>
            <List dense>
              {[5, 4, 3, 2, 1].map((star) => (
                <ListItem key={star} sx={{ py: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="body2" sx={{ width: 40 }}>
                      {star} star
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
                          backgroundColor: star >= 4 ? '#4CAF50' : star >= 3 ? '#FFC107' : '#F44336'
                        }
                      }} 
                    />
                    <Typography variant="body2" sx={{ width: 40, textAlign: 'right' }}>
                      {star === 5 ? '70%' : star === 4 ? '20%' : star === 3 ? '7%' : star === 2 ? '2%' : '1%'}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ReviewsTab;