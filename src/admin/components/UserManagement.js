import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Avatar, Chip, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, MenuItem, Select,
  InputLabel, FormControl, Divider
} from '@mui/material';
import { 
  FiUserPlus, FiEdit2, FiTrash2, FiSearch, 
  FiFilter, FiDownload, FiUpload 
} from 'react-icons/fi';
import { 
  MdOutlineAdminPanelSettings, MdOutlinePersonOutline,
  MdOutlineSupervisorAccount, MdOutlineVerifiedUser 
} from 'react-icons/md';
import { auth, db } from '../../services/firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client',
    phone: '',
    company: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          firstName: doc.data().firstName || '',
          lastName: doc.data().lastName || '',
          email: doc.data().email || '',
          role: doc.data().role || 'client',
          phone: doc.data().phone || '',
          company: doc.data().company || '',
          status: doc.data().status || 'active'
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


  const handleAddUser = async () => {
    try {
      // Create authentication entry
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        'defaultPassword123' // In production, generate a temp password
      );
      
      // Add to Firestore with UID as document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone || '',
        company: newUser.company || '',
        status: 'active',
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString()
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
      
      // Refresh user list
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

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const email = user.email?.toLowerCase() || '';
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         email.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <MdOutlineAdminPanelSettings className="text-purple-600" />;
      case 'sales': return <MdOutlineSupervisorAccount className="text-blue-600" />;
      case 'client': return <MdOutlinePersonOutline className="text-green-600" />;
      default: return <MdOutlineVerifiedUser className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Box className="p-6 flex justify-center items-center h-64">
        <Typography>Loading users...</Typography>
      </Box>
    );
  }

  return (
    <Box className="p-6">
      <Typography variant="h4" className="text-gray-800 font-bold mb-6">
        User & Client Management
      </Typography>
      
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
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="sales">Sales Team</MenuItem>
                <MenuItem value="marketing">Marketing Team</MenuItem>
                <MenuItem value="Project Manager">Project Manager</MenuItem>
                <MenuItem value="client">Clients</MenuItem>

              </Select>
            </FormControl>
            
            <Button 
              variant="contained" 
              startIcon={<FiUserPlus />}
              className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
              onClick={() => setOpenDialog(true)}
            >
              Add New User
            </Button>
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
                <TableCell className="font-semibold">Company</TableCell>
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
                          user.role === 'sales' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      />
                    </TableCell>
                    <TableCell>{user.email || 'No email'}</TableCell>
                    <TableCell>{user.company || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.status === 'active' ? 'Active' : 'Inactive'}
                        color={user.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<FiEdit2 size={14} />}
                          className="text-gray-600 border-gray-300"
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<FiTrash2 size={14} />}
                          className="text-red-600 border-red-200"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </Button>
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
      
      {/* Add User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold text-gray-800 border-b pb-3">
          Add New User
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
                <MenuItem value="Project Manager">Project Manager</MenuItem>
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
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role}
          >
            Add User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;