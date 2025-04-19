// Update MainContent.js
import React from "react";
import { Box, Toolbar, Typography } from "@mui/material";
import DashboardCards from "./DashBoardCards";
import UserManagement from "./UserManagement";
import MonthlyTargetManagement from "./MonthlyTarget";
import UpcomingBusinessEvents from "./UpcomingBussinessEvents";
import OngoingProjects from "./OngoingProjects";
import AdminLeadManagement from "./LeadManagement";
import ConversionMetrics from "./ConversionMetrics";
import ClientOverview from "./ClientOverview";
import ForecastManagement from "./ForecastManageent";

const MainContent = ({ activeSection, activeSubsection, sections }) => {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f8fafc' }}>
      <Toolbar />
      
      {/* Show specific components based on selection */}
      {activeSubsection === "Admin & Team Roles" ? (
        <UserManagement />
      ) : activeSubsection === "Monthly Target" ? (
        <MonthlyTargetManagement />
      ) : activeSubsection === "Upcoming Business Events" ? (
        <UpcomingBusinessEvents/>
      ): activeSubsection === "Ongoing Projects" ? (
        <OngoingProjects/>
      ):activeSubsection === "Lead Management" ? (
        <AdminLeadManagement/>
      ):activeSubsection === "Conversion Metrics" ? (
        <ConversionMetrics/>
      ):activeSubsection === "Clients Overview" ? (
        <ClientOverview/>
      ):activeSubsection === "Forecast Management" ? (
        <ForecastManagement />
      ) :(
        <>
          <div className="mb-6">
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
              {activeSubsection || activeSection}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {activeSection === "Dashboard" 
                ? "Overview of financial analytics, marketing stats, sales performance, and active projects"
                : activeSubsection || sections.find(s => s.title === activeSection)?.items.join(" • ")}
            </Typography>
          </div>
          <DashboardCards 
            activeSection={activeSection} 
            activeSubsection={activeSubsection} 
          />
        </>
      )}
    </Box>
  );
};

export default MainContent;