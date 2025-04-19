import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar, Chip } from "@mui/material";
import { auth, db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";

const MarketingUserProfile = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
      <div className="flex items-center space-x-3">
        <Avatar 
          alt="User Profile" 
          src={userData?.profilePicture || "https://randomuser.me/api/portraits/women/44.jpg"} 
          sx={{ width: 40, height: 40 }}
        />
        <div className="flex-1">
          <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
            {userData ? `${userData.firstName} ${userData.lastName}` : "Loading..."}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {userData ? userData.role : "Loading..."}
          </Typography>
        </div>
        {userData?.role === "Marketing Manager" && (
          <Chip 
            label="Manager" 
            size="small" 
            sx={{ 
              backgroundColor: 'rgba(236, 72, 153, 0.1)', 
              color: '#ec4899',
              fontWeight: 'bold'
            }}
          />
        )}
      </div>
    </Box>
  );
};

export default MarketingUserProfile;