import React from "react";
import { Box, Toolbar, Typography } from "@mui/material";
import SalesDashboardCards from "./SalesDashboardCards";

const SalesMainContent = ({ activeSection, activeSubSection }) => {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
      <Toolbar />
      
      <SalesDashboardCards activeSection={activeSection} activeSubSection={activeSubSection} />
    </Box>
  );
};

export default SalesMainContent;