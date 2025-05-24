import React from "react";
import { Box, Toolbar, Typography } from "@mui/material";
import MarketingDashboardCards from "./MarketingDashboardCards";
import CampaignsContent from "./Campaigns";
import UpcomingPosts from "./UpcomingPosts";
import TeamAssignment from "./TeamAssignment";
import MarketingTaskBoard from "./TaskBoard";
import TeamPerformance from "./TeamPerformance";
import SubmissionReview from "./Submissions";
import Communication from "./Communication";
import SocialMediaDashboard from "./SocialMedia";
import PerformanceMetrics from "./PerformanceMetrics";

const MarketingMainContent = ({ activeSection, activeSubsection, sections }) => {
  const renderSectionContent = () => {
    if (activeSubsection) {
      switch (activeSubsection) {
        case "All Campaigns":
          return <CampaignsContent />;
        case "Performance Metrics":
          return <PerformanceMetrics />;
        case "Upcoming Posts":
          return <UpcomingPosts />;
        case "Team assignment":
          return <TeamAssignment />;
        case "Task Board":
          return <MarketingTaskBoard />;
        case "Team Performance":
          return <TeamPerformance/>;
        case "Submissions":
          return <SubmissionReview/>;
        case "Communication":
          return <Communication/>;
        case "Social Media Dahboard":
          return <SocialMediaDashboard/>;  
        default:
          return (
            <>
              <div className="mb-6">
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                  {activeSubsection}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {sections.find(s => s.title === activeSection)?.items.join(" • ")}
                </Typography>
              </div>
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ color: '#334155' }}>
                  {activeSubsection} Content
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Detailed information about {activeSubsection.toLowerCase()}
                </Typography>
              </Box>
            </>
          );
      }
    }

    // Section-level rendering
    return (
      <>
        <div className="mb-6">
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
            {activeSection}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {activeSection === "Dashboard"
              ? "Overview of marketing performance, campaigns, and key metrics"
              : sections.find(s => s.title === activeSection)?.items.join(" • ")}
          </Typography>
        </div>

        {activeSection === "Dashboard" ? (
          <MarketingDashboardCards />
        ) : activeSection === "Campaigns" ? (
          <CampaignsContent />
        ) : (
          <MarketingDashboardCards />
        )}
      </>
    );
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
      {renderSectionContent()}
      <Toolbar />
    </Box>
  );
};

export default MarketingMainContent;
