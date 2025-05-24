import React, { useState, useEffect } from "react";
import { Box, Typography, Chip, CircularProgress } from "@mui/material";
import { FiCalendar, FiClock } from "react-icons/fi";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebase";
import { parseISO, format, isAfter, isBefore, addDays } from "date-fns";

const UpcomingMilestones = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingMilestones = async () => {
      try {
        // Get current date and date 30 days from now
        const now = new Date();
        const futureDate = addDays(now, 30);
        
        // Query for upcoming milestones in the next 30 days
        const q = query(
          collection(db, "project-timeline"),
          where("type", "==", "milestone"),
          where("status", "==", "upcoming")
        );
        
        const querySnapshot = await getDocs(q);
        const milestonesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by date (ascending)
        milestonesData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setMilestones(milestonesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching milestones:", error);
        setLoading(false);
      }
    };

    fetchUpcomingMilestones();
  }, []);

  const getDaysLeft = (dateString) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusPriority = (daysLeft) => {
    if (daysLeft <= 3) return "high";
    if (daysLeft <= 7) return "medium";
    return "low";
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'primary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (milestones.length === 0) {
    return (
      <Box py={2}>
        <Typography variant="body2" color="textSecondary" textAlign="center">
          No upcoming milestones in the next 30 days
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {milestones.map((milestone) => {
        const daysLeft = getDaysLeft(milestone.date);
        const statusPriority = getStatusPriority(daysLeft);
        
        return (
          <div key={milestone.id} className="flex items-start pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
            <div className="p-2 rounded-lg bg-indigo-50 mr-3" style={{ backgroundColor: `${milestone.color}20` }}>
              <FiCalendar className="text-indigo-600" size={18} style={{ color: milestone.color || '#8b5cf6' }} />
            </div>
            <div className="flex-1">
              <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                {milestone.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.75rem', mt: 0.5 }}>
                {milestone.project}
              </Typography>
              <div className="flex items-center mt-1">
                <FiClock className="text-gray-400 mr-1" size={14} />
                <Typography variant="caption" sx={{ color: '#64748b', mr: 2 }}>
                  {format(parseISO(milestone.date), "MMM d, yyyy")}
                </Typography>
                <Chip 
                  label={`${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`} 
                  size="small" 
                  color={getStatusColor(statusPriority)}
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </Box>
  );
};

export default UpcomingMilestones;