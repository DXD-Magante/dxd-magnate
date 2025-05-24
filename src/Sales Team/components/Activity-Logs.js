import React, { useState, useEffect } from "react";
import { 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Typography, 
  Avatar, Divider, Chip, CircularProgress,
  Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper
} from "@mui/material";
import { 
  FiActivity, FiClock, FiUser, 
  FiMail, FiGlobe, FiAlertCircle,
  FiCheckCircle, FiRefreshCw, FiX
} from "react-icons/fi";
import { auth, db } from "../../services/firebase";
import { collection, query, orderBy, getDocs, onSnapshot, where } from "firebase/firestore";
import { format } from "date-fns";

const ActivityLogModal = ({ open, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = query(
        collection(db, 'Activity-logs'),
        where("userId", "==", auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const activityData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      setActivities(activityData);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchActivities();
      
      // Set up real-time listener
      const q = query(
        collection(db, 'Activity-logs'),
        orderBy('timestamp', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const activityData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        setActivities(activityData);
      });
      
      return () => unsubscribe();
    }
  }, [open]);

  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <FiCheckCircle className="text-green-500" />;
      case 'logout':
        return <FiX className="text-red-500" />;
      default:
        return <FiActivity className="text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return format(timestamp, "PPpp");
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiActivity size={24} />
            <Typography variant="h6" className="font-bold">
              Activity Logs
            </Typography>
          </div>
          <Chip 
            label={`${activities.length} entries`}
            size="small"
            className="bg-white text-indigo-600 font-medium"
          />
        </div>
      </DialogTitle>
      
      <DialogContent className="p-0 bg-gray-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CircularProgress size={48} className="text-indigo-500 mb-4" />
            <Typography variant="body2" className="text-gray-500">
              Loading activity logs...
            </Typography>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <FiAlertCircle size={48} className="text-red-500 mb-4" />
            <Typography variant="body2" className="text-gray-700 mb-2">
              {error}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FiRefreshCw />}
              onClick={fetchActivities}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FiActivity size={48} className="text-gray-400 mb-4" />
            <Typography variant="body2" className="text-gray-500">
              No activity logs found
            </Typography>
          </div>
        ) : (
          <TableContainer component={Paper} elevation={0} className="border-0">
            <Table className="min-w-full">
              <TableHead className="bg-gray-100">
                <TableRow>
                  <TableCell className="font-bold text-gray-700">Action</TableCell>
                  <TableCell className="font-bold text-gray-700">User</TableCell>
                  <TableCell className="font-bold text-gray-700">Details</TableCell>
                  <TableCell className="font-bold text-gray-700">IP Address</TableCell>
                  <TableCell className="font-bold text-gray-700">Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow 
                    key={activity.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(activity.action)}
                        <span className="capitalize font-medium">
                          {activity.action}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 bg-blue-100 text-blue-600">
                          <FiUser size={16} />
                        </Avatar>
                        <div>
                          <Typography variant="body2" className="font-medium">
                            {activity.email}
                          </Typography>
                          <Typography variant="caption" className="text-gray-500">
                            ID: {activity.userId.substring(0, 8)}...
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {activity.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={activity.ip}
                        size="small"
                        icon={<FiGlobe size={14} className="mr-1" />}
                        className="bg-gray-100 text-gray-800"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <FiClock size={14} />
                        <Typography variant="body2">
                          {formatTimestamp(activity.timestamp)}
                        </Typography>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions className="bg-gray-50 border-t border-gray-200 px-6 py-3">
        <div className="flex justify-between items-center w-full">
          <Typography variant="caption" className="text-gray-500">
            Last updated: {format(new Date(), "PPpp")}
          </Typography>
          <div className="space-x-2">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FiRefreshCw />}
              onClick={fetchActivities}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default ActivityLogModal;