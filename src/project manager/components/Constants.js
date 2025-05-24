// constants.js
import { FaRegDotCircle, FaRegClock, FaCheckCircle } from "react-icons/fa";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";

export const statusStyles = {
  "Not started yet": { color: "#64748b", icon: <FaRegDotCircle /> },
  "In progress": { color: "#3b82f6", icon: <FaRegClock /> },
  "On hold": { color: "#f59e0b", icon: <FiAlertTriangle /> },
  "Completed": { color: "#10b981", icon: <FaCheckCircle /> },
  "Cancelled": { color: "#ef4444", icon: <FiTrash2 /> }
};

export const priorityStyles = {
  "low": { color: "#10b981", bgcolor: "#ecfdf5" },
  "medium": { color: "#f59e0b", bgcolor: "#fffbeb" },
  "high": { color: "#ef4444", bgcolor: "#fef2f2" }
};