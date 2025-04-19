import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Divider,
  Chip,
  Avatar,
  useTheme,
} from "@mui/material";
import {
  FiHelpCircle,
  FiMail,
  FiMessageSquare,
  FiPhone,
  FiClock,
  FiChevronDown,
  FiSearch,
  FiBookOpen,
  FiVideo,
  FiDownload,
  FiUser,
  FiGlobe,
} from "react-icons/fi";
import { styled } from "@mui/material/styles";

const HelpSupportPage = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking on 'Forgot Password' on the login page. A reset link will be sent to your registered email address.",
    },
    {
      question: "How can I update my profile information?",
      answer: "Navigate to your profile page from the dashboard sidebar. Click the 'Edit Profile' button to update your information.",
    },
    {
      question: "Where can I find my project reports?",
      answer: "All project reports are available under the 'Reports & Insights' section in your dashboard. You can filter by date range and project type.",
    },
    {
      question: "How do I invite team members to a project?",
      answer: "Go to the project management section, select your project, and click 'Invite Members'. Enter their email addresses and assign roles.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers. Payment methods can be managed in your account settings.",
    },
  ];

  const supportTopics = [
    {
      icon: <FiBookOpen size={24} />,
      title: "Knowledge Base",
      description: "Browse our comprehensive documentation and guides",
      color: "#4f46e5",
    },
    {
      icon: <FiVideo size={24} />,
      title: "Video Tutorials",
      description: "Watch step-by-step video guides for all features",
      color: "#10b981",
    },
    {
      icon: <FiDownload size={24} />,
      title: "Resources",
      description: "Download templates, checklists, and other resources",
      color: "#f59e0b",
    },
    {
      icon: <FiGlobe size={24} />,
      title: "Community",
      description: "Join our community forum to connect with others",
      color: "#3b82f6",
    },
  ];

  const contactOptions = [
    {
      icon: <FiMail size={24} />,
      title: "Email Support",
      description: "support@dxdmagnate.com",
      responseTime: "Typically replies within 2 hours",
      action: "Send Email",
    },
    {
      icon: <FiMessageSquare size={24} />,
      title: "Live Chat",
      description: "Available 9AM-6PM (GMT+5:30)",
      responseTime: "Instant connection during business hours",
      action: "Start Chat",
    },
    {
      icon: <FiPhone size={24} />,
      title: "Phone Support",
      description: "+1 (555) 123-4567",
      responseTime: "Available 24/7 for urgent issues",
      action: "Call Now",
    },
  ];

  const StyledAccordion = styled(Accordion)(({ theme }) => ({
    boxShadow: "none",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "8px !important",
    marginBottom: "12px",
    "&:before": {
      display: "none",
    },
    "&.Mui-expanded": {
      borderColor: theme.palette.primary.main,
    },
  }));

  const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: "8px",
    "&.Mui-expanded": {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    "& .MuiAccordionSummary-content": {
      alignItems: "center",
    },
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Chip
          label="Support Center"
          color="primary"
          size="small"
          sx={{ mb: 2 }}
        />
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          How can we help you today?
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth="700px" mx="auto">
          Get answers to your questions, browse our knowledge base, or contact our support team directly.
        </Typography>
        
        <Box mt={4} mx="auto" maxWidth="700px">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <Box sx={{ color: "text.secondary", mr: 1 }}>
                  <FiSearch size={20} />
                </Box>
              ),
              sx: {
                borderRadius: "50px",
                backgroundColor: theme.palette.background.paper,
              },
            }}
          />
          <Box mt={2} display="flex" justifyContent="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              Popular searches:
            </Typography>
            <Chip label="billing" size="small" variant="outlined" />
            <Chip label="password reset" size="small" variant="outlined" />
            <Chip label="project setup" size="small" variant="outlined" />
          </Box>
        </Box>
      </Box>

      <Box mb={6}>
        <Grid container spacing={3}>
          {supportTopics.map((topic, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: theme.shadows[4],
                    borderColor: topic.color,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    backgroundColor: `${topic.color}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    color: topic.color,
                  }}
                >
                  {topic.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {topic.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {topic.description}
                </Typography>
                <Button
                  size="small"
                  endIcon={<FiChevronDown size={16} />}
                  sx={{ color: topic.color }}
                >
                  Explore
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box mb={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Frequently Asked Questions
          </Typography>
          <Button variant="text" endIcon={<FiChevronDown />}>
            View all
          </Button>
        </Box>

        <Box>
          {faqs.map((faq, index) => (
            <StyledAccordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
            >
              <StyledAccordionSummary
                expandIcon={<FiChevronDown />}
                aria-controls={`panel${index}bh-content`}
                id={`panel${index}bh-header`}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    backgroundColor: theme.palette.primary.light,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    color: theme.palette.primary.main,
                  }}
                >
                  <FiHelpCircle size={16} />
                </Box>
                <Typography sx={{ fontWeight: "medium" }}>
                  {faq.question}
                </Typography>
              </StyledAccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </StyledAccordion>
          ))}
        </Box>
      </Box>

      <Box mb={6}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Contact Our Support Team
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Can't find what you're looking for? Our team is here to help.
        </Typography>

        <Grid container spacing={3}>
          {contactOptions.map((option, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      backgroundColor: `${theme.palette.primary.light}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 2,
                      color: theme.palette.primary.main,
                    }}
                  >
                    {option.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold">
                    {option.title}
                  </Typography>
                </Box>
                <Typography variant="body1" mb={2}>
                  {option.description}
                </Typography>
                <Box display="flex" alignItems="center" mb={3}>
                  <FiClock
                    size={16}
                    style={{ marginRight: "8px", color: theme.palette.text.secondary }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {option.responseTime}
                  </Typography>
                </Box>
                <Button variant="outlined" fullWidth>
                  {option.action}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: "white",
          }}
        >
          <Grid container alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Need personalized assistance?
              </Typography>
              <Typography variant="body1" mb={3}>
                Schedule a one-on-one session with our support specialist to get
                tailored help for your specific needs.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<FiUser />}
              >
                Book a Support Session
              </Button>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: { xs: "none", md: "block" } }}>
              <Box textAlign="right">
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: "white",
                    color: theme.palette.primary.main,
                    fontSize: "3rem",
                    marginLeft: "auto",
                  }}
                >
                  <FiUser size={48} />
                </Avatar>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default HelpSupportPage;