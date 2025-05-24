import React from 'react';
import { Grid, Typography, TextField, Button, Paper, List, Box } from '@mui/material';

const QnATab = ({ question, setQuestion, questions, handleSubmitQuestion }) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
          Questions & Answers
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this course..."
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
                fontWeight: '600'
              }}
            >
              Post Question
            </Button>
          </Box>
        </Box>

        {questions.length > 0 ? (
          <List>
            {questions.map((q) => (
              <Paper key={q.id} sx={{ mb: 3, p: 2, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: '600' }}>
                    {q.question}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {q.date}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Asked by {q.author}
                </Typography>
                
                {q.replies.length > 0 && (
                  <Box sx={{ 
                    backgroundColor: 'action.hover',
                    borderRadius: '8px',
                    p: 2,
                    mt: 2
                  }}>
                    {q.replies.map((reply, index) => (
                      <Box key={index} sx={{ mb: index < q.replies.length - 1 ? 2 : 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: '600' }}>
                            {reply.author}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {reply.date}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {reply.reply}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              No questions yet. Be the first to ask!
            </Typography>
          </Box>
        )}
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: '12px', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Tips for Asking Questions
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="• Be specific and clear in your question" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="• Check if your question has already been answered" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="• Be respectful to other learners" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="• Include relevant details about your issue" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default QnATab;