import React from 'react';
import { Grid, Typography, Card, CardContent, Button } from '@mui/material';
import { FiFileText, FiDownload } from 'react-icons/fi';

const ResourcesTab = ({ course }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
        Course Resources
      </Typography>
      <Grid container spacing={3}>
        {course.modules?.flatMap(module => 
          module.materials?.filter(material => material.type === 'file').map((material, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ 
                    height: 160,
                    backgroundColor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <FiFileText size={48} color="text.secondary" />
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
                      variant="outlined"
                      startIcon={<FiDownload size={16} />}
                      onClick={() => window.open(material.url, '_blank')}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: '600'
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
  );
};

export default ResourcesTab;