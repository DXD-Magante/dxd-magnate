import React from "react";
import { Box, Toolbar, Typography } from "@mui/material";
import MarketingDashboardCards from "./MarketingDashboardCards";
import CampaignsContent from "./Campaigns";

const MarketingMainContent = ({ activeSection, activeSubsection, sections }) => {
  const renderSectionContent = () => {
    if (activeSubsection) {
      switch (activeSubsection) {
        case "All Campaigns":
          return <CampaignsContent />;
        // Add cases for other subsections...
        default:
          return (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ color: '#334155' }}>
                {activeSubsection} Content
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Detailed information about {activeSubsection.toLowerCase()}
              </Typography>
            </Box>
          );
      }
    }

    switch (activeSection) {
      case "Dashboard":
        return <MarketingDashboardCards />;
      case "Campaigns":
        return <CampaignsContent />; // Show campaigns by default when section is clicked
      // Add cases for other sections...
      default:
        return <MarketingDashboardCards />;
    }
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
      <Toolbar />

      <div className="mb-6">
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
          {activeSubsection || activeSection}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {activeSection === "Dashboard"
            ? "Overview of marketing performance, campaigns, and key metrics"
            : activeSubsection || sections.find(s => s.title === activeSection)?.items.join(" • ")}
        </Typography>
      </div>

      {renderSectionContent()}
    </Box>
  );
};

export default MarketingMainContent;