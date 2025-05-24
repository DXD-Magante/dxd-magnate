
import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, ListItemAvatar, Avatar, Button } from '@mui/material';
import { FiChevronDown, FiLink, FiFileText, FiPlay } from 'react-icons/fi';

const ContentTab = ({ course, expandedModule, handleModuleExpand }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
        Course Curriculum
      </Typography>
      {course.modules?.map((module, index) => (
        <Accordion 
          key={index} 
          expanded={expandedModule === index}
          onChange={() => handleModuleExpand(index)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary
            expandIcon={<FiChevronDown />}
            sx={{ 
              backgroundColor: 'action.hover',
              '&.Mui-expanded': {
                backgroundColor: 'action.selected'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.dark',
                width: 32,
                height: 32
              }}>
                {index + 1}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: '600' }}>
                  {module.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {module.materials?.length} items • 30 min
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense>
              {module.materials?.map((material, matIndex) => (
                <ListItem 
                  key={matIndex}
                  button
                  onClick={() => window.open(material.url, '_blank')}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      5 min
                    </Typography>
                    <Button 
                      size="small"
                      startIcon={<FiPlay size={14} />}
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
  );
};

export default ContentTab;