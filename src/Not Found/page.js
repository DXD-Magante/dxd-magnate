import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiHome, FiMail } from "react-icons/fi";
import Lottie from "lottie-react";
import animationData from "../assets/404-animation-2.json";
import { Button, Typography, Box, Container, Stack } from "@mui/material";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ height: '100vh', overflow: 'hidden' }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          textAlign: "center",
          py: 2,
        }}
      >
        {/* Lottie Animation - Made smaller */}
        <Box sx={{ width: { xs: "70%", sm: "60%", md: "50%" }, mb: 1 }}> 
          <Lottie 
            animationData={animationData} 
            loop={true} 
            style={{ width: "100%" }}
          />
        </Box>

        {/* Error Message - Made smaller */}
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            mb: 0.5,
            color: "text.primary",
          }}
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 1.5,
            color: "text.secondary",
            maxWidth: "400px",
          }}
        >
          Oops! The page you're looking for doesn't exist or has been moved. 
          Please check the URL or try one of the options below.
        </Typography>

        {/* Action Buttons - Made smaller */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5}> 
          <Button
            variant="contained"
            size="small"
            startIcon={<FiArrowLeft />}
            onClick={() => navigate(-1)}
            sx={{
              px: 2,
              py: 0.5,
              fontWeight: 600,
            }}
          >
            Go Back
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FiHome />}
            onClick={() => navigate("/")}
            sx={{
              px: 2,
              py: 0.5,
              fontWeight: 600,
            }}
          >
            Home Page
          </Button>

          <Button
            variant="text"
            size="small"
            startIcon={<FiMail />}
            onClick={() => navigate("/support")}
            sx={{
              px: 2,
              py: 0.5,
              fontWeight: 600,
            }}
          >
            Contact Support
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}

export default NotFoundPage;