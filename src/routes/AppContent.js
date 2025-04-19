// AppContent.js
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginForm from "../auth/Login";
import SignupForm from "../auth/Signup";
import { auth, db } from "../services/firebase";
import { useEffect, useState } from "react";
import AdminDashboard from "../admin/Dashboard";
import SalesDashboard from "../Sales Team/Dashboard";
import ClientDashboard from "../client/Dahboard"; 
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import AdminNavbar from "../admin/components/AdminNavbar";
import { useTheme, useMediaQuery } from "@mui/material";
import HomePage from "../Home/HomePage";
import Footer from "../Footer/Footer";
import HomeNavbar from "../Home/components/HomeNavbar";
import ClientNavbar from "../client/components/ClientNavbar";
import SalesNavbar from "../Sales Team/components/SalesNavbar";
import ProjectManagerDashboard from "../project manager/Dashboard";
import ProjectManagerNavbar from "../project manager/components/ProjectManagerNavbar";
import ForgotPassword from "../auth/Forgot-Password";
import MarketingNavbar from "../Marketing Team/components/MarketingNavbar";
import MarketingDashboard from "../Marketing Team/Dashboard";
import VerifyEmail from "../Verify/Verify-email";
import SalesProfilePage from "../Profile/ProfilePage";
import AdminProfilePage from "../Profile/components/AdminProfile"
import CollaboratorNavbar from "../Collaborator/components/CollaboratorNavbar";
import ProjectManagerProfile from "../Profile/components/ProjectManagerProfile";
import CollaboratorDashboard from "../Collaborator/Dashboard";
import HelpSupportPage from "../Support/SupportPage";
import ClientProfile from "../Profile/components/Client-Profile";
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert
} from "@mui/material";
import MarketingProfile from "../Profile/components/MarketingProfile";
import SalesNotifications from "../Sales Team/components/SalesNotifications";
import AdminNotifications from "../admin/components/AdminNotifications";
import ClientNotifications from "../client/components/ClientNotifications";
import ChatPage from "../Chats/Chats";
import LoadingSpinner from "../assets/LoadingSpinner";
import SalesLeaderboard from "../Leaderboard/components/SalesTeam";

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const drawerWidth = 280;
  const location = useLocation();

  // Username modal state
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        try {
          const userDocRef = doc(db, 'users', authUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = {
              ...authUser,
              role: userDocSnap.data().role,
              ...userDocSnap.data()
            };
            setUser(userData);
            
            // Check if username exists and is valid
            if (!userDocSnap.data().username || userDocSnap.data().username.trim() === '') {
              setUsernameModalOpen(true);
            }
          } else {
            setUser(authUser);
            setUsernameModalOpen(true); // No user document exists, prompt for username
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(authUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkUsernameAvailability = async (username) => {
    if (!username || username.trim() === '') {
      return { available: false, error: 'Username cannot be empty' };
    }
    
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return { available: false, error: 'Username can only contain letters, numbers, underscores, dots, and hyphens' };
    }
    
    if (username.length < 3 || username.length > 20) {
      return { available: false, error: 'Username must be between 3 and 20 characters' };
    }
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return { available: false, error: 'Username is already taken' };
      }
      
      return { available: true, error: '' };
    } catch (error) {
      console.error('Error checking username:', error);
      return { available: false, error: 'Error checking username availability' };
    }
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }
    
    setIsCheckingUsername(true);
    setUsernameError('');
    
    const { available, error } = await checkUsernameAvailability(username);
    
    if (!available) {
      setUsernameError(error);
      setIsCheckingUsername(false);
      return;
    }
    
    try {
      // Update user document with username
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { username: username.toLowerCase() }, { merge: true });
      
      // Update local user state
      setUser(prev => ({
        ...prev,
        username: username.toLowerCase()
      }));
      
      setUsernameSuccess(true);
      setTimeout(() => {
        setUsernameModalOpen(false);
        setUsernameSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error updating username:', error);
      setUsernameError('Error updating username. Please try again.');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;;
  }

  // Check if current route is auth route
  const isAuthRoute = ["/login", "/signup", "/forgot-password"].includes(location.pathname);
  const isDashboardRoute = [
    "/admin-dashboard", 
    "/sales-dashboard", 
    "/client-dashboard",
    "/project-manager-dashboard",
    "/marketing-team-dashboard",
    "/colaborator-dashboard"
  ].includes(location.pathname);

  const routesWithoutFooter = [
    "/login", 
    "/signup", 
    "/forgot-password",
    "/admin-dashboard", 
    "/sales-dashboard", 
    "/client-dashboard",
    "/project-manager-dashboard",
    "/marketing-team-dashboard",
    "/colaborator-dashboard",
    "/chats"
  ];
  
  const shouldShowFooter = !routesWithoutFooter.some(route => 
    location.pathname.startsWith(route)
  );

  // Determine the dashboard path based on user role
  const getDashboardPath = () => {
    if (!user) return "/home";
    switch(user.role) {
      case 'Admin': return "/admin-dashboard";
      case 'sales': return "/sales-dashboard";
      case 'Project Manager': return "/project-manager-dashboard";
      case 'marketing' : return  "/marketing-team-dashboard";
      case 'Collaborator' : return "/colaborator-dashboard";
      case 'Intern' : return "/colaborator-dashboard";
      case 'Client':
      default: return "/client-dashboard";
    }
  };

  return (
    <>
      {/* Username Update Modal */}
      <Modal
        open={usernameModalOpen}
        onClose={() => {}}
        aria-labelledby="username-modal-title"
        aria-describedby="username-modal-description"
        disableEscapeKeyDown
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          {usernameSuccess ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Username updated successfully!
            </Alert>
          ) : (
            <>
              <Typography id="username-modal-title" variant="h6" component="h2" gutterBottom>
                Set Your Username
              </Typography>
              <Typography id="username-modal-description" sx={{ mb: 2 }}>
                Please choose a unique username to continue. This will be used for your profile URL.
              </Typography>
              
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!usernameError}
                helperText={usernameError || "3-20 characters, letters, numbers, underscores, dots, hyphens"}
                disabled={isCheckingUsername}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {isCheckingUsername ? (
                  <CircularProgress size={24} />
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleUsernameSubmit}
                    disabled={!username.trim() || isCheckingUsername}
                  >
                    Submit
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>

      {/* Show appropriate navbar based on user role */}
      {user?.role === 'Admin' && (
        <AdminNavbar 
          drawerWidth={drawerWidth}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}

      {user?.role === 'sales' && (
        <SalesNavbar
          drawerWidth={drawerWidth}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}

      {(user?.role === 'Collaborator' || user?.role === 'Intern') && (
        <CollaboratorNavbar
          drawerWidth={drawerWidth}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}

      {user?.role === 'client' && (
        <ClientNavbar
          drawerWidth={drawerWidth}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}

      {user?.role === 'marketing' && (
        <MarketingNavbar
          drawerWidth={drawerWidth}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}

      {user?.role === 'Project Manager' && (
        <ProjectManagerNavbar 
          drawerWidth={drawerWidth}
          handleDrawerToggle={handleDrawerToggle}
        />
      )}
  
      {/* Show home navbar for non-authenticated users on non-auth routes */}
      {!user && !isAuthRoute && <HomeNavbar/>}

      <Routes>
        <Route 
          path="/" 
          element={<Navigate to={getDashboardPath()} replace />}
        />
        
        <Route 
          path="/login" 
          element={user ? <Navigate to={getDashboardPath()} replace /> : <LoginForm />}
        />
        
        <Route 
          path="/signup" 
          element={user ? <Navigate to={getDashboardPath()} replace /> : <SignupForm />} 
        />
        
        <Route 
          path="/admin-dashboard" 
          element={
            user?.role === 'Admin' ? (
              <AdminDashboard 
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                drawerWidth={drawerWidth}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/sales-dashboard" 
          element={
            user?.role === 'sales' ? (
              <SalesDashboard 
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                drawerWidth={drawerWidth}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/client-dashboard" 
          element={
            user ? (
              <ClientDashboard 
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                drawerWidth={drawerWidth}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/colaborator-dashboard" 
          element={
            user ? (
              <CollaboratorDashboard
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                drawerWidth={drawerWidth}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />

        <Route 
          path="/marketing-team-dashboard" 
          element={
            user ? (
              <MarketingDashboard
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                drawerWidth={drawerWidth}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/project-manager-dashboard" 
          element={
            user?.role === 'Project Manager' ? (
              <ProjectManagerDashboard 
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                drawerWidth={drawerWidth}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/profile/:role/:username" 
          element={<SalesProfilePage />} 
        />
        
        <Route path="/admin-dashboard/profile/:username" element={<AdminProfilePage />} />
        <Route path="/project-manager-dashboard/profile/:username" element={<ProjectManagerProfile />} />
        <Route path="/client-dashboard/profile/:username" element={<ClientProfile/>} />
        <Route path="/marketing-team-dashboard/profile/:username" element={<MarketingProfile/>} />
        <Route path="/home" element={<HomePage/>}/>
        <Route path="/verify-email" element={<VerifyEmail/>}/>
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/support" element={<HelpSupportPage/>}/>
        <Route path="/sales-dashboard/notifications" element={<SalesNotifications/>} />
        <Route path="/admin-dashboard/notifications" element={<AdminNotifications/>} />
        <Route path="/client-dashboard/notifications" element={<ClientNotifications/>} />
        <Route path="/chats" element ={<ChatPage/>}/>
        <Route path="/sales-dashboard/leaderboard" element={<SalesLeaderboard/>}/>
      </Routes>
      
      {shouldShowFooter && <Footer/>}
    </>
  );
}

export default AppContent;