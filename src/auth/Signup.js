import React, { useState } from "react";
import { auth, db } from "../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { 
  Button, 
  TextField, 
  Typography, 
  Link, 
  InputAdornment, 
  IconButton,
  Box,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  Select,
  MenuItem,
  Chip,
  Autocomplete
} from "@mui/material";
import { 
  FaEye, 
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaUserTie,
  FaUserCircle,
  FaUserShield,
  FaUserGraduate,
  FaBullhorn,
  FaTools,
  FaBuilding
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SignupForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "client", // Default role
    department: "",
    skills: []
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputSkill, setInputSkill] = useState("");
  const navigate = useNavigate();

  // Departments for Collaborator/Intern
  const departments = [
    "Design",
    "Development",
    "Marketing",
    "Content",
    "Quality Assurance",
    "Product Management"
  ];

  // Common skills for autocomplete suggestions
  const skillSuggestions = [
    "JavaScript",
    "React",
    "Python",
    "Node.js",
    "Agile Methodology",
    "Project Management",
    "Digital Marketing",
    "SEO",
    "Content Writing",
    "UI/UX Design",
    "Graphic Design",
    "Data Analysis",
    "Machine Learning",
    "Sales Techniques",
    "CRM Software",
    "Social Media Marketing"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleAddSkill = () => {
    if (inputSkill && inputSkill.trim() && !formData.skills.includes(inputSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, inputSkill.trim()]
      });
      setInputSkill("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputSkill.trim()) {
      handleAddSkill();
      e.preventDefault();
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username = "Username must be 4-20 characters (letters, numbers, _)";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Add role validation if needed
    if (!formData.role) {
      newErrors.role = "Please select a role";
    }

    // Department validation for collaborator/intern
    if (["collaborator", "intern"].includes(formData.role) && !formData.department) {
      newErrors.department = "Department is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Prepare user data for Firestore
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        uid: userCredential.user.uid,
        createdAt: new Date().toISOString(),
      };

      // Add department if collaborator/intern
      if (["collaborator", "intern"].includes(formData.role)) {
        userData.department = formData.department;
      }

      // Add skills if they exist and role requires them
      if (formData.skills.length > 0 && 
          ["sales", "projectManager", "collaborator", "intern", "marketing"].includes(formData.role)) {
        userData.skills = formData.skills;
      }

      // Save additional user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      // Redirect based on role after successful signup
      switch(formData.role) {
        case "sales":
          navigate("/sales-dashboard");
          break;
        case "projectManager":
          navigate("/manager-dashboard");
          break;
        case "collaborator":
        case "intern":
          navigate("/collaborator-dashboard");
          break;
        case "marketing":
          navigate("/marketing-dashboard");
          break;
        default:
          navigate("/client-dashboard");
      }
    } catch (error) {
      setErrors({
        ...errors,
        form: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case "sales":
        return <FaUserTie className="text-gray-400" />;
      case "projectManager":
        return <FaUserShield className="text-gray-400" />;
      case "collaborator":
        return <FaUserCircle className="text-gray-400" />;
      case "intern":
        return <FaUserGraduate className="text-gray-400" />;
      case "marketing":
        return <FaBullhorn className="text-gray-400" />;
      default:
        return <FaUser className="text-gray-400" />;
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Box className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl">
        {/* Header */}
        <Box className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
          <Typography variant="h4" className="font-bold text-white">
            Create Your Account
          </Typography>
          <Typography variant="subtitle1" className="text-blue-100 mt-1">
            Join DXD Magnate Today
          </Typography>
        </Box>

        {/* Form */}
        <Box className="p-8">
          {errors.form && (
            <Box className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {errors.form}
            </Box>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUser className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </div>

            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUser className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaEnvelope className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaPhone className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Role Selection Field */}
            <FormControl fullWidth error={!!errors.role}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                label="Role"
                startAdornment={
                  <InputAdornment position="start">
                    {getRoleIcon(formData.role)}
                  </InputAdornment>
                }
              >
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="projectManager">Project Manager</MenuItem>
                <MenuItem value="collaborator">Collaborator</MenuItem>
                <MenuItem value="intern">Intern</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
              </Select>
              {errors.role && (
                <FormHelperText>{errors.role}</FormHelperText>
              )}
            </FormControl>

            {/* Department Selection (for Collaborator/Intern) */}
            {["collaborator", "intern"].includes(formData.role) && (
              <FormControl fullWidth error={!!errors.department}>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  label="Department"
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <FaBuilding className="text-gray-400" />
                    </InputAdornment>
                  }
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
                {errors.department && (
                  <FormHelperText>{errors.department}</FormHelperText>
                )}
              </FormControl>
            )}

            {/* Skills Input (Conditional) */}
            {["sales", "projectManager", "collaborator", "intern", "marketing"].includes(formData.role) && (
              <Box className="space-y-2">
                <Typography variant="subtitle2" className="text-gray-600">
                  Skills (Optional)
                </Typography>
                <Box className="flex gap-2">
                  <Autocomplete
                    freeSolo
                    fullWidth
                    options={skillSuggestions}
                    value={inputSkill}
                    onChange={(e, newValue) => setInputSkill(newValue || "")}
                    inputValue={inputSkill}
                    onInputChange={(e, newInputValue) => setInputSkill(newInputValue || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Add your skills"
                        onKeyDown={handleKeyDown}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <FaTools className="text-gray-400" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Button
                                variant="contained"
                                size="small"
                                onClick={handleAddSkill}
                                disabled={!inputSkill.trim()}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                Add
                              </Button>
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  />
                </Box>
                {formData.skills.length > 0 && (
                  <Box className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        onDelete={() => handleRemoveSkill(skill)}
                        className="bg-blue-100 text-blue-800"
                        deleteIcon={<span className="text-blue-600 hover:text-blue-800">✕</span>}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}

            <FormControl fullWidth variant="outlined" error={!!errors.password}>
              <InputLabel>Password</InputLabel>
              <OutlinedInput
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </IconButton>
                  </InputAdornment>
                }
                startAdornment={
                  <InputAdornment position="start">
                    <FaLock className="text-gray-400" />
                  </InputAdornment>
                }
                label="Password"
              />
              {errors.password && (
                <FormHelperText>{errors.password}</FormHelperText>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaLock className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 rounded-lg shadow-md transition-all duration-300 transform hover:scale-[1.01]"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <Box className="mt-6 text-center">
            <Typography variant="body2" className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Log in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignupForm;