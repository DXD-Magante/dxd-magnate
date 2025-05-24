import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Avatar, Button, Card, CardContent, 
  Grid, Divider, Chip, List, ListItem, ListItemText, 
  ListItemAvatar, Paper, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Snackbar, Alert, Tabs, Tab,
  Badge, IconButton, Collapse, LinearProgress, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Switch,
  CircularProgress, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow
} from '@mui/material';
import { 
  FiEdit2, FiMail, FiPhone, FiUser, FiCalendar, 
  FiUsers, FiBarChart2, FiFileText, FiFolder, 
  FiShield, FiMessageSquare, FiBell, FiCheckCircle,
  FiXCircle, FiChevronDown, FiChevronUp, FiLock,
  FiActivity, FiRefreshCw, FiDownload, FiSettings,
  FiPlus, FiTrendingUp, FiPieChart, FiAward, FiHome,
  FiStar, FiClock, FiCheck, FiX, FiUpload, FiEye, FiUserPlus
} from 'react-icons/fi';
import { auth, db } from '../../services/firebase';
import { doc, getDoc, collection, query, where, getDocs, arrayUnion, arrayRemove, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { FaTools } from 'react-icons/fa';

const ProjectManagerProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tempData, setTempData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeTab, setActiveTab] = useState(0);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [tasks, setTasks] = useState({});
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);
const [teamWorkloads, setTeamWorkloads] = useState({});
const [refreshingTeam, setRefreshingTeam] = useState(false);
const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
const [selectedMemberToReassign, setSelectedMemberToReassign] = useState(null);
const [newProjectForMember, setNewProjectForMember] = useState(null);
const [selectedProject, setSelectedProject] = useState(null);
const [openTeamDialog, setOpenTeamDialog] = useState(false);
const [currentUser, setCurrentUser] = useState(null); 


  // Mock data - in a real app, this would come from your database
   const [stats, setStats] = useState([
     { title: "Total Projects Managed", value: 0, icon: <FiFolder size={24} /> },
     { title: "Milestones Completed", value: 0, icon: <FiCheckCircle size={24} />, color: "#f59e0b" },
     { title: "Current Team Size", value: 0, icon: <FiUsers size={24} /> },
     { title: "Completion Rate", value: "0%", icon: <FiTrendingUp size={24} /> }
   ]);
 
 
   useEffect(() => {
     const fetchStats = async () => {
       try {
         const userId = auth.currentUser.uid;
         
         // 1. Total Projects Managed
         const projectsQuery = query(
           collection(db, "dxd-magnate-projects"),
           where("projectManagerId", "==", userId)
         );
         const projectsSnapshot = await getDocs(projectsQuery);
         const totalProjects = projectsSnapshot.size;
         
         // 2. Milestones Completed
         const milestonesQuery = query(
           collection(db, "project-timeline"),
           where("type", "==", "milestone"),
           where("status", "==", "completed"),
           where("participants", "array-contains", {
             id: userId,
             type: "pm"
           })
         );
         const milestonesSnapshot = await getDocs(milestonesQuery);
         const completedMilestones = milestonesSnapshot.size;
         
         // 3. Current Team Size (unique team members across all projects)
         const allTeamMembers = new Set();
         projectsSnapshot.forEach(projectDoc => {
           const projectData = projectDoc.data();
           if (projectData.teamMembers) {
             projectData.teamMembers.forEach(member => {
               allTeamMembers.add(member.id);
             });
           }
         });
         
         // 4. Completion Rate
         const completedProjects = projectsSnapshot.docs.filter(doc => 
           doc.data().status === "Completed"
         ).length;
         const completionRate = totalProjects > 0 
           ? Math.round((completedProjects / totalProjects) * 100) 
           : 0;
         
         setStats([
           { title: "Total Projects Managed", value: totalProjects, icon: <FiFolder size={24} /> },
           { 
             title: "Milestones Completed", 
             value: completedMilestones, 
             icon: <FiCheckCircle size={24} />,
             color: "#f59e0b"
           },
           { title: "Current Team Size", value: allTeamMembers.size, icon: <FiUsers size={24} /> },
           { 
             title: "Completion Rate", 
             value: `${completionRate}% `, 
             icon: <FiTrendingUp size={24} /> 
           }
         ]);
         
       } catch (error) {
         console.error("Error fetching stats:", error);
       }
     };
     
     fetchStats();
   }, [projects]);

 

  const feedback = [
    {
      quote: "John ensured timely delivery and excellent communication throughout the project.",
      client: "TechCorp Inc.",
      date: "Feb 15, 2025"
    },
    {
      quote: "Exceptional project management skills that kept everything on track despite challenges.",
      client: "Innovate Solutions",
      date: "Jan 10, 2025"
    }
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);


  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to get user by username
        if (username) {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", username));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            setProfileData(doc.data());
            setTempData(doc.data());
          } else {
            throw new Error("User not found");
          }
        } else {
          // Fallback to current auth user if no username in params
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setProfileData(userSnap.data());
              setTempData(userSnap.data());
            } else {
              throw new Error("User data not found");
            }
          } else {
            throw new Error("Not authenticated");
          }
        }

        // Fetch projects managed by this project manager
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", auth.currentUser.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        
        // Fetch tasks for each project and calculate progress
        const projectsData = await Promise.all(projectsSnapshot.docs.map(async (doc) => {
          const project = { id: doc.id, ...doc.data() };
          
          // Fetch tasks for this project
          try {
            const tasksQuery = query(
              collection(db, "project-tasks"),
              where("projectId", "==", project.id)
            );
            const tasksSnapshot = await getDocs(tasksQuery);
            const tasks = tasksSnapshot.docs.map(taskDoc => taskDoc.data());
            
            // Calculate progress
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.status === 'Done').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            return {
              ...project,
              progress,
              totalTasks,
              completedTasks
            };
          } catch (taskError) {
            console.error(`Error fetching tasks for project ${project.id}:`, taskError);
            return {
              ...project,
              progress: 0,
              totalTasks: 0,
              completedTasks: 0
            };
          }
        }));
        
        setProjects(projectsData);
          
         

   

        // Fetch activities (mock data in this example)
        const mockActivities = [
          { id: 1, type: "Completed Milestone", description: "Prototype Finalization", date: "Feb 10, 2025", project: "Website Redesign" },
          { id: 2, type: "Updated Status", description: "Marked Project X as Completed", date: "Feb 5, 2025", project: "Mobile App" },
          { id: 3, type: "Assigned Task", description: "UI Revamp for Project Y", date: "Feb 3, 2025", project: "Dashboard UI" },
          { id: 4, type: "Team Meeting", description: "Sprint Planning Session", date: "Jan 28, 2025", project: "All Projects" }
        ];
        setActivities(mockActivities);

      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err.message);
        setSnackbarMessage(err.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  const handleEditOpen = () => {
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setTempData(profileData);
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedProjectForTeam || !memberId) return;
  
    try {
      const confirmRemove = window.confirm(
        `Are you sure you want to remove this team member from ${selectedProjectForTeam.title}?`
      );
      if (!confirmRemove) return;
  
      const projectRef = doc(db, 'dxd-magnate-projects', selectedProjectForTeam.id);
      const projectSnap = await getDoc(projectRef);
      const projectData = projectSnap.data();
  
      const updatedTeam = projectData.teamMembers.filter(
        member => member.id !== memberId
      );
  
      await updateDoc(projectRef, {
        teamMembers: updatedTeam
      });
  
      // Update activities
      const memberToRemove = projectData.teamMembers.find(m => m.id === memberId);
      if (memberToRemove) {
        await setDoc(doc(collection(db, 'project-activities')), {
          actionType: "member_removed",
          message: `${memberToRemove.name} removed from project ${selectedProjectForTeam.title}`,
          projectId: selectedProjectForTeam.id,
          projectName: selectedProjectForTeam.title,
          timestamp: serverTimestamp(),
          type: "team",
          userFullName: memberToRemove.name,
          userId: memberId
        });
  
        await setDoc(doc(collection(db, 'collaborator-notifications')), {
          userId: memberId,
          message: `You've been removed from project: ${selectedProjectForTeam.title}`,
          type: "project_removal",
          read: false,
          timestamp: serverTimestamp()
        });
      }
  
      // Update local state
      setSelectedProjectForTeam(prev => ({
        ...prev,
        teamMembers: updatedTeam
      }));
  
      setProjects(prev => prev.map(project => {
        if (project.id === selectedProjectForTeam.id) {
          return {
            ...project,
            teamMembers: updatedTeam
          };
        }
        return project;
      }));
  
      setSnackbarMessage("Team member removed successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error removing team member:", error);
      setSnackbarMessage("Failed to remove team member");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  useEffect(() => {
    const fetchSkills = async () => {
      if (!profileData) return;
      
      try {
        setSkillsLoading(true);
        const userRef = doc(db, "users", profileData.uid || auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setSkills(userSnap.data().skills || []);
        }
      } catch (err) {
        console.error("Error fetching skills:", err);
        setSnackbarMessage("Failed to load skills");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setSkillsLoading(false);
      }
    };
  
    fetchSkills();
  }, [profileData]);


  useEffect(() => {
    const calculateWorkloads = async () => {
      if (!selectedProjectForTeam) return;
      
      try {
        setRefreshingTeam(true);
        
        // Fetch tasks for the selected project
        const tasksQuery = query(
          collection(db, "project-tasks"),
          where("projectId", "==", selectedProjectForTeam.id)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasks = tasksSnapshot.docs.map(doc => doc.data());
        
        // Calculate workload for each team member
        const workloads = {};
        const priorityWeights = {
          'Low': 1,
          'Medium': 2,
          'High': 3,
          'Critical': 5
        };
        
        // Initialize all team members with 0 workload
        selectedProjectForTeam.teamMembers?.forEach(member => {
          workloads[member.id] = {
            total: 0,
            completed: 0,
            pending: 0,
            status: 'Available'
          };
        });
        
        // Calculate workload based on tasks
        tasks.forEach(task => {
          if (task.assignee?.id) {
            const weight = priorityWeights[task.priority] || 1;
            if (workloads[task.assignee.id]) {
              workloads[task.assignee.id].total += weight;
              if (task.status === 'Done') {
                workloads[task.assignee.id].completed += weight;
              } else {
                workloads[task.assignee.id].pending += weight;
              }
            }
          }
        });
        
        // Determine status based on workload
        Object.keys(workloads).forEach(memberId => {
          const memberWorkload = workloads[memberId];
          const completionRatio = memberWorkload.total > 0 ? 
            memberWorkload.completed / memberWorkload.total : 0;
          
          if (memberWorkload.pending >= 15) {
            memberWorkload.status = 'Overloaded';
          } else if (memberWorkload.pending >= 10) {
            memberWorkload.status = 'Busy';
          } else if (memberWorkload.pending >= 5) {
            memberWorkload.status = 'Moderate';
          } else if (completionRatio < 0.5 && memberWorkload.total > 0) {
            memberWorkload.status = 'Behind';
          } else {
            memberWorkload.status = 'Available';
          }
        });
        
        setTeamWorkloads(workloads);
      } catch (error) {
        console.error("Error calculating workloads:", error);
      } finally {
        setRefreshingTeam(false);
      }
    };
    
    calculateWorkloads();
  }, [selectedProjectForTeam]);

   // Add these handler functions
   const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
  
    try {
      setSkillsLoading(true);
      const userRef = doc(db, "users", profileData.uid || auth.currentUser.uid);
      
      await updateDoc(userRef, {
        skills: arrayUnion(newSkill.trim())
      });
  
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      setAddSkillOpen(false);
      setSnackbarMessage("Skill added successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error adding skill:", err);
      setSnackbarMessage("Failed to add skill");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSkillsLoading(false);
    }
  };
  
  const handleRemoveSkill = async (skillToRemove) => {
    try {
      setSkillsLoading(true);
      const userRef = doc(db, "users", profileData.uid || auth.currentUser.uid);
      
      await updateDoc(userRef, {
        skills: arrayRemove(skillToRemove)
      });
  
      setSkills(prev => prev.filter(skill => skill !== skillToRemove));
      setSnackbarMessage("Skill removed successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error removing skill:", err);
      setSnackbarMessage("Failed to remove skill");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // In a real app, you would update the data in Firestore here
      setProfileData(tempData);
      setEditOpen(false);
      setSnackbarMessage("Profile updated successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbarMessage("Failed to update profile");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleSecuritySection = () => {
    setSecurityOpen(!securityOpen);
  };

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    setSnackbarMessage(`Two-factor authentication ${!twoFactorEnabled ? "enabled" : "disabled"}`);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleReassignMember = async () => {
    if (!selectedMemberToReassign || !newProjectForMember) return;
    
    try {
      // Remove from current project
      const currentProjectRef = doc(db, 'dxd-magnate-projects', selectedProjectForTeam.id);
      const currentProjectSnap = await getDoc(currentProjectRef);
      const currentProjectData = currentProjectSnap.data();
      
      const updatedCurrentTeam = currentProjectData.teamMembers.filter(
        member => member.id !== selectedMemberToReassign.id
      );
      
      await updateDoc(currentProjectRef, {
        teamMembers: updatedCurrentTeam
      });
      
      // Add to new project
      const newProjectRef = doc(db, 'dxd-magnate-projects', newProjectForMember.id);
      const newProjectSnap = await getDoc(newProjectRef);
      const newProjectData = newProjectSnap.data();
      
      const updatedNewTeam = [
        ...(newProjectData.teamMembers || []),
        {
          ...selectedMemberToReassign,
          projectRole: selectedMemberToReassign.projectRole || 'Team Member'
        }
      ];
      
      await updateDoc(newProjectRef, {
        teamMembers: updatedNewTeam
      });
      
      // Update activities
      await setDoc(doc(collection(db, 'project-activities')), {
        actionType: "member_reassigned",
        message: `Team member ${selectedMemberToReassign.name} reassigned from ${selectedProjectForTeam.title} to ${newProjectForMember.title}`,
        projectId: selectedProjectForTeam.id,
        projectName: selectedProjectForTeam.title,
        timestamp: serverTimestamp(),
        type: "team",
        userFullName: selectedMemberToReassign.name,
        userId: selectedMemberToReassign.id
      });
      
      await setDoc(doc(collection(db, 'collaborator-notifications')), {
        userId: selectedMemberToReassign.id,
        projectId: newProjectForMember.id,
        projectName: newProjectForMember.title,
        message: `You've been reassigned to project: ${newProjectForMember.title}`,
        type: "project_reassignment",
        read: false,
        timestamp: serverTimestamp()
      });
      
      // Update local state
      setSelectedProjectForTeam(prev => ({
        ...prev,
        teamMembers: updatedCurrentTeam
      }));
      
      setProjects(prev => prev.map(project => {
        if (project.id === newProjectForMember.id) {
          return {
            ...project,
            teamMembers: updatedNewTeam
          };
        }
        return project;
      }));
      
      setSnackbarMessage("Team member reassigned successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setReassignDialogOpen(false);
    } catch (error) {
      console.error("Error reassigning team member:", error);
      setSnackbarMessage("Failed to reassign team member");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <Typography>No profile data found</Typography>
      </Box>
    );
  }

  return (
    <Box className="bg-gray-50 min-h-screen p-6 max-w-7xl mx-auto" sx={{ marginTop: '60px' }}>
      {/* Header Section */}
      <Box className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <Box className="flex items-center space-x-4 mb-4 md:mb-0">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton size="small" color="primary" component="label">
                <FiEdit2 size={12} />
                <input type="file" hidden />
              </IconButton>
            }
          >
            <Avatar
              alt={`${profileData.firstName} ${profileData.lastName}`}
              src={profileData.photoURL}
              sx={{ width: 100, height: 100 }}
              className="shadow-lg ring-2 ring-white"
            />
          </Badge>
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <Box className="flex items-center space-x-2 mt-1">
              <Typography variant="subtitle1" className="text-gray-600">
                Project Manager
              </Typography>
              <Chip
                label="Active"
                color="success"
                size="small"
                icon={<FiCheckCircle size={14} />}
                className="text-xs"
              />
            </Box>
            <Box className="flex space-x-2 mt-2">
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="mr-1" />
                <span>{profileData.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiPhone className="mr-1" />
                <span>{profileData.phone || "Not provided"}</span>
              </div>
            </Box>
          </Box>
        </Box>
        <Box className="flex space-x-3">
          <Button
            variant="contained"
            startIcon={<FiDownload />}
            className="bg-gray-800 hover:bg-gray-700"
          >
            Export Data
          </Button>
          {currentUser && currentUser.uid === profileData?.uid && (
            <Button
              variant="contained"
              startIcon={<FiEdit2 />}
              onClick={handleEditOpen}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Edit Profile
            </Button>
          )}
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} className="mb-6">
      {stats.map((stat, index) => (
  <Grid item xs={12} sm={6} md={3} key={index}>
    <Paper sx={{ 
      p: 3, 
      borderRadius: 2, 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      height: '100%'
    }}>
      <div className="flex justify-between items-start">
        <div>
          <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1 }}>
            {stat.title}
          </Typography>
          <Typography variant="h4" className="font-bold">
            {stat.value}
          </Typography>
        </div>
        <div 
          className="p-2 rounded-lg" 
          style={{ 
            backgroundColor: stat.color ? `${stat.color}20` : '#e0e7ff',
            color: stat.color || '#6366f1'
          }}
        >
          {stat.icon}
        </div>
      </div>
    </Paper>
  </Grid>
))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Current Projects */}
          <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-4">
                <Typography variant="h6" className="font-bold text-gray-800">
                  Current Projects
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<FiPlus />}
                  size="small"
                  className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  New Project
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Project</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Timeline</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.filter(p => p.status !== "Completed").map((project) => (
                      <TableRow key={project.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" className="font-bold">
                            {project.title}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            {project.clientName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.status}
                            size="small"
                            sx={{
                              backgroundColor: project.status === "In Progress" ? '#e0f2fe' : 
                                              project.status === "On Hold" ? '#fef3c7' : '#dcfce7',
                              color: project.status === "In Progress" ? '#0369a1' : 
                                     project.status === "On Hold" ? '#92400e' : '#166534'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`${project.completedTasks || 0} completed, ${(project.totalTasks || 0) - (project.completedTasks || 0)} remaining`}>
                            <Box className="flex items-center">
                              <LinearProgress
                                variant="determinate"
                                value={project.progress || 0}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  width: '80%',
                                  mr: 1,
                                  backgroundColor: '#e2e8f0',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    backgroundColor: project.progress >= 80 ? '#10B981' : 
                                                   project.progress >= 50 ? '#F59E0B' : '#EF4444'
                                  }
                                }}
                              />
                              <Typography variant="caption">
                                {project.progress || 0}% ({project.completedTasks}/{project.totalTasks})
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            to {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                              <Avatar 
                                key={i}
                                sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                                className="border-2 border-white"
                              >
                                {i === 1 ? 'JS' : i === 2 ? 'MJ' : 'SW'}
                              </Avatar>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <FiEye className="text-gray-600" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card className="shadow-lg rounded-xl border border-gray-200">
  <CardContent className="p-6">
    <Box className="flex justify-between items-center mb-4">
      <Typography variant="h6" className="font-bold text-gray-800">
        Team Management
      </Typography>
      <Box className="flex items-center gap-2">
        <IconButton 
          size="small" 
          onClick={() => setSelectedProjectForTeam(selectedProjectForTeam)}
          disabled={refreshingTeam}
        >
          <FiRefreshCw className={refreshingTeam ? "animate-spin" : ""} />
        </IconButton>
        <Select
          value={selectedProjectForTeam?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value);
            setSelectedProjectForTeam(project);
          }}
          displayEmpty
          size="small"
          sx={{
            minWidth: 200,
            backgroundColor: 'white',
            '& .MuiSelect-select': {
              py: 0.8
            }
          }}
          IconComponent={FiChevronDown}
        >
          <MenuItem value="" disabled>
            Select a project
          </MenuItem>
          {projects.map(project => (
            <MenuItem key={project.id} value={project.id}>
              {project.title}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="contained"
          startIcon={<FiPlus />}
          size="small"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            if (selectedProjectForTeam) {
              // Open team management dialog for the selected project
              setSelectedProject(selectedProjectForTeam);
              setOpenTeamDialog(true);
            }
          }}
          disabled={!selectedProjectForTeam}
        >
          Manage Team
        </Button>
      </Box>
    </Box>
    
    {!selectedProjectForTeam ? (
      <Box className="text-center py-6">
        <Typography variant="body2" className="text-gray-500">
          Select a project to view team members
        </Typography>
      </Box>
    ) : selectedProjectForTeam.teamMembers?.length === 0 ? (
      <Box className="text-center py-6">
        <Typography variant="body2" className="text-gray-500">
          No team members assigned to this project
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FiUserPlus />}
          className="mt-3 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          onClick={() => {
            setSelectedProject(selectedProjectForTeam);
            setOpenTeamDialog(true);
          }}
        >
          Add Team Members
        </Button>
      </Box>
    ) : (
      <Grid container spacing={2}>
        {selectedProjectForTeam.teamMembers?.map((member) => {
          const workload = teamWorkloads[member.id] || { 
            total: 0, 
            completed: 0, 
            pending: 0, 
            status: 'Available' 
          };
          const progress = workload.total > 0 ? 
            Math.round((workload.completed / workload.total) * 100) : 0;
          
          const statusColor = {
            'Available': 'success',
            'Moderate': 'info',
            'Busy': 'warning',
            'Overloaded': 'error',
            'Behind': 'error'
          }[workload.status] || 'default';
          
          return (
            <Grid item xs={12} sm={6} key={member.id}>
              <Paper className="p-4 rounded-lg hover:shadow-md transition-shadow">
                <Box className="flex items-start space-x-3">
                  <Avatar
                    sx={{ width: 48, height: 48 }}
                    className="bg-indigo-100 text-indigo-600"
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box className="flex-1">
                    <Typography variant="subtitle1" className="font-bold">
                      {member.name}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600 mb-2">
                      {member.role} • {member.projectRole || 'No role'}
                    </Typography>
                    <Box className="flex items-center justify-between">
                      <Chip
                        label={workload.status}
                        size="small"
                        color={statusColor}
                      />
                      <Box className="text-right">
                        <Typography variant="caption" className="text-gray-600">
                          Workload: {workload.pending} pts
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            width: '80px',
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: progress >= 80 ? '#10b981' : 
                                              progress >= 50 ? '#f59e0b' : '#ef4444'
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Box className="flex justify-end space-x-2 mt-3">
                  <Button
                    variant="outlined"
                    size="small"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      // Open reassign dialog
                      setSelectedProject(selectedProjectForTeam);
                      setSelectedMemberToReassign(member);
                      setReassignDialogOpen(true);
                    }}
                  >
                    Reassign
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    className="hover:bg-red-50"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    Remove
                  </Button>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    )}
  </CardContent>
</Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
        <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
  <CardContent className="p-6">
    <Box className="flex justify-between items-center mb-4">
      <Typography variant="h6" className="font-bold text-gray-800">
        Skills & Expertise
      </Typography>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FiPlus size={16} />}
        onClick={() => setAddSkillOpen(true)}
        sx={{
          borderColor: "#4f46e5",
          color: "#4f46e5",
          "&:hover": { backgroundColor: "#eef2ff" },
          textTransform: "none",
          borderRadius: "8px",
          padding: "6px 12px",
          fontSize: "0.875rem",
        }}
      >
        Add Skill
      </Button>
    </Box>

    {skillsLoading ? (
      <Box className="flex justify-center py-4">
        <CircularProgress size={24} color="inherit" />
      </Box>
    ) : skills.length > 0 ? (
      <Box className="flex flex-wrap gap-3">
        {skills.map((skill, index) => (
          <Chip
            key={index}
            label={skill}
            onDelete={() => handleRemoveSkill(skill)}
            sx={{
              backgroundColor: "#eef2ff",
              color: "#4f46e5",
              fontWeight: 500,
              fontSize: "0.875rem",
              padding: "4px 8px",
              borderRadius: "6px",
              "& .MuiChip-deleteIcon": {
                color: "#818cf8",
                "&:hover": { color: "#4f46e5" },
              },
              "&:hover": {
                backgroundColor: "#e0e7ff",
              },
            }}
            deleteIcon={<FiX size={16} />}
          />
        ))}
      </Box>
    ) : (
      <Box className="text-center py-6">
        <FiFileText className="mx-auto text-gray-300 mb-3" size={40} />
        <Typography variant="body2" className="text-gray-500 mb-2">
          No skills added yet
        </Typography>
        <Typography variant="caption" className="text-gray-400">
          Add your expertise to showcase your strengths
        </Typography>
      </Box>
    )}
  </CardContent>

  {/* **Enhanced Add Skill Dialog** */}
  <Dialog
    open={addSkillOpen}
    onClose={() => setAddSkillOpen(false)}
    maxWidth="xs"
    fullWidth
    PaperProps={{
      sx: {
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      },
    }}
  >
    <DialogTitle
      sx={{
        backgroundColor: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "16px 24px",
      }}
    >
      <FaTools className="text-indigo-600" />
      Add New Skill
    </DialogTitle>
    <DialogContent sx={{ padding: "24px" }}>
      <TextField
        fullWidth
        label="Skill Name"
        value={newSkill}
        onChange={(e) => setNewSkill(e.target.value)}
        variant="outlined"
        size="small"
        placeholder="e.g., Agile Methodology, React.js"
        InputProps={{
          startAdornment: (
            <FiUser className="mr-2 text-gray-400" size={18} />
          ),
          sx: {
            borderRadius: "8px",
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#e5e7eb",
            },
            "&:hover fieldset": {
              borderColor: "#a5b4fc",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#6366f1",
            },
          },
        }}
        onKeyPress={(e) => {
          if (e.key === "Enter") handleAddSkill();
        }}
      />
      <Box className="mt-3">
        <Typography variant="caption" className="text-gray-500">
          <strong>Suggestions:</strong> Project Planning, Risk Management, Team Leadership
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions
      sx={{
        padding: "16px 24px",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <Button
        onClick={() => setAddSkillOpen(false)}
        variant="text"
        sx={{
          color: "#6b7280",
          "&:hover": {
            backgroundColor: "#f3f4f6",
          },
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleAddSkill}
        variant="contained"
        disabled={!newSkill.trim() || skillsLoading}
        sx={{
          backgroundColor: "#4f46e5",
          "&:hover": { backgroundColor: "#4338ca" },
          borderRadius: "8px",
          padding: "8px 16px",
          textTransform: "none",
          fontWeight: 500,
        }}
        startIcon={
          skillsLoading ? (
            <CircularProgress size={16} color="inherit" />
          ) : null
        }
      >
        {skillsLoading ? "Adding..." : "Add Skill"}
      </Button>
    </DialogActions>
  </Dialog>
</Card>
          <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Recent Activity
              </Typography>
              
              <List className="space-y-4">
                {activities.map((activity) => (
                  <ListItem key={activity.id} className="p-0">
                    <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                      <Box className="flex items-start">
                        <Box className="mr-3 mt-1">
                          {activity.type.includes("Completed") ? (
                            <FiCheckCircle className="text-green-500" />
                          ) : activity.type.includes("Updated") ? (
                            <FiRefreshCw className="text-blue-500" />
                          ) : activity.type.includes("Assigned") ? (
                            <FiUser className="text-purple-500" />
                          ) : (
                            <FiUsers className="text-amber-500" />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body2" className="font-medium">
                            {activity.type}
                          </Typography>
                          <Typography variant="caption" className="text-gray-600">
                            {activity.description}
                          </Typography>
                          <Box className="flex items-center mt-1">
                            <Typography variant="caption" className="text-gray-500 mr-2">
                              {activity.date}
                            </Typography>
                            <Chip
                              label={activity.project}
                              size="small"
                              className="bg-gray-100 text-gray-700"
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
              
              <Button
                fullWidth
                variant="text"
                className="mt-3 text-indigo-600 hover:bg-indigo-50"
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Feedback & Recognition */}
          <Card className="shadow-lg rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <Typography variant="h6" className="font-bold text-gray-800 mb-4">
                Feedback & Recognition
              </Typography>
              
              {feedback.map((item, index) => (
                <Box key={index} className="mb-4">
                  <Box className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="text-yellow-400" />
                    ))}
                  </Box>
                  <Typography variant="body2" className="italic mb-1">
                    "{item.quote}"
                  </Typography>
                  <Box className="flex justify-between">
                    <Typography variant="caption" className="text-gray-600">
                      - {item.client}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      {item.date}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              <Divider className="my-4" />
              
              <Box>
                <Typography variant="subtitle2" className="text-gray-800 mb-2">
                  Awards & Recognition
                </Typography>
                <Box className="flex items-center space-x-2">
                  <FiAward className="text-amber-500" />
                  <Typography variant="body2">
                    Employee of the Month - January 2025
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editOpen} 
        onClose={handleEditClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle className="font-bold bg-gray-50 border-b">
          <Box className="flex items-center">
            <FiEdit2 className="mr-2 text-indigo-600" />
            Edit Profile
          </Box>
        </DialogTitle>
        <DialogContent className="py-6">
          <Grid container spacing={3}>
            <Grid item xs={12} className="text-center">
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton size="small" color="primary" component="label">
                    <FiUpload size={16} />
                    <input type="file" hidden />
                  </IconButton>
                }
              >
                <Avatar
                  src={tempData.photoURL}
                  sx={{ width: 80, height: 80, margin: '0 auto' }}
                />
              </Badge>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={tempData.firstName || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={tempData.lastName || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={tempData.email || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={tempData.phone || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={tempData.bio || ""}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className="border-t px-6 py-4">
          <Button 
            onClick={handleEditClose} 
            variant="outlined"
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>


      <Dialog 
  open={reassignDialogOpen} 
  onClose={() => setReassignDialogOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Reassign Team Member</DialogTitle>
  <DialogContent>
    <Box className="space-y-4 mt-3">
      <Typography variant="body1">
        Reassign <strong>{selectedMemberToReassign?.name}</strong> to another project
      </Typography>
      
      <Select
        fullWidth
        value={newProjectForMember?.id || ''}
        onChange={(e) => {
          const project = projects.find(p => p.id === e.target.value);
          setNewProjectForMember(project);
        }}
        displayEmpty
        sx={{ mt: 2 }}
      >
        <MenuItem value="" disabled>
          Select target project
        </MenuItem>
        {projects
          .filter(p => p.id !== selectedProjectForTeam?.id)
          .map(project => (
            <MenuItem key={project.id} value={project.id}>
              {project.title}
            </MenuItem>
          ))}
      </Select>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={() => setReassignDialogOpen(false)}
      variant="outlined"
    >
      Cancel
    </Button>
    <Button
      onClick={handleReassignMember}
      variant="contained"
      disabled={!newProjectForMember}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      Reassign
    </Button>
  </DialogActions>
</Dialog>
    </Box>

    
  );
};

export default ProjectManagerProfile;