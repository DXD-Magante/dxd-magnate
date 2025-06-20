import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserData({
              ...userSnap.data(),
              // Fallback to auth user data if fields are missing
              firstName: userSnap.data().firstName || user.displayName?.split(' ')[0] || '',
              lastName: userSnap.data().lastName || user.displayName?.split(' ')[1] || '',
              photoURL: userSnap.data().photoURL || user.photoURL || null,
              role: userSnap.data().role || 'User'
            });
          } else {
            // If user doc doesn't exist, create basic profile from auth data
            setUserData({
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ')[1] || '',
              photoURL: user.photoURL || null,
              role: 'User'
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Function to get user initials
  const getInitials = () => {
    if (!userData) return "";
    const firstNameInitial = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : "";
    const lastNameInitial = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : "";
    return `${firstNameInitial}${lastNameInitial}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <div className="flex items-center space-x-3">
          <Avatar sx={{ width: 40, height: 40 }} />
          <div>
            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
              Loading...
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Loading...
            </Typography>
          </div>
        </div>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
      <div className="flex items-center space-x-3">
        <Avatar 
          alt="User Profile" 
          src={userData?.photoURL || undefined} 
          sx={{ 
            width: 40, 
            height: 40,
            bgcolor: userData?.photoURL ? 'transparent' : 'primary.main'
          }}
        >
          {!userData?.photoURL && getInitials()}
        </Avatar>
        <div>
          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
            {userData ? `${userData.firstName} ${userData.lastName}` : "Guest User"}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {userData?.role || "User"}
          </Typography>
        </div>
      </div>
    </Box>
  );
};

export default UserProfile;