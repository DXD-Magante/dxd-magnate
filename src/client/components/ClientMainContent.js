// ClientMainContent.js
import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import ClientDashboardCards from "./DashboardCards";
import ActiveProjects from "./ActiveProjects";
import RolesResponsibilities from "./Roles";
import Contacts from "./Contacts";
import MyTasks from "./MyTasks";
import ChatPage from "../../Chats/Chats";
import { useNavigate } from "react-router-dom";
import PayNow from "./Paynow";
import Invoices from "./Invoices";
import Receipts from "./Receipts";
import PaymentHistory from "./PaymentHistory";
import Milestones from "./Milestones";
import Meetings from "./Meetings";
import SettingsProfile from "./ProfileSettings";
import NotificationSettings from "./NotificationSettings";

const ClientMainContent = ({ activeSection, activeSubsection }) => {
  const navigate = useNavigate()
  const renderContent = () => {
    // Always show dashboard content when on dashboard section
    if (activeSection === "Dashboard") {
      return <ClientDashboardCards />;
    }
    
    if (activeSubsection === "Active Projects") {
      return <ActiveProjects />;
    }

    if (activeSubsection === "Contacts") {
      return <Contacts />;
    }

    if (activeSubsection === "My Tasks") {
      return <MyTasks />;
    }

    if (activeSubsection === "Roles & Responsibilities") {
      return <RolesResponsibilities />;
    }

    if (activeSubsection === "Pay now") {
      return <PayNow />;
    }

    if (activeSubsection === "Invoices") {
      return <Invoices />;
    }

    if (activeSubsection === "Receipts") {
      return <Receipts />;
    }

    if (activeSubsection === "Milestones") {
      return <Milestones />;
    }

    if (activeSubsection === "Payment History") {
      return <PaymentHistory />;
    }

    if (activeSubsection === "Meetings") {
      return <Meetings />;
    }

    if (activeSubsection === "Profile") {
      return <SettingsProfile />;
    }

    if (activeSubsection === "Notifications") {
      return <NotificationSettings />;
    }
    

    if (activeSubsection === "Messages") {
       navigate('/chats');
    }
    // Show content only when a subsection is selected
    if (activeSubsection) {
      return (
        <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              {activeSubsection}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This section will display detailed information about {activeSubsection.toLowerCase()}.
            </Typography>
          </CardContent>
        </Card>
      );
    }
    
    // Default view when no subsection is selected
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            {activeSection}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please select a subsection from the sidebar to view detailed information.
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <div className="mb-8">
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold', 
          color: '#1e293b',
          mb: 1
        }}>
          {activeSubsection || activeSection}
        </Typography>
        <Typography variant="body1" sx={{ 
          color: '#64748b',
          maxWidth: '600px'
        }}>
          {getSectionDescription(activeSubsection || activeSection)}
        </Typography>
      </div>
      
      {renderContent()}
    </Box>
  );
};

const getSectionDescription = (section) => {
  const descriptions = {
    "Dashboard": "Overview of your projects, tasks, and recent activities",
    "Overview": "Summary of your dashboard metrics and statistics",
    "Recent Activity": "Latest updates and actions in your account",
    "Projects": "Track your active projects, milestones, and deliverables",
    "Active Projects": "View all currently active projects",
    "Milestones": "Track important project milestones",
    "Deliverables": "View project deliverables and due dates",
    "Tasks": "Manage your assigned tasks and review progress",
    "My Tasks": "Tasks assigned to you",
    "Completed": "View your completed tasks",
    "Pending Review": "Tasks awaiting your review",
    "Communications": "View messages, meeting notes, and support tickets",
    "Messages": "Your message inbox",
    "Meeting Notes": "Notes from past meetings",
    "Support Tickets": "Open and resolved support tickets",
    "Billing": "Access invoices, payment history, and receipts",
    "Invoices": "View and download invoices",
    "Payment History": "Your payment transaction history",
    "Receipts": "Download payment receipts",
    "Team": "View team contacts and responsibilities",
    "Contacts": "Team member contact information",
    "Roles & Responsibilities": "Team roles and responsibilities",
    "Settings": "Configure your profile and preferences",
    "Profile": "Edit your profile information",
    "Notifications": "Configure notification settings",
    "Preferences": "Set your account preferences"
  };
  return descriptions[section] || "";
};

export default ClientMainContent;