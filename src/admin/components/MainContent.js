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
import BillingInvoices from "./Billings";
import RevenueProfitAnalysis from "./Revenue";
import SalesPipeline from "./SalesPipeline";
import SchedulePosts from "./SchedulePost";
import Resources from "./Resources";
import ProgressTrackingDashboard from "./ProgressTracking";
import PerformanceMetrics from "./PerformanceMetrics";
import PermissionsAccess from "./PermissionAccess";
import TeamAssignment from "./Team Assignment/teamAssignment";
import CourseManagement from "./courseManagement";
import AdminCampaigns from "./AllCampaigns";
import AdminCampaignPerformance from "./campaignPerformance";

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
      ): activeSubsection === "Billing & Invoices" ? (
        <BillingInvoices/>
      ):  activeSubsection === "Revenue & Profit Analysis" ? (
        <RevenueProfitAnalysis/>
      ):  activeSubsection === "Sales Pipeline" ? (
        <SalesPipeline/>
      ): activeSubsection === "Schedule Posts" ? (
        <SchedulePosts />
      ): activeSubsection === "Team Resource Allocation" ? (
        <Resources />
      ): activeSubsection === "Performance Metrics" ? (
        <PerformanceMetrics />
      ):  activeSubsection === "Progress Tracking" ? (
        <ProgressTrackingDashboard />
      ): activeSubsection === "Permissions & Access" ? (
        <PermissionsAccess />
      ): activeSubsection === "Team Assignment" ? (
        <TeamAssignment />
      ): activeSubsection === "Course Management" ? (
        <CourseManagement />
      ): activeSubsection === "Campaign Performance" ? (
        <AdminCampaignPerformance />
      ):  ( activeSubsection === "All Campaigns" ? (
        <AdminCampaigns />
      ):
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