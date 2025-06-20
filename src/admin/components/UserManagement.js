import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Avatar, Chip, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, MenuItem, Select,
  InputLabel, FormControl, Divider, Card, CardContent,
  IconButton, Tooltip, Badge
} from '@mui/material';
import { 
  FiUserPlus, FiEdit2, FiTrash2, FiSearch, 
  FiFilter, FiDownload, FiUpload, FiUser, FiActivity,
  FiCheckCircle, FiPauseCircle, FiXCircle, FiClock,
  FiEye, FiMoreVertical
} from 'react-icons/fi';
import { 
  MdOutlineAdminPanelSettings, MdOutlinePersonOutline,
  MdOutlineSupervisorAccount, MdOutlineVerifiedUser,
  MdOutlineCloudUpload
} from 'react-icons/md';
import { auth, db } from '../../services/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import ProjectManagerProfileModal from '../../Overview/components/ProjectManager';
import SalesProfileModal from '../../Overview/components/SalesProfile';
import ClientProfileModal from '../../Overview/components/ClientProfile';
import ProfilePreviewModal from '../../Overview/components/CollaboratorProfile';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [salesProfileOpen, setSalesProfileOpen] = useState(false);
  const [selectedSalesId, setSelectedSalesId] = useState(null);
  const [clientProfileOpen, setClientProfileOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [userRole,  setUserRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [internProfileModalOpen, setInternProfileModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client',
    phone: '',
    company: ''
  });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        'defaultPassword123'
      );
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone || '',
        company: newUser.company || '',
        status: 'active',
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        profileStatus: 'offline'
      });
      
      setOpenDialog(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        role: 'client',
        phone: '',
        company: ''
      });
      
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleEditUser = async () => {
    try {
      await updateDoc(doc(db, 'users', editingUser.id), editingUser);
      setUsers(users.map(user => user.id === editingUser.id ? editingUser : user));
      setOpenEditDialog(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleViewProfile = (userId, userRole) => {
    if (userRole === 'Project Manager') {
      setSelectedManagerId(userId);
      setProfileModalOpen(true);
    } else if (userRole === 'sales') {
      setSelectedSalesId(userId);
      setSalesProfileOpen(true);
    } else if (userRole === 'client') {
      setSelectedClientId(userId);
      setClientProfileOpen(true);
    } else if (userRole === 'Collaborator' || userRole === 'Intern') {
      setSelectedUserId(userId);
      setInternProfileModalOpen(true);
    } else {
      alert('Profile view for this role is coming soon!');
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         email.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role) => {
    switch(role) {
      case 'Admin': return <MdOutlineAdminPanelSettings className="text-purple-600" />;
      case 'sales': return <MdOutlineSupervisorAccount className="text-blue-600" />;
      case 'client': return <MdOutlinePersonOutline className="text-green-600" />;
      default: return <MdOutlineVerifiedUser className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <FiCheckCircle className="text-green-500" />;
      case 'suspended': return <FiPauseCircle className="text-yellow-500" />;
      case 'deactivated': return <FiXCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const getProfileStatusBadge = (status) => {
    switch(status) {
      case 'online': return 'success';
      case 'offline': return 'default';
      case 'away': return 'warning';
      case 'busy': return 'error';
      default: return 'default';
    }
  };

  // Analytics data
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.role === 'Admin').length;
  const clientUsers = users.filter(u => u.role === 'client').length;

  if (loading) {
    return (
      <Box className="p-6 flex justify-center items-center h-64">
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="text-gray-800 font-bold">
          User Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<FiUserPlus />}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
          onClick={() => setOpenDialog(true)}
        >
          Add New User
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md rounded-xl border-l-4 border-indigo-500">
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <Typography variant="body2" className="text-gray-500">Total Users</Typography>
                <Typography variant="h4" className="font-bold">{totalUsers}</Typography>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <FiUser className="text-indigo-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-l-4 border-green-500">
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <Typography variant="body2" className="text-gray-500">Active Users</Typography>
                <Typography variant="h4" className="font-bold">{activeUsers}</Typography>
                <Typography variant="caption" className="text-green-600">
                  +{(activeUsers / totalUsers * 100).toFixed(1)}% of total
                </Typography>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiActivity className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-l-4 border-purple-500">
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <Typography variant="body2" className="text-gray-500">Administrators</Typography>
                <Typography variant="h4" className="font-bold">{adminUsers}</Typography>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <MdOutlineAdminPanelSettings className="text-purple-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md rounded-xl border-l-4 border-blue-500">
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <Typography variant="body2" className="text-gray-500">Clients</Typography>
                <Typography variant="h4" className="font-bold">{clientUsers}</Typography>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <MdOutlinePersonOutline className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Paper className="p-4 mb-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center w-full md:w-1/3">
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
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                label="Role"
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Project Manager">Project Manager</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="Collaborator">Collaborator</MenuItem>
                <MenuItem value="Intern">Intern</MenuItem>
                <MenuItem value="client">Clients</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" className="min-w-[140px]">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="deactivated">Deactivated</MenuItem>
              </Select>
            </FormControl>

            <Button 
              variant="outlined" 
              startIcon={<FiDownload />}
              className="border-gray-300 text-gray-600"
            >
              Export
            </Button>
          </div>
        </div>
      </Paper>
      
      {/* Users Table */}
      <Paper className="rounded-xl shadow-sm overflow-hidden">
        <TableContainer>
          <Table>
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell className="font-semibold">User</TableCell>
                <TableCell className="font-semibold">Role</TableCell>
                <TableCell className="font-semibold">Contact</TableCell>
                <TableCell className="font-semibold">Last Activity</TableCell>
                <TableCell className="font-semibold">Status</TableCell>
                <TableCell className="font-semibold text-right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color={getProfileStatusBadge(user.profileStatus)}
                        >
                          <Avatar 
                            src={user.photoURL || user.profilePicture}
                            className="border-2 border-white shadow-sm"
                          >
                            {user.firstName?.charAt(0) || user.lastName?.charAt(0) || 'U'}
                          </Avatar>
                        </Badge>
                        <div>
                          <Typography className="font-medium">
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name provided'}
                          </Typography>
                          <Typography variant="body2" className="text-gray-500">
                            @{user.username || 'no-username'}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Unknown'}
                        className={`rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Typography>{user.email || 'No email'}</Typography>
                        {user.phone && (
                          <Typography variant="body2" className="text-gray-500">
                            {user.phone}
                          </Typography>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <Tooltip title={new Date(user.lastLogin).toLocaleString()}>
                          <Typography variant="body2" className="text-gray-500">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" className="text-gray-400">
                          Never logged in
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(user.status)}
                        label={user.status?.charAt(0).toUpperCase() + user.status?.slice(1) || 'Unknown'}
                        className={`rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-1">
                      <Tooltip title="View Profile">
                        <IconButton 
                          className="text-gray-500 hover:bg-gray-100"
                          onClick={() => handleViewProfile(user.id, user.role)}
                        >
                          <FiEye size={16} />
                        </IconButton>
                      </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            className="text-blue-500 hover:bg-blue-50"
                            onClick={() => {
                              setEditingUser(user);
                              setOpenEditDialog(true);
                            }}
                          >
                            <FiEdit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <FiTrash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" className="py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FiUser className="text-3xl text-gray-400" />
                      <Typography>No users found matching your criteria</Typography>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-gray-800 border-b pb-3">
          <div className="flex items-center gap-2">
            <FiUserPlus className="text-indigo-600" />
            <span>Add New User</span>
          </div>
        </DialogTitle>
        <DialogContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="First Name"
              variant="outlined"
              size="small"
              fullWidth
              name="firstName"
              value={newUser.firstName}
              onChange={handleInputChange}
              className="mb-3"
              required
            />
            <TextField
              label="Last Name"
              variant="outlined"
              size="small"
              fullWidth
              name="lastName"
              value={newUser.lastName}
              onChange={handleInputChange}
              className="mb-3"
              required
            />
            <TextField
              label="Email"
              variant="outlined"
              size="small"
              fullWidth
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              className="mb-3 md:col-span-2"
              required
            />
            <FormControl fullWidth size="small" className="mb-3">
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                name="role"
                value={newUser.role}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="sales">Sales Team</MenuItem>
                <MenuItem value="marketing">Marketing Team</MenuItem>
                <MenuItem value="client">Client</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Phone Number"
              variant="outlined"
              size="small"
              fullWidth
              name="phone"
              value={newUser.phone}
              onChange={handleInputChange}
              className="mb-3"
            />
            <TextField
              label="Company"
              variant="outlined"
              size="small"
              fullWidth
              name="company"
              value={newUser.company}
              onChange={handleInputChange}
              className="mb-3 md:col-span-2"
            />
          </div>
        </DialogContent>
        <DialogActions className="border-t pt-3 px-4">
          <Button 
            variant="outlined" 
            onClick={() => setOpenDialog(false)}
            className="text-gray-600 border-gray-300"
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddUser}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            disabled={!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-gray-800 border-b pb-3">
          <div className="flex items-center gap-2">
            <FiEdit2 className="text-blue-600" />
            <span>Edit User</span>
          </div>
        </DialogTitle>
        <DialogContent className="py-4">
          {editingUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-4 mb-4">
                <Avatar 
                  src={editingUser.photoURL || editingUser.profilePicture}
                  className="w-16 h-16 border-2 border-white shadow-md"
                >
                  {editingUser.firstName?.charAt(0) || editingUser.lastName?.charAt(0) || 'U'}
                </Avatar>
                <div>
                  <Typography variant="h6">{`${editingUser.firstName} ${editingUser.lastName}`}</Typography>
                  <Typography variant="body2" className="text-gray-500">
                    {editingUser.email}
                  </Typography>
                </div>
              </div>

              <TextField
                label="First Name"
                variant="outlined"
                size="small"
                fullWidth
                name="firstName"
                value={editingUser.firstName}
                onChange={handleEditInputChange}
                className="mb-3"
                required
              />
              <TextField
                label="Last Name"
                variant="outlined"
                size="small"
                fullWidth
                name="lastName"
                value={editingUser.lastName}
                onChange={handleEditInputChange}
                className="mb-3"
                required
              />
              <FormControl fullWidth size="small" className="mb-3">
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  name="role"
                  value={editingUser.role}
                  onChange={handleEditInputChange}
                  required
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="sales">Sales Team</MenuItem>
                  <MenuItem value="marketing">Marketing Team</MenuItem>
                  <MenuItem value="client">Client</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" className="mb-3">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={editingUser.status}
                  onChange={handleEditInputChange}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="deactivated">Deactivated</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Phone Number"
                variant="outlined"
                size="small"
                fullWidth
                name="phone"
                value={editingUser.phone}
                onChange={handleEditInputChange}
                className="mb-3"
              />
              <TextField
                label="Company"
                variant="outlined"
                size="small"
                fullWidth
                name="company"
                value={editingUser.company}
                onChange={handleEditInputChange}
                className="mb-3 md:col-span-2"
              />
              <div className="md:col-span-2">
                <Button
                  variant="outlined"
                  startIcon={<MdOutlineCloudUpload />}
                  className="w-full"
                >
                  Upload Profile Picture
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="border-t pt-3 px-4">
          <Button 
            variant="outlined" 
            onClick={() => setOpenEditDialog(false)}
            className="text-gray-600 border-gray-300"
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditUser}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <ProjectManagerProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        managerId={selectedManagerId}
      />

<SalesProfileModal
  open={salesProfileOpen}
  onClose={() => setSalesProfileOpen(false)}
  salesId={selectedSalesId}
/>

<ClientProfileModal
  open={clientProfileOpen}
  onClose={() => setClientProfileOpen(false)}
  clientId={selectedClientId}
/>

<ProfilePreviewModal
  open={internProfileModalOpen}
  onClose={() => setInternProfileModalOpen(false)}
  userId={selectedUserId}
/>
    </Box>
  );
};

export default UserManagement;