import React, { useEffect, useState } from "react";
import { 
  FiDollarSign, FiUsers, FiLayers, 
  FiTrendingUp, FiBarChart2, FiHome,
  FiUser, FiKey, FiShield
} from "react-icons/fi";
import { Typography, Avatar } from "@mui/material";
import { auth, db } from "../../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const DashboardCards = ({ activeSection, activeSubsection }) => {
  const [leadsCount, setLeadsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      try {
        // Fetch leads count
        const leadsQuery = query(
          collection(db, "leads"),
          where("status", "==", "closed-won")
        );
        const leadsSnapshot = await getDocs(leadsQuery);
        setLeadsCount(leadsSnapshot.size);

        // Calculate revenue from closed-won leads
        const totalRevenue = leadsSnapshot.docs.reduce((sum, doc) => {
          return sum + parseInt(doc.data().budget || 0);
        }, 0);
        setRevenue(totalRevenue);

        // Fetch projects count
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        setProjectsCount(projectsSnapshot.size);

        // Get recent activities (last 3 projects)
        const recentProjects = projectsSnapshot.docs
          .slice(0, 3)
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().createdAt // Using createdAt as timestamp
          }));
        setRecentActivities(recentProjects);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  // If a subsection is selected, show its content
  if (activeSubsection) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-3">
        <div className="text-center">
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activeSubsection} Content
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Detailed information about {activeSubsection.toLowerCase()}
          </Typography>
        </div>
      </div>
    );
  }

  // If on Dashboard section, show the dashboard cards
  if (activeSection === "Dashboard") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Financial Summary
            </Typography>
            <div className="p-2 rounded-lg bg-indigo-50">
              <FiDollarSign className="text-indigo-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            ${revenue.toLocaleString()}
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>From closed deals</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Active Projects
            </Typography>
            <div className="p-2 rounded-lg bg-blue-50">
              <FiLayers className="text-blue-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {projectsCount}
          </Typography>
          <div className="flex items-center text-sm text-blue-600">
            <span>Your current projects</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Closed Leads
            </Typography>
            <div className="p-2 rounded-lg bg-green-50">
              <FiUsers className="text-green-600" size={18} />
            </div>
          </div>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {leadsCount}
          </Typography>
          <div className="flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>Successful conversions</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Recent Projects
            </Typography>
            <div className="p-2 rounded-lg bg-purple-50">
              <FiBarChart2 className="text-purple-600" size={18} />
            </div>
          </div>
          <div className="space-y-4">
            {recentActivities.map((project, index) => (
              <div key={project.id} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', mr: 2 }}>
                  {index + 1}
                </Avatar>
                <div>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {project.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 col-span-1 md:col-span-3">
      {activeSubsection ? (
        // Content for specific subsections
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            {activeSubsection === "Admin & Team Roles" ? (
              <FiShield className="text-indigo-600" size={20} />
            ) : activeSubsection === "Permissions & Access" ? (
              <FiKey className="text-indigo-600" size={20} />
            ) : (
              <FiUser className="text-indigo-600" size={20} />
            )}
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activeSubsection}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {activeSubsection === "Admin & Team Roles"
              ? "Manage administrator and team member roles and permissions"
              : `Detailed information about ${activeSubsection.toLowerCase()}`}
          </Typography>
        </div>
      ) : (
        // Default content for main sections
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
            <FiHome className="text-indigo-600" size={20} />
          </div>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            {activeSection}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Select a subsection from the sidebar to view detailed information
          </Typography>
        </div>
      )}
    </div>
  );
};

export default DashboardCards;