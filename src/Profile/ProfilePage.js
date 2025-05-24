import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import SalesProfile from "./components/SalesProfile";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { FiArrowLeft } from "react-icons/fi";

const ProfilePage = () => {
  const { role, username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Find user by username (first name in this case)
        const usersQuery = query(
          collection(db, "users"),

        );
        const querySnapshot = await getDocs(usersQuery);
        
        if (querySnapshot.empty) {
          throw new Error("User not found");
        }

        let userFound = false;
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.role.toLowerCase() === role.toLowerCase()) {
            setProfileData({ id: doc.id, ...userData });
            userFound = true;
          }
        });

        if (!userFound) {
          throw new Error(`No ${role} found with that username`);
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [role, username]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate("/sales-dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6">
          No profile data available
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate("/sales-dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Render different profile components based on role
  switch (role.toLowerCase()) {
    case 'sales':
      return <SalesProfile profileData={profileData} />;
    default:
      return (
        <Box p={4} textAlign="center">
          <Typography variant="h6" color="error">
            Invalid role specified
          </Typography>
        </Box>
      );
  }
};

export default ProfilePage;