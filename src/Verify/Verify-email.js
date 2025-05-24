import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
  alpha
} from "@mui/material";
import { 
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
  FaSignInAlt,
  FaArrowRight,
  FaEnvelopeOpen
} from "react-icons/fa";

const VerifyEmail = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("checking");
  const [cooldown, setCooldown] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        checkVerificationStatus(currentUser);
      } else {
        setStatus("unauthenticated");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const checkVerificationStatus = async (currentUser) => {
    try {
      setLoading(true);
      await currentUser.reload();
      
      if (currentUser.emailVerified) {
        setStatus("verified");
      } else {
        setStatus("unverified");
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          // Handle case where user document doesn't exist
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await sendEmailVerification(user);
      setCooldown(60); // 60 seconds cooldown
      setStatus("resent");
    } catch (error) {
      console.error("Error resending verification email:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }) => {
    const iconStyle = {
      fontSize: "4rem",
      marginBottom: "1.5rem"
    };

    switch (status) {
      case "verified":
        return <FaCheckCircle style={{ ...iconStyle, color: theme.palette.success.main }} />;
      case "unverified":
        return <FaEnvelope style={{ ...iconStyle, color: theme.palette.primary.main }} />;
      case "resent":
        return <FaEnvelopeOpen style={{ ...iconStyle, color: theme.palette.info.main }} />;
      case "error":
        return <FaExclamationTriangle style={{ ...iconStyle, color: theme.palette.error.main }} />;
      case "unauthenticated":
        return <FaSignInAlt style={{ ...iconStyle, color: theme.palette.warning.main }} />;
      default:
        return <CircularProgress size={64} />;
    }
  };

  const StatusMessage = ({ status }) => {
    switch (status) {
      case "verified":
        return (
          <>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Email Verified
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your email address <strong>{user?.email}</strong> has been successfully verified.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You now have full access to all features of your account.
            </Typography>
          </>
        );
      case "unverified":
        return (
          <>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Verify Your Email
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We've sent a verification link to <strong>{user?.email}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please check your inbox and click the link to complete your registration. If you don't see the email, check your spam folder.
            </Typography>
          </>
        );
      case "resent":
        return (
          <>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Verification Sent
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              A new verification email has been sent to <strong>{user?.email}</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please allow a few minutes for the email to arrive.
            </Typography>
          </>
        );
      case "error":
        return (
          <>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Verification Error
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We encountered an issue while processing your request.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please try again later or contact support if the problem persists.
            </Typography>
          </>
        );
      case "unauthenticated":
        return (
          <>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Session Expired
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your session has expired or you're not signed in.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please sign in to verify your email address.
            </Typography>
          </>
        );
      default:
        return (
          <>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Checking Status
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Verifying your email status...
            </Typography>
          </>
        );
    }
  };

  const ActionButton = ({ status }) => {
    switch (status) {
      case "verified":
        return (
          <Button
            variant="contained"
            size="large"
            endIcon={<FaArrowRight />}
            href="/dashboard"
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Continue to Dashboard
          </Button>
        );
      case "unverified":
      case "resent":
        return (
          <Button
            variant="contained"
            size="large"
            onClick={handleResendVerification}
            disabled={loading || cooldown > 0}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaSyncAlt />}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Verification"}
          </Button>
        );
      case "error":
        return (
          <Button
            variant="contained"
            size="large"
            onClick={() => checkVerificationStatus(user)}
            startIcon={<FaSyncAlt />}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Try Again
          </Button>
        );
      case "unauthenticated":
        return (
          <Button
            variant="contained"
            size="large"
            endIcon={<FaArrowRight />}
            href="/login"
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Sign In
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: theme.palette.mode === 'dark' 
              ? `0 8px 32px ${alpha(theme.palette.primary.dark, 0.2)}`
              : `0 8px 32px ${alpha(theme.palette.primary.light, 0.2)}`,
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.8)
              : alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(8px)',
            border: theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Stack spacing={4} alignItems="center" textAlign="center">
              <Box>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, #4FACFE 0%, #00F2FE 100%)'
                      : 'linear-gradient(45deg, #3A7BD5 0%, #00D2FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block'
                  }}
                >
                  Email Verification
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {status === "verified" 
                    ? "Your account is now secure" 
                    : "Secure your account with email verification"}
                </Typography>
              </Box>

              <Divider sx={{ width: '100%', borderColor: 'divider' }} />

              <StatusIcon status={status} />

              <StatusMessage status={status} />

              <Box sx={{ pt: 2 }}>
                <ActionButton status={status} />
              </Box>

              {status === "unverified" && (
                <Typography variant="caption" color="text.secondary">
                  Didn't receive the email? Check your spam folder or resend.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};

export default VerifyEmail;