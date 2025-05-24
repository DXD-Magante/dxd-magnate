// LoadingSpinner.js
import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Fade } from "@mui/material";
import { FiLoader } from "react-icons/fi";

const LoadingSpinner = ({ size = 80, text = "Loading..." }) => {
  return (
    <Fade in={true} timeout={500}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          zIndex: 9999,
          backdropFilter: "blur(3px)",
        }}
        className="backdrop-blur-sm bg-opacity-80"
      >
        <Box
          sx={{
            position: "relative",
            display: "inline-flex",
          }}
        >
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: (theme) => theme.palette.primary.main,
              animationDuration: "1000ms",
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiLoader
              className="animate-spin text-primary-500"
              style={{
                fontSize: size * 0.6,
                color: "inherit",
              }}
            />
          </Box>
        </Box>
        <Typography
          variant="body1"
          sx={{
            mt: 2,
            color: (theme) => theme.palette.text.secondary,
            fontWeight: 500,
          }}
          className="text-gray-600 font-medium"
        >
          {text}
        </Typography>
      </Box>
    </Fade>
  );
};

export default LoadingSpinner;