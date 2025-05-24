import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Avatar, Chip, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, MenuItem, Select,
  InputLabel, FormControl, Divider, Switch, 
  Drawer, Badge, IconButton, Tooltip, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, LinearProgress, FormControlLabel, CircularProgress
} from '@mui/material';
import { 
  FiSearch, FiFilter, FiEdit2, FiTrash2, 
  FiEye, FiLock, FiRefreshCw, FiClock,
  FiUserX, FiUserCheck, FiShield, FiKey,
  FiChevronDown, FiChevronRight, FiCheck,
  FiX, FiDownload, FiUpload, FiPlus
} from 'react-icons/fi';
import { 
  MdOutlineAdminPanelSettings, MdOutlinePersonOutline,
  MdOutlineSupervisorAccount, MdOutlineVerifiedUser,
  MdOutlineSecurity, MdOutlineHistory
} from 'react-icons/md';
import { auth, db } from '../../services/firebase';
import { 
  collection, getDocs, doc, updateDoc, 
  query, where, orderBy, addDoc,
  serverTimestamp,
  setDoc, deleteDoc
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const PermissionsAccess = () => {
  // State for users data
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // State for roles and permissions
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // State for edit drawer
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  
  // State for access matrix view
  const [activeTab, setActiveTab] = useState('users');
  
  // State for audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const [configureModalOpen, setConfigureModalOpen] = useState(false);
const [selectedRole, setSelectedRole] = useState(null);
  
  // State for security controls
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [securityControls, setSecurityControls] = useState({
    forceLogout: false,
    requirePasswordReset: false,
    enable2FA: false,
    accessExpiration: '',
    status: 'active'
  });

  const PermissionsAccess = [
    {
      id: "access_dashboard",
      name: "Access Dashboard",
      description: "Access to the main dashboard"
    },
    {
      id: "view_tasks",
      name: "View Tasks",
      description: "View all tasks"
    },
    {
      id: "create_edit_tasks",
      name: "Create/Edit Tasks",
      description: "Create and edit tasks"
    },
    {
      id: "assign_tasks",
      name: "Assign Tasks",
      description: "Assign tasks to team members"
    },
    {
      id: "access_performance_page",
      name: "Access Performance Page",
      description: "View performance metrics and analytics"
    },
    {
      id: "set_evaluation_weights",
      name: "Set Evaluation Weights",
      description: "Configure evaluation criteria weights"
    },
    {
      id: "view_leaderboard",
      name: "View Leaderboard",
      description: "View team leaderboard and rankings"
    },
    {
      id: "view_sales_targets",
      name: "View Sales Targets",
      description: "View sales targets and goals"
    },
    {
      id: "modify_project_settings",
      name: "Modify Project Settings",
      description: "Change project configurations"
    },
    {
      id: "access_user_management",
      name: "Access User Management",
      description: "Manage users and permissions"
    },
    {
      id: "create_projects",
      name: "Create Projects",
      description: "Create new projects"
    },
    {
      id: "view_project_progress",
      name: "View Project Progress",
      description: "View project timelines and progress"
    },
    {
      id: "access_feedback_tools",
      name: "Access Feedback Tools",
      description: "Use feedback and review tools"
    },
    {
      id: "access_billing_finance",
      name: "Access Billing/Finance",
      description: "View financial data and billing"
    },
    {
      id: "change_user_roles",
      name: "Change User Roles",
      description: "Modify user roles and permissions"
    }
  ];
  
  // Role definitions with associated permissions
  const rolesAccess = [
    {
      id: "admin",
      name: "Admin",
      permissions: [
        "access_dashboard",
        "view_tasks",
        "create_edit_tasks",
        "assign_tasks",
        "access_performance_page",
        "set_evaluation_weights",
        "view_leaderboard",
        "view_sales_targets",
        "modify_project_settings",
        "access_user_management",
        "create_projects",
        "view_project_progress",
        "access_feedback_tools",
        "access_billing_finance",
        "change_user_roles"
      ]
    },
    {
      id: "project_manager",
      name: "Project Manager",
      permissions: [
        "access_dashboard",
        "view_tasks",
        "create_edit_tasks",
        "assign_tasks",
        "access_performance_page",
        "view_leaderboard",
        "modify_project_settings",
        "create_projects",
        "view_project_progress",
        "access_feedback_tools"
      ]
    },
    {
      id: "sales_team",
      name: "Sales Team",
      permissions: [
        "access_dashboard",
        "view_tasks",
        "access_performance_page",
        "view_leaderboard",
        "view_sales_targets",
        "view_project_progress",
        "access_feedback_tools"
      ]
    },
    {
      id: "marketing_team",
      name: "Marketing Team",
      permissions: [
        "access_dashboard",
        "view_tasks",
        "access_performance_page",
        "view_leaderboard",
        "view_project_progress",
        "access_feedback_tools"
      ]
    },
    {
      id: "intern",
      name: "Intern/Collaborator",
      permissions: [
        "access_dashboard",
        "view_tasks",
        "access_performance_page",
        "view_leaderboard",
        "view_project_progress",
        "access_feedback_tools"
      ]
    },
    {
      id: "client",
      name: "Client",
      permissions: [
        "access_dashboard",
        "view_tasks",
        "view_project_progress",
        "access_feedback_tools"
      ]
    }
  ];
  
  async function initializePermissions() {
    try {
      console.log("Starting permissions initialization...");
      
      // Add permissions to Firestore
      const permissionsCollection = collection(db, 'permissions');
      for (const permission of PermissionsAccess) {
        await setDoc(doc(permissionsCollection, permission.id), {
          name: permission.name,
          description: permission.description,
          createdAt: new Date()
        });
        console.log(`Added permission: ${permission.name}`);
      }
      
      // Add roles to Firestore
      const rolesCollection = collection(db, 'roles');
      for (const role of rolesAccess) {
        await setDoc(doc(rolesCollection, role.id), {
          name: role.name,
          permissions: role.permissions,
          createdAt: new Date()
        });
        console.log(`Added role: ${role.name} with ${role.permissions.length} permissions`);
      }
      
      console.log('Successfully initialized permissions and roles!');
    } catch (error) {
      console.error('Error initializing permissions:', error);
    }
  }
  
  // Run the initialization
  initializePermissions();
  // Fetch all necessary data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersQuery = query(
          collection(db, 'users'),
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastLogin: doc.data().lastLogin?.toDate() || null
        }));
        setUsers(usersData);
        
        // Fetch roles (assuming you have a 'roles' collection)
        const rolesSnapshot = await getDocs(collection(db, 'roles'));
        const rolesData = rolesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRoles(rolesData);
        
        // Fetch permissions (assuming you have a 'permissions' collection)
        const permsSnapshot = await getDocs(collection(db, 'permissions'));
        const permsData = permsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPermissions(permsData);
        
        // Fetch audit logs
        const logsQuery = query(
          collection(db, 'permissionAuditLogs'),
        );
        const logsSnapshot = await getDocs(logsQuery);
        const logsData = logsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        setAuditLogs(logsData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingUsers(false);
        setLoadingLogs(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Get user permissions when a user is selected for editing
  useEffect(() => {
    if (selectedUser) {
      const fetchUserPermissions = async () => {
        try {
          const userPermsQuery = query(
            collection(db, 'userPermissions'),
            where('userId', '==', selectedUser.id)
          );
          const snapshot = await getDocs(userPermsQuery);
          const perms = snapshot.docs.map(doc => doc.data().permissionId);
          setUserPermissions(perms);
        } catch (error) {
          console.error('Error fetching user permissions:', error);
        }
      };
      
      fetchUserPermissions();
    }
  }, [selectedUser]);

  // Handle permission toggle
  const handlePermissionToggle = async (permissionId) => {
    try {
      const hasPermission = userPermissions.includes(permissionId);
      let newPermissions = [...userPermissions];
      
      if (hasPermission) {
        newPermissions = newPermissions.filter(id => id !== permissionId);
      } else {
        newPermissions.push(permissionId);
      }
      
      setUserPermissions(newPermissions);
      
      // Update in Firestore
      const userPermsRef = doc(db, 'userPermissions', `${selectedUser.id}_${permissionId}`);
      
      if (hasPermission) {
        await deleteDoc(userPermsRef);
      } else {
        await setDoc(userPermsRef, {
          userId: selectedUser.id,
          permissionId,
          grantedAt: serverTimestamp(),
          grantedBy: auth.currentUser.uid
        });
      }
      
      // Log the permission change
      await addDoc(collection(db, 'permissionAuditLogs'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        action: hasPermission ? 'permission_revoked' : 'permission_granted',
        permissionId,
        changedBy: auth.currentUser.uid,
        changedByEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
        details: `Permission ${hasPermission ? 'revoked' : 'granted'} for ${selectedUser.email}`
      });
      
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const fetchClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (err) {
      console.error('Error fetching IP:', err);
      return 'unknown';
    }
  };

  const logRolePermissionActivity = async (roleId, permissionId, action) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
  
      const timestamp = serverTimestamp();
      
      // Log to admin-activities collection
      await addDoc(collection(db, 'admin-activities'), {
        userId: user.uid,
        userEmail: user.email,
        activityType: 'security',
        action: `role_permission_${action}`,
        timestamp: timestamp,
        metadata: {
          roleId: roleId,
          permissionId: permissionId,
          changedBy: user.uid,
          changedByEmail: user.email
        },
        status: 'completed'
      });
      
      // Log to permissionAuditLogs collection
      await addDoc(collection(db, 'permissionAuditLogs'), {
        action: `role_permission_${action}`,
        roleId: roleId,
        permissionId: permissionId,
        changedBy: user.uid,
        changedByEmail: user.email,
        timestamp: timestamp,
        details: `Permission ${action} for role ${roleId}`,
        ipAddress: await fetchClientIP(),
        userAgent: navigator.userAgent
      });
      
    } catch (error) {
      console.error('Error logging role permission activity:', error);
    }
  };
  // Handle role change
  const handleRoleChange = async (newRole) => {
    try {
      const oldRole = selectedUser.role;
      
      // Update user role in Firestore
      await updateDoc(doc(db, 'users', selectedUser.id), {
        role: newRole
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, role: newRole } : user
      ));
      setSelectedUser({ ...selectedUser, role: newRole });
      
      // Log the role change
      await addDoc(collection(db, 'permissionAuditLogs'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        action: 'role_updated',
        changedBy: auth.currentUser.uid,
        changedByEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
        details: `Role changed from ${oldRole} to ${newRole} for ${selectedUser.email}`,
        oldValue: oldRole,
        newValue: newRole
      });
      
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  // Handle security controls change
  const handleSecurityChange = async () => {
    try {
      // Update user in Firestore with security settings
      await updateDoc(doc(db, 'users', selectedUser.id), {
        security: {
          forceLogout: securityControls.forceLogout,
          requirePasswordReset: securityControls.requirePasswordReset,
          enable2FA: securityControls.enable2FA,
          accessExpiration: securityControls.accessExpiration,
          status: securityControls.status
        },
        lastUpdated: serverTimestamp()
      });
      
      // Log the security change
      await addDoc(collection(db, 'permissionAuditLogs'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        action: 'security_updated',
        changedBy: auth.currentUser.uid,
        changedByEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
        details: `Security settings updated for ${selectedUser.email}`
      });
      
      setSecurityDialogOpen(false);
      
    } catch (error) {
      console.error('Error updating security settings:', error);
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <MdOutlineAdminPanelSettings className="text-purple-600" />;
      case 'manager': return <MdOutlineSupervisorAccount className="text-blue-600" />;
      case 'client': return <MdOutlinePersonOutline className="text-green-600" />;
      default: return <MdOutlineVerifiedUser className="text-gray-600" />;
    }
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch(status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'suspended':
        return <Chip label="Suspended" color="error" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      default:
        return <Chip label="Unknown" size="small" />;
    }
  };

  // Format last login time
  const formatLastLogin = (date) => {
    if (!date) return 'Never logged in';
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loadingUsers) {
    return (
      <Box className="p-6 flex justify-center items-center h-64">
        <LinearProgress className="w-full" />
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <Typography variant="h4" className="text-gray-800 font-bold mb-6">
        Permissions & Access Management
      </Typography>
      
      {/* Tabs for switching between views */}
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        className="mb-6"
      >
        <Tab 
          value="users" 
          label="User Access" 
          icon={<FiUserCheck className="mr-2" />} 
          iconPosition="start" 
        />
        <Tab 
          value="matrix" 
          label="Access Matrix" 
          icon={<MdOutlineSecurity className="mr-2" />} 
          iconPosition="start" 
        />
        <Tab 
          value="logs" 
          label="Audit Logs" 
          icon={<MdOutlineHistory className="mr-2" />} 
          iconPosition="start" 
        />
      </Tabs>
      
      {/* User Access View */}
      {activeTab === 'users' && (
        <>
          {/* Controls Section */}
          <Paper className="p-4 mb-6 rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center w-full md:w-auto">
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search users..."
                  InputProps={{
                    startAdornment: <FiSearch className="text-gray-400 mr-2" />
                  }}
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <FormControl size="small" className="min-w-[120px]">
                  <InputLabel>Filter by Role</InputLabel>
                  <Select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    label="Filter by Role"
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    {roles.map(role => (
                      <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" className="min-w-[120px]">
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Filter by Status"
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>
          </Paper>
          
          {/* Users Table */}
          <Paper className="rounded-lg shadow-sm overflow-hidden">
            <TableContainer>
              <Table>
                <TableHead className="bg-gray-50">
                  <TableRow>
                    <TableCell className="font-semibold">User</TableCell>
                    <TableCell className="font-semibold">Role</TableCell>
                    <TableCell className="font-semibold">Email</TableCell>
                    <TableCell className="font-semibold">Last Login</TableCell>
                    <TableCell className="font-semibold">Status</TableCell>
                    <TableCell className="font-semibold text-right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-indigo-100 text-indigo-600">
                              {user.firstName?.charAt(0) || user.lastName?.charAt(0) || 'U'}
                            </Avatar>
                            <div>
                              <Typography className="font-medium">
                                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name provided'}
                              </Typography>
                              {user.phone && (
                                <Typography variant="body2" className="text-gray-500">
                                  {user.phone}
                                </Typography>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getRoleIcon(user.role)}
                            label={user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Unknown'}
                            className={`${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}
                          />
                        </TableCell>
                        <TableCell>{user.email || 'No email'}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatLastLogin(user.lastLogin)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(user.status)}
                        </TableCell>
                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <Tooltip title="View Permissions">
                              <IconButton
                                size="small"
                                className="text-indigo-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditDrawerOpen(true);
                                }}
                              >
                                <FiEye size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Security Controls">
                              <IconButton
                                size="small"
                                className="text-gray-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSecurityDialogOpen(true);
                                }}
                              >
                                <FiLock size={16} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" className="py-8 text-gray-500">
                        No users found matching your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
      
      {/* Access Matrix View */}
      {activeTab === 'matrix' && (
        <Paper className="p-4 rounded-lg shadow-sm">
          <Typography variant="h6" className="font-bold mb-4">
            Role-Based Access Matrix
          </Typography>
          
          <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse">
                    <thead>
                    <tr className="bg-gray-50">
                        <th className="p-3 text-left border-b font-semibold">Feature</th>
                        {roles.map(role => (
                        <th key={role.id} className="p-3 text-center border-b font-semibold">
                            <div className="flex flex-col items-center">
                            <span>{role.name}</span>
                            <Button
                                size="small"
                                variant="outlined"
                                className="mt-1 text-xs"
                                onClick={() => {
                                setSelectedRole(role);
                                setConfigureModalOpen(true);
                                }}
                            >
                                Configure
                            </Button>
                            </div>
                        </th>
                        ))}
                    </tr>
                    </thead>
              <tbody>
                {permissions.map(permission => (
                  <tr key={permission.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{permission.name}</td>
                    {roles.map(role => (
                      <td key={`${permission.id}-${role.id}`} className="p-3 text-center">
                        {role.permissions?.includes(permission.id) ? (
                          <FiCheck className="text-green-500 mx-auto" />
                        ) : (
                          <FiX className="text-red-500 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Typography variant="body2" className="text-gray-500 mt-4">
            This matrix shows which permissions are automatically granted by each role.
            Individual users may have additional permissions.
          </Typography>
        </Paper>
      )}
      
      {/* Audit Logs View */}
      {activeTab === 'logs' && (
        <Paper className="p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6" className="font-bold">
              Permission Audit Logs
            </Typography>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                startIcon={<FiDownload size={14} />}
                size="small"
              >
                Export
              </Button>
            </div>
          </div>
          
          {loadingLogs ? (
            <Box className="flex justify-center py-4">
              <CircularProgress size={24} />
            </Box>
          ) : auditLogs.length === 0 ? (
            <Typography variant="body2" className="text-gray-500 py-4 text-center">
              No audit logs found.
            </Typography>
          ) : (
            <List className="divide-y">
              {auditLogs.map(log => (
                <ListItem key={log.id} className="py-3">
                  <ListItemText
                    primary={
                      <div className="flex justify-between">
                        <Typography className="font-medium">
                          {log.userEmail || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                          {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                        </Typography>
                      </div>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">
                          {log.details}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          Changed by: {log.changedByEmail || 'System'}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
      
      {/* Edit Permissions Drawer */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        PaperProps={{
          sx: { width: 450 }
        }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h6" className="font-bold">
              User Permissions
            </Typography>
            <IconButton onClick={() => setEditDrawerOpen(false)}>
              <FiX />
            </IconButton>
          </div>
          
          {selectedUser && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="bg-indigo-100 text-indigo-600" sx={{ width: 56, height: 56 }}>
                  {selectedUser.firstName?.charAt(0) || selectedUser.lastName?.charAt(0) || 'U'}
                </Avatar>
                <div>
                  <Typography className="font-bold">
                    {`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'No name provided'}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600">
                    {selectedUser.email}
                  </Typography>
                </div>
              </div>
              
              <FormControl fullWidth size="small" className="mb-6">
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={selectedUser.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Typography variant="subtitle2" className="font-bold mb-3">
                Permissions
              </Typography>
              
              <div className="flex-1 overflow-y-auto">
                {permissions.map(permission => (
                  <Accordion key={permission.id} className="shadow-none border-b">
                    <AccordionSummary expandIcon={<FiChevronDown />}>
                      <div className="flex items-center justify-between w-full">
                        <Typography>{permission.name}</Typography>
                        <Switch
                          size="small"
                          checked={userPermissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" className="text-gray-600">
                        {permission.description}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </div>
            </>
          )}
        </div>
      </Drawer>


      {/* Role Configuration Modal */}
<Dialog 
  open={configureModalOpen} 
  onClose={() => setConfigureModalOpen(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle className="font-bold">
    Configure {selectedRole?.name} Permissions
  </DialogTitle>
  <DialogContent>
    {selectedRole && (
      <div className="space-y-4 mt-4">
        <Typography variant="subtitle1" className="font-bold">
          Available Permissions
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissions.map(permission => (
            <Paper key={permission.id} className="p-3 border rounded-lg">
              <FormControlLabel
                control={
                  <Switch
                    checked={selectedRole.permissions.includes(permission.id)}
                    onChange={async (e) => {
                      const newPermissions = e.target.checked
                        ? [...selectedRole.permissions, permission.id]
                        : selectedRole.permissions.filter(id => id !== permission.id);
                      
                      // Update local state immediately for responsive UI
                      setRoles(roles.map(r => 
                        r.id === selectedRole.id 
                          ? {...r, permissions: newPermissions} 
                          : r
                      ));
                      setSelectedRole({...selectedRole, permissions: newPermissions});
                      
                      try {
                        // Update in Firestore
                        const roleRef = doc(db, 'roles', selectedRole.id);
                        await updateDoc(roleRef, {
                          permissions: newPermissions
                        });
                        
                        // Log the activity
                        await logRolePermissionActivity(
                          selectedRole.id,
                          permission.id,
                          e.target.checked ? 'added' : 'removed'
                        );
                        
                      } catch (error) {
                        console.error('Error updating role permissions:', error);
                        // Revert local state if update fails
                        setRoles(roles);
                        setSelectedRole(selectedRole);
                      }
                    }}
                  />
                }
                label={
                  <div>
                    <Typography>{permission.name}</Typography>
                    <Typography variant="caption" className="text-gray-600">
                      {permission.description}
                    </Typography>
                  </div>
                }
              />
            </Paper>
          ))}
        </div>
      </div>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfigureModalOpen(false)}>Close</Button>
  </DialogActions>
</Dialog>
      
      {/* Security Controls Dialog */}
      <Dialog 
        open={securityDialogOpen} 
        onClose={() => setSecurityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="font-bold flex items-center gap-2">
          <FiShield className="text-indigo-600" />
          Security Controls for {selectedUser?.firstName || 'User'}
        </DialogTitle>
        <DialogContent className="py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Typography>Force Logout</Typography>
              <Switch
                checked={securityControls.forceLogout}
                onChange={(e) => setSecurityControls({
                  ...securityControls,
                  forceLogout: e.target.checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Typography>Require Password Reset</Typography>
              <Switch
                checked={securityControls.requirePasswordReset}
                onChange={(e) => setSecurityControls({
                  ...securityControls,
                  requirePasswordReset: e.target.checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Typography>Enable Two-Factor Authentication</Typography>
              <Switch
                checked={securityControls.enable2FA}
                onChange={(e) => setSecurityControls({
                  ...securityControls,
                  enable2FA: e.target.checked
                })}
              />
            </div>
            
            <TextField
              label="Access Expiration Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={securityControls.accessExpiration}
              onChange={(e) => setSecurityControls({
                ...securityControls,
                accessExpiration: e.target.value
              })}
            />
            
            <FormControl fullWidth size="small">
              <InputLabel>Account Status</InputLabel>
              <Select
                label="Account Status"
                value={securityControls.status}
                onChange={(e) => setSecurityControls({
                  ...securityControls,
                  status: e.target.value
                })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="readonly">Read Only</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSecurityDialogOpen(false)}
            className="text-gray-600"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSecurityChange}
            variant="contained"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Apply Changes
          </Button>
        </DialogActions>
      </Dialog>


      
    </Box>
  );
};

export default PermissionsAccess;