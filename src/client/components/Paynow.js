// PayNow.js
import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Button, Box, 
  LinearProgress, Alert, Avatar, Divider, Chip
} from '@mui/material';
import { FaRupeeSign, FaCheckCircle, FaReceipt } from 'react-icons/fa';
import { FiAlertCircle, FiCreditCard, FiCalendar } from 'react-icons/fi';
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { format } from 'date-fns';

const PayNow = () => {
  const [outstandingProjects, setOutstandingProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const fetchOutstandingProjects = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("clientId", "==", user.uid),
          where("paymentStatus", "==", "not_paid")
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dueDate: calculateDueDate(doc.data().createdAt),
          outstandingAmount: parseFloat(doc.data().budget) - (parseFloat(doc.data().paidAmount) || 0)
        }));

        setOutstandingProjects(projectsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load payment information. Please try again.");
        setLoading(false);
      }
    };

    fetchOutstandingProjects();
  }, []);

  const calculateDueDate = (createdAt) => {
    if (!createdAt) return null;
    const createdDate = new Date(createdAt);
    const dueDate = new Date(createdDate);
    dueDate.setDate(dueDate.getDate() + 10);
    return dueDate;
  };

  const initiatePayment = async (project) => {
    setPaymentProcessing(true);
    setSelectedProject(project);
    setError(null);
    setSuccess(null);
  
    try {
      // In a real app, you would call your backend to create an order first
      // const orderResponse = await createRazorpayOrder(project.outstandingAmount);
      
      const options = {
        key: "rzp_test_q2PasVbigxFprT",
        amount: project.outstandingAmount * 100,
        currency: "INR",
        name: "DXD Magnate",
        description: `Payment for ${project.title}`,
        image: "../../assets/dxd-logo.png",
        // order_id: orderResponse.id, // Uncomment when using backend order creation
        handler: async (response) => {
          await handlePaymentSuccess(response, project);
        },
        prefill: {
          name: project.clientName,
          email: auth.currentUser.email,
          contact: "" 
        },
        notes: {
          projectId: project.id,
          clientId: project.clientId
        },
        theme: {
          color: "#4f46e5"
        }
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
      
      rzp.on('payment.failed', (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setPaymentProcessing(false);
        // You might want to log this failure in your database
      });
  
    } catch (err) {
      console.error("Payment error:", err);
      setError("Failed to initiate payment. Please try again.");
      setPaymentProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response, project) => {
    try {
      // Prepare transaction data with fallbacks for optional fields
      const transactionData = {
        projectId: project.id,
        projectTitle: project.title || "Untitled Project",
        clientId: project.clientId,
        clientName: project.clientName || "Unknown Client",
        amount: project.outstandingAmount,
        currency: "INR",
        paymentMethod: "razorpay",
        paymentId: response.razorpay_payment_id || null,
        orderId: response.razorpay_order_id || null, // Handle undefined orderId
        signature: response.razorpay_signature || null,
        status: "completed",
        timestamp: new Date().toISOString(),
        type: "project_payment",
        invoiceNumber: `INV-${Date.now()}`,
        taxAmount: 0,
        platformFee: 0,
        // Add additional metadata
        clientEmail: auth.currentUser?.email || null,
        projectManager: project.projectManager || null,
        projectType: project.type || null
      };
  
      // First update the project payment status
      const projectRef = doc(db, "dxd-magnate-projects", project.id);
      await updateDoc(projectRef, {
        paymentStatus: "paid",
        paidAmount: project.budget,
        paymentMethod: "razorpay",
        paymentDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
  
      // Then create the transaction record
      await addDoc(collection(db, "platform-transactions"), transactionData);
  
      setSuccess("Payment successful! Thank you for your payment.");
      setOutstandingProjects(prev => prev.filter(p => p.id !== project.id));
      setSelectedProject(null);
      
      // You might want to send a confirmation email here
    } catch (err) {
      console.error("Error updating records:", err);
      setError("Payment was successful but we encountered an issue updating records. Please contact support with your payment ID: " + 
        (response.razorpay_payment_id || 'N/A'));
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Payment Information
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading your payment details...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (outstandingProjects.length === 0 && !loading) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <FaCheckCircle size={24} color="#10B981" style={{ marginRight: 12 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              No Outstanding Payments
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            You don't have any pending payments at this time.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box className="space-y-6">
      {error && (
        <Alert severity="error" icon={<FiAlertCircle />} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" icon={<FaCheckCircle />} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
        Outstanding Payments
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Please review and complete your pending payments below.
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {outstandingProjects.map((project) => (
          <Card 
            key={project.id} 
            sx={{ 
              borderRadius: 2, 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #EF4444'
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <div>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {project.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {project.company}
                  </Typography>
                </div>
                <Chip 
                  label="Payment Due" 
                  color="error" 
                  size="small"
                  icon={<FiAlertCircle size={14} />}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2">Project Budget:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  ₹{parseFloat(project.budget).toLocaleString()}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2">Outstanding Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#EF4444' }}>
                  ₹{project.outstandingAmount.toLocaleString()}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="body2">Due Date:</Typography>
                <Box display="flex" alignItems="center">
                  <FiCalendar size={16} style={{ marginRight: 8, color: '#64748B' }} />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {project.dueDate ? format(project.dueDate, 'dd MMM yyyy') : 'Not specified'}
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<FiCreditCard />}
                onClick={() => initiatePayment(project)}
                disabled={paymentProcessing}
                sx={{
                  py: 1.5,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none',
                    backgroundColor: '#4338CA'
                  }
                }}
              >
                {paymentProcessing && selectedProject?.id === project.id ? (
                  'Processing...'
                ) : (
                  'Pay Now'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Information Card */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mt: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Payment Information
          </Typography>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: '#4F46E510', mr: 2 }}>
              <FiCreditCard size={20} color="#4F46E5" />
            </Avatar>
            <div>
              <Typography variant="subtitle2">Secure Payment Gateway</Typography>
              <Typography variant="body2" color="text.secondary">
                Powered by Razorpay - PCI DSS Compliant
              </Typography>
            </div>
          </Box>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar sx={{ bgcolor: '#10B98110', mr: 2 }}>
              <FaCheckCircle size={20} color="#10B981" />
            </Avatar>
            <div>
              <Typography variant="subtitle2">Instant Confirmation</Typography>
              <Typography variant="body2" color="text.secondary">
                Receive payment confirmation immediately
              </Typography>
            </div>
          </Box>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: '#F59E0B10', mr: 2 }}>
              <FaReceipt size={20} color="#F59E0B" />
            </Avatar>
            <div>
              <Typography variant="subtitle2">Automatic Receipts</Typography>
              <Typography variant="body2" color="text.secondary">
                Invoice will be generated and sent to your email
              </Typography>
            </div>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PayNow;