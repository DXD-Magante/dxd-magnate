import React from "react";
import { Box, Toolbar, Typography } from "@mui/material";
import SalesDashboardCards from "./SalesDashboardCards";

const SalesMainContent = ({ activeSection, activeSubSection }) => {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
      <Toolbar />
      
      <div className="mb-6">
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          {activeSubSection || activeSection}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {activeSection === "Dashboard" 
            ? "Your sales performance overview and key metrics"
            : `Manage your ${activeSubSection ? activeSubSection.toLowerCase() : activeSection.toLowerCase()} and related activities`}
        </Typography>
      </div>
      
      <SalesDashboardCards activeSection={activeSection} activeSubSection={activeSubSection} />
    </Box>
  );
};

export default SalesMainContent;