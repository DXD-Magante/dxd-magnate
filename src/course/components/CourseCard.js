import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  minHeight: 48
}));

const CourseTabs = ({ activeTab, setActiveTab }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: 'primary.main',
            height: 3
          }
        }}
      >
        <StyledTab value="overview" label="Overview" />
        <StyledTab value="content" label="Course Content" />
        <StyledTab value="resources" label="Resources" />
        <StyledTab value="qna" label="Q&A" />
        <StyledTab value="reviews" label="Reviews" />
      </Tabs>
    </Box>
  );
};

export default CourseTabs;
