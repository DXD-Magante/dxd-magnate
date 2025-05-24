import React from 'react';
import { Grid, Typography, Box, Card, CardContent, Chip, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button } from '@mui/material';
import { FiCheckCircle, FiChevronDown, FiLink, FiFileText, FiPlay } from 'react-icons/fi';

const OverviewTab = ({ course, expandedModule, handleModuleExpand }) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={8}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          About This Course
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {course.description}
        </Typography>

        {course.learningOutcomes?.length > 0 && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              What You'll Learn
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {course.learningOutcomes.map((outcome, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <FiCheckCircle size={20} color="#4CAF50" />
                    <Typography variant="body1">{outcome}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Course Content
        </Typography>
        <Box sx={{ mb: 3 }}>
          {course.modules?.slice(0, 3).map((module, index) => (
            <Accordion 
              key={index} 
              expanded={expandedModule === index}
              onChange={() => handleModuleExpand(index)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<FiChevronDown />}>
                <Typography sx={{ fontWeight: '600' }}>
                  Module {index + 1}: {module.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {module.materials?.map((material, matIndex) => (
                    <ListItem key={matIndex} sx={{ py: 0.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ 
                          bgcolor: 'primary.light', 
                          color: 'primary.dark',
                          width: 32,
                          height: 32
                        }}>
                          {material.type === 'link' ? (
                            <FiLink size={16} />
                          ) : (
                            <FiFileText size={16} />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={material.type === 'link' ? material.url : material.fileName}
                        secondary={material.type === 'file' ? `${material.fileType} • ${formatFileSize(material.fileSize)}` : null}
                      />
                      <Button 
                        size="small"
                        startIcon={<FiPlay size={14} />}
                        onClick={() => window.open(material.url, '_blank')}
                      >
                        View
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ borderRadius: '12px', mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Course Details
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                Department:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {course.department}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                Level:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {course.level}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                Duration:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {course.estimatedDuration}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                Completion Deadline:
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {course.completionDeadline || 'No deadline'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: '500', mb: 0.5 }}>
                Visible To:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {course.visibleTo?.map((role, index) => (
                  <Chip
                    key={index}
                    label={role}
                    size="small"
                    sx={{ 
                      backgroundColor: 'primary.light',
                      color: 'primary.dark'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OverviewTab;