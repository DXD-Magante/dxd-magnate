import React, { useState, useEffect } from 'react';
import { Box, Grid, Snackbar, CircularProgress, Typography, Alert, } from '@mui/material';
import { doc, getDoc, collection, query, where, getDocs, arrayUnion, arrayRemove, updateDoc, serverTimestamp, setDoc, } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

// Import sections
import ProfileHeader from './sections/ProfileHeader';
import KeyMetrics from './sections/KeyMetrics';
import CurrentProjects from './sections/CurrentProjects';
import TeamManagement from './sections/TeamManagement';
import SkillsExpertise from './sections/SkillsExpertise';
import RecentActivity from './sections/RecentActivity';
import FeedbackRecognition from './sections/FeedbackRecognition';
import EditProfileDialog from './sections/EditProfileDialog';
import ReassignDialog from './sections/ReassignDialog';
import { auth, db } from '../../../services/firebase';

const ProjectManagerProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tempData, setTempData] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState(null);
  const [teamWorkloads, setTeamWorkloads] = useState({});
  const [refreshingTeam, setRefreshingTeam] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedMemberToReassign, setSelectedMemberToReassign] = useState(null);
  const [newProjectForMember, setNewProjectForMember] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [ratings, setRatings] = useState([]);
const [ratingsLoading, setRatingsLoading] = useState(true);
const [sortOption, setSortOption] = useState('recent');
const [filteredRatings, setFilteredRatings] = useState([]);
const [projectFilter, setProjectFilter] = useState('all');
  const [stats, setStats] = useState([
    { title: "Total Projects Managed", value: 0, icon: "FiFolder" },
    { title: "Milestones Completed", value: 0, icon: "FiCheckCircle", color: "#f59e0b" },
    { title: "Current Team Size", value: 0, icon: "FiUsers" },
    { title: "Completion Rate", value: "0%", icon: "FiTrendingUp" }
  ]);

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
    const fetchStats = async () => {
      try {
        const userId = auth.currentUser.uid;
        
        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", userId)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const totalProjects = projectsSnapshot.size;
        
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
        
        const allTeamMembers = new Set();
        projectsSnapshot.forEach(projectDoc => {
          const projectData = projectDoc.data();
          if (projectData.teamMembers) {
            projectData.teamMembers.forEach(member => {
              allTeamMembers.add(member.id);
            });
          }
        });
        
        const completedProjects = projectsSnapshot.docs.filter(doc => 
          doc.data().status === "Completed"
        ).length;
        const completionRate = totalProjects > 0 
          ? Math.round((completedProjects / totalProjects) * 100) 
          : 0;
        
        setStats([
          { title: "Total Projects Managed", value: totalProjects, icon: "FiFolder" },
          { 
            title: "Milestones Completed", 
            value: completedMilestones, 
            icon: "FiCheckCircle",
            color: "#f59e0b"
          },
          { title: "Current Team Size", value: allTeamMembers.size, icon: "FiUsers" },
          { 
            title: "Completion Rate", 
            value: `${completionRate}%`, 
            icon: "FiTrendingUp" 
          }
        ]);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, [projects]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
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

        const projectsQuery = query(
          collection(db, "dxd-magnate-projects"),
          where("projectManagerId", "==", auth.currentUser.uid)
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const projectsData = await Promise.all(projectsSnapshot.docs.map(async (doc) => {
          const project = { id: doc.id, ...doc.data() };
          
          try {
            const tasksQuery = query(
              collection(db, "project-tasks"),
              where("projectId", "==", project.id)
            );
            const tasksSnapshot = await getDocs(tasksQuery);
            const tasks = tasksSnapshot.docs.map(taskDoc => taskDoc.data());
            
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
        
        const mockActivities = [
          { id: 1, type: "Completed Milestonesss", description: "Prototype Finalization", date: "Feb 10, 2025", project: "Website Redesign" },
          { id: 2, type: "Updated Status", description: "Marked Project X as Completed", date: "Feb 5, 2025", project: "Mobile App" },
          { id: 3, type: "Assigned Task", description: "UI Revamp for Project Y", date: "Feb 3, 2025", project: "Dashboard UI" },
          { id: 4, type: "Team Meeting", description: "Sprint Planning Session", date: "Jan 28, 2025", project: "All Projects" }
        ];
        setActivities(mockActivities);

      } catch (err) {
        console.error("Error fetching profile data:", err);
        setSnackbarMessage(err.message);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [username]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!currentUser) return; // Don't fetch if no user
      
      try {
        setRatingsLoading(true);
        const ratingsQuery = query(
          collection(db, "projectManagerRatings"),
          where("managerId", "==", currentUser.uid)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratingsData = ratingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate() || new Date()
        }));
        
        setRatings(ratingsData);
        setFilteredRatings(ratingsData);
      } catch (error) {
        console.error("Error fetching ratings:", error);
        setSnackbarMessage("Failed to load feedback");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setRatingsLoading(false);
      }
    };
  
    fetchRatings();
  }, [currentUser]);
  
  // Add this useEffect for sorting/filtering
  useEffect(() => {
    let result = [...ratings];
    
    // Apply project filter
    if (projectFilter !== 'all') {
      result = result.filter(rating => rating.projectId === projectFilter);
    }
    
    // Apply sort
    switch (sortOption) {
      case 'recent':
        result.sort((a, b) => b.submittedAt - a.submittedAt);
        break;
      case 'oldest':
        result.sort((a, b) => a.submittedAt - b.submittedAt);
        break;
      case 'highest':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        result.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }
    
    setFilteredRatings(result);
  }, [sortOption, projectFilter, ratings]);
  
  // Calculate average rating
  const averageRating = ratings.length > 0 
    ? (ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length)
    : 0;
  

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

  const handleEditOpen = () => setEditOpen(true);
  const handleEditClose = () => {
    setEditOpen(false);
    setTempData(profileData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const handleSnackbarClose = () => setSnackbarOpen(false);

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

  const handleReassignMember = async () => {
    if (!selectedMemberToReassign || !newProjectForMember) return;
    
    try {
      const currentProjectRef = doc(db, 'dxd-magnate-projects', selectedProjectForTeam.id);
      const currentProjectSnap = await getDoc(currentProjectRef);
      const currentProjectData = currentProjectSnap.data();
      
      const updatedCurrentTeam = currentProjectData.teamMembers.filter(
        member => member.id !== selectedMemberToReassign.id
      );
      
      await updateDoc(currentProjectRef, {
        teamMembers: updatedCurrentTeam
      });
      
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
      <ProfileHeader 
        profileData={profileData} 
        currentUser={currentUser} 
        handleEditOpen={handleEditOpen} 
        averageRating = {averageRating}
      />
      
      <KeyMetrics stats={stats} />
      
      <Grid>
        <Grid item xs={12} md={8}>
          <CurrentProjects projects={projects} />
          <TeamManagement 
            projects={projects}
            selectedProjectForTeam={selectedProjectForTeam}
            setSelectedProjectForTeam={setSelectedProjectForTeam}
            teamWorkloads={teamWorkloads}
            refreshingTeam={refreshingTeam}
            handleRemoveMember={handleRemoveMember}
            setSelectedMemberToReassign={setSelectedMemberToReassign}
            setReassignDialogOpen={setReassignDialogOpen}
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <SkillsExpertise 
            skills={skills}
            skillsLoading={skillsLoading}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            addSkillOpen={addSkillOpen}
            setAddSkillOpen={setAddSkillOpen}
            handleAddSkill={handleAddSkill}
            handleRemoveSkill={handleRemoveSkill}
          />
          <RecentActivity activities={activities} />
          <FeedbackRecognition 
  ratings={filteredRatings} 
  ratingsLoading={ratingsLoading}
  averageRating={averageRating}
  projects={projects}
  sortOption={sortOption}
  setSortOption={setSortOption}
  projectFilter={projectFilter}
  setProjectFilter={setProjectFilter}
/>
        </Grid>
      </Grid>

      <EditProfileDialog 
        editOpen={editOpen}
        handleEditClose={handleEditClose}
        tempData={tempData}
        handleInputChange={handleInputChange}
        handleSave={handleSave}
      />
      
      <ReassignDialog 
        reassignDialogOpen={reassignDialogOpen}
        setReassignDialogOpen={setReassignDialogOpen}
        selectedMemberToReassign={selectedMemberToReassign}
        newProjectForMember={newProjectForMember}
        setNewProjectForMember={setNewProjectForMember}
        projects={projects}
        selectedProjectForTeam={selectedProjectForTeam}
        handleReassignMember={handleReassignMember}
      />
      
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
    </Box>
  );
};

export default ProjectManagerProfile;